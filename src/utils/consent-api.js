import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  buildConsentRevokeBody,
  buildConsentSignBody,
  buildConsentTemplateBody,
  buildConsentVersionBody,
  mapClientConsentsList,
  mapConsentTemplatesList,
  mapConsentVersionsList,
  normalizeClientConsent,
  normalizeConsentPublicPreview,
  normalizeConsentTemplate,
  normalizeConsentVersion,
} from 'src/utils/consent-normalize.js'
import {
  buildClientConsentDocumentFileName,
  extractDownloadFileName,
} from 'src/utils/http-headers.js'
import { attachEncounterId } from 'src/utils/encounter-api.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

function unwrapList(body) {
  const data = unwrapData(body)
  if (Array.isArray(data)) {
    return data
  }

  return data?.items ?? data?.content ?? []
}

function extractFileName(response, fallback = 'consent.pdf') {
  return extractDownloadFileName(response, fallback)
}

export function consentApiErrorMessage(error, fallback = 'Request failed') {
  const data = error?.response?.data
  const message = data?.error_description
    ?? data?.message
    ?? data?.error
    ?? error?.message

  return String(message || fallback)
}

export function consentPublicErrorKey(error) {
  const status = Number(error?.response?.status)
  const message = consentApiErrorMessage(error, '').toLowerCase()
  if (
    message.includes('expired')
    || message.includes('expir')
  ) {
    return 'consentSignPublicErrorExpired'
  }
  if (
    message.includes('already')
    || message.includes('used')
    || message.includes('single-use')
    || message.includes('single use')
  ) {
    return 'consentSignPublicErrorUsed'
  }
  if (message.includes('revok')) {
    return 'consentSignPublicErrorRevoked'
  }
  if (
    message.includes('pending')
    || message.includes('no longer')
    || message.includes('not pending')
  ) {
    return 'consentSignPublicErrorNotPending'
  }
  if (
    status === 404
    || message.includes('invalid')
    || message.includes('token')
  ) {
    return 'consentSignPublicErrorInvalid'
  }

  return 'consentSignPublicErrorGeneric'
}

export async function listConsentTemplates(params = {}) {
  const query = {}
  if (params.active != null) {
    query.active = Boolean(params.active)
  }
  if (params.consentType) {
    // eslint-disable-next-line camelcase -- query param for API
    query.consent_type = String(params.consentType)
  }
  const response = await apiInstance.get(apiPaths.consentTemplates, {
    params: query,
  })

  return mapConsentTemplatesList(unwrapList(response.data))
}

export async function fetchConsentTemplate(templateId) {
  const response = await apiInstance.get(
    apiPaths.consentTemplateById(templateId),
  )

  return normalizeConsentTemplate(unwrapData(response.data))
}

export async function createConsentTemplate(form) {
  const response = await apiInstance.post(
    apiPaths.consentTemplates,
    buildConsentTemplateBody(form),
  )

  return normalizeConsentTemplate(unwrapData(response.data))
}

export async function updateConsentTemplate(templateId, form) {
  const response = await apiInstance.put(
    apiPaths.consentTemplateById(templateId),
    buildConsentTemplateBody(form),
  )

  return normalizeConsentTemplate(unwrapData(response.data))
}

export async function deleteConsentTemplate(templateId) {
  await apiInstance.delete(apiPaths.consentTemplateById(templateId))
}

export async function listConsentVersions(templateId) {
  const response = await apiInstance.get(
    apiPaths.consentTemplateVersions(templateId),
  )

  return mapConsentVersionsList(unwrapList(response.data))
}

export async function fetchConsentVersion(templateId, versionId) {
  const response = await apiInstance.get(
    apiPaths.consentVersionById(templateId, versionId),
  )

  return normalizeConsentVersion(unwrapData(response.data))
}

export async function createConsentVersion(templateId, form) {
  const response = await apiInstance.post(
    apiPaths.consentTemplateVersions(templateId),
    buildConsentVersionBody(form),
  )

  return normalizeConsentVersion(unwrapData(response.data))
}

export async function updateConsentVersion(templateId, versionId, form) {
  const response = await apiInstance.put(
    apiPaths.consentVersionById(templateId, versionId),
    buildConsentVersionBody(form),
  )

  return normalizeConsentVersion(unwrapData(response.data))
}

export async function deleteConsentVersion(templateId, versionId) {
  await apiInstance.delete(
    apiPaths.consentVersionById(templateId, versionId),
  )
}

export async function publishConsentVersion(templateId, versionId) {
  const response = await apiInstance.post(
    apiPaths.consentVersionPublish(templateId, versionId),
  )

  return normalizeConsentVersion(unwrapData(response.data))
}

export async function previewConsentVersionPdf(
  templateId,
  versionId,
  form = {},
) {
  const response = await apiInstance.post(
    apiPaths.consentVersionPreview(templateId, versionId),
    form.layout
      ? { layout: buildConsentVersionBody(form).layout }
      : {},
    { responseType: 'blob' },
  )

  return {
    blob: response.data,
    fileName: extractFileName(response, 'consent-preview.pdf'),
  }
}

export async function listClientConsents(clientId, params = {}) {
  const query = {}
  if (params.status) {
    query.status = String(params.status)
  }
  const response = await apiInstance.get(apiPaths.clientConsents(clientId), {
    params: query,
  })

  return mapClientConsentsList(unwrapList(response.data))
}

export async function fetchClientConsent(clientId, consentId) {
  const response = await apiInstance.get(
    apiPaths.clientConsentById(clientId, consentId),
  )

  return normalizeClientConsent(unwrapData(response.data))
}

