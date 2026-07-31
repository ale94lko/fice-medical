import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  labToApiPayload,
  mapClientLabsListFromApi,
  normalizeLabDetail,
  normalizeLabFile,
} from 'src/utils/lab-normalize.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

export async function listPatientLabs(patientId) {
  const response = await apiInstance.get(apiPaths.patientLabs(patientId))
  const data = unwrapData(response.data)
  const list = Array.isArray(data) ? data : data?.items ?? []

  return mapClientLabsListFromApi(list)
}

export async function fetchPatientLab(patientId, labId) {
  const response = await apiInstance.get(
    apiPaths.patientLabById(patientId, labId),
  )
  const data = unwrapData(response.data)

  return normalizeLabDetail(data?.lab ?? data)
}

export async function createPatientLab(patientId, payload) {
  const body = labToApiPayload(payload, { draft: false })
  const response = await apiInstance.post(
    apiPaths.patientLabs(patientId),
    body,
  )
  const data = unwrapData(response.data)

  return {
    labId: data?.lab_id ?? data?.labId ?? data?.id,
    status: data?.status,
  }
}

export async function savePatientLabDraft(patientId, labId, payload) {
  const body = labToApiPayload(payload, { draft: true })
  const response = await apiInstance.put(
    apiPaths.patientLabDraft(patientId, labId),
    body,
  )
  const data = unwrapData(response.data)

  return normalizeLabDetail(data?.lab ?? data)
}

export async function updatePatientLab(patientId, labId, payload) {
  const body = labToApiPayload(payload)
  const response = await apiInstance.put(
    apiPaths.patientLabById(patientId, labId),
    body,
  )
  const data = unwrapData(response.data)

  return normalizeLabDetail(data?.lab ?? data)
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
    fileName: extractFileName(response.headers),
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

function extractFileName(headers) {
  const raw = headers?.['content-disposition'] ?? ''
  const match = /filename="?([^"]+)"?/i.exec(raw)

  return match?.[1] ?? 'lab-attachment'
}

export function triggerBlobDownload(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName || 'download'
  anchor.click()
  URL.revokeObjectURL(url)
}
