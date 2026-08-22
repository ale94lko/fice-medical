import {
  consentSignatureMethodValues,
  consentSignerTypeValues,
  consentStatusValues,
  consentTypeValues,
  consentVersionStatusValues,
} from 'components/constants.js'
import {
  buildConsentVersionFieldBody,
  normalizeConsentFieldDefinition,
  normalizeConsentFieldValue,
} from 'src/utils/consent-fields.js'
import {
  buildConsentSignatureRequirementBody,
  normalizeConsentSignatureRequirement,
} from 'src/utils/consent-signature-requirements.js'
import {
  buildDocumentLayoutBody,
  normalizeDocumentLayout,
} from 'src/utils/document-layout.js'

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
  if (Array.isArray(value)) {
    return value.map(item => trim(item)).filter(Boolean)
  }
  const token = trim(value)
  if (!token) {
    return []
  }

  return token.split(',').map(item => trim(item)).filter(Boolean)
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
    ).map(item => item.toUpperCase()),
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
    validityYearsAfterSign: parseOptionalNumber(
      row.validity_years_after_sign ?? row.validityYearsAfterSign,
    ),
    contentHtml: String(row.content_html ?? row.contentHtml ?? ''),
    presentedToClients: parseBoolean(
      row.presented_to_clients ?? row.presentedToClients,
    ),
    publishedAt: trim(row.published_at ?? row.publishedAt) || null,
    createdAt: trim(row.created_at ?? row.createdAt) || null,
    updatedAt: trim(row.updated_at ?? row.updatedAt) || null,
    fields: Array.isArray(row.fields)
      ? row.fields.map((item, index) => (
        normalizeConsentFieldDefinition(item, index)
      ))
      : [],
    signatureRequirements: Array.isArray(row.signature_requirements)
      ? row.signature_requirements.map((item, index) => (
        normalizeConsentSignatureRequirement(item, index)
      ))
      : Array.isArray(row.signatureRequirements)
        ? row.signatureRequirements.map((item, index) => (
          normalizeConsentSignatureRequirement(item, index)
        ))
        : [],
    layout: normalizeDocumentLayout(row.layout),
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
    completedAt: trim(row.completed_at ?? row.completedAt) || null,
    signerType: trim(row.signer_type ?? row.signerType) || null,
    relationshipToClient: trim(
      row.relationship_to_client ?? row.relationshipToClient,
    ) || null,
    declinedAt: trim(row.declined_at ?? row.declinedAt) || null,
    declinedByName: trim(
      row.declined_by_name ?? row.declinedByName,
    ) || null,
    declineReason: trim(row.decline_reason ?? row.declineReason) || null,
    cancelledAt: trim(row.cancelled_at ?? row.cancelledAt) || null,
    cancelledBy: parseOptionalNumber(
      row.cancelled_by ?? row.cancelledBy,
    ),
    cancellationReason: trim(
      row.cancellation_reason ?? row.cancellationReason,
    ) || null,
    revokedAt: trim(row.revoked_at ?? row.revokedAt) || null,
    revocationReason: trim(
      row.revocation_reason ?? row.revocationReason,
    ) || null,
    expiredAt: trim(row.expired_at ?? row.expiredAt) || null,
    documentFileId: parseOptionalNumber(
      row.signed_document_file_id
      ?? row.signedDocumentFileId
      ?? row.document_file_id
      ?? row.documentFileId,
    ),
    allowedSignerTypes: normalizeStringList(
      row.allowed_signer_types ?? row.allowedSignerTypes,
    ).map(item => item.toUpperCase()),
    signatures: (Array.isArray(row.signatures) ? row.signatures : [])
      .map(item => ({
        id: parseOptionalNumber(item.id),
        signerName: trim(item.signer_name ?? item.signerName),
        signerType: trim(item.signer_type ?? item.signerType)
          .toUpperCase(),
        requirementKey: trim(
          item.requirement_key ?? item.requirementKey,
        ),
        relationshipToClient: trim(
          item.relationship_to_client ?? item.relationshipToClient,
        ) || null,
        signatureMethod: trim(
          item.signature_method ?? item.signatureMethod,
        ),
        signedAt: trim(item.signed_at ?? item.signedAt) || null,
      })),
    signatureRequirements: (Array.isArray(row.signature_requirements)
      ? row.signature_requirements
      : Array.isArray(row.signatureRequirements)
        ? row.signatureRequirements
        : [])
      .map((item, index) => (
        normalizeConsentSignatureRequirement(item, index)
      )),
    fieldValues: (Array.isArray(row.field_values)
      ? row.field_values
      : Array.isArray(row.fieldValues) ? row.fieldValues : [])
      .map((item, index) => normalizeConsentFieldValue(item, index)),
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
    allowed_signer_types: allowed
      .map(item => trim(item))
      .filter(Boolean)
      .join(','),
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
    validity_years_after_sign: parseOptionalNumber(
      form.validityYearsAfterSign,
    ),
    /* eslint-disable-next-line camelcase -- API body */
    content_html: String(form.contentHtml ?? ''),
    fields: Array.isArray(form.fields)
      ? form.fields.map((item, index) => (
        buildConsentVersionFieldBody(item, index)
      ))
      : [],
    /* eslint-disable-next-line camelcase -- API body */
    signature_requirements: Array.isArray(form.signatureRequirements)
      ? form.signatureRequirements.map((item, index) => (
        buildConsentSignatureRequirementBody(item, index)
      ))
      : [],
    layout: form.layout ? buildDocumentLayoutBody(form.layout) : null,
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
    attachConsentFieldValues(body, form)

    return body
  }
  /* eslint-disable-next-line camelcase -- API body */
  body.signature_artifact = String(form.signatureArtifact ?? '')
  attachConsentFieldValues(body, form)

  return body
}

function attachConsentFieldValues(body, form) {
  if (Array.isArray(form.fieldValues) && form.fieldValues.length) {
    /* eslint-disable-next-line camelcase -- API body */
    body.field_values = form.fieldValues
  }
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
    fieldValues: (Array.isArray(row.field_values)
      ? row.field_values
      : Array.isArray(row.fieldValues) ? row.fieldValues : [])
      .map((item, index) => normalizeConsentFieldValue(item, index)),
    signatureRequirements: (Array.isArray(row.signature_requirements)
      ? row.signature_requirements
      : Array.isArray(row.signatureRequirements)
        ? row.signatureRequirements
        : [])
      .map((item, index) => (
        normalizeConsentSignatureRequirement(item, index)
      )),
  }
}