export async function assignClientConsent(clientId, payload = {}) {
  const body = attachEncounterId({}, clientId)
  if (payload.consentVersionId != null) {
    // eslint-disable-next-line camelcase -- API body
    body.consent_version_id = Number(payload.consentVersionId)
  } else if (payload.consentTemplateId != null) {
    // eslint-disable-next-line camelcase -- API body
    body.consent_template_id = Number(payload.consentTemplateId)
  }
  const response = await apiInstance.post(
    apiPaths.clientConsents(clientId),
    body,
  )

  return normalizeClientConsent(unwrapData(response.data))
}

export async function signClientConsent(clientId, consentId, form) {
  const response = await apiInstance.post(
    apiPaths.clientConsentSign(clientId, consentId),
    attachEncounterId(buildConsentSignBody(form), clientId),
  )

  return normalizeClientConsent(unwrapData(response.data))
}

export async function declineClientConsent(clientId, consentId) {
  const response = await apiInstance.post(
    apiPaths.clientConsentDecline(clientId, consentId),
  )

  return normalizeClientConsent(unwrapData(response.data))
}

export async function revokeClientConsent(clientId, consentId, reason) {
  const response = await apiInstance.post(
    apiPaths.clientConsentRevoke(clientId, consentId),
    buildConsentRevokeBody(reason),
  )

  return normalizeClientConsent(unwrapData(response.data))
}

export async function cancelClientConsent(clientId, consentId) {
  const response = await apiInstance.post(
    apiPaths.clientConsentCancel(clientId, consentId),
  )

  return normalizeClientConsent(unwrapData(response.data))
}

export async function sendClientConsentSecureLink(
  clientId,
  consentId,
  form = {},
) {
  const body = {
    // eslint-disable-next-line camelcase -- API body
    send_email: form.sendEmail !== false,
  }
  const email = String(form.email ?? '').trim()
  if (email) {
    body.email = email
  }
  const response = await apiInstance.post(
    apiPaths.clientConsentSecureLink(clientId, consentId),
    body,
  )
  const raw = unwrapData(response.data) || {}

  return {
    secureLinkUrl: String(raw.secure_link_url ?? '').trim(),
    expiresAt: String(raw.expires_at ?? '').trim(),
    emailSentTo: String(raw.email_sent_to ?? '').trim(),
  }
}

export async function requestClientConsentViaPortal(
  clientId,
  consentId,
) {
  const response = await apiInstance.post(
    apiPaths.clientConsentPortalRequest(clientId, consentId),
  )
  const raw = unwrapData(response.data) || {}

  return {
    portalUrl: String(raw.portal_url ?? '').trim(),
    emailSentTo: String(raw.email_sent_to ?? '').trim(),
  }
}

export async function previewConsentPublic(form) {
  const response = await apiInstance.post(apiPaths.consentPublicPreview, {
    // eslint-disable-next-line camelcase -- API body
    tenant_key: String(form.tenantKey ?? '').trim(),
    // eslint-disable-next-line camelcase -- API body
    subtenant_key: String(form.subtenantKey ?? '').trim(),
    token: String(form.token ?? '').trim(),
  })

  return normalizeConsentPublicPreview(unwrapData(response.data))
}

export async function signConsentPublic(form) {
  const body = {
    // eslint-disable-next-line camelcase -- API body
    tenant_key: String(form.tenantKey ?? '').trim(),
    // eslint-disable-next-line camelcase -- API body
    subtenant_key: String(form.subtenantKey ?? '').trim(),
    token: String(form.token ?? '').trim(),
    // eslint-disable-next-line camelcase -- API body
    signer_name: String(form.signerName ?? '').trim(),
    // eslint-disable-next-line camelcase -- API body
    signer_type: String(form.signerType ?? '').trim().toUpperCase(),
    // eslint-disable-next-line camelcase -- API body
    relationship_to_client: form.relationshipToClient
      ? String(form.relationshipToClient).trim()
      : null,
  }
  if (form.signatureArtifact) {
    // eslint-disable-next-line camelcase -- API body
    body.signature_artifact = form.signatureArtifact
  }
  if (Array.isArray(form.fieldValues) && form.fieldValues.length) {
    // eslint-disable-next-line camelcase -- API body
    body.field_values = form.fieldValues
  }
  const response = await apiInstance.post(
    apiPaths.consentPublicSign,
    body,
  )

  return unwrapData(response.data)
}

export async function declineConsentPublic(form) {
  const response = await apiInstance.post(apiPaths.consentPublicDecline, {
    // eslint-disable-next-line camelcase -- API body
    tenant_key: String(form.tenantKey ?? '').trim(),
    // eslint-disable-next-line camelcase -- API body
    subtenant_key: String(form.subtenantKey ?? '').trim(),
    token: String(form.token ?? '').trim(),
    // eslint-disable-next-line camelcase -- API body
    declined_by_name: String(form.declinedByName ?? '').trim(),
    // eslint-disable-next-line camelcase -- API body
    decline_reason: String(form.declineReason ?? '').trim(),
  })

  return unwrapData(response.data)
}

export async function downloadClientConsentDocument(
  clientId,
  consentId,
  { version } = {},
) {
  const response = await apiInstance.get(
    apiPaths.clientConsentDocumentDownload(clientId, consentId),
    { responseType: 'blob' },
  )
  const fallback = buildClientConsentDocumentFileName(
    { id: consentId, version },
  )

  return {
    blob: response.data,
    fileName: extractFileName(response, fallback),
  }
}

export async function printClientConsentDocument(
  clientId,
  consentId,
  { version } = {},
) {
  const response = await apiInstance.get(
    apiPaths.clientConsentDocumentPrint(clientId, consentId),
    { responseType: 'blob' },
  )
  const fallback = buildClientConsentDocumentFileName(
    { id: consentId, version },
    { print: true },
  )

  return {
    blob: response.data,
    fileName: extractFileName(response, fallback),
  }
}
