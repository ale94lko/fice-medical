import { computed, ref } from 'vue'
import {
  telehealthHeartbeatIntervalMs,
  telehealthParticipantStatuses,
  telehealthRoles,
  telehealthSessionStatuses,
} from 'components/constants.js'
import {
  admitTelehealthParticipant,
  apiErrorMessage,
  finishTelehealthSession,
  getTelehealthSession,
  joinTelehealthSession,
  leaveTelehealthSession,
  listTelehealthChat,
  listTelehealthFiles,
  markWaitingRoomReady,
  postTelehealthChat,
  deleteTelehealthChatMessage,
  sendTelehealthHeartbeat,
  startTelehealthSession,
  startTelehealthScreenShare,
  stopTelehealthScreenShare,
  uploadTelehealthFile,
  deleteTelehealthFile,
  downloadTelehealthFile,
  publicJoinTelehealth,
  publicGetTelehealthSession,
  publicMarkWaitingRoomReady,
  publicSendTelehealthHeartbeat,
  publicLeaveTelehealth,
  publicListTelehealthChat,
  publicPostTelehealthChat,
  resendTelehealthClientInvite,
} from 'src/utils/telehealth-api.js'
import {
  cacheGuestAppointmentSummary,
  formatTelehealthElapsedLabel,
  isTelehealthTerminalStatus,
  normalizeTelehealthChatMessage,
  normalizeTelehealthFile,
  normalizeTelehealthSession,
  resolveTelehealthDurationSeconds,
  resolveTelehealthElapsedSeconds,
} from 'src/utils/telehealth-normalize.js'
import { createTelehealthStompClient } from 'src/utils/telehealth-stomp.js'
import { useTelehealthWebRtc } from 'src/composables/useTelehealthWebRtc.js'

function findSelfParticipant(session, role, displayName) {
  const list = session?.participants ?? []
  const roleToken = String(role ?? '').toUpperCase()
  const byRole = list.filter(p => p.role === roleToken)
  if (byRole.length === 1) {
    return byRole[0]
  }
  const name = String(displayName ?? '').trim().toLowerCase()
  if (name) {
    const byName = byRole.find(
      p => String(p.displayName ?? '').trim().toLowerCase() === name,
    )
    if (byName) {
      return byName
    }
  }

  return byRole[0] || list[0] || null
}

function findRemoteParticipant(session, selfId, selfRole) {
  const list = (session?.participants ?? []).filter(
    p => p.id != null && p.id !== selfId,
  )
  // Only peers already in the call — waiting-room clients are not on
  // the signaling channel yet, so an early offer would be lost.
  const active = list.filter(p =>
    p.status === telehealthParticipantStatuses.admitted
    || p.status === telehealthParticipantStatuses.inSession,
  )
  if (selfRole === telehealthRoles.clinician) {
    return active.find(p => p.role === telehealthRoles.client)
      || active[0]
      || null
  }

  return active.find(p => p.role === telehealthRoles.clinician)
    || active[0]
    || null
}

function isParticipantAdmitted(participant) {
  const token = String(participant?.status ?? '').toUpperCase()

  return (
    token === telehealthParticipantStatuses.admitted
    || token === telehealthParticipantStatuses.inSession
  )
}

function findParticipantById(session, participantId) {
  if (participantId == null) {
    return null
  }

  return (session?.participants ?? []).find(
    p => p.id === participantId,
  ) || null
}

