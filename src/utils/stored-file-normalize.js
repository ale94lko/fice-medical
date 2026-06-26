import { storedFileStatuses } from 'components/constants.js'

function trim(value) {
  return String(value ?? '').trim()
}

function parseOptionalNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const num = Number(value)

  return Number.isFinite(num) ? num : null
}

export function normalizeStoredFile(raw) {
  const row = raw ?? {}
  const originalFilename = trim(
    row.original_filename
    ?? row.originalFilename
    ?? row.file_name
    ?? row.fileName
    ?? row.name,
  )

  return {
    id: parseOptionalNumber(row.id),
    originalFilename,
    name: originalFilename,
    contentType: trim(
      row.content_type ?? row.contentType ?? row.mime_type ?? row.mimeType,
    ) || null,
    fileSize: parseOptionalNumber(
      row.file_size ?? row.fileSize ?? row.size,
    ) ?? 0,
    category: trim(row.category) || null,
    clientId: parseOptionalNumber(row.client_id ?? row.clientId),
    clinicianId: parseOptionalNumber(row.clinician_id ?? row.clinicianId),
    entityType: trim(row.entity_type ?? row.entityType) || null,
    entityId: parseOptionalNumber(row.entity_id ?? row.entityId),
    status: trim(row.status).toUpperCase() || storedFileStatuses.active,
    uploadedBy: parseOptionalNumber(row.uploaded_by ?? row.uploadedBy),
    uploadedAt: trim(row.uploaded_at ?? row.uploadedAt) || null,
    createdAt: trim(row.created_at ?? row.createdAt) || null,
  }
}

export function mapStoredFilesList(rawList) {
  const list = Array.isArray(rawList) ? rawList : []

  return list
    .map(normalizeStoredFile)
    .filter(file =>
      file.id != null
      && file.status !== storedFileStatuses.deleted,
    )
}

export function storedFileIsImage(file) {
  const type = trim(file?.contentType).toLowerCase()

  return type.startsWith('image/')
}
