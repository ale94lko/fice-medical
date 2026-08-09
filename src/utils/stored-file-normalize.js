import { storedFileStatuses } from 'components/constants.js'

function trim(value) {
  return String(value ?? '').trim()
}

function parseOptionalNumber(value) {
  if (value == null || value === '') {
    return null
  }
  if (typeof value === 'object') {
    return parseOptionalNumber(value.id ?? value.user_id ?? value.userId)
  }
  const num = Number(value)

  return Number.isFinite(num) ? num : null
}

function resolveUploadedById(row) {
  return parseOptionalNumber(
    row.uploaded_by
    ?? row.uploadedBy
    ?? row.uploader_id
    ?? row.uploaderId,
  )
}

function resolveUploadedByName(row) {
  const direct = trim(
    row.uploaded_by_name
    ?? row.uploadedByName
    ?? row.uploader_name
    ?? row.uploaderName
    ?? row.uploaded_by_username
    ?? row.uploadedByUsername,
  )
  if (direct) {
    return direct
  }
  const nested = row.uploaded_by ?? row.uploadedBy ?? row.uploader
  if (nested && typeof nested === 'object') {
    const fromNested = trim(
      nested.name
      ?? nested.full_name
      ?? nested.fullName
      ?? nested.display_name
      ?? nested.displayName
      ?? nested.username
      ?? nested.user_name
      ?? nested.userName,
    )
    if (fromNested) {
      return fromNested
    }
  }

  return null
}

function resolveStoredFilePayload(raw) {
  if (!raw || typeof raw !== 'object') {
    return {}
  }
  if (raw.file && typeof raw.file === 'object') {
    return { ...raw, ...raw.file }
  }
  if (raw.stored_file && typeof raw.stored_file === 'object') {
    return { ...raw, ...raw.stored_file }
  }
  if (raw.storedFile && typeof raw.storedFile === 'object') {
    return { ...raw, ...raw.storedFile }
  }

  return raw
}

export function normalizeStoredFile(raw) {
  const row = resolveStoredFilePayload(raw)
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
    uploadedBy: resolveUploadedById(row),
    uploadedByName: resolveUploadedByName(row),
    uploadedAt: trim(row.uploaded_at ?? row.uploadedAt) || null,
    documentDate: trim(
      row.document_date ?? row.documentDate,
    ) || null,
    description: trim(
      row.description ?? row.notes,
    ) || null,
    createdAt: trim(row.created_at ?? row.createdAt) || null,
    url: trim(
      row.url
      ?? row.public_url
      ?? row.publicUrl
      ?? row.download_url
      ?? row.downloadUrl
      ?? row.file_url
      ?? row.fileUrl,
    ) || null,
  }
}

export function formatStoredFileUploadedBy(file) {
  const name = trim(file?.uploadedByName)
  if (name) {
    return name
  }
  if (file?.uploadedBy != null) {
    return String(file.uploadedBy)
  }

  return '—'
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
