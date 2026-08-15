import { apiInstance } from 'boot/axios'
import { apiPaths, telehealthFileCategories } from 'components/constants.js'
import {
  mapChatMessagesFromApi,
  mapParticipantsFromApi,
  mapTelehealthFilesFromApi,
  normalizeTelehealthAppointmentSummary,
  normalizeTelehealthChatMessage,
  normalizeTelehealthFile,
  normalizeTelehealthSession,
} from 'src/utils/telehealth-normalize.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

/** Session payloads may be `{ data }`, `{ data: { session } }`, or bare. */
function unwrapSessionData(body) {
  const data = unwrapData(body)
  if (
    data
    && typeof data === 'object'
    && !Array.isArray(data)
    && data.session
    && typeof data.session === 'object'
    && !Array.isArray(data.session)
  ) {
    /* eslint-disable camelcase -- merge snake_case API session fields */
    return {
      ...data.session,
      // Keep top-level client fields when API duplicates them outside session.
      client_display_name:
        data.session.client_display_name
        ?? data.session.clientDisplayName
        ?? data.client_display_name
        ?? data.clientDisplayName,
      client_number:
        data.session.client_number
        ?? data.session.clientNumber
        ?? data.client_number
        ?? data.clientNumber,
      clinician_display_name:
        data.session.clinician_display_name
        ?? data.session.clinicianDisplayName
        ?? data.clinician_display_name
        ?? data.clinicianDisplayName,
    }
    /* eslint-enable camelcase */
  }

  return data
}

function unwrapList(data) {
  if (Array.isArray(data)) {
    return data
  }

  return data?.items ?? data?.messages ?? data?.files ?? []
}

function isMeetPublicRequest(error) {
  const url = String(
    error?.config?.url
    ?? error?.config?.baseURL
    ?? '',
  )

  return url.includes('/meet/v1/public/')
}

export function isGuestJoinDisabledError(error) {
  const data = error?.response?.data
  const msg = String(
    data?.error_description
    ?? data?.message
    ?? data?.error
    ?? '',
  )

  return /guest telehealth join is disabled/i.test(msg)
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

/**
 * Retry public meet calls on HTTP 429 with exponential backoff.
 * Honors Retry-After (seconds) when present.
 */
async function withMeetPublicRetry(requestFn, {
  maxAttempts = 4,
  baseDelayMs = 500,
} = {}) {
  let lastError
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      const status = Number(error?.response?.status)
      if (status !== 429 || attempt >= maxAttempts) {
        throw error
      }
      const retryAfterRaw = error?.response?.headers?.['retry-after']
      const retryAfterSec = Number(retryAfterRaw)
      const delayMs = Number.isFinite(retryAfterSec) && retryAfterSec > 0
        ? Math.min(retryAfterSec * 1000, 15000)
        : baseDelayMs * (2 ** (attempt - 1))
      await sleep(delayMs)
    }
  }
  throw lastError
}

function firstApiErrorText(data) {
  if (!data || typeof data !== 'object') {
    return ''
  }
  const direct = String(
    data.message
    ?? data.error_description
    ?? data.errorDescription
    ?? data.error
    ?? '',
  ).trim()
  if (direct) {
    return direct
  }
  const errors = data.errors
  if (typeof errors === 'string' && errors.trim()) {
    return errors.trim()
  }
  if (Array.isArray(errors)) {
    const first = errors.find(item => String(item ?? '').trim())

    return String(first ?? '').trim()
  }
  if (errors && typeof errors === 'object') {
    for (const value of Object.values(errors)) {
      if (Array.isArray(value) && value.length) {
        return String(value[0] ?? '').trim()
      }
      if (value != null && String(value).trim()) {
        return String(value).trim()
      }
    }
  }

  return ''
}

export function apiErrorMessage(error, fallback = 'Request failed') {
  const status = Number(error?.response?.status)
  const apiMessage = firstApiErrorText(error?.response?.data)
  if (status === 429) {
    return String(
      apiMessage
      || 'Too many requests. Please wait and try again.',
    )
  }
  if (
    isMeetPublicRequest(error)
    && (status === 401 || status === 403 || status === 404)
  ) {
    return String(
      apiMessage
      || 'This invite is no longer valid. Ask for a new invite link.',
    )
  }

  return String(apiMessage || error?.message || fallback)
}

export async function createTelehealthSession(appointmentId) {
  const response = await apiInstance.post(apiPaths.telehealthSessions, {
    appointmentId: Number(appointmentId),
  })

  return normalizeTelehealthSession(unwrapSessionData(response.data))
}

export async function getTelehealthSession(sessionId) {
  const response = await apiInstance.get(
    apiPaths.telehealthSession(sessionId),
  )

  return normalizeTelehealthSession(unwrapSessionData(response.data))
}

export async function joinTelehealthSession(sessionId, payload = {}) {
  const response = await apiInstance.post(
    apiPaths.telehealthSessionJoin(sessionId),
    {
      role: payload.role,
      displayName: payload.displayName || undefined,
    },
  )

  return normalizeTelehealthSession(unwrapSessionData(response.data))
}

