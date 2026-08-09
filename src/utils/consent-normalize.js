import {
  consentSignatureMethodValues,
  consentSignerTypeValues,
  consentStatusValues,
  consentTypeValues,
  consentVersionStatusValues,
} from 'components/constants.js'

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

function parseBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value
  }
  if (value == null || value === '') {
    return fallback
  }
  const token = String(value).trim().toLowerCase()
  if (token === 'true' || token === '1') {
    return true
  }
  if (token === 'false' || token === '0') {
    return false
  }

  return fallback
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map(item => trim(item)).filter(Boolean)
}

export function normalizeConsentTemplate(raw = {}) {
  const row = raw ?? {}

  return {
    id: parseOptionalNumber(row.id),
    name: trim(row.name),
    consentType: trim(row.consent_type ?? row.consentType)
      || consentTypeValues.other,
    description: trim(row.description),
    required: parseBoolean(row.required),
    signatureRequired: parseBoolean(
      row.signature_required ?? row.signatureRequired,
      true,
    ),
    allowedSignerTypes: normalizeStringList(
      row.allowed_signer_types ?? row.allowedSignerTypes,
    ),
    active: parseBoolean(row.active, true),
    createdAt: trim(row.created_at ?? row.createdAt) || null,
    updatedAt: trim(row.updated_at ?? row.updatedAt) || null,
  }
}

export function mapConsentTemplatesList(rawList) {
  const list = Array.isArray(rawList) ? rawList : []

  return list.map(normalizeConsentTemplate).filter(item => item.id != null)
}

export function normalizeConsentVersion(raw = {}) {
  const row = raw ?? {}

  return {
    id: parseOptionalNumber(row.id),
    consentTemplateId: parseOptionalNumber(
      row.consent_template_id ?? row.consentTemplateId,
    ),
    version: trim(row.version) || String(row.version_number
      ?? row.versionNumber
      ?? ''),
    status: trim(row.status).toUpperCase()
      || consentVersionStatusValues.draft,
    effectiveDate: trim(row.effective_date ?? row.effectiveDate) || null,
    expirationDate: trim(row.expiration_date ?? row.expirationDate) || null,
    contentHtml: String(row.content_html ?? row.contentHtml ?? ''),
    presentedToClients: parseBoolean(
      row.presented_to_clients ?? row.presentedToClients,
    ),
    publishedAt: trim(row.published_at ?? row.publishedAt) || null,
    createdAt: trim(row.created_at ?? row.createdAt) || null,
    updatedAt: trim(row.updated_at ?? row.updatedAt) || null,
  }
}

export function mapConsentVersionsList(rawList) {
  const list = Array.isArray(rawList) ? rawList : []

  return list.map(normalizeConsentVersion).filter(item => item.id != null)
}

export function normalizeClientConsent(raw = {}) {
  const row = raw ?? {}

  return {
    id: parseOptionalNumber(row.id),
    clientId: parseOptionalNumber(row.client_id ?? row.clientId),
    consentTemplateId: parseOptionalNumber(
      row.consent_template_id ?? row.consentTemplateId,
    ),
    consentVersionId: parseOptionalNumber(
      row.consent_version_id ?? row.consentVersionId,
    ),
    consentName: trim(
      row.consent_name
      ?? row.consentName
      ?? row.name
      ?? row.template_name
      ?? row.templateName,
    ),
    consentType: trim(row.consent_type ?? row.consentType) || null,
    required: parseBoolean(row.required),
    signatureRequired: parseBoolean(
      row.signature_required ?? row.signatureRequired,
      true,
    ),
    status: trim(row.status).toUpperCase()
      || consentStatusValues.pendingSignature,
    version: trim(row.version ?? row.version_label ?? row.versionLabel),
    contentHtml: String(row.content_html ?? row.contentHtml ?? ''),
    signedAt: trim(row.signed_at ?? row.signedAt) || null,
    signedByName: trim(row.signed_by_name ?? row.signedByName) || null,
    signerType: trim(row.signer_type ?? row.signerType) || null,
    relationshipToClient: trim(
      row.relationship_to_client ?? row.relationshipToClient,
    ) || null,
    declinedAt: trim(row.declined_at ?? row.declinedAt) || null,
    revokedAt: trim(row.revoked_at ?? row.revokedAt) || null,
    revocationReason: trim(
      row.revocation_reason ?? row.revocationReason,
    ) || null,
    cancelledAt: trim(row.cancelled_at ?? row.cancelledAt) || null,
    expiredAt: trim(row.expired_at ?? row.expiredAt) || null,
    documentFileId: parseOptionalNumber(
      row.document_file_id ?? row.documentFileId,
    ),
    allowedSignerTypes: normalizeStringList(
      row.allowed_signer_types ?? row.allowedSignerTypes,
    ).map(item => item.toUpperCase()),
    createdAt: trim(row.created_at ?? row.createdAt) || null,
    updatedAt: trim(row.updated_at ?? row.updatedAt) || null,
  }
}

