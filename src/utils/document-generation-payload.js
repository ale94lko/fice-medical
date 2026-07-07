import {
  documentContextFields,
} from 'src/utils/document-generation-constants.js'

function parsePositiveId(value) {
  const id = Number(value)
  if (!Number.isFinite(id) || id <= 0) {
    return null
  }

  return id
}

const CONTEXT_FIELD_MAP = {
  clientId: 'clientId',
  userId: 'userId',
  staffId: 'staffId',
  carePlanId: 'carePlanId',
  clinicalNoteId: 'clinicalNoteId',
  appointmentId: 'appointmentId',
  screeningId: 'screeningId',
}

const REQUIRED_FIELD_MAP = {
  // eslint-disable-next-line camelcase -- API field names
  client_id: 'clientId',
  // eslint-disable-next-line camelcase -- API field names
  user_id: 'userId',
  // eslint-disable-next-line camelcase -- API field names
  staff_id: 'staffId',
  // eslint-disable-next-line camelcase -- API field names
  care_plan_id: 'carePlanId',
  // eslint-disable-next-line camelcase -- API field names
  clinical_note_id: 'clinicalNoteId',
  // eslint-disable-next-line camelcase -- API field names
  appointment_id: 'appointmentId',
  // eslint-disable-next-line camelcase -- API field names
  screening_id: 'screeningId',
}

export function normalizeDocumentTypeInfo(raw) {
  const row = raw ?? {}

  return {
    documentType: String(
      row.document_type ?? row.documentType ?? '',
    ).trim(),
    supportedFormats: Array.isArray(row.supported_formats)
      ? row.supported_formats
      : Array.isArray(row.supportedFormats)
        ? row.supportedFormats
        : [],
    requiredFields: Array.isArray(row.required_fields)
      ? row.required_fields
      : Array.isArray(row.requiredFields)
        ? row.requiredFields
        : [],
    entityType: String(row.entity_type ?? row.entityType ?? '').trim(),
  }
}

export function findDocumentTypeInfo(types, documentType) {
  const token = String(documentType ?? '').trim()

  return (types ?? []).find(
    item => item.documentType === token,
  ) ?? null
}

export function validateDocumentGenerationContext(
  typeInfo,
  context = {},
  documentType = '',
) {
  const missing = []
  const resolvedType = typeInfo?.documentType || documentType
  const required = typeInfo?.requiredFields?.length
    ? typeInfo.requiredFields
    : documentContextFields[resolvedType] ?? []

  required.forEach(field => {
    const contextKey = REQUIRED_FIELD_MAP[field] ?? field
    const value = parsePositiveId(context[contextKey])
    if (value == null) {
      missing.push(field)
    }
  })

  return missing
}

export function buildGenerateDocumentPayload({
  documentType,
  format,
  locale,
  context = {},
}) {
  const body = {
    documentType: String(documentType ?? '').trim(),
    format: String(format ?? '').trim(),
  }
  const localeToken = String(locale ?? '').trim()
  if (localeToken) {
    body.locale = localeToken
  }

  const fields = documentContextFields[body.documentType] ?? []
  fields.forEach(field => {
    const value = parsePositiveId(context[field])
    if (value != null) {
      body[CONTEXT_FIELD_MAP[field] ?? field] = value
    }
  })

  return body
}

export function resolveDocumentLocale(appLocale) {
  const token = String(appLocale ?? '').trim().toLowerCase()
  if (token.startsWith('es')) {
    return 'es'
  }
  if (token.startsWith('en')) {
    return 'en'
  }

  return token.slice(0, 2) || 'en'
}
