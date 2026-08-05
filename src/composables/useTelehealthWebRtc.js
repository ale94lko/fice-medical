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

/** Clear a stream ref without stopping inbound (remote) tracks. */
function detachStream(streamRef) {
  streamRef.value = null
}

function unwrapSignalPayload(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null
  }
  const nested = raw.data
  if (
    nested
    && typeof nested === 'object'
    && !Array.isArray(nested)
    && raw.type == null
    && (nested.type != null || nested.sdp != null || nested.candidate != null)
  ) {
    return nested
  }

  return raw
}

function resolveSdp(payload) {
  if (!payload || typeof payload !== 'object') {
    return ''
  }

  return String(
    payload.sdp
    ?? payload.session_description
    ?? payload.sessionDescription
    ?? payload.description
    ?? '',
  ).trim()
}

function normalizeSignalType(rawType) {
  return String(rawType ?? '')
    .toLowerCase()
    .replace(/_/g, '-')
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
  const iceConnectionState = ref('new')
  const audioEnabled = ref(true)
  const videoEnabled = ref(true)
  const speakerEnabled = ref(true)
  const isScreenSharing = ref(false)
  const isRemoteScreenSharing = ref(false)
  /** Bumps when remote tracks change — drives UI safely. */
  const remoteMediaGeneration = ref(0)

  let pc = null
  let selfParticipantId = null
  let remoteParticipantId = null
  let sendSignal = null
  let screenSender = null
  let makingOffer = false
  let renegotiateQueued = false
  let ignoreOffer = false
  let polite = false
  /** Clinician must not offer until peer_ready (or an explicit offer). */
  let offerArmed = false
  /** ICE before remote description — common when both join at once. */
  let pendingIceCandidates = []
  /** Offers/answers/ICE that arrived before PC existed. */
  let pendingSignals = []
  /** Remote MediaStream id announced with screen_share_start. */
  let remoteScreenStreamId = null
  /** track.id → inbound MediaStream.id (from ontrack). */
  const remoteTrackStreamIds = new Map()

  function bumpRemoteMedia() {
    remoteMediaGeneration.value += 1
  }

  function publishStream(targetRef, stream, { bump = false } = {}) {
    // New MediaStream identity so Vue shallowRef consumers update.
    targetRef.value = new MediaStream(stream.getTracks())
    if (bump) {
      bumpRemoteMedia()
    }
  }

  function ensureRemoteStream() {
    if (!remoteStream.value) {
      remoteStream.value = new MediaStream()
      bumpRemoteMedia()
    }

    return remoteStream.value
  }

  function ensureRemoteScreenStream() {
    if (!remoteScreenStream.value) {
      remoteScreenStream.value = new MediaStream()
      bumpRemoteMedia()
    }

    return remoteScreenStream.value
  }

  function clearRemoteScreenStream() {
    detachStream(remoteScreenStream)
    bumpRemoteMedia()
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
        publishStream(remoteStream, remoteStream.value, { bump: true })
      } catch {
        // ignore
      }
    }
    const stream = ensureRemoteScreenStream()
    if (!stream.getTracks().some(t => t.id === track.id)) {
      stream.addTrack(track)
    }
    publishStream(remoteScreenStream, stream, { bump: true })
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
        bumpRemoteMedia()
      })

      return
    }
    const stream = ensureRemoteStream()
    if (!stream.getTracks().some(t => t.id === track.id)) {
      stream.addTrack(track)
    }
    publishStream(remoteStream, stream, { bump: true })
    track.addEventListener('ended', () => {
      remoteTrackStreamIds.delete(track.id)
      bumpRemoteMedia()
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

  function resolveIceServers(iceServers = []) {
    if (Array.isArray(iceServers) && iceServers.length) {
      return iceServers
    }
    // Fallback STUN so peers behind NAT can still gather candidates
    // when the session payload omits ice_servers.
    return [{ urls: 'stun:stun.l.google.com:19302' }]
  }

  function flushPendingSignals() {
    if (!pendingSignals.length || !pc) {
      return
    }
    const queued = pendingSignals
    pendingSignals = []
    queued.forEach(msg => {
      void handleSignal(msg)
    })
  }

  function createPeerConnection(iceServers = []) {
    closePeerConnection({ keepLocal: true })
    pc = new RTCPeerConnection({
      iceServers: resolveIceServers(iceServers),
    })
    connectionState.value = pc.connectionState || 'new'
    iceConnectionState.value = pc.iceConnectionState || 'new'

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
      attachRemoteTrack(event.track, event.streams?.[0] ?? null)
    }

    pc.onnegotiationneeded = () => {
      // 1:1 telehealth: only the impolite peer (clinician) offers, and
      // only after offerArmed (peer_ready / explicit offer).
      if (polite || !offerArmed) {
        return
      }
      void renegotiate()
    }

    pc.onconnectionstatechange = () => {
      connectionState.value = pc?.connectionState || 'closed'
    }

    pc.oniceconnectionstatechange = () => {
      iceConnectionState.value = pc?.iceConnectionState || 'closed'
    }

    if (localStream.value) {
      localStream.value.getTracks().forEach(track => {
        pc.addTrack(track, localStream.value)
      })
    }
    applyScreenShareToPeer()
    flushPendingSignals()

    return pc
  }

  async function createAndSendOffer() {
    if (!pc || !sendSignal || polite) {
      return false
    }
    offerArmed = true
    if (makingOffer || pc.signalingState !== 'stable') {
      renegotiateQueued = true

      return false
    }
    makingOffer = true
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      if (!pc || pc.signalingState !== 'stable') {
        renegotiateQueued = true

        return false
      }
      await pc.setLocalDescription(offer)
      sendSignal({
        type: 'offer',
        sdp: pc.localDescription?.sdp || offer.sdp,
        fromParticipantId: selfParticipantId,
        toParticipantId: remoteParticipantId,
      })

      return true
    } catch {
      return false
    } finally {
      makingOffer = false
      if (renegotiateQueued && pc?.signalingState === 'stable') {
        renegotiateQueued = false
        void renegotiate()
      }
    }
  }

  async function renegotiate() {
    await createAndSendOffer()
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
    // Only the clinician (impolite) drives offers; guest screen share
    // relies on a peer_ready-style renegotiation from the clinician.
    if (!polite) {
      void renegotiate()
    }
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

  /**
   * @param {object} options
   * @param {boolean} [options.offerImmediately] — clinician should wait for
   *   peer_ready before the first offer (default: !isPolite).
   */
  async function startCall({
    iceServers,
    selfId,
    remoteId,
    publishSignal,
    isPolite = false,
    offerImmediately,
  }) {
    preparePeer({
      iceServers,
      selfId,
      remoteId,
      publishSignal,
      isPolite,
    })
    const shouldOffer = offerImmediately == null
      ? !polite
      : Boolean(offerImmediately)
    // addTrack fires negotiationneeded — keep disarmed until we mean to offer.
    offerArmed = false
    if (shouldOffer) {
      await createAndSendOffer()
    }
  }

  async function handleSignal(payload) {
    const msg = unwrapSignalPayload(payload)
    if (!msg) {
      return
    }
    if (!pc) {
      pendingSignals.push(msg)

      return
    }
    try {
      await handleSignalInner(msg)
    } catch {
      // Swallow SDP races (duplicate answer, glare, closed PC).
    }
  }

  function normalizeIceCandidateInit(raw) {
    if (raw == null) {
      return null
    }
    if (typeof raw === 'string') {
      return { candidate: raw }
    }
    if (typeof raw !== 'object') {
      return null
    }
    const line = String(raw.candidate ?? '').trim()
    if (!line) {
      return null
    }
    const mid = raw.sdpMid ?? raw.sdp_mid
    const mLine = raw.sdpMLineIndex ?? raw.sdp_m_line_index
    const ufrag = raw.usernameFragment ?? raw.username_fragment
    const init = { candidate: line }
    if (mid != null && mid !== '') {
      init.sdpMid = String(mid)
    }
    if (mLine != null && mLine !== '') {
      const n = Number(mLine)
      if (Number.isFinite(n)) {
        init.sdpMLineIndex = n
      }
    }
    if (ufrag != null && ufrag !== '') {
      init.usernameFragment = String(ufrag)
    }

    return init
  }

  async function flushPendingIceCandidates() {
    if (!pc?.remoteDescription || !pendingIceCandidates.length) {
      return
    }
    const queued = pendingIceCandidates
    pendingIceCandidates = []
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(candidate)
      } catch {
        // ignore stale candidates after glare / restart
      }
    }
  }

  async function handleSignalInner(payload) {
    if (!payload || typeof payload !== 'object' || !pc) {
      return
    }
    const type = normalizeSignalType(payload.type)
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
      // Clinician never accepts remote offers (sole offerer).
      if (!polite) {
        return
      }
      if (Number.isFinite(fromId)) {
        remoteParticipantId = fromId
      }
      const sdp = resolveSdp(payload)
      if (!sdp) {
        return
      }
      const offerCollision = makingOffer
        || pc.signalingState !== 'stable'
      if (offerCollision) {
        if (!polite) {
          ignoreOffer = true

          return
        }
        try {
          await pc.setLocalDescription({ type: 'rollback' })
        } catch {
          // ignore if rollback unsupported / unnecessary
        }
      }
      ignoreOffer = false
      await pc.setRemoteDescription({
        type: 'offer',
        sdp,
      })
      await flushPendingIceCandidates()
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      sendSignal?.({
        type: 'answer',
        sdp: answer.sdp,
        fromParticipantId: selfParticipantId,
        toParticipantId: fromId || remoteParticipantId,
      })

      return
    }

    if (type === 'answer') {
      // Duplicate / late answers arrive after negotiation already finished.
      if (pc.signalingState !== 'have-local-offer') {
        return
      }
      const sdp = resolveSdp(payload)
      if (!sdp) {
        return
      }
      await pc.setRemoteDescription({
        type: 'answer',
        sdp,
      })
      await flushPendingIceCandidates()
      if (renegotiateQueued && pc.signalingState === 'stable') {
        renegotiateQueued = false
        void renegotiate()
      }

      return
    }

    if (type === 'ice-candidate') {
      const init = normalizeIceCandidateInit(
        payload.candidate ?? payload.ice_candidate ?? payload.iceCandidate,
      )
      if (!init) {
        return
      }
      if (!pc.remoteDescription) {
        pendingIceCandidates.push(init)

        return
      }
      try {
        await pc.addIceCandidate(init)
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
        pc.oniceconnectionstatechange = null
        pc.close()
      } catch {
        // ignore
      }
      pc = null
    }
    // Do not stop() inbound remote tracks — only detach UI refs.
    detachStream(remoteStream)
    clearRemoteScreenStream()
    isRemoteScreenSharing.value = false
    remoteScreenStreamId = null
    remoteTrackStreamIds.clear()
    bumpRemoteMedia()
    if (!keepLocal) {
      stopStream(localStream.value)
      localStream.value = null
    }
    stopStream(screenStream.value)
    screenStream.value = null
    screenSender = null
    isScreenSharing.value = false
    connectionState.value = 'closed'
    iceConnectionState.value = 'closed'
    makingOffer = false
    renegotiateQueued = false
    ignoreOffer = false
    offerArmed = false
    pendingIceCandidates = []
    pendingSignals = []
  }

  function cleanup() {
    closePeerConnection({ keepLocal: false })
    sendSignal = null
    selfParticipantId = null
    remoteParticipantId = null
  }

  function hasPeerConnection() {
    return Boolean(pc)
  }

  return {
    localStream,
    remoteStream,
    remoteScreenStream,
    screenStream,
    connectionState,
    iceConnectionState,
    remoteMediaGeneration,
    audioEnabled,
    videoEnabled,
    speakerEnabled,
    isScreenSharing,
    isRemoteScreenSharing,
    getLocalMedia,
    adoptLocalStream,
    preparePeer,
    startCall,
    createAndSendOffer,
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
    closePeerConnection,
    applyScreenShareToPeer,
    hasPeerConnection,
    cleanup,
  }
}