export function mapClientConsentsList(rawList) {
  const list = Array.isArray(rawList) ? rawList : []

  return list.map(normalizeClientConsent).filter(item => item.id != null)
}

export function buildConsentTemplateBody(form = {}) {
  const allowed = Array.isArray(form.allowedSignerTypes)
    ? form.allowedSignerTypes
    : [consentSignerTypeValues.client]

  return {
    name: trim(form.name),
    /* eslint-disable-next-line camelcase -- API body */
    consent_type: trim(form.consentType) || consentTypeValues.other,
    description: trim(form.description) || null,
    required: Boolean(form.required),
    /* eslint-disable-next-line camelcase -- API body */
    signature_required: Boolean(form.signatureRequired),
    /* eslint-disable-next-line camelcase -- API body */
    allowed_signer_types: allowed.map(item => trim(item)).filter(Boolean),
    active: form.active !== false,
  }
}

export function buildConsentVersionBody(form = {}) {
  return {
    version: trim(form.version),
    /* eslint-disable-next-line camelcase -- API body */
    effective_date: trim(form.effectiveDate) || null,
    /* eslint-disable-next-line camelcase -- API body */
    expiration_date: trim(form.expirationDate) || null,
    /* eslint-disable-next-line camelcase -- API body */
    content_html: String(form.contentHtml ?? ''),
  }
}

export function buildConsentSignBody(form = {}) {
  const method = resolveConsentSignatureMethod(form.signatureMethod)
  const body = {
    /* eslint-disable-next-line camelcase -- API body */
    signer_name: trim(form.signerName),
    /* eslint-disable-next-line camelcase -- API body */
    signer_type: trim(form.signerType)
      || consentSignerTypeValues.client,
    /* eslint-disable-next-line camelcase -- API body */
    relationship_to_client: trim(form.relationshipToClient) || null,
    /* eslint-disable-next-line camelcase -- API body */
    signature_method: method,
  }
  if (method === consentSignatureMethodValues.inPersonPaper) {
    const fileId = parseOptionalNumber(form.signatureFileId)
    if (fileId != null) {
      /* eslint-disable-next-line camelcase -- API body */
      body.signature_file_id = fileId
    }

    return body
  }
  /* eslint-disable-next-line camelcase -- API body */
  body.signature_artifact = String(form.signatureArtifact ?? '')

  return body
}

export function resolveConsentSignatureMethod(method) {
  const token = trim(method).toUpperCase()
  if (!token || token === 'IN_PERSON') {
    return consentSignatureMethodValues.inPersonDigital
  }

  return token
}

export function buildConsentRevokeBody(reason) {
  return {
    /* eslint-disable-next-line camelcase -- API body */
    revocation_reason: trim(reason),
  }
}

export function isConsentVersionEditable(version) {
  if (!version) {
    return false
  }
  if (version.status !== consentVersionStatusValues.draft) {
    return false
  }
  if (version.presentedToClients) {
    return false
  }

  return true
}

export function normalizeConsentPublicPreview(raw = {}) {
  const row = raw ?? {}

  return {
    consentName: trim(
      row.consent_name
      ?? row.consentName
      ?? row.name,
    ),
    consentType: trim(row.consent_type ?? row.consentType) || null,
    version: trim(row.version ?? row.version_label ?? row.versionLabel),
    contentHtml: String(row.content_html ?? row.contentHtml ?? ''),
    signatureRequired: parseBoolean(
      row.signature_required ?? row.signatureRequired,
      true,
    ),
    allowedSignerTypes: normalizeStringList(
      row.allowed_signer_types ?? row.allowedSignerTypes,
    ).map(item => item.toUpperCase()),
    status: trim(row.status).toUpperCase()
      || consentStatusValues.pendingSignature,
  }
}
