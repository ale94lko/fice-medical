/* eslint-disable camelcase -- API payloads use snake_case */
import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  diagnosticStudyToCancelPayload,
  diagnosticStudyToCompletePayload,
  diagnosticStudyToExistingPayload,
  diagnosticStudyToOrderPayload,
  diagnosticStudyToPatchPayload,
  diagnosticStudyToResultPayload,
  diagnosticStudyToReviewPayload,
  mapDiagnosticStudiesListFromApi,
  normalizeDiagnosticStudy,
} from 'src/utils/diagnostic-study-normalize.js'
import { extractDownloadFileName } from
  'src/utils/http-headers.js'
import { attachEncounterId } from 'src/utils/encounter-api.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

function resolveStudy(data) {
  return normalizeDiagnosticStudy(data?.diagnostic_study ?? data)
}

function withEncounter(body, patientId, encounterId) {
  const id = Number(encounterId)
  if (Number.isFinite(id) && id > 0) {
    return { ...body, encounter_id: id }
  }

  return attachEncounterId(body, patientId)
}

export async function listPatientDiagnosticStudies(patientId) {
  const response = await apiInstance.get(
    apiPaths.clientDiagnosticStudies(patientId),
    { params: { limit: 200, page: 0 } },
  )
  const data = unwrapData(response.data)
  const list = Array.isArray(data) ? data : data?.items ?? []

  return mapDiagnosticStudiesListFromApi(list)
}

export async function fetchPatientDiagnosticStudy(
  patientId,
  studyId,
) {
  const response = await apiInstance.get(
    apiPaths.clientDiagnosticStudyById(patientId, studyId),
  )

  return resolveStudy(unwrapData(response.data))
}

export async function orderPatientDiagnosticStudy(
  patientId,
  payload,
  encounterId,
) {
  const body = withEncounter(
    diagnosticStudyToOrderPayload(payload),
    patientId,
    encounterId,
  )
  const response = await apiInstance.post(
    apiPaths.clientDiagnosticStudies(patientId),
    body,
  )

  return resolveStudy(unwrapData(response.data))
}

export async function documentExistingDiagnosticStudy(
  patientId,
  payload,
  encounterId,
) {
  const body = withEncounter(
    diagnosticStudyToExistingPayload(payload),
    patientId,
    encounterId,
  )
  const response = await apiInstance.post(
    apiPaths.clientDiagnosticStudyExisting(patientId),
    body,
  )

  return resolveStudy(unwrapData(response.data))
}

export async function updatePatientDiagnosticStudy(
  patientId,
  studyId,
  payload,
) {
  const response = await apiInstance.patch(
    apiPaths.clientDiagnosticStudyById(patientId, studyId),
    diagnosticStudyToPatchPayload(payload),
  )

  return resolveStudy(unwrapData(response.data))
}

export async function completePatientDiagnosticStudy(
  patientId,
  studyId,
  payload,
) {
  const response = await apiInstance.post(
    apiPaths.clientDiagnosticStudyComplete(patientId, studyId),
    diagnosticStudyToCompletePayload(payload),
  )

  return resolveStudy(unwrapData(response.data))
}

export async function addPatientDiagnosticStudyResult(
  patientId,
  studyId,
  payload,
) {
  const response = await apiInstance.post(
    apiPaths.clientDiagnosticStudyResult(patientId, studyId),
    diagnosticStudyToResultPayload(payload),
  )

  return resolveStudy(unwrapData(response.data))
}

export async function reviewPatientDiagnosticStudy(
  patientId,
  studyId,
  payload,
  encounterId,
) {
  const body = withEncounter(
    diagnosticStudyToReviewPayload(payload),
    patientId,
    encounterId,
  )
  const response = await apiInstance.post(
    apiPaths.clientDiagnosticStudyReview(patientId, studyId),
    body,
  )

  return resolveStudy(unwrapData(response.data))
}

export async function cancelPatientDiagnosticStudy(
  patientId,
  studyId,
  payload,
) {
  const response = await apiInstance.post(
    apiPaths.clientDiagnosticStudyCancel(patientId, studyId),
    diagnosticStudyToCancelPayload(payload),
  )

  return resolveStudy(unwrapData(response.data))
}

export async function deletePatientDiagnosticStudy(
  patientId,
  studyId,
) {
  await apiInstance.delete(
    apiPaths.clientDiagnosticStudyById(patientId, studyId),
  )
}

export async function uploadDiagnosticStudySourceDocument(
  patientId,
  studyId,
  file,
) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiInstance.post(
    apiPaths.clientDiagnosticStudySourceDocument(patientId, studyId),
    formData,
  )
  const data = unwrapData(response.data)

  return {
    id: data?.id ?? null,
    originalFilename: data?.original_filename
      ?? data?.originalFilename
      ?? file?.name
      ?? '',
  }
}

export async function downloadDiagnosticStudySourceDocument(
  patientId,
  studyId,
) {
  const response = await apiInstance.get(
    apiPaths.clientDiagnosticStudySourceDownload(patientId, studyId),
    { responseType: 'blob' },
  )

  return {
    blob: response.data,
    fileName: extractDownloadFileName(
      response,
      'diagnostic-study',
    ),
  }
}

export function triggerBlobDownload(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName || 'download'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
