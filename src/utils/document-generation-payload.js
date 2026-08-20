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

function parseClientNumber(value) {
  const token = String(value ?? '').trim()
  if (!token) {
    return null
  }

  return token
}

const CONTEXT_FIELD_MAP = {
  clientNumber: 'clientNumber',
  userId: 'userId',
  staffId: 'staffId',
  carePlanId: 'carePlanId',
  clinicalNoteId: 'clinicalNoteId',
  appointmentId: 'appointmentId',
  screeningId: 'screeningId',
}

const REQUIRED_FIELD_MAP = {
  // eslint-disable-next-line camelcase -- API field names
  client_number: 'clientNumber',
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

function resolveContextValue(field, contextKey, context) {
  if (field === 'client_number' || contextKey === 'clientNumber') {
    return parseClientNumber(context[contextKey])
  }

  return parsePositiveId(context[contextKey])
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
    const value = resolveContextValue(field, contextKey, context)
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
  timezone,
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
  const timezoneToken = String(timezone ?? '').trim()
  if (timezoneToken) {
    body.timezone = timezoneToken
  }

  const fields = documentContextFields[body.documentType] ?? []
  fields.forEach(field => {
    const value = resolveContextValue(field, field, context)
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
