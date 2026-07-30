import { storedFileCategories } from 'components/constants.js'
import { uploadStoredFile } from 'src/utils/stored-file-api.js'

function trim(value) {
  return String(value ?? '').trim()
}

function parsePositiveFileId(value) {
  const id = Number(value)
  if (!Number.isFinite(id) || id <= 0) {
    return null
  }

  return id
}

/**
 * Resolves a card attachment for form state.
 * Uploads local File/Blob; keeps existing stored-file refs by id.
 */
export async function resolveInsuranceCardAttachment(value, opts = {}) {
  if (value == null || value === '') {
    return null
  }

  if (value?.file instanceof Blob) {
    const uploaded = await uploadStoredFile(
      value.file,
      storedFileCategories.insuranceDocument,
      opts.clientId ? { clientId: opts.clientId } : {},
    )
    const fileId = parsePositiveFileId(uploaded?.id)
    if (fileId == null) {
      throw new Error('Insurance card upload returned no file id')
    }

    return {
      fileId,
      name: trim(uploaded?.name || value.name) || null,
      type: trim(value.type || uploaded?.contentType) || null,
    }
  }

  const existingId = parsePositiveFileId(
    value?.fileId ?? (typeof value === 'number' ? value : null),
  )
  if (existingId != null) {
    return {
      fileId: existingId,
      name: trim(value?.name) || null,
      type: trim(value?.type) || null,
    }
  }

  return null
}

/** File id for create/update insurance profile (`front_card_file_id`). */
export function insuranceCardFileIdForApi(value) {
  if (value == null || value === '') {
    return null
  }
  if (typeof value === 'number' || typeof value === 'string') {
    return parsePositiveFileId(value)
  }

  return parsePositiveFileId(value.fileId)
}
