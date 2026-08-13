/* eslint-disable camelcase -- AI API payloads use snake_case */
import { apiInstance } from 'boot/axios'
import {
  aiGenerateTimeoutMs,
  apiPaths,
} from 'components/constants.js'
import {
  aiConfigPromptsToApi,
  normalizeAiConfig,
  normalizeAiSuggestion,
} from 'src/utils/ai-normalize.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

const generateRequestConfig = {
  timeout: aiGenerateTimeoutMs,
}

export function aiApiErrorMessage(error, fallback = 'Request failed') {
  const data = error?.response?.data
  const msg = data?.error_description
    ?? data?.message
    ?? data?.error
    ?? error?.message

  if (typeof msg === 'string' && msg.trim()) {
    return msg.trim()
  }
  if (error?.code === 'ECONNABORTED') {
    return 'AI request timed out. Please try again.'
  }

  return fallback
}

export async function fetchAiConfig() {
  const response = await apiInstance.get(apiPaths.aiConfig)

  return normalizeAiConfig(unwrapData(response.data))
}

export async function patchAiConfig(prompts) {
  const response = await apiInstance.patch(
    apiPaths.aiConfig,
    aiConfigPromptsToApi(prompts),
  )

  return normalizeAiConfig(unwrapData(response.data))
}

export async function fetchAiSuggestion(id) {
  const response = await apiInstance.get(apiPaths.aiSuggestionById(id))

  return normalizeAiSuggestion(unwrapData(response.data))
}

export async function patchAiSuggestion(id, result) {
  const response = await apiInstance.patch(
    apiPaths.aiSuggestionById(id),
    { result },
  )

  return normalizeAiSuggestion(unwrapData(response.data))
}

export async function acceptAiSuggestion(id, payload = {}) {
  const body = {
    commit_to_record: payload.commitToRecord === true,
  }
  if (Array.isArray(payload.acceptedPaths)
    && payload.acceptedPaths.length) {
    body.accepted_paths = payload.acceptedPaths
  }
  if (payload.editedResult != null) {
    body.edited_result = payload.editedResult
  }
  const response = await apiInstance.post(
    apiPaths.aiSuggestionAccept(id),
    body,
  )

  return normalizeAiSuggestion(unwrapData(response.data))
}

export async function rejectAiSuggestion(id, reason) {
  const response = await apiInstance.post(
    apiPaths.aiSuggestionReject(id),
    { reason: String(reason ?? '').trim() },
  )

  return normalizeAiSuggestion(unwrapData(response.data))
}

export async function generateClinicalSummary(clientId, body = {}) {
  const payload = {}
  if (body.scope) {
    payload.scope = body.scope
  }
  if (body.encounterId != null) {
    payload.encounter_id = Number(body.encounterId)
  }
  if (body.historyDays != null) {
    payload.history_days = Number(body.historyDays)
  }
  const response = await apiInstance.post(
    apiPaths.aiClinicalSummary(clientId),
    payload,
    generateRequestConfig,
  )

  return normalizeAiSuggestion(unwrapData(response.data))
}

export async function generateSoapDraft(encounterId) {
  const response = await apiInstance.post(
    apiPaths.aiSoapDraft(encounterId),
    {},
    generateRequestConfig,
  )

  return normalizeAiSuggestion(unwrapData(response.data))
}

export async function generateIcd10Suggest(encounterId, body = {}) {
  const payload = {}
  if (body.clinicalText) {
    payload.clinical_text = String(body.clinicalText).trim()
  }
  if (body.limit != null) {
    payload.limit = Number(body.limit)
  }
  const response = await apiInstance.post(
    apiPaths.aiSuggestIcd10(encounterId),
    payload,
    generateRequestConfig,
  )

  return normalizeAiSuggestion(unwrapData(response.data))
}

export async function generateCarePlanDraft(clientId, body = {}) {
  const payload = {}
  if (body.mode) {
    payload.mode = body.mode
  }
  if (body.targetCarePlanId != null) {
    payload.target_care_plan_id = Number(body.targetCarePlanId)
  }
  if (body.problemMode) {
    payload.problem_mode = body.problemMode
  }
  if (body.encounterId != null) {
    payload.encounter_id = Number(body.encounterId)
  }
  if (Array.isArray(body.focusProblems) && body.focusProblems.length) {
    payload.focus_problems = body.focusProblems
      .map(item => String(item).trim())
      .filter(Boolean)
  }
  const response = await apiInstance.post(
    apiPaths.aiCarePlanDraft(clientId),
    payload,
    generateRequestConfig,
  )

  return normalizeAiSuggestion(unwrapData(response.data))
}

export async function askChartChat(clientId, message, options = {}) {
  const payload = {
    message: String(message ?? '').trim(),
  }
  if (options.encounterId != null && options.encounterId !== '') {
    payload.encounter_id = Number(options.encounterId)
  }
  const conversationId = String(options.conversationId ?? '').trim()
  if (conversationId) {
    payload.conversation_id = conversationId
  } else if (Array.isArray(options.history) && options.history.length) {
    payload.history = options.history
  }
  const response = await apiInstance.post(
    apiPaths.aiChartChat(clientId),
    payload,
    generateRequestConfig,
  )
  const data = unwrapData(response.data) || {}
  const suggestionRaw = data.suggestion

  return {
    feature: data.feature || '',
    intent: data.intent || '',
    answer: data.answer || '',
    fromChart: Boolean(data.fromChart ?? data.from_chart),
    suggestion: suggestionRaw
      ? normalizeAiSuggestion(suggestionRaw)
      : null,
    conversationId:
      data.conversation_id || data.conversationId || '',
  }
}
