/* eslint-disable camelcase -- API request body uses snake_case */
import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  mockCompleteAssessment,
  mockCreateAssessment,
  mockGetPatientAssessment,
  mockGetTemplate,
  mockListPatientAssessments,
  mockListTemplates,
  mockSaveDraft,
} from 'src/utils/assessment-mock-store.js'
import {
  normalizeAssessmentAnswer,
  normalizeAssessmentRecord,
  normalizeAssessmentTemplate,
  normalizeAssessmentTemplateSummary,
} from 'src/utils/assessment-normalize.js'
import {
  buildMeasurementsApiPayload,
} from 'src/utils/assessment-measurements.js'

function buildDraftRequestBody(payload = {}) {
  const body = {
    answers: (payload.answers ?? []).map(item => ({
      question_id: item.questionId,
      value: item.value,
    })),
  }
  Object.assign(body, buildMeasurementsApiPayload(payload))

  return body
}

function useMockFallback(error) {
  const status = error?.response?.status
  if (status === 404 || status === 501 || status === 502 || status === 503) {
    return true
  }
  if (!error?.response) {
    return true
  }

  return false
}

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

function normalizeTemplatesList(body) {
  const data = unwrapData(body)
  const list = Array.isArray(data) ? data : data?.items ?? []

  return list.map(normalizeAssessmentTemplateSummary)
}

function normalizeAssessmentDetail(body) {
  const data = unwrapData(body)
  const assessment = normalizeAssessmentRecord(
    data?.assessment ?? data,
  )
  const template = normalizeAssessmentTemplate(
    data?.template ?? {},
  )
  const answers = (data?.answers ?? []).map(normalizeAssessmentAnswer)

  return { assessment, template, answers }
}

export async function fetchAssessmentTemplates() {
  try {
    const response = await apiInstance.get(apiPaths.assessmentTemplates)

    return normalizeTemplatesList(response.data)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mockListTemplates()
  }
}

export async function fetchAssessmentTemplateById(templateId) {
  try {
    const response = await apiInstance.get(
      apiPaths.assessmentTemplateById(templateId),
    )
    const data = unwrapData(response.data)

    return normalizeAssessmentTemplate(data)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }
    const template = mockGetTemplate(templateId)
    if (!template) {
      throw new Error('Template not found')
    }

    return template
  }
}

export async function createPatientAssessment(patientId, payload) {
  try {
    const requestBody = {
      template_id: payload.templateId,
      assigned_clinician_id: payload.assignedClinicianId,
      assessment_date: payload.assessmentDate,
      ...buildMeasurementsApiPayload(payload),
    }
    const response = await apiInstance.post(
      apiPaths.patientAssessments(patientId),
      requestBody,
    )
    const data = unwrapData(response.data)

    return {
      assessmentId: data?.assessment_id ?? data?.assessmentId,
      status: data?.status,
      bmi: data?.bmi ?? null,
    }
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mockCreateAssessment(patientId, payload)
  }
}

export async function fetchPatientAssessment(patientId, assessmentId) {
  try {
    const response = await apiInstance.get(
      apiPaths.patientAssessmentById(patientId, assessmentId),
    )

    return normalizeAssessmentDetail(response.data)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mockGetPatientAssessment(patientId, assessmentId)
  }
}

export async function saveAssessmentDraft(
  patientId,
  assessmentId,
  payload = {},
) {
  const body = buildDraftRequestBody(payload)
  try {
    const response = await apiInstance.put(
      apiPaths.patientAssessmentDraft(patientId, assessmentId),
      body,
    )

    return unwrapData(response.data)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mockSaveDraft(patientId, assessmentId, {
      answers: payload.answers ?? [],
      weight: payload.weight,
      height: payload.height,
    })
  }
}

export async function completePatientAssessment(
  patientId,
  assessmentId,
  payload = {},
) {
  const body = buildDraftRequestBody(payload)
  try {
    const response = await apiInstance.post(
      apiPaths.patientAssessmentComplete(patientId, assessmentId),
      body,
    )

    return unwrapData(response.data)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mockCompleteAssessment(patientId, assessmentId, {
      answers: payload.answers ?? [],
      weight: payload.weight,
      height: payload.height,
    })
  }
}

export async function listPatientAssessments(patientId) {
  try {
    const response = await apiInstance.get(
      apiPaths.patientAssessments(patientId),
    )
    const data = unwrapData(response.data)
    const list = Array.isArray(data) ? data : data?.items ?? []

    return list.map(normalizeAssessmentRecord)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mockListPatientAssessments(patientId)
  }
}