export async function leaveTelehealthSession(sessionId) {
  const response = await apiInstance.post(
    apiPaths.telehealthSessionLeave(sessionId),
  )

  return normalizeTelehealthSession(unwrapSessionData(response.data))
    || unwrapSessionData(response.data)
}

export async function markWaitingRoomReady(sessionId, payload = {}) {
  const response = await apiInstance.post(
    apiPaths.telehealthWaitingRoomReady(sessionId),
    {
      cameraTested: Boolean(payload.cameraTested),
      microphoneTested: Boolean(payload.microphoneTested),
      speakerTested: Boolean(payload.speakerTested),
      connectionQuality: payload.connectionQuality || undefined,
      ready: payload.ready !== false,
      estimatedWaitSeconds: payload.estimatedWaitSeconds ?? undefined,
    },
  )

  return normalizeTelehealthSession(unwrapSessionData(response.data))
    || unwrapSessionData(response.data)
}

export async function admitTelehealthParticipant(sessionId, participantId) {
  const response = await apiInstance.post(
    apiPaths.telehealthSessionAdmit(sessionId),
    { participantId: Number(participantId) },
  )

  return normalizeTelehealthSession(unwrapSessionData(response.data))
}

export async function startTelehealthSession(sessionId) {
  const response = await apiInstance.post(
    apiPaths.telehealthSessionStart(sessionId),
  )

  return normalizeTelehealthSession(unwrapSessionData(response.data))
}

export async function finishTelehealthSession(sessionId) {
  const response = await apiInstance.post(
    apiPaths.telehealthSessionFinish(sessionId),
  )

  return normalizeTelehealthSession(unwrapSessionData(response.data))
}

export async function listTelehealthParticipants(sessionId) {
  const response = await apiInstance.get(
    apiPaths.telehealthSessionParticipants(sessionId),
  )

  return mapParticipantsFromApi(unwrapList(unwrapData(response.data)))
}

export async function sendTelehealthHeartbeat(sessionId) {
  await apiInstance.post(apiPaths.telehealthSessionHeartbeat(sessionId))
}

export async function listTelehealthChat(sessionId) {
  const response = await apiInstance.get(
    apiPaths.telehealthSessionChat(sessionId),
  )

  return mapChatMessagesFromApi(unwrapList(unwrapData(response.data)))
}

export async function postTelehealthChat(sessionId, body) {
  const response = await apiInstance.post(
    apiPaths.telehealthSessionChat(sessionId),
    { body: String(body ?? '') },
  )

  return normalizeTelehealthChatMessage(unwrapData(response.data))
}

export async function deleteTelehealthChatMessage(sessionId, messageId) {
  await apiInstance.delete(
    apiPaths.telehealthSessionChatMessage(sessionId, messageId),
  )
}

export async function listTelehealthFiles(sessionId) {
  const response = await apiInstance.get(
    apiPaths.telehealthSessionFiles(sessionId),
  )

  return mapTelehealthFilesFromApi(unwrapList(unwrapData(response.data)))
}

export async function uploadTelehealthFile(
  sessionId,
  file,
  category = telehealthFileCategories.clinicalDocument,
) {
  const formData = new FormData()
  formData.append('file', file)
  if (category) {
    formData.append('category', category)
  }
  const response = await apiInstance.post(
    apiPaths.telehealthSessionFiles(sessionId),
    formData,
  )

  return normalizeTelehealthFile(unwrapData(response.data))
}

export async function downloadTelehealthFile(sessionId, fileId) {
  const response = await apiInstance.get(
    apiPaths.telehealthSessionFileDownload(sessionId, fileId),
    { responseType: 'blob' },
  )

  return response.data
}

export async function deleteTelehealthFile(sessionId, fileId) {
  await apiInstance.delete(
    apiPaths.telehealthSessionFileById(sessionId, fileId),
  )
}

export async function startTelehealthScreenShare(sessionId) {
  const response = await apiInstance.post(
    apiPaths.telehealthScreenShareStart(sessionId),
  )

  return normalizeTelehealthSession(unwrapSessionData(response.data))
    || unwrapSessionData(response.data)
}

export async function stopTelehealthScreenShare(sessionId) {
  const response = await apiInstance.post(
    apiPaths.telehealthScreenShareStop(sessionId),
  )

  return normalizeTelehealthSession(unwrapSessionData(response.data))
    || unwrapSessionData(response.data)
}

export async function resendTelehealthClientInvite(sessionId, payload = {}) {
  const body = {}
  const email = String(payload.email ?? '').trim()
  if (email) {
    body.email = email
  }
  const response = await apiInstance.post(
    apiPaths.telehealthSessionResendInvite(sessionId),
    body,
  )

  return normalizeTelehealthSession(unwrapSessionData(response.data))
    || unwrapSessionData(response.data)
}

/**
 * Flat public guest body (no nested `auth`).
 * Keys are snake_case to match the current API contract.
 */
