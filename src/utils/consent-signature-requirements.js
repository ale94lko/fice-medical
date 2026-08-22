import { consentSignerTypeValues } from 'components/constants.js'

export const consentAuthorizationSignerTypes = [
  consentSignerTypeValues.client,
  consentSignerTypeValues.guardian,
  consentSignerTypeValues.authorizedRepresentative,
]

export function emptyConsentSignatureRequirement(order = 0) {
  return {
    key: '',
    label: '',
    required: true,
    displayOrder: order,
    allowedSignerTypes: [consentSignerTypeValues.client],
    active: true,
  }
}

export function normalizeConsentSignatureRequirement(raw = {}, index = 0) {
  const row = raw ?? {}
  const types = normalizeSignerTypeList(
    row.allowed_signer_types ?? row.allowedSignerTypes,
  )

  return {
    id: row.id ?? null,
    key: String(row.key ?? row.requirement_key ?? '').trim(),
    label: String(row.label ?? '').trim(),
    required: row.required !== false
      && row.required_snapshot !== false
      && row.requiredSnapshot !== false,
    displayOrder: Number.isFinite(Number(row.display_order
      ?? row.displayOrder
      ?? index))
      ? Number(row.display_order ?? row.displayOrder ?? index)
      : index,
    allowedSignerTypes: types.length
      ? types
      : [consentSignerTypeValues.client],
    active: row.active !== false,
    satisfied: Boolean(row.satisfied),
    signatureId: row.signature_id ?? row.signatureId ?? null,
  }
}

export function buildConsentSignatureRequirementBody(form = {}, index = 0) {
  const types = normalizeSignerTypeList(form.allowedSignerTypes)

  return {
    key: String(form.key ?? '').trim() || undefined,
    label: String(form.label ?? '').trim(),
    required: form.required !== false,
    /* eslint-disable-next-line camelcase -- API body */
    display_order: Number.isFinite(Number(form.displayOrder))
      ? Number(form.displayOrder)
      : index,
    /* eslint-disable-next-line camelcase -- API body */
    allowed_signer_types: types,
    active: form.active !== false,
  }
}

export function remainingSignerTypes(consent) {
  const requirements = Array.isArray(consent?.signatureRequirements)
    ? consent.signatureRequirements
    : []
  if (!requirements.length) {
    return normalizeSignerTypeList(consent?.allowedSignerTypes)
  }

  const remaining = []
  for (const requirement of requirements) {
    if (requirement.satisfied) {
      continue
    }
    remaining.push(...normalizeSignerTypeList(
      requirement.allowedSignerTypes,
    ))
  }

  return [...new Set(remaining)]
}

export function isAuthorizationSignerType(type) {
  return consentAuthorizationSignerTypes.includes(
    String(type ?? '').trim().toUpperCase(),
  )
}

export function signerNeedsRelationship(type) {
  const token = String(type ?? '').trim().toUpperCase()

  return token === consentSignerTypeValues.guardian
    || token === consentSignerTypeValues.authorizedRepresentative
}

export function normalizeSignerTypeList(raw) {
  if (Array.isArray(raw)) {
    return raw
      .map(item => String(item ?? '').trim().toUpperCase())
      .filter(Boolean)
  }
  const token = String(raw ?? '').trim()
  if (!token) {
    return []
  }

  return token
    .split(',')
    .map(item => item.trim().toUpperCase())
    .filter(Boolean)
}
