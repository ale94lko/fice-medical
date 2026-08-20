import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  labToCollectApiPayload,
  labToOrderApiPayload,
  labToPatchApiPayload,
  labToResultsApiPayload,
  labToReviewApiPayload,
  mapClientLabsListFromApi,
  normalizeLabDetail,
  normalizeLabFile,
} from 'src/utils/lab-normalize.js'
import { mapLabComponentDefinitionFromApi } from
  'src/utils/lab-orders.js'
import { extractDownloadFileName } from
  'src/utils/http-headers.js'
import { attachEncounterId } from 'src/utils/encounter-api.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

function resolveLabFromResponse(data) {
  return normalizeLabDetail(data?.lab ?? data)
}

export async function listPatientLabs(patientId) {
  const response = await apiInstance.get(apiPaths.patientLabs(patientId))
  const data = unwrapData(response.data)
  const list = Array.isArray(data) ? data : data?.items ?? []

  return mapClientLabsListFromApi(list)
}

export async function listLabComponentDefinitions({
  activeOnly = true,
} = {}) {
  const response = await apiInstance.get(
    apiPaths.labComponentDefinitions,
    { params: { 'active_only': activeOnly } },
  )
  const data = unwrapData(response.data)
  const items = Array.isArray(data) ? data : data?.items ?? []

  return items.map(mapLabComponentDefinitionFromApi)
}

export async function fetchPatientLab(patientId, labId) {
  const response = await apiInstance.get(
    apiPaths.patientLabById(patientId, labId),
  )
  const data = unwrapData(response.data)

  return resolveLabFromResponse(data)
}

/** Create lab order (status → ORDERED via endpoint). */
export async function createPatientLab(patientId, payload) {
  const body = attachEncounterId(
    labToOrderApiPayload(payload),
    patientId,
  )
  const response = await apiInstance.post(
    apiPaths.patientLabs(patientId),
    body,
  )
  const data = unwrapData(response.data)

  return {
    labId: data?.lab_id ?? data?.labId ?? data?.id,
    status: data?.status,
    lab: data?.lab ? resolveLabFromResponse(data) : null,
  }
}

/** PATCH fields allowed for the lab's current status (no status field). */
export async function updatePatientLab(patientId, labId, payload) {
  const body = labToPatchApiPayload(payload, payload?.status)
  const response = await apiInstance.patch(
    apiPaths.patientLabById(patientId, labId),
    body,
  )
  const data = unwrapData(response.data)

  return resolveLabFromResponse(data)
}

/** ORDERED → COLLECTED */
export async function collectPatientLab(patientId, labId, payload) {
  const body = labToCollectApiPayload(payload)
  const response = await apiInstance.post(
    apiPaths.patientLabCollect(patientId, labId),
    body,
  )
  const data = unwrapData(response.data)

  return resolveLabFromResponse(data)
}

/** COLLECTED → RESULTED */
export async function enterLabResults(patientId, labId, payload) {
  const body = labToResultsApiPayload(payload)
  const response = await apiInstance.post(
    apiPaths.patientLabResults(patientId, labId),
    body,
  )
  const data = unwrapData(response.data)

  return resolveLabFromResponse(data)
}

/** RESULTED → REVIEWED */
export async function reviewPatientLab(patientId, labId, payload) {
  const body = labToReviewApiPayload(payload)
  const response = await apiInstance.post(
    apiPaths.patientLabReview(patientId, labId),
    body,
  )
  const data = unwrapData(response.data)

  return resolveLabFromResponse(data)
}

/** Any non-cancelled / non-reviewed → CANCELLED */
export async function cancelPatientLab(patientId, labId, reason = '') {
  const trimmed = String(reason ?? '').trim()
  const body = trimmed ? { reason: trimmed } : {}
  const response = await apiInstance.post(
    apiPaths.patientLabCancel(patientId, labId),
    body,
  )
  const data = unwrapData(response.data)

  return data?.lab || data?.status
    ? resolveLabFromResponse(data)
    : null
}

export async function deletePatientLab(patientId, labId) {
  await apiInstance.delete(apiPaths.patientLabById(patientId, labId))
}

export async function uploadLabFile(clientId, labId, file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiInstance.post(
    apiPaths.clientLabFiles(clientId, labId),
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )

  return normalizeLabFile(unwrapData(response.data))
}

/** @deprecated use uploadLabFile */
export const uploadLabAttachment = uploadLabFile

export async function downloadLabFile(clientId, labId, fileId) {
  const response = await apiInstance.get(
    apiPaths.clientLabFileDownload(clientId, labId, fileId),
    { responseType: 'blob' },
  )

  return {
    blob: response.data,
    fileName: extractFileName(response),
  }
}

/** @deprecated use downloadLabFile */
export const downloadLabAttachment = downloadLabFile

export async function deleteLabFile(clientId, labId, fileId) {
  await apiInstance.delete(
    apiPaths.clientLabFileById(clientId, labId, fileId),
  )
}

/** @deprecated use deleteLabFile */
export const deleteLabAttachment = deleteLabFile

function extractFileName(response) {
  return extractDownloadFileName(response, 'lab-attachment')
}

export function triggerBlobDownload(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName || 'download'
  anchor.click()
  URL.revokeObjectURL(url)
}
