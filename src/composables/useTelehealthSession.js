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
  mapParticipantsFromApi,
  normalizeTelehealthChatMessage,
  normalizeTelehealthFile,
  normalizeTelehealthParticipant,
  normalizeTelehealthSession,
  resolveTelehealthDurationSeconds,
  resolveTelehealthElapsedSeconds,
} from 'src/utils/telehealth-normalize.js'
import { createTelehealthStompClient } from 'src/utils/telehealth-stomp.js'
import { useTelehealthWebRtc } from 'src/composables/useTelehealthWebRtc.js'

function findSelfParticipant(session, role, displayName) {
  const list = session?.participants ?? []
  const selfId = toSessionSelfId(session)
  if (selfId != null) {
    const byId = list.find(p => p.id === selfId)
    if (byId) {
      return byId
    }
  }
  const roleToken = String(role ?? '').toUpperCase()
  const matchRoles = isClientLikeRole(roleToken)
    ? [telehealthRoles.client, telehealthRoles.guest, 'PATIENT']
    : [roleToken]
  const byRole = list.filter(p => matchRoles.includes(p.role))
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

  // Never fall back to an unrelated participant (e.g. clinician).
  return byRole[0] || null
}

function toSessionSelfId(session) {
  const raw = session?.selfParticipantId
  if (raw == null || raw === '') {
    return null
  }
  const n = Number(raw)

  return Number.isFinite(n) ? n : null
}

function isClientLikeRole(role) {
  const token = String(role ?? '').toUpperCase()

  return (
    token === telehealthRoles.client
    || token === telehealthRoles.guest
    || token === 'PATIENT'
  )
}

function isParticipantInCallStatus(status) {
  const token = String(status ?? '').toUpperCase()

  return (
    token === telehealthParticipantStatuses.admitted
    || token === telehealthParticipantStatuses.inSession
    || token === 'IN_CALL'
    || token === 'CONNECTED'
  )
}

function isParticipantLeft(status) {
  const token = String(status ?? '').toUpperCase()

  return token === telehealthParticipantStatuses.left || token === 'LEFT'
}

function findRemoteParticipant(session, selfId, selfRole) {
  const selfNum = Number(selfId)
  const list = (session?.participants ?? []).filter(
    p => p.id != null && Number(p.id) !== selfNum,
  )
  // Clinician: only offer to admitted clients (not waiting-room).
  if (selfRole === telehealthRoles.clinician) {
    const active = list.filter(p => isParticipantInCallStatus(p.status))

    return active.find(p => isClientLikeRole(p.role))
      || active[0]
      || null
  }

  // Client/guest: clinician may not use ADMITTED — still connect to them.
  const clinicianPeer = list.find(
    p => p.role === telehealthRoles.clinician && !isParticipantLeft(p.status),
  )
  if (clinicianPeer) {
    return clinicianPeer
  }
  const active = list.filter(p => isParticipantInCallStatus(p.status))

  return active[0] || null
}

function isParticipantAdmitted(participant) {
  return isParticipantInCallStatus(participant?.status)
}

function isParticipantWaitingStatus(status) {
  const token = String(status ?? '').toUpperCase()

  return (
    token === telehealthParticipantStatuses.waiting
    || token === 'READY'
    || token === 'IN_WAITING_ROOM'
    || token === 'WAITING_ROOM'
  )
}

function mergeParticipants(current = [], incoming = []) {
  const byId = new Map()
  for (const participant of current) {
    if (participant?.id != null) {
      byId.set(participant.id, participant)
    }
  }
  for (const participant of incoming) {
    if (participant?.id == null) {
      continue
    }
    byId.set(participant.id, {
      ...(byId.get(participant.id) || {}),
      ...participant,
    })
  }

  return [...byId.values()]
}

function participantsFromWaitingPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const body = payload.data && typeof payload.data === 'object'
    ? payload.data
    : payload
  const list = body.participants
    ?? body.participant_list
    ?? body.waiting_participants
    ?? body.waitingParticipants
  if (Array.isArray(list)) {
    return mapParticipantsFromApi(list)
  }
  const single = body.participant
    || (
      body.id != null && (body.role || body.status)
        ? body
        : null
    )
  const normalized = normalizeTelehealthParticipant(single)

  return normalized ? [normalized] : []
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
  let chatPollTimer = null
  let elapsedTimer = null
  let mediaStarted = false
  let webrtcStarted = false
  let callStartedAtMs = null
  /** Client was admitted once in this meet — may re-enter without waiting. */
  let clientAdmittedOnce = false

  const status = computed(() => session.value?.status || '')
  const participants = computed(() => session.value?.participants ?? [])
  const waitingParticipants = computed(() =>
    participants.value.filter(p => isParticipantWaitingStatus(p.status)),
  )
  const isGuest = computed(() => Boolean(guestAuth.value?.guestKey))
  const isClinician = computed(() => role.value === telehealthRoles.clinician)
  const isClient = computed(() =>
    role.value === telehealthRoles.client || isGuest.value,
  )

  function upsertChatMessage(msg) {
    if (!msg || msg.type === 'message_deleted') {
      return
    }
    if (chatMessages.value.some(m => m.id === msg.id)) {
      return
    }
    chatMessages.value = [...chatMessages.value, msg]
  }

  function applyChatPayload(payload) {
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
    upsertChatMessage(msg)
  }

  function mergeChatMessages(incoming) {
    const list = Array.isArray(incoming) ? incoming : []
    if (!list.length) {
      return
    }
    const byId = new Map(
      chatMessages.value.map(item => [item.id, item]),
    )
    for (const msg of list) {
      if (msg?.id == null || msg.type === 'message_deleted') {
        continue
      }
      byId.set(msg.id, msg)
    }
    chatMessages.value = [...byId.values()].sort((a, b) => {
      const aTime = String(a.createdAt || '')
      const bTime = String(b.createdAt || '')
      if (aTime && bTime && aTime !== bTime) {
        return aTime.localeCompare(bTime)
      }

      return Number(a.id) - Number(b.id)
    })
  }

  function stopChatPolling() {
    if (chatPollTimer) {
      clearInterval(chatPollTimer)
      chatPollTimer = null
    }
  }

  function startChatPolling() {
    stopChatPolling()
    // Guest may miss staff STOMP chat frames; poll public list as backup.
    if (!isGuest.value) {
      return
    }
    chatPollTimer = setInterval(() => {
      if (phase.value !== 'in_call' || !guestAuth.value?.guestKey) {
        return
      }
      publicListTelehealthChat(guestAuth.value)
        .then(mergeChatMessages)
        .catch(() => {})
    }, 2500)
  }
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
    const nextParticipants = Array.isArray(next.participants)
      ? next.participants
      : null
    // Prefer API list when present; merge so admit status updates win by id.
    // Do not keep stale WAITING forever when API sends a real empty list.
    const mergedParticipants = nextParticipants == null
      ? (prev.participants ?? [])
      : (
        nextParticipants.length
          ? mergeParticipants(prev.participants, nextParticipants)
          : nextParticipants
      )
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
      participants: mergedParticipants,
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
      stopChatPolling()
      stopElapsedTicker()
      teardownMedia()

      return
    }
    if (next.status === telehealthSessionStatuses.inProgress) {
      // First visit: wait for admit. After admit, re-enter if meet is live.
      if (
        role.value !== telehealthRoles.clinician
        && !isSelfAdmitted(session.value)
        && !canClientReenterMeet(session.value)
      ) {
        if (phase.value !== 'lobby') {
          phase.value = 'waiting'
        }

        return
      }
      const clientEntering = role.value !== telehealthRoles.clinician
        && (
          isSelfAdmitted(session.value)
          || canClientReenterMeet(session.value)
        )
      if (clientEntering) {
        clientAdmittedOnce = true
      }
      const wasWaiting = phase.value === 'waiting'
      phase.value = 'in_call'
      startElapsedTicker()
      // Admit must start media/STOMP — phase alone is not enough.
      if (clientEntering && wasWaiting && !mediaStarted) {
        void ensureInCallMedia()
      }
    } else if (
      next.status === telehealthSessionStatuses.waitingRoom
      || next.status === telehealthSessionStatuses.ready
      || next.status === telehealthSessionStatuses.scheduled
    ) {
      applyPreCallPhase()
    }
  }

  function applyPreCallPhase() {
    // Clinicians never use the waiting-room screen — they join the meet
    // UI directly and admit clients from the in-call side panel.
    if (role.value === telehealthRoles.clinician) {
      if (phase.value === 'lobby' || phase.value === 'ended') {
        return
      }
      if (phase.value !== 'waiting') {
        return
      }
      phase.value = 'in_call'
      startElapsedTicker()
      if (!mediaStarted) {
        void ensureInCallMedia()
      }

      return
    }
    if (phase.value === 'lobby') {
      return
    }
    phase.value = 'waiting'
    stopElapsedTicker()
  }

  function resolveSelfParticipant(sess = session.value) {
    if (selfParticipantId.value != null) {
      const byId = findParticipantById(sess, selfParticipantId.value)
      if (byId) {
        return byId
      }
    }

    return findSelfParticipant(
      sess,
      role.value,
      displayName.value,
    )
  }

  function isSelfAdmitted(sess = session.value) {
    return isParticipantAdmitted(resolveSelfParticipant(sess))
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
    // Never leave the clinician on the legacy waiting-room phase.
    if (phase.value === 'waiting' || phase.value === 'lobby') {
      phase.value = 'in_call'
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
          // Client: enter call after admit. Clinician: keep waiting list fresh.
          tryEnterCallAfterAdmitCheck(next)
          if (
            role.value === telehealthRoles.clinician
            && phase.value === 'in_call'
          ) {
            tryStartWebRtc()
          }
        })
        .catch(() => {})
    }, 2000)
  }

  function applyWaitingPayload(payload) {
    const incoming = participantsFromWaitingPayload(payload)
    if (!incoming.length || !session.value) {
      return
    }
    session.value = {
      ...session.value,
      participants: mergeParticipants(
        session.value.participants,
        incoming,
      ),
    }
  }

  function onClinicianWaitingEvent(payload) {
    applyWaitingPayload(payload)
    refreshSession()
      .then(() => tryStartWebRtc())
      .catch(() => {})
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
    stopChatPolling()
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
    phase.value = 'in_call'
    startHeartbeat()
    // Clinician must keep polling — waiting-room STOMP can be missed when
    // the client joins after the clinician is already in_call.
    if (role.value === telehealthRoles.clinician) {
      startPolling()
    } else {
      stopPolling()
    }
    try {
      if (!webrtc.localStream.value) {
        await webrtc.getLocalMedia({ audio: true, video: true })
      }
      connectStompAndCall()
      scheduleGuestWebRtcRetries()
      scheduleClinicianOfferRetries()
      await loadChat()
      startChatPolling()
      if (!isGuest.value) {
        await loadFiles()
      }
    } catch (err) {
      mediaStarted = false
      stopChatPolling()
      setError(err, 'Could not start media')
    }
  }

  function isWebRtcConnected() {
    const state = String(webrtc.connectionState.value || '')
    const ice = String(webrtc.iceConnectionState.value || '')

    return state === 'connected'
      || ice === 'connected'
      || ice === 'completed'
  }

  function shouldRecoverWebRtc() {
    const state = String(webrtc.connectionState.value || '')
    const ice = String(webrtc.iceConnectionState.value || '')

    return (
      state === 'failed'
      || state === 'disconnected'
      || state === 'closed'
      || ice === 'failed'
      || ice === 'disconnected'
      || ice === 'closed'
    )
  }

  function announcePeerReady(remoteId) {
    if (!remoteId || !stomp?.isConnected?.()) {
      return
    }
    stomp.sendSignal({
      type: 'peer_ready',
      fromParticipantId: selfParticipantId.value,
      toParticipantId: remoteId,
      role: role.value,
    })
  }

  function tryStartWebRtc({ force = false, offer = false } = {}) {
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
    const isClinicianPeer = role.value === telehealthRoles.clinician
    let shouldForce = force
    if (webrtcStarted && !shouldForce) {
      if (isWebRtcConnected()) {
        return
      }
      if (shouldRecoverWebRtc()) {
        shouldForce = true
      } else if (isClinicianPeer && offer && webrtc.hasPeerConnection?.()) {
        // PC already up — just (re)send offer for peer_ready / retries.
        void webrtc.createAndSendOffer()

        return
      } else if (!offer) {
        return
      }
    }
    try {
      if (shouldForce) {
        webrtc.closePeerConnection({ keepLocal: true })
        webrtcStarted = false
      }
      webrtcStarted = true
      // Clinician prepares PC immediately but must NOT offer until the
      // guest is on /signal (peer_ready). Otherwise the offer is lost.
      const offerImmediately = isClinicianPeer
        ? Boolean(offer)
        : false
      webrtc.startCall({
        iceServers: session.value?.iceServers ?? [],
        selfId: selfParticipantId.value,
        remoteId: remote.id,
        publishSignal: body => stomp?.sendSignal(body),
        isPolite: !isClinicianPeer,
        offerImmediately,
      }).then(() => {
        if (isClinicianPeer) {
          return
        }
        // Tell clinician we are on /signal and ready for an offer.
        announcePeerReady(remote.id)
        ;[1000, 2500, 5000].forEach(delayMs => {
          window.setTimeout(() => {
            if (phase.value !== 'in_call' || isWebRtcConnected()) {
              return
            }
            announcePeerReady(remote.id)
          }, delayMs)
        })
      }).catch(() => {
        webrtcStarted = false
      })
    } catch {
      webrtcStarted = false
    }
  }

  async function onPeerReadySignal() {
    if (role.value !== telehealthRoles.clinician) {
      return
    }
    if (isWebRtcConnected()) {
      return
    }
    try {
      await refreshSession()
    } catch {
      // use current session snapshot
    }
    // Soft offer on existing PC; force only when ICE/PC is broken.
    tryStartWebRtc({
      force: shouldRecoverWebRtc(),
      offer: true,
    })
    window.setTimeout(() => {
      if (phase.value === 'in_call' && !isWebRtcConnected()) {
        tryStartWebRtc({
          force: shouldRecoverWebRtc(),
          offer: true,
        })
      }
    }, 2000)
  }

  function scheduleGuestWebRtcRetries() {
    if (role.value === telehealthRoles.clinician) {
      return
    }
    ;[500, 2000, 4000].forEach(delayMs => {
      window.setTimeout(() => {
        if (phase.value !== 'in_call' || isWebRtcConnected()) {
          return
        }
        // Only force-rebuild when ICE/PC actually failed — never while
        // still "connecting" (that tears down a valid in-flight answer).
        tryStartWebRtc({
          force: webrtcStarted && shouldRecoverWebRtc(),
        })
      }, delayMs)
    })
  }

  function scheduleClinicianOfferRetries() {
    if (role.value !== telehealthRoles.clinician) {
      return
    }
    ;[3000, 6000, 10000].forEach(delayMs => {
      window.setTimeout(() => {
        if (phase.value !== 'in_call' || isWebRtcConnected()) {
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
        tryStartWebRtc({
          force: shouldRecoverWebRtc(),
          offer: true,
        })
      }, delayMs)
    })
  }

  function normalizeIncomingSignal(payload) {
    if (!payload || typeof payload !== 'object') {
      return null
    }
    const nested = payload.data
    if (
      nested
      && typeof nested === 'object'
      && !Array.isArray(nested)
      && payload.type == null
      && nested.type != null
    ) {
      return nested
    }

    return payload
  }

  function connectStompAndCall() {
    const id = session.value?.id
    if (!id) {
      return
    }
    teardownStomp()
    stomp = createTelehealthStompClient(stompOptions({
      onSignal: payload => {
        const msg = normalizeIncomingSignal(payload)
        const type = String(msg?.type ?? '')
          .toLowerCase()
          .replace(/_/g, '-')
        if (type === 'peer-ready' || type === 'webrtc-ready') {
          void onPeerReadySignal()

          return
        }
        if (type === 'screen-share-start') {
          webrtc.setRemoteScreenSharing(
            true,
            msg?.streamId ?? msg?.stream_id ?? null,
          )
          refreshSession().catch(() => {})

          return
        }
        if (type === 'screen-share-stop') {
          webrtc.setRemoteScreenSharing(false)
          refreshSession().catch(() => {})

          return
        }
        webrtc.handleSignal(msg)
      },
      onWaiting: payload => {
        if (role.value === telehealthRoles.clinician) {
          onClinicianWaitingEvent(payload)

          return
        }
        refreshSession()
          .then(() => tryStartWebRtc())
          .catch(() => {})
      },
      onChat: applyChatPayload,
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

  function tryEnterCallAfterAdmitCheck(sess) {
    if (!shouldClientEnterCall(sess || session.value)) {
      return false
    }
    void ensureInCallMedia()

    return true
  }

  function connectWaitingStomp(sessionId) {
    teardownStomp()
    stomp = createTelehealthStompClient(stompOptions({
      sessionId,
      // Guest waiting socket must also hear chat (provider may write early).
      onChat: applyChatPayload,
      onWaiting: payload => {
        applyWaitingPayload(payload)
        if (tryEnterCallAfterAdmitCheck(session.value)) {
          return
        }
        refreshSession()
          .then(next => {
            tryEnterCallAfterAdmitCheck(next)
          })
          .catch(() => {})
      },
      onConnect: () => {
        stompConnected.value = true
        // Catch admits that happened while STOMP was connecting.
        refreshSession()
          .then(next => {
            tryEnterCallAfterAdmitCheck(next)
          })
          .catch(() => {})
      },
      onDisconnect: () => {
        stompConnected.value = false
      },
    }))
    stomp.connect()
  }

  async function resolveJoinSession(sessionId) {
    try {
      return await joinTelehealthSession(sessionId, {
        role: role.value,
        displayName: displayName.value,
      })
    } catch (err) {
      const status = Number(err?.response?.status)
      // Already in the meet (or idempotent join) — continue via GET.
      if (status !== 400 && status !== 409) {
        throw err
      }
      const existing = await getTelehealthSession(sessionId)
      const self = findSelfParticipant(
        existing,
        role.value,
        displayName.value,
      )
      if (!existing?.selfParticipantId && !self) {
        throw err
      }

      return existing
    }
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
      const joined = await resolveJoinSession(sessionId)
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
          telehealthRoles.guest,
          displayName.value,
        )
          || findSelfParticipant(
            joined,
            telehealthRoles.client,
            displayName.value,
          )
        selfParticipantId.value = self?.id ?? null
      }
      // Guest join uses CLIENT role in app state; API peer may be GUEST.
      role.value = telehealthRoles.client
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
      // Do not offer WebRTC yet — guest is still on waiting STOMP (no
      // /signal). Guest sends peer_ready after ensureInCallMedia; that
      // triggers the clinician offer.
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
      mergeChatMessages(await publicListTelehealthChat(guestAuth.value))

      return
    }
    if (!session.value?.id) {
      return
    }
    mergeChatMessages(await listTelehealthChat(session.value.id))
  }

  async function sendChat(body) {
    const text = String(body ?? '').trim()
    if (!text) {
      return null
    }
    const msg = isGuest.value
      ? await publicPostTelehealthChat(guestAuth.value, text)
      : await postTelehealthChat(session.value.id, text)
    upsertChatMessage(msg)

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