function createTelehealthSessionState() {
  const session = ref(null)
  const role = ref(null)
  const displayName = ref('')
  const selfParticipantId = ref(null)
  const guestAuth = ref(null)
  const phase = ref('lobby')
  const loading = ref(false)
  const error = ref('')
  const chatMessages = ref([])
  const files = ref([])
  const stompConnected = ref(false)
  /** When true, call stays alive while user browses other pages. */
  const minimized = ref(false)
  const returnRoute = ref(null)
  const lastCallDurationSeconds = ref(null)
  /** Ticks once per second while in_call for shared elapsed UI. */
  const nowTick = ref(Date.now())

  const webrtc = useTelehealthWebRtc()
  let stomp = null
  let heartbeatTimer = null
  let pollTimer = null
  let elapsedTimer = null
  let mediaStarted = false
  let webrtcStarted = false
  let callStartedAtMs = null
  /** Client was admitted once in this meet — may re-enter without waiting. */
  let clientAdmittedOnce = false

  const status = computed(() => session.value?.status || '')
  const participants = computed(() => session.value?.participants ?? [])
  const waitingParticipants = computed(() =>
    participants.value.filter(
      p => p.status === telehealthParticipantStatuses.waiting,
    ),
  )
  const isGuest = computed(() => Boolean(guestAuth.value?.guestKey))
  const isClinician = computed(() => role.value === telehealthRoles.clinician)
  const isClient = computed(() =>
    role.value === telehealthRoles.client || isGuest.value,
  )
  const isEnded = computed(() => isTelehealthTerminalStatus(status.value))
  const isInProgress = computed(
    () => status.value === telehealthSessionStatuses.inProgress,
  )

  /** Live meet clock — only while the in-call UI is active. */
  const elapsedSeconds = computed(() => {
    nowTick.value
    if (phase.value !== 'in_call') {
      return null
    }

    return resolveTelehealthElapsedSeconds(
      session.value,
      callStartedAtMs,
      Date.now(),
    )
  })

  const elapsedLabel = computed(() => {
    if (phase.value !== 'in_call') {
      return ''
    }

    return formatTelehealthElapsedLabel(elapsedSeconds.value)
  })

  function setError(err, fallback) {
    error.value = apiErrorMessage(err, fallback)
  }

  function clearError() {
    error.value = ''
  }

  function applySession(next, options = {}) {
    if (!next) {
      return
    }
    const syncPhase = options.syncPhase !== false
    const prev = session.value || {}
    session.value = {
      ...next,
      meetingToken: next.meetingToken || prev.meetingToken || null,
      guestKey: next.guestKey || prev.guestKey || null,
      clientMeetingToken:
        next.clientMeetingToken || prev.clientMeetingToken || null,
      // Prefer API value after resend-invite (old links stop working).
      clientInviteUrl: next.clientInviteUrl != null
        && String(next.clientInviteUrl).trim() !== ''
        ? String(next.clientInviteUrl).trim()
        : (prev.clientInviteUrl || null),
      iceServers: next.iceServers?.length
        ? next.iceServers
        : (prev.iceServers ?? []),
      clinicianDisplayName:
        next.clinicianDisplayName
        || prev.clinicianDisplayName
        || null,
      clientDisplayName:
        String(next.clientDisplayName ?? '').trim()
        || prev.clientDisplayName
        || null,
      clientNumber:
        String(next.clientNumber ?? '').trim()
        || prev.clientNumber
        || null,
      appointmentSummary:
        next.appointmentSummary
        || prev.appointmentSummary
        || null,
    }
    // Anchor local fallback to server start so staff/guest clocks match.
    syncCallClockFromSession(session.value)
    if (guestAuth.value) {
      guestAuth.value = {
        ...guestAuth.value,
        meetingToken:
          session.value.meetingToken || guestAuth.value.meetingToken,
        guestKey: session.value.guestKey || guestAuth.value.guestKey,
      }
    }
    const cacheToken = session.value.meetingToken
      || guestAuth.value?.meetingToken
    if (cacheToken) {
      cacheGuestAppointmentSummary(cacheToken, {
        clinicianDisplayName: session.value.clinicianDisplayName,
        appointmentSummary: session.value.appointmentSummary,
      })
    }
    if (!syncPhase) {
      return
    }
    if (isTelehealthTerminalStatus(next.status)) {
      phase.value = 'ended'
      minimized.value = false
      clientAdmittedOnce = false
      stopHeartbeat()
      stopPolling()
      stopElapsedTicker()
      teardownMedia()

      return
    }
    if (next.status === telehealthSessionStatuses.inProgress) {
      // First visit: wait for admit. After admit, re-enter if meet is live.
      if (
        role.value !== telehealthRoles.clinician
        && !isSelfAdmitted(next)
        && !canClientReenterMeet(next)
      ) {
        if (phase.value !== 'lobby') {
          phase.value = 'waiting'
        }

        return
      }
      if (
        role.value !== telehealthRoles.clinician
        && (isSelfAdmitted(next) || canClientReenterMeet(next))
      ) {
        clientAdmittedOnce = true
      }
      phase.value = 'in_call'
      startElapsedTicker()
    } else if (
      next.status === telehealthSessionStatuses.waitingRoom
      || next.status === telehealthSessionStatuses.ready
      || next.status === telehealthSessionStatuses.scheduled
    ) {
      // Clinicians skip waiting room UI once they entered the meet.
      if (
        role.value === telehealthRoles.clinician
        && (phase.value === 'in_call' || mediaStarted)
      ) {
        return
      }
      if (phase.value === 'lobby') {
        return
      }
      phase.value = 'waiting'
      stopElapsedTicker()
    }
  }

  function isSelfAdmitted(sess = session.value) {
    const self = findParticipantById(sess, selfParticipantId.value)
      || findSelfParticipant(sess, role.value, displayName.value)

    return isParticipantAdmitted(self)
  }

  function hasActiveMeetPresence(sess, selfId) {
    return (sess?.participants ?? []).some(participant => {
      if (participant?.id == null || participant.id === selfId) {
        return false
      }

      return isParticipantAdmitted(participant)
    })
  }

  function canClientReenterMeet(sess = session.value) {
    if (role.value === telehealthRoles.clinician || !clientAdmittedOnce) {
      return false
    }
    if (sess?.status !== telehealthSessionStatuses.inProgress) {
      return false
    }

    return hasActiveMeetPresence(sess, selfParticipantId.value)
  }

  function shouldClientEnterCall(sess = session.value) {
    if (role.value === telehealthRoles.clinician) {
      return false
    }

    return (
      sess?.status === telehealthSessionStatuses.inProgress
      && (isSelfAdmitted(sess) || canClientReenterMeet(sess))
    )
  }

  async function enterClientWaiting(previewStream, mediaPrefs, sessionId) {
    phase.value = 'waiting'
    await ensureWaitingPreview(previewStream, mediaPrefs)
    startPolling()
    connectWaitingStomp(sessionId)
  }

  async function enterClientAfterJoin(
    previewStream,
    mediaPrefs,
    sessionId,
    joined,
  ) {
    if (canClientReenterMeet(joined)) {
      await ensureWaitingPreview(previewStream, mediaPrefs)
      await ensureInCallMedia()

      return
    }
    await enterClientWaiting(previewStream, mediaPrefs, sessionId)
  }

  /**
   * Fresh page open → lobby. Floating restore → keep in-call.
   */
  async function beginLobbyEntry(expectedSessionId) {
    const sameSession = expectedSessionId == null
      || (
        session.value?.id != null
        && String(session.value.id) === String(expectedSessionId)
      )
    const restoring = Boolean(
      minimized.value
      && phase.value === 'in_call'
      && sameSession
      && session.value?.id,
    )
    if (restoring) {
      minimized.value = false
      startElapsedTicker()

      return { restored: true }
    }

    minimized.value = false
    lastCallDurationSeconds.value = null
    callStartedAtMs = null
    stopElapsedTicker()
    // Keep displayName + clientAdmittedOnce so "Back to meet" can rejoin.
    if (phase.value === 'in_call' || phase.value === 'waiting') {
      await leave().catch(() => {})
    } else {
      stopHeartbeat()
      stopPolling()
      teardownMedia()
    }
    phase.value = 'lobby'
    clearError()

    return { restored: false }
  }

  function syncCallClockFromSession(sess = session.value) {
    const startIso = String(sess?.startedAtUtc ?? '').trim()
    if (!startIso) {
      return
    }
    const startMs = new Date(startIso).getTime()
    if (Number.isFinite(startMs)) {
      callStartedAtMs = startMs
    }
  }

  function markCallClock() {
    syncCallClockFromSession()
    if (callStartedAtMs == null) {
      callStartedAtMs = Date.now()
    }
    startElapsedTicker()
  }

  function captureCallDuration() {
    const seconds = resolveTelehealthDurationSeconds(
      session.value,
      callStartedAtMs,
    )
    if (seconds != null && seconds > 0) {
      lastCallDurationSeconds.value = seconds
    }
    callStartedAtMs = null
    stopElapsedTicker()
  }

  function startElapsedTicker() {
    if (elapsedTimer != null || typeof window === 'undefined') {
      return
    }
    nowTick.value = Date.now()
    elapsedTimer = window.setInterval(() => {
      nowTick.value = Date.now()
    }, 1000)
  }

  function stopElapsedTicker() {
    if (elapsedTimer == null) {
      return
    }
    window.clearInterval(elapsedTimer)
    elapsedTimer = null
  }

  function isPreCallSessionStatus(token) {
    return (
      token === telehealthSessionStatuses.waitingRoom
      || token === telehealthSessionStatuses.ready
      || token === telehealthSessionStatuses.scheduled
    )
  }

  /** Clinician: start visit if needed, then go straight to in-call meet. */
  async function enterClinicianMeet(previewStream, mediaPrefs) {
    await ensureWaitingPreview(previewStream, mediaPrefs)
    if (isPreCallSessionStatus(session.value?.status)) {
      try {
        const started = await startTelehealthSession(session.value.id)
        applySession(started)
      } catch {
        // Already started or not permitted — still enter meet UI.
        await refreshSession().catch(() => {})
      }
    }
    // Clients in waiting are admitted from the in-call UI.
    await ensureInCallMedia()
  }

  async function refreshSession() {
    if (isGuest.value) {
      const next = await publicGetTelehealthSession(guestAuth.value)
      applySession(next)

      return next
    }
    if (!session.value?.id) {
      return null
    }
    const next = await getTelehealthSession(session.value.id)
    applySession(next)

    return next
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  function startHeartbeat() {
    stopHeartbeat()
    heartbeatTimer = setInterval(() => {
      if (isGuest.value) {
        publicSendTelehealthHeartbeat(guestAuth.value).catch(() => {})

        return
      }
      if (session.value?.id) {
        sendTelehealthHeartbeat(session.value.id).catch(() => {})
      }
    }, telehealthHeartbeatIntervalMs)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  function startPolling() {
    stopPolling()
    pollTimer = setInterval(() => {
      refreshSession()
        .then(next => {
          if (shouldClientEnterCall(next)) {
            ensureInCallMedia()
          }
        })
        .catch(() => {})
    }, 5000)
  }

  function teardownStomp() {
    stomp?.disconnect()
    stomp = null
    stompConnected.value = false
  }

  function teardownMedia() {
    webrtc.cleanup()
    mediaStarted = false
    webrtcStarted = false
    teardownStomp()
  }

  function rememberClientAdmitted() {
    if (role.value !== telehealthRoles.clinician) {
      clientAdmittedOnce = true
    }
  }

  function stompOptions(extra = {}) {
    return {
      sessionId: session.value?.id,
      // Live getter so reconnect uses latest guest_key / meeting_token.
      getGuestAuth: isGuest.value ? () => guestAuth.value : null,
      onError: err => {
        const message = String(
          err?.message
          ?? err
          ?? 'Telehealth realtime connection failed',
        )
        if (message) {
          error.value = message
        }
      },
      ...extra,
    }
  }

  async function ensureWaitingPreview(previewStream = null, mediaPrefs = {}) {
    try {
      if (previewStream) {
        webrtc.adoptLocalStream(previewStream, mediaPrefs)
      }
      if (!webrtc.localStream.value) {
        await webrtc.getLocalMedia({ audio: true, video: true })
        if (mediaPrefs.audioEnabled != null) {
          webrtc.setAudioEnabled(mediaPrefs.audioEnabled)
        }
        if (mediaPrefs.videoEnabled != null) {
          webrtc.setVideoEnabled(mediaPrefs.videoEnabled)
        }
        if (mediaPrefs.speakerEnabled != null) {
          webrtc.setSpeakerEnabled(mediaPrefs.speakerEnabled)
        }
      }
    } catch (err) {
      setError(err, 'Could not start camera preview')
    }
  }

  async function ensureInCallMedia() {
    if (mediaStarted || !session.value?.id) {
      return
    }
    mediaStarted = true
    rememberClientAdmitted()
    markCallClock()
    stopPolling()
    phase.value = 'in_call'
    startHeartbeat()
    try {
      if (!webrtc.localStream.value) {
        await webrtc.getLocalMedia({ audio: true, video: true })
      }
      connectStompAndCall()
      await loadChat()
      if (!isGuest.value) {
        await loadFiles()
      }
    } catch (err) {
      mediaStarted = false
      setError(err, 'Could not start media')
    }
  }

  function tryStartWebRtc({ force = false } = {}) {
    if (!stomp?.isConnected?.() || !selfParticipantId.value) {
      return
    }
    const remote = findRemoteParticipant(
      session.value,
      selfParticipantId.value,
      role.value,
    )
    if (!remote?.id) {
      return
    }
    if (webrtcStarted && !force) {
      return
    }
    if (force) {
      webrtc.closePeerConnection({ keepLocal: true })
    }
    webrtcStarted = true
    const polite = role.value !== telehealthRoles.clinician
    webrtc.startCall({
      iceServers: session.value?.iceServers ?? [],
      selfId: selfParticipantId.value,
      remoteId: remote.id,
      publishSignal: body => stomp?.sendSignal(body),
      isPolite: polite,
    }).then(() => {
      // Client announces it can receive offers (clinician may have
      // offered while this peer was still in the waiting room).
      if (!polite) {
        return
      }
      stomp?.sendSignal({
        type: 'peer_ready',
        fromParticipantId: selfParticipantId.value,
        toParticipantId: remote.id,
        role: role.value,
      })
    }).catch(() => {
      webrtcStarted = false
    })
  }

  function onPeerReadySignal() {
    if (role.value !== telehealthRoles.clinician) {
      return
    }
    const state = String(webrtc.connectionState.value || '')
    if (state === 'connected') {
      return
    }
    tryStartWebRtc({ force: true })
  }

  function connectStompAndCall() {
    const id = session.value?.id
    if (!id) {
      return
    }
    teardownStomp()
    stomp = createTelehealthStompClient(stompOptions({
      onSignal: payload => {
        const type = String(payload?.type ?? '').toLowerCase()
        if (type === 'peer_ready' || type === 'webrtc_ready') {
          onPeerReadySignal()

          return
        }
        if (type === 'screen_share_start') {
          webrtc.setRemoteScreenSharing(
            true,
            payload?.streamId ?? payload?.stream_id ?? null,
          )
          refreshSession().catch(() => {})

          return
        }
        if (type === 'screen_share_stop') {
          webrtc.setRemoteScreenSharing(false)
          refreshSession().catch(() => {})

          return
        }
        webrtc.handleSignal(payload)
      },
      onWaiting: () => {
        refreshSession()
          .then(() => tryStartWebRtc())
          .catch(() => {})
      },
      onChat: payload => {
        const msg = normalizeTelehealthChatMessage(payload)
        if (!msg) {
          return
        }
        if (msg.type === 'message_deleted') {
          chatMessages.value = chatMessages.value.filter(
            m => m.id !== msg.messageId,
          )

          return
        }
        if (!chatMessages.value.some(m => m.id === msg.id)) {
          chatMessages.value = [...chatMessages.value, msg]
        }
      },
      onFiles: isGuest.value
        ? undefined
        : payload => {
          const file = normalizeTelehealthFile(payload)
          if (!file) {
            return
          }
          if (file.type === 'file_deleted') {
            files.value = files.value.filter(f => f.id !== file.id)

            return
          }
          if (!files.value.some(f => f.id === file.id)) {
            files.value = [file, ...files.value]
          }
        },
      onConnect: () => {
        stompConnected.value = true
        tryStartWebRtc()
      },
      onDisconnect: () => {
        stompConnected.value = false
      },
    }))
    stomp.connect()
  }

  function connectWaitingStomp(sessionId) {
    teardownStomp()
    stomp = createTelehealthStompClient(stompOptions({
      sessionId,
      onWaiting: () => {
        refreshSession()
          .then(next => {
            if (shouldClientEnterCall(next)) {
              return ensureInCallMedia()
            }

            return null
          })
          .catch(() => {})
      },
      onConnect: () => {
        stompConnected.value = true
      },
      onDisconnect: () => {
        stompConnected.value = false
      },
    }))
    stomp.connect()
  }

  async function join({
    sessionId,
    joinRole,
    name,
    previewStream = null,
    mediaPrefs = {},
  }) {
    loading.value = true
    clearError()
    try {
      role.value = String(joinRole || telehealthRoles.client).toUpperCase()
      if (role.value === 'PATIENT') {
        role.value = telehealthRoles.client
      }
      displayName.value = String(name ?? '').trim()
      const joined = await joinTelehealthSession(sessionId, {
        role: role.value,
        displayName: displayName.value,
      })
      const self = findSelfParticipant(
        joined,
        role.value,
        displayName.value,
      )
      selfParticipantId.value = joined.selfParticipantId ?? self?.id ?? null
      applySession(joined)
      if (role.value === telehealthRoles.clinician) {
        await enterClinicianMeet(previewStream, mediaPrefs)
      } else {
        await enterClientAfterJoin(
          previewStream,
          mediaPrefs,
          sessionId,
          joined,
        )
      }

      return joined
    } catch (err) {
      setError(err, 'Could not join session')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function joinAsGuest({
    tenantKey,
    subtenantKey,
    meetingCode,
    meetingToken,
    code,
    token,
    name,
    previewStream = null,
    mediaPrefs = {},
  }) {
    loading.value = true
    clearError()
    try {
      role.value = telehealthRoles.client
      displayName.value = String(name ?? '').trim()
      const inviteMeetingCode = String(meetingCode ?? code ?? '').trim()
      const inviteMeetingToken = String(meetingToken ?? token ?? '').trim()
      const joined = await publicJoinTelehealth({
        tenantKey,
        subtenantKey,
        meetingCode: inviteMeetingCode,
        meetingToken: inviteMeetingToken,
        displayName: displayName.value,
      })
      const resolvedGuestKey = String(joined?.guestKey ?? '').trim()
      if (!resolvedGuestKey) {
        throw new Error('Join did not return guest_key')
      }
      // Flat guest creds for public APIs (never nested under `auth`).
      guestAuth.value = {
        tenantKey: String(tenantKey ?? '').trim(),
        subtenantKey: String(subtenantKey ?? '').trim(),
        meetingToken: inviteMeetingToken
          || String(joined?.meetingToken ?? '').trim()
          || null,
        guestKey: resolvedGuestKey,
      }
      selfParticipantId.value = joined?.selfParticipantId ?? null
      if (!selfParticipantId.value) {
        const self = findSelfParticipant(
          joined,
          telehealthRoles.client,
          displayName.value,
        )
        selfParticipantId.value = self?.id ?? null
      }
      applySession(joined)
      await enterClientAfterJoin(
        previewStream,
        mediaPrefs,
        joined?.id,
        joined,
      )

      return joined
    } catch (err) {
      setError(err, 'Could not join session')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function markReady(flags = {}) {
    loading.value = true
    clearError()
    try {
      const payload = {
        cameraTested: flags.cameraTested,
        microphoneTested: flags.microphoneTested,
        speakerTested: flags.speakerTested,
        connectionQuality: flags.connectionQuality,
        ready: true,
      }
      if (isGuest.value && !guestAuth.value?.guestKey) {
        throw new Error('Missing guest_key after join')
      }
      const next = isGuest.value
        ? await publicMarkWaitingRoomReady(guestAuth.value, payload)
        : await markWaitingRoomReady(session.value.id, payload)
      if (normalizeTelehealthSession(next)) {
        applySession(normalizeTelehealthSession(next))
      } else {
        await refreshSession()
      }
    } catch (err) {
      setError(err, 'Could not mark ready')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function admit(participantId) {
    loading.value = true
    clearError()
    try {
      const next = await admitTelehealthParticipant(
        session.value.id,
        participantId,
      )
      applySession(next)
      tryStartWebRtc()
    } catch (err) {
      setError(err, 'Could not admit participant')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function start() {
    loading.value = true
    clearError()
    try {
      const next = await startTelehealthSession(session.value.id)
      applySession(next)
      await ensureInCallMedia()
    } catch (err) {
      setError(err, 'Could not start session')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function finish() {
    loading.value = true
    clearError()
    try {
      const next = await finishTelehealthSession(session.value.id)
      applySession(next)
      phase.value = 'ended'
    } catch (err) {
      setError(err, 'Could not finish session')
      throw err
    } finally {
      captureCallDuration()
      loading.value = false
      minimized.value = false
      stopHeartbeat()
      stopPolling()
      teardownMedia()
    }
  }

  async function leave() {
    loading.value = true
    clearError()
    try {
      if (isGuest.value) {
        await publicLeaveTelehealth(guestAuth.value)
      } else if (session.value?.id) {
        const next = await leaveTelehealthSession(session.value.id)
        if (next) {
          applySession(next)
        }
      }
    } catch (err) {
      setError(err, 'Could not leave session')
    } finally {
      captureCallDuration()
      loading.value = false
      minimized.value = false
      stopHeartbeat()
      stopPolling()
      teardownMedia()
      if (!isTelehealthTerminalStatus(session.value?.status)) {
        phase.value = 'ended'
      }
    }
  }

  function minimizeToRoute(routeLocation) {
    // Floating window is staff-only (not guest/client magic-link).
    if (
      isGuest.value
      || phase.value !== 'in_call'
      || !session.value?.id
    ) {
      return false
    }
    returnRoute.value = routeLocation || {
      name: 'TelehealthSession',
      params: { sessionId: String(session.value.id) },
      query: { role: role.value || undefined },
    }
    minimized.value = true

    return true
  }

  function clearMinimized() {
    minimized.value = false
  }

  const isFloatingCallActive = computed(() =>
    minimized.value
    && !isGuest.value
    && phase.value === 'in_call'
    && Boolean(session.value?.id),
  )

  async function loadChat() {
    if (isGuest.value) {
      chatMessages.value = await publicListTelehealthChat(guestAuth.value)

      return
    }
    if (!session.value?.id) {
      return
    }
    chatMessages.value = await listTelehealthChat(session.value.id)
  }

  async function sendChat(body) {
    const text = String(body ?? '').trim()
    if (!text) {
      return null
    }
    const msg = isGuest.value
      ? await publicPostTelehealthChat(guestAuth.value, text)
      : await postTelehealthChat(session.value.id, text)
    if (msg && !chatMessages.value.some(m => m.id === msg.id)) {
      chatMessages.value = [...chatMessages.value, msg]
    }

    return msg
  }

  async function removeChatMessage(messageId) {
    if (isGuest.value) {
      return
    }
    await deleteTelehealthChatMessage(session.value.id, messageId)
    chatMessages.value = chatMessages.value.filter(m => m.id !== messageId)
  }

  async function loadFiles() {
    if (isGuest.value || !session.value?.id) {
      return
    }
    files.value = await listTelehealthFiles(session.value.id)
  }

  async function uploadFile(file, category) {
    if (isGuest.value) {
      return null
    }
    const uploaded = await uploadTelehealthFile(
      session.value.id,
      file,
      category,
    )
    if (uploaded) {
      files.value = [uploaded, ...files.value.filter(f => f.id !== uploaded.id)]
    }

    return uploaded
  }

  async function removeFile(fileId) {
    if (isGuest.value) {
      return
    }
    await deleteTelehealthFile(session.value.id, fileId)
    files.value = files.value.filter(f => f.id !== fileId)
  }

  async function downloadFile(fileId) {
    return downloadTelehealthFile(session.value.id, fileId)
  }

  async function beginScreenShare() {
    // Capture display first so a REST failure does not block the picker UX.
    await webrtc.startScreenShare({
      onStarted: () => {
        stomp?.sendSignal({
          type: 'screen_share_start',
          participantId: selfParticipantId.value,
          role: role.value,
          streamId: webrtc.screenStream.value?.id ?? null,
        })
      },
    })
    if (!isGuest.value && session.value?.id) {
      try {
        await startTelehealthScreenShare(session.value.id)
        await refreshSession()
      } catch {
        // Keep local share even if session flag update fails.
      }
    }
  }

  async function endScreenShare() {
    await webrtc.stopScreenShare({
      onStopped: () => {
        stomp?.sendSignal({
          type: 'screen_share_stop',
          participantId: selfParticipantId.value,
          role: role.value,
        })
      },
    })
    if (!isGuest.value) {
      await stopTelehealthScreenShare(session.value.id)
    }
    await refreshSession()
  }

  async function resendClientInvite(email) {
    const trimmed = String(email ?? '').trim()
    const next = await resendTelehealthClientInvite(
      session.value.id,
      trimmed ? { email: trimmed } : {},
    )
    if (normalizeTelehealthSession(next)) {
      applySession(normalizeTelehealthSession(next))
    } else {
      await refreshSession()
    }

    return next
  }

  function hydrateSession(raw, options = {}) {
    applySession(raw, options)
  }

  return {
    session,
    role,
    displayName,
    selfParticipantId,
    guestAuth,
    phase,
    loading,
    error,
    chatMessages,
    files,
    stompConnected,
    minimized,
    returnRoute,
    lastCallDurationSeconds,
    elapsedSeconds,
    elapsedLabel,
    isFloatingCallActive,
    status,
    participants,
    waitingParticipants,
    isGuest,
    isClinician,
    isClient,
    isEnded,
    isInProgress,
    webrtc,
    clearError,
    hydrateSession,
    beginLobbyEntry,
    refreshSession,
    join,
    joinAsGuest,
    markReady,
    admit,
    start,
    finish,
    leave,
    minimizeToRoute,
    clearMinimized,
    loadChat,
    sendChat,
    removeChatMessage,
    loadFiles,
    uploadFile,
    removeFile,
    downloadFile,
    beginScreenShare,
    endScreenShare,
    resendClientInvite,
  }
}

let sharedTelehealthSession = null

/** Singleton so the call survives route changes (floating widget). */
export function useTelehealthSession() {
  if (!sharedTelehealthSession) {
    sharedTelehealthSession = createTelehealthSessionState()
  }

  return sharedTelehealthSession
}