/* eslint-disable camelcase -- public telehealth guest payloads */
function buildPublicGuestBody(creds = {}, extra = {}) {
  const tenant_key = String(
    creds.tenantKey ?? creds.tenant_key ?? '',
  ).trim()
  const subtenant_key = String(
    creds.subtenantKey ?? creds.subtenant_key ?? '',
  ).trim()
  const meeting_token = String(
    creds.meetingToken ?? creds.meeting_token ?? '',
  ).trim()
  const guest_key = String(
    creds.guestKey ?? creds.guest_key ?? '',
  ).trim()
  if (!tenant_key || !subtenant_key || !meeting_token || !guest_key) {
    throw new Error(
      'Missing tenant_key, subtenant_key, meeting_token or guest_key',
    )
  }

  return {
    tenant_key,
    subtenant_key,
    meeting_token,
    guest_key,
    ...extra,
  }
}
/* eslint-enable camelcase */

function buildPublicInviteBody(payload = {}) {
  /* eslint-disable camelcase -- public telehealth invite payloads */
  return {
    tenant_key: String(
      payload.tenantKey ?? payload.tenant_key ?? '',
    ).trim(),
    subtenant_key: String(
      payload.subtenantKey ?? payload.subtenant_key ?? '',
    ).trim(),
    meeting_code: String(
      payload.meetingCode ?? payload.code ?? payload.meeting_code ?? '',
    ).trim(),
    meeting_token: String(
      payload.meetingToken ?? payload.token ?? payload.meeting_token ?? '',
    ).trim(),
  }
  /* eslint-enable camelcase */
}

/**
 * Guest lobby preview (no participant). Returns appointment summary only.
 */
export async function publicLobbyTelehealth(payload = {}) {
  return withMeetPublicRetry(async() => {
    const response = await apiInstance.post(
      apiPaths.telehealthPublicLobby,
      buildPublicInviteBody(payload),
    )
    const data = unwrapData(response.data) || {}
    const appointmentSummary = normalizeTelehealthAppointmentSummary(
      data.appointment_summary ?? data.appointmentSummary,
    )
    const clinicianDisplayName = String(
      data.clinician_display_name
      ?? data.clinicianDisplayName
      ?? appointmentSummary?.clinicianDisplayName
      ?? '',
    ).trim()

    return {
      appointmentSummary,
      clinicianDisplayName,
    }
  })
}

export async function publicJoinTelehealth(payload = {}) {
  return withMeetPublicRetry(async() => {
    /* eslint-disable camelcase -- public telehealth join payload */
    const response = await apiInstance.post(apiPaths.telehealthPublicJoin, {
      ...buildPublicInviteBody(payload),
      display_name:
        payload.displayName || payload.display_name || undefined,
    })
    /* eslint-enable camelcase */

    return normalizeTelehealthSession(unwrapData(response.data))
  })
}

export async function publicGetTelehealthSession(creds) {
  return withMeetPublicRetry(async() => {
    const response = await apiInstance.post(
      apiPaths.telehealthPublicSession,
      buildPublicGuestBody(creds),
    )

    return normalizeTelehealthSession(unwrapData(response.data))
  })
}

export async function publicMarkWaitingRoomReady(creds, payload = {}) {
  return withMeetPublicRetry(async() => {
    /* eslint-disable camelcase -- public waiting-room ready payload */
    const response = await apiInstance.post(
      apiPaths.telehealthPublicWaitingReady,
      buildPublicGuestBody(creds, {
        camera_tested: Boolean(payload.cameraTested),
        microphone_tested: Boolean(payload.microphoneTested),
        speaker_tested: Boolean(payload.speakerTested),
        connection_quality: payload.connectionQuality || undefined,
        ready: payload.ready !== false,
        estimated_wait_seconds: payload.estimatedWaitSeconds ?? undefined,
      }),
    )
    /* eslint-enable camelcase */

    return normalizeTelehealthSession(unwrapData(response.data))
      || unwrapData(response.data)
  })
}

export async function publicSendTelehealthHeartbeat(creds) {
  return withMeetPublicRetry(async() => {
    await apiInstance.post(
      apiPaths.telehealthPublicHeartbeat,
      buildPublicGuestBody(creds),
    )
  })
}

export async function publicLeaveTelehealth(creds) {
  return withMeetPublicRetry(async() => {
    const response = await apiInstance.post(
      apiPaths.telehealthPublicLeave,
      buildPublicGuestBody(creds),
    )

    return normalizeTelehealthSession(unwrapData(response.data))
      || unwrapData(response.data)
  })
}

export async function publicListTelehealthChat(creds) {
  return withMeetPublicRetry(async() => {
    const response = await apiInstance.post(
      apiPaths.telehealthPublicChat,
      buildPublicGuestBody(creds),
    )

    return mapChatMessagesFromApi(unwrapList(unwrapData(response.data)))
  })
}

export async function publicPostTelehealthChat(creds, body) {
  return withMeetPublicRetry(async() => {
    const response = await apiInstance.post(
      apiPaths.telehealthPublicChatSend,
      buildPublicGuestBody(creds, {
        body: String(body ?? ''),
      }),
    )

    return normalizeTelehealthChatMessage(unwrapData(response.data))
  })
}
