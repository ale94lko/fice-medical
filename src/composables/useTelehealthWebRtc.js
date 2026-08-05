import { ref, shallowRef } from 'vue'

function stopTrack(track) {
  try {
    track?.stop?.()
  } catch {
    // ignore
  }
}

function stopStream(stream) {
  if (!stream) {
    return
  }
  stream.getTracks().forEach(stopTrack)
}

/**
 * WebRTC peer connection for a 1:1 telehealth call.
 * Signaling payloads must be published by the caller (no PHI logging).
 */
export function useTelehealthWebRtc() {
  const localStream = shallowRef(null)
  const remoteStream = shallowRef(null)
  const remoteScreenStream = shallowRef(null)
  const screenStream = shallowRef(null)
  const connectionState = ref('new')
  const audioEnabled = ref(true)
  const videoEnabled = ref(true)
  const speakerEnabled = ref(true)
  const isScreenSharing = ref(false)
  const isRemoteScreenSharing = ref(false)

  let pc = null
  let selfParticipantId = null
  let remoteParticipantId = null
  let sendSignal = null
  let screenSender = null
  let makingOffer = false
  let renegotiateQueued = false
  let ignoreOffer = false
  let polite = false
  /** Remote MediaStream id announced with screen_share_start. */
  let remoteScreenStreamId = null
  /** track.id → inbound MediaStream.id (from ontrack). */
  const remoteTrackStreamIds = new Map()

  function publishStream(targetRef, stream) {
    targetRef.value = new MediaStream(stream.getTracks())
  }

  function ensureRemoteStream() {
    if (!remoteStream.value) {
      remoteStream.value = new MediaStream()
    }

    return remoteStream.value
  }

  function ensureRemoteScreenStream() {
    if (!remoteScreenStream.value) {
      remoteScreenStream.value = new MediaStream()
    }

    return remoteScreenStream.value
  }

  function clearRemoteScreenStream() {
    if (remoteScreenStream.value) {
      remoteScreenStream.value.getTracks().forEach(track => {
        try {
          remoteScreenStream.value.removeTrack(track)
        } catch {
          // ignore
        }
      })
    }
    remoteScreenStream.value = null
  }

  function remoteHasCameraVideo() {
    return Boolean(
      remoteStream.value
        ?.getVideoTracks?.()
        ?.some(track => track && track.readyState !== 'ended'),
    )
  }

  function shouldTreatAsScreenTrack(track, inboundStream) {
    const streamId = inboundStream?.id
      || remoteTrackStreamIds.get(track?.id)
    if (
      remoteScreenStreamId
      && streamId
      && streamId === remoteScreenStreamId
    ) {
      return true
    }
    // Do not guess screen tracks unless a remote share was announced —
    // otherwise a normal camera can be mis-routed and "disappear".
    if (!isRemoteScreenSharing.value && !remoteScreenStreamId) {
      return false
    }
    const hint = String(track?.contentHint ?? '').toLowerCase()
    if (hint === 'detail' || hint === 'text') {
      return true
    }
    if (remoteHasCameraVideo()) {
      return true
    }

    return false
  }

  function moveTrackToScreen(track) {
    if (!track || track.kind !== 'video') {
      return
    }
    if (remoteStream.value?.getTracks?.().some(t => t.id === track.id)) {
      try {
        remoteStream.value.removeTrack(track)
        publishStream(remoteStream, remoteStream.value)
      } catch {
        // ignore
      }
    }
    const stream = ensureRemoteScreenStream()
    if (!stream.getTracks().some(t => t.id === track.id)) {
      stream.addTrack(track)
    }
    publishStream(remoteScreenStream, stream)
    isRemoteScreenSharing.value = true
  }

  function reclassifyRemoteScreenTracks() {
    if (!remoteScreenStreamId || !remoteStream.value) {
      return
    }
    remoteStream.value.getVideoTracks().forEach(track => {
      if (remoteTrackStreamIds.get(track.id) === remoteScreenStreamId) {
        moveTrackToScreen(track)
      }
    })
  }

  function attachRemoteTrack(track, inboundStream) {
    if (!track) {
      return
    }
    if (inboundStream?.id) {
      remoteTrackStreamIds.set(track.id, inboundStream.id)
    }
    const isScreenVideo = track.kind === 'video'
      && shouldTreatAsScreenTrack(track, inboundStream)
    if (isScreenVideo) {
      moveTrackToScreen(track)
      track.addEventListener('ended', () => {
        clearRemoteScreenStream()
        remoteTrackStreamIds.delete(track.id)
        if (!isScreenSharing.value && !remoteScreenStreamId) {
          isRemoteScreenSharing.value = false
        }
      })

      return
    }
    const stream = ensureRemoteStream()
    if (!stream.getTracks().some(t => t.id === track.id)) {
      stream.addTrack(track)
    }
    publishStream(remoteStream, stream)
    track.addEventListener('ended', () => {
      remoteTrackStreamIds.delete(track.id)
    })
  }

  function setRemoteScreenSharing(active, streamId = null) {
    const nextActive = Boolean(active)
    isRemoteScreenSharing.value = nextActive
    if (!nextActive) {
      remoteScreenStreamId = null
      clearRemoteScreenStream()

      return
    }
    if (streamId) {
      remoteScreenStreamId = String(streamId)
      reclassifyRemoteScreenTracks()
    }
  }

  async function getLocalMedia(constraints = { audio: true, video: true }) {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    localStream.value = stream
    audioEnabled.value = stream.getAudioTracks().some(t => t.enabled)
    videoEnabled.value = stream.getVideoTracks().some(t => t.enabled)

    return stream
  }

  /** Take ownership of an existing MediaStream (e.g. lobby preview). */
  function adoptLocalStream(stream, options = {}) {
    if (!stream) {
      return null
    }
    if (localStream.value && localStream.value !== stream) {
      stopStream(localStream.value)
    }
    localStream.value = stream
    const nextAudio = options.audioEnabled
    const nextVideo = options.videoEnabled
    audioEnabled.value = nextAudio == null
      ? stream.getAudioTracks().some(t => t.enabled)
      : Boolean(nextAudio)
    videoEnabled.value = nextVideo == null
      ? stream.getVideoTracks().some(t => t.enabled)
      : Boolean(nextVideo)
    if (options.speakerEnabled != null) {
      speakerEnabled.value = Boolean(options.speakerEnabled)
    }
    stream.getAudioTracks().forEach(track => {
      track.enabled = audioEnabled.value
    })
    stream.getVideoTracks().forEach(track => {
      track.enabled = videoEnabled.value
    })

    return stream
  }

  function createPeerConnection(iceServers = []) {
    closePeerConnection({ keepLocal: true })
    pc = new RTCPeerConnection({
      iceServers: Array.isArray(iceServers) ? iceServers : [],
    })
    connectionState.value = pc.connectionState || 'new'

    pc.onicecandidate = event => {
      if (!event.candidate || !sendSignal) {
        return
      }
      sendSignal({
        type: 'ice-candidate',
        candidate: event.candidate.toJSON(),
        fromParticipantId: selfParticipantId,
        toParticipantId: remoteParticipantId,
      })
    }

    pc.ontrack = event => {
      attachRemoteTrack(event.track, event.streams?.[0])
    }

    pc.onnegotiationneeded = () => {
      void renegotiate()
    }

    pc.onconnectionstatechange = () => {
      connectionState.value = pc?.connectionState || 'closed'
    }

    if (localStream.value) {
      localStream.value.getTracks().forEach(track => {
        pc.addTrack(track, localStream.value)
      })
    }
    applyScreenShareToPeer()

    return pc
  }

  async function renegotiate() {
    if (!pc || !sendSignal) {
      return
    }
    // Wait until stable so we never stack a second local offer.
    if (makingOffer || pc.signalingState !== 'stable') {
      renegotiateQueued = true

      return
    }
    makingOffer = true
    try {
      const offer = await pc.createOffer()
      if (!pc || pc.signalingState !== 'stable') {
        return
      }
      await pc.setLocalDescription(offer)
      sendSignal({
        type: 'offer',
        sdp: pc.localDescription?.sdp || offer.sdp,
        fromParticipantId: selfParticipantId,
        toParticipantId: remoteParticipantId,
      })
    } catch {
      // ignore glare / closed PC
    } finally {
      makingOffer = false
      if (renegotiateQueued && pc?.signalingState === 'stable') {
        renegotiateQueued = false
        void renegotiate()
      }
      // If still negotiating, keep renegotiateQueued for answer/offer handlers.
    }
  }

  function applyScreenShareToPeer() {
    if (!pc || !isScreenSharing.value || !screenStream.value) {
      return
    }
    const displayTrack = screenStream.value.getVideoTracks()[0]
    if (!displayTrack || displayTrack.readyState === 'ended') {
      return
    }
    // Keep camera sender; screen is a separate "participant" track.
    const alreadySending = pc.getSenders().some(
      sender => sender.track && sender.track.id === displayTrack.id,
    )
    if (alreadySending) {
      screenSender = pc.getSenders().find(
        sender => sender.track?.id === displayTrack.id,
      ) || screenSender

      return
    }
    screenSender = pc.addTrack(displayTrack, screenStream.value)
    void renegotiate()
  }

  function preparePeer({
    iceServers,
    selfId,
    remoteId,
    publishSignal,
    isPolite = false,
  }) {
    selfParticipantId = selfId
    remoteParticipantId = remoteId
    sendSignal = publishSignal
    polite = Boolean(isPolite)
    createPeerConnection(iceServers)
  }

  async function startCall({
    iceServers,
    selfId,
    remoteId,
    publishSignal,
    isPolite = false,
  }) {
    // Only prepare the PC. Offers come from onnegotiationneeded so we
    // do not race a second createOffer (causes "answer in state stable").
    preparePeer({
      iceServers,
      selfId,
      remoteId,
      publishSignal,
      isPolite,
    })
  }

  async function handleSignal(payload) {
    try {
      await handleSignalInner(payload)
    } catch {
      // Swallow SDP races (duplicate answer, glare, closed PC).
    }
  }

  async function handleSignalInner(payload) {
    if (!payload || typeof payload !== 'object' || !pc) {
      return
    }
    const type = String(payload.type ?? '').toLowerCase()
    const fromId = Number(
      payload.from_participant_id ?? payload.fromParticipantId,
    )
    const toId = Number(
      payload.to_participant_id ?? payload.toParticipantId,
    )
    if (
      Number.isFinite(toId)
      && selfParticipantId != null
      && toId !== Number(selfParticipantId)
    ) {
      return
    }
    if (
      Number.isFinite(fromId)
      && remoteParticipantId != null
      && fromId !== Number(remoteParticipantId)
      && (type === 'offer' || type === 'answer' || type === 'ice-candidate')
    ) {
      // Allow first remote id assignment from inbound offer.
      if (type === 'offer' && remoteParticipantId == null) {
        remoteParticipantId = fromId
      } else if (type !== 'offer') {
        return
      }
    }

    if (type === 'offer') {
      const offerCollision = makingOffer
        || pc.signalingState !== 'stable'
      ignoreOffer = !polite && offerCollision
      if (ignoreOffer) {
        return
      }
      await pc.setRemoteDescription({
        type: 'offer',
        sdp: payload.sdp,
      })
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      sendSignal?.({
        type: 'answer',
        sdp: answer.sdp,
        fromParticipantId: selfParticipantId,
        toParticipantId: fromId || remoteParticipantId,
      })
      if (renegotiateQueued && pc.signalingState === 'stable') {
        renegotiateQueued = false
        void renegotiate()
      }

      return
    }

    if (type === 'answer') {
      // Duplicate / late answers arrive after negotiation already finished.
      if (pc.signalingState !== 'have-local-offer') {
        return
      }
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: payload.sdp,
      })
      if (renegotiateQueued && pc.signalingState === 'stable') {
        renegotiateQueued = false
        void renegotiate()
      }

      return
    }

    if (type === 'ice-candidate' && payload.candidate) {
      try {
        await pc.addIceCandidate(payload.candidate)
      } catch {
        if (!ignoreOffer) {
          // swallow races during glare
        }
      }
    }
  }

  function setAudioEnabled(enabled) {
    audioEnabled.value = Boolean(enabled)
    localStream.value?.getAudioTracks().forEach(track => {
      track.enabled = audioEnabled.value
    })
  }

  function setVideoEnabled(enabled) {
    videoEnabled.value = Boolean(enabled)
    localStream.value?.getVideoTracks().forEach(track => {
      track.enabled = videoEnabled.value
    })
  }

  function toggleAudio() {
    setAudioEnabled(!audioEnabled.value)
  }

  function toggleVideo() {
    setVideoEnabled(!videoEnabled.value)
  }

  function setSpeakerEnabled(enabled) {
    speakerEnabled.value = Boolean(enabled)
  }

  function toggleSpeaker() {
    setSpeakerEnabled(!speakerEnabled.value)
  }

  async function startScreenShare({ onStarted } = {}) {
    if (isScreenSharing.value) {
      return screenStream.value
    }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error('Screen share is not supported in this browser')
    }
    let display
    try {
      display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
        // Avoid offering this call tab when the browser supports it.
        selfBrowserSurface: 'exclude',
        preferCurrentTab: false,
      })
    } catch (error) {
      const name = String(error?.name ?? '')
      if (name === 'NotAllowedError' || name === 'AbortError') {
        throw error
      }
      display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      })
    }
    const displayTrack = display.getVideoTracks()[0]
    if (!displayTrack) {
      stopStream(display)
      throw new Error('No screen video track available')
    }
    try {
      displayTrack.contentHint = 'detail'
    } catch {
      // contentHint is best-effort
    }
    screenStream.value = display
    isScreenSharing.value = true
    displayTrack.onended = () => {
      stopScreenShare()
    }
    applyScreenShareToPeer()
    onStarted?.()

    return display
  }

  async function stopScreenShare({ onStopped } = {}) {
    if (!isScreenSharing.value) {
      return
    }
    if (pc && screenSender) {
      try {
        pc.removeTrack(screenSender)
      } catch {
        // ignore
      }
    }
    screenSender = null
    stopStream(screenStream.value)
    screenStream.value = null
    isScreenSharing.value = false
    onStopped?.()
  }

  function closePeerConnection({ keepLocal = false } = {}) {
    if (pc) {
      try {
        pc.onicecandidate = null
        pc.ontrack = null
        pc.onnegotiationneeded = null
        pc.onconnectionstatechange = null
        pc.close()
      } catch {
        // ignore
      }
      pc = null
    }
    if (remoteStream.value) {
      stopStream(remoteStream.value)
      remoteStream.value = null
    }
    clearRemoteScreenStream()
    isRemoteScreenSharing.value = false
    remoteScreenStreamId = null
    remoteTrackStreamIds.clear()
    if (!keepLocal) {
      stopStream(localStream.value)
      localStream.value = null
    }
    stopStream(screenStream.value)
    screenStream.value = null
    screenSender = null
    isScreenSharing.value = false
    connectionState.value = 'closed'
    makingOffer = false
    renegotiateQueued = false
    ignoreOffer = false
  }

  function cleanup() {
    closePeerConnection({ keepLocal: false })
    sendSignal = null
    selfParticipantId = null
    remoteParticipantId = null
  }

  return {
    localStream,
    remoteStream,
    remoteScreenStream,
    screenStream,
    connectionState,
    audioEnabled,
    videoEnabled,
    speakerEnabled,
    isScreenSharing,
    isRemoteScreenSharing,
    getLocalMedia,
    adoptLocalStream,
    preparePeer,
    startCall,
    handleSignal,
    setAudioEnabled,
    setVideoEnabled,
    setSpeakerEnabled,
    toggleAudio,
    toggleVideo,
    toggleSpeaker,
    startScreenShare,
    stopScreenShare,
    setRemoteScreenSharing,
    createPeerConnection,
    applyScreenShareToPeer,
    cleanup,
  }
}
