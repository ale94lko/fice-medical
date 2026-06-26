import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { normalizeStoredFile } from 'src/utils/stored-file-normalize.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

function parseStoredFileId(fileId) {
  const id = Number(fileId)
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('Invalid file id')
  }

  return id
}

function extractFileName(headers, fallback = 'download') {
  const raw = headers?.['content-disposition'] ?? ''
  const match = /filename="?([^"]+)"?/i.exec(raw)

  return match?.[1] ?? fallback
}

export async function uploadStoredFile(file, category, opts = {}) {
  const formData = new FormData()
  formData.append('file', file)
  const params = new URLSearchParams({ category })
  if (opts.clientId != null && opts.clientId !== '') {
    params.set('client_id', String(opts.clientId))
  }
  if (opts.clinicianId != null && opts.clinicianId !== '') {
    params.set('clinician_id', String(opts.clinicianId))
  }
  if (opts.entityType) {
    params.set('entity_type', String(opts.entityType))
  }
  if (opts.entityId != null && opts.entityId !== '') {
    params.set('entity_id', String(opts.entityId))
  }

  const response = await apiInstance.post(
    `${apiPaths.storedFilesUpload}?${params.toString()}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )

  return normalizeStoredFile(unwrapData(response.data))
}

export async function fetchStoredFileBlob(fileId, preview = true) {
  const id = parseStoredFileId(fileId)
  const response = await apiInstance.get(
    preview
      ? apiPaths.storedFilePreview(id)
      : apiPaths.storedFileDownload(id),
    { responseType: 'blob' },
  )

  return response.data
}

export async function downloadStoredFile(fileId, { preview = false } = {}) {
  const id = parseStoredFileId(fileId)
  const response = await apiInstance.get(
    preview
      ? apiPaths.storedFilePreview(id)
      : apiPaths.storedFileDownload(id),
    { responseType: 'blob' },
  )

  return {
    blob: response.data,
    fileName: extractFileName(response.headers),
  }
}

export async function deleteStoredFile(fileId) {
  await apiInstance.delete(apiPaths.storedFileById(parseStoredFileId(fileId)))
}

export async function resolveStoredFileImageSrc(fileId) {
  const id = Number(fileId)
  if (!Number.isFinite(id) || id <= 0) {
    return ''
  }

  const blob = await fetchStoredFileBlob(id, true)

  return URL.createObjectURL(blob)
}

export function revokeStoredFileImageSrc(src) {
  if (String(src ?? '').startsWith('blob:')) {
    URL.revokeObjectURL(src)
  }
}

export function triggerBlobDownload(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName || 'download'
  anchor.click()
  URL.revokeObjectURL(url)
}

export const filesApi = {
  upload: uploadStoredFile,
  blob: fetchStoredFileBlob,
  download: downloadStoredFile,
  delete: deleteStoredFile,
}
