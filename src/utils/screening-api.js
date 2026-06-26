/* eslint-disable camelcase -- API request body uses snake_case */
import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { usDateToIso } from 'src/utils/client-form.js'
import {
  normalizeScreeningAnswer,
  normalizeScreeningRecord,
  normalizeScreeningTemplate,
  normalizeScreeningTemplateSummary,
} from 'src/utils/screening-normalize.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

function unwrapList(body) {
  const data = unwrapData(body)
  if (Array.isArray(data)) {
    return data
  }

  return data?.items ?? []
}

export function screeningApiErrorMessage(error, fallback = 'Request failed') {
  const data = error?.response?.data
  const message = data?.error_description
    ?? data?.message
    ?? data?.error
    ?? error?.message

  return String(message || fallback)
}

function serializeAnswerValue(value) {
  if (value === null || value === undefined) {
    return null
  }
  if (Array.isArray(value)) {
    const items = value
      .map(item => String(item ?? '').trim())
      .filter(Boolean)

    return items.length ? items.join(', ') : null
  }
  const trimmed = String(value).trim()

  return trimmed || null
}

function buildAnswersRequestBody(payload = {}) {
  return {
    answers: (payload.answers ?? [])
      .map(item => ({
        question_id: Number(item.questionId) || item.questionId,
        value: serializeAnswerValue(item.value),
      }))
      .filter(item => item.question_id != null && item.question_id !== ''),
  }
}

function normalizeScreeningDetail(body) {
  const data = unwrapData(body)
  const screening = normalizeScreeningRecord(data)
  const template = normalizeScreeningTemplate(
    data?.template ?? {},
  )
  const answers = (data?.answers ?? []).map(normalizeScreeningAnswer)

  return { screening, template, answers }
}

function normalizeTemplatesList(body) {
  return unwrapList(body).map(normalizeScreeningTemplateSummary)
}

function normalizeCreateResponse(body) {
  const data = unwrapData(body)

  return {
    screeningId: data?.id ?? data?.screening_id ?? data?.assessment_id,
    status: String(data?.status ?? 'draft').trim().toLowerCase(),
  }
}

function resolveScreeningDateForApi(value) {
  const iso = usDateToIso(value)
  if (iso) {
    return iso
  }
  const trimmed = String(value ?? '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  return trimmed || null
}

export async function fetchScreeningTemplates(params = {}) {
  const response = await apiInstance.get(apiPaths.screeningTemplates, {
    params,
  })

  return normalizeTemplatesList(response.data)
}

export async function fetchScreeningTemplateById(templateId) {
  const response = await apiInstance.get(
    apiPaths.screeningTemplateById(templateId),
    { params: { include_structure: true } },
  )
  const data = unwrapData(response.data)

  return normalizeScreeningTemplate(data)
}

export async function createClientScreening(clientId, payload) {
  const requestBody = {
    template_id: Number(payload.templateId) || payload.templateId,
    screening_date: resolveScreeningDateForApi(payload.screeningDate),
  }
  if (payload.assignedClinicianId != null
    && String(payload.assignedClinicianId).trim() !== '') {
    requestBody.assigned_clinician_id = Number(payload.assignedClinicianId)
      || payload.assignedClinicianId
  }
  const response = await apiInstance.post(
    apiPaths.clientScreenings(clientId),
    requestBody,
  )

  return normalizeCreateResponse(response.data)
}

export async function listClientScreenings(
  clientId,
  params = {},
) {
  const response = await apiInstance.get(
    apiPaths.clientScreenings(clientId),
    {
      params: {
        page: 0,
        limit: 100,
        ...params,
      },
    },
  )

  return unwrapList(response.data).map(normalizeScreeningRecord)
}

export async function fetchClientScreening(clientId, screeningId) {
  const response = await apiInstance.get(
    apiPaths.clientScreeningById(clientId, screeningId),
    { params: { include_template: true } },
  )

  return normalizeScreeningDetail(response.data)
}

export async function saveScreeningDraft(
  clientId,
  screeningId,
  payload = {},
) {
  const body = buildAnswersRequestBody(payload)
  const response = await apiInstance.patch(
    apiPaths.clientScreeningAnswers(clientId, screeningId),
    body,
  )

  return unwrapData(response.data)
}

export async function completeClientScreening(
  clientId,
  screeningId,
  payload = {},
) {
  const body = buildAnswersRequestBody(payload)
  try {
    const response = await apiInstance.post(
      apiPaths.clientScreeningComplete(clientId, screeningId),
      body,
    )

    return unwrapData(response.data)
  } catch (error) {
    const err = new Error(
      screeningApiErrorMessage(error, 'Could not complete screening'),
    )
    err.cause = error
    throw err
  }
}

export async function cancelClientScreening(clientId, screeningId) {
  const response = await apiInstance.post(
    apiPaths.clientScreeningCancel(clientId, screeningId),
  )

  return unwrapData(response.data)
}
