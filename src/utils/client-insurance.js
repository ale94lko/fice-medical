import {
  clientInsuranceGoldenCardMemberIdLength,
  clientInsuranceMaxMemberIdLength,
  clientInsuranceMaxPayerLength,
  clientInsuranceMaxSubscriberNameLength,
  clientInsuranceMedicaidRecipientIdLength,
  clientInsuranceMedicareMemberIdLength,
  clientInsurancePriorityValues,
  clientInsuranceRelationshipValues,
  clientInsuranceStatusValues,
  clientInsuranceTypeValues,
  insuranceDeactivationReasonFallbackLabels,
} from 'components/constants.js'
import {
  isCompleteUsDateString,
  parseUsDateString,
  startOfDay,
} from 'src/utils/client-form.js'
import { findPayerById } from 'src/utils/insurance-payers.js'
import { createEmptyCardFilesByKind } from
  'src/utils/insurance-identifier-cards.js'
import {
  NON_PERSON_NAME_CHARS_RE,
  PERSON_NAME_CHAR_RE,
  PERSON_NAME_RE,
} from 'src/utils/text-input-chars.js'

/** Plan Member ID / Other Insurance ID */
const PLAN_MEMBER_ID_RE = new RegExp(
  `^(?=.*[A-Za-z0-9])[A-Za-z0-9-]{1,${clientInsuranceMaxMemberIdLength}}$`,
)

/** Medicare MBI (11 chars, position-specific alphabet). */
const MEDICARE_MBI_RE = new RegExp(
  '^[1-9][A-HJ-KMNP-RT-Y0-9][A-HJ-KMNP-RT-Y0-9][0-9]'
  + '[A-HJ-KMNP-RT-Y][A-HJ-KMNP-RT-Y0-9][0-9]'
  + '[A-HJ-KMNP-RT-Y][A-HJ-KMNP-RT-Y][0-9][0-9]$',
)

/** Legacy HICN: 9 digits + optional 0–2 alphanumeric. */
const MEDICARE_HICN_RE = /^\d{9}[A-Za-z0-9]{0,2}$/

const MEDICAID_RECIPIENT_ID_RE = new RegExp(
  `^\\d{${clientInsuranceMedicaidRecipientIdLength}}$`,
)
const GOLDEN_CARD_ID_RE = new RegExp(
  `^\\d{${clientInsuranceGoldenCardMemberIdLength}}$`,
)

/** Per-position MBI allowed chars (uppercase). */
const MEDICARE_MBI_POS_RE = [
  /^[1-9]$/,
  /^[A-HJ-KMNP-RT-Y0-9]$/,
  /^[A-HJ-KMNP-RT-Y0-9]$/,
  /^\d$/,
  /^[A-HJ-KMNP-RT-Y]$/,
  /^[A-HJ-KMNP-RT-Y0-9]$/,
  /^\d$/,
  /^[A-HJ-KMNP-RT-Y]$/,
  /^[A-HJ-KMNP-RT-Y]$/,
  /^\d$/,
  /^\d$/,
]

const MEDICARE_TYPES = new Set([
  clientInsuranceTypeValues.medicare,
  clientInsuranceTypeValues.managedMedicare,
  clientInsuranceTypeValues.dualEligible,
])

const MEDICAID_TYPES = new Set([
  clientInsuranceTypeValues.medicaid,
  clientInsuranceTypeValues.managedMedicaid,
  clientInsuranceTypeValues.dualEligible,
])

let insuranceIdCounter = 0

export function nextInsuranceId() {
  insuranceIdCounter += 1

  return `insurance-${insuranceIdCounter}`
}

export function createEmptyInsuranceProfile() {
  return {
    id: nextInsuranceId(),
    apiId: null,
    payerId: null,
    payerName: '',
    planName: '',
    priority: null,
    memberId: '',
    insuranceType: null,
    policyEffectiveDate: '',
    policyExpirationDate: '',
    relationshipToSubscriber: null,
    subscriberName: '',
    medicaidRecipientId: '',
    medicareMemberId: '',
    goldenCardMemberId: '',
    otherInsuranceId: '',
    status: clientInsuranceStatusValues.ACTIVE,
    cardFilesByKind: createEmptyCardFilesByKind(),
    deleted: false,
    deletedAt: null,
    deactivationReason: '',
    deactivationNotes: '',
    deactivatedAt: null,
    deactivatedBy: null,
    deactivatedByName: null,
  }
}

export function createEmptyInsuranceSection() {
  return {
    profiles: [],
  }
}

export function trimInsuranceField(value) {
  if (value == null) {
    return ''
  }

  return String(value).trim()
}

function rowHasBackendInsuranceId(entry) {
  const raw = entry?.apiId ?? entry?.api_id

  return raw != null && String(raw).trim() !== ''
}

/** True when this profile came from the API (reason required on deactivate). */
export function insuranceRowHasPersistedApiId(entry) {
  return rowHasBackendInsuranceId(entry)
}

export function visibleInsuranceProfiles(section) {
  return (section?.profiles ?? []).filter(profile => !profile.deleted)
}

export function isInsuranceProfileInactive(profile) {
  return profile?.status === clientInsuranceStatusValues.INACTIVE
}

/** Active or future coverage occupies a Primary/Secondary/Tertiary slot. */
export function occupiesInsurancePriority(profile) {
  const status = profile?.status

  return (
    status === clientInsuranceStatusValues.ACTIVE
    || status === clientInsuranceStatusValues.FUTURE
  )
}

export function canDeactivateInsuranceProfile(profile) {
  if (!profile || isInsuranceProfileInactive(profile)) {
    return false
  }
  const status = profile.status

  return (
    status === clientInsuranceStatusValues.ACTIVE
    || status === clientInsuranceStatusValues.FUTURE
    || status === clientInsuranceStatusValues.EXPIRED
  )
}

export function canReactivateInsuranceProfile(profile) {
  return isInsuranceProfileInactive(profile)
}

export function insuranceStatusBadgeVariant(status) {
  if (status === clientInsuranceStatusValues.ACTIVE) {
    return 'active'
  }
  if (status === clientInsuranceStatusValues.FUTURE) {
    return 'future'
  }
  if (status === clientInsuranceStatusValues.EXPIRED) {
    return 'inactive'
  }
  if (status === clientInsuranceStatusValues.INACTIVE) {
    return 'pending'
  }

  return 'other'
}

export function formatInsuranceDeactivationReason(code) {
  const raw = trimInsuranceField(code)
  if (!raw) {
    return ''
  }
  const fallback = insuranceDeactivationReasonFallbackLabels[raw]
  if (fallback) {
    return fallback
  }

  return raw
    .split('_')
    .map(part => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Local status estimate from coverage dates (before API assigns status).
 */
export function deriveInsuranceStatusFromDates(profile) {
  if (isInsuranceProfileInactive(profile)) {
    return clientInsuranceStatusValues.INACTIVE
  }
  const today = startOfDay(new Date()).getTime()
  const endRaw = trimInsuranceField(profile?.policyExpirationDate)
  if (endRaw && isCompleteUsDateString(endRaw)) {
    const end = parseUsDateString(endRaw)
    if (end && startOfDay(end).getTime() < today) {
      return clientInsuranceStatusValues.EXPIRED
    }
  }
  const startRaw = trimInsuranceField(profile?.policyEffectiveDate)
  if (startRaw && isCompleteUsDateString(startRaw)) {
    const start = parseUsDateString(startRaw)
    if (start && startOfDay(start).getTime() > today) {
      return clientInsuranceStatusValues.FUTURE
    }
  }

  return clientInsuranceStatusValues.ACTIVE
}

/**
 * Profiles for the insurance table: optional inactive rows, always last.
 */
export function listInsuranceProfilesForDisplay(
  section,
  { showInactive = false } = {},
) {
  const visible = visibleInsuranceProfiles(section)
  const activeOrOther = []
  const inactive = []
  visible.forEach(profile => {
    if (isInsuranceProfileInactive(profile)) {
      inactive.push(profile)
    } else {
      activeOrOther.push(profile)
    }
  })
  if (!showInactive) {
    return activeOrOther
  }

  return [...activeOrOther, ...inactive]
}

export function activeInsuranceProfiles(section, excludeId = null) {
  return visibleInsuranceProfiles(section).filter(profile => {
    if (excludeId && profile.id === excludeId) {
      return false
    }

    return occupiesInsurancePriority(profile)
  })
}

export function isInsurancePriorityTaken(
  section,
  priority,
  excludeId = null,
) {
  const token = trimInsuranceField(priority)
  if (!token) {
    return false
  }

  return activeInsuranceProfiles(section, excludeId).some(
    profile => profile.priority === token,
  )
}

export function buildInsurancePrioritySelectOptions(
  section,
  excludeId = null,
) {
  return Object.values(clientInsurancePriorityValues).map(value => ({
    label: value,
    value,
    disable: isInsurancePriorityTaken(section, value, excludeId),
  }))
}

export function firstAvailableInsurancePriority(
  section,
  excludeId = null,
) {
  return Object.values(clientInsurancePriorityValues).find(
    value => !isInsurancePriorityTaken(section, value, excludeId),
  ) ?? null
}

export function findOccupyingInsuranceByPriority(
  section,
  priority,
  excludeId = null,
) {
  const token = trimInsuranceField(priority)
  if (!token) {
    return null
  }

  return activeInsuranceProfiles(section, excludeId).find(
    profile => profile.priority === token,
  ) ?? null
}

export function areAllActiveInsurancePrioritiesTaken(section) {
  return Object.values(clientInsurancePriorityValues).every(
    value => isInsurancePriorityTaken(section, value),
  )
}

export function requiresMedicaidRecipientId(insuranceType) {
  return MEDICAID_TYPES.has(insuranceType)
}

export function requiresMedicareMemberId(insuranceType) {
  return MEDICARE_TYPES.has(insuranceType)
}

export function requiresGoldenCardMemberId(insuranceType) {
  return insuranceType === clientInsuranceTypeValues.assistanceProgram
}

export function isSubscriberNameRequired(relationship) {
  return relationship !== clientInsuranceRelationshipValues.self
}

export function sanitizeSubscriberNameInput(value) {
  return String(value ?? '')
    .replace(NON_PERSON_NAME_CHARS_RE, '')
    .slice(0, clientInsuranceMaxSubscriberNameLength)
}

export function isSubscriberNameKeyAllowed(event) {
  if (!event) {
    return true
  }
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return true
  }
  if (event.isComposing || event.key === 'Dead') {
    return true
  }
  const key = String(event.key ?? '')
  if (key.length !== 1) {
    return true
  }

  return PERSON_NAME_CHAR_RE.test(key)
}

export function isValidSubscriberName(value) {
  const s = trimInsuranceField(value)
  if (!s || s.length > clientInsuranceMaxSubscriberNameLength) {
    return false
  }

  return PERSON_NAME_RE.test(s)
}

function combinedPayerPlanKey(profile) {
  return [
    trimInsuranceField(profile?.payerName),
    trimInsuranceField(profile?.planName),
  ].filter(Boolean).join(' ').toLowerCase()
}

export function insuranceCoverageIdentityKey(profile) {
  return [
    combinedPayerPlanKey(profile),
    trimInsuranceField(profile?.insuranceType).toLowerCase(),
    sanitizePlanMemberIdInput(profile?.memberId),
    sanitizeMedicaidRecipientIdInput(profile?.medicaidRecipientId),
    sanitizeMedicareMemberIdInput(profile?.medicareMemberId),
    sanitizeGoldenCardMemberIdInput(profile?.goldenCardMemberId),
    sanitizePlanMemberIdInput(profile?.otherInsuranceId),
  ].join('|')
}

export function isInsuranceCoverageDuplicate(
  section,
  profile,
  excludeId = null,
) {
  const key = insuranceCoverageIdentityKey(profile)

  return visibleInsuranceProfiles(section).some(row => {
    if (excludeId && row.id === excludeId) {
      return false
    }

    return insuranceCoverageIdentityKey(row) === key
  })
}

function digitsOnlyInput(value, maxLen) {
  return String(value ?? '').replace(/\D/g, '').slice(0, maxLen)
}

/** Plan Member ID / Other Insurance ID while typing. */
export function sanitizePlanMemberIdInput(value) {
  return String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, clientInsuranceMaxMemberIdLength)
}

export function sanitizeMedicaidRecipientIdInput(value) {
  return digitsOnlyInput(
    value,
    clientInsuranceMedicaidRecipientIdLength,
  )
}

export function sanitizeGoldenCardMemberIdInput(value) {
  return digitsOnlyInput(
    value,
    clientInsuranceGoldenCardMemberIdLength,
  )
}

function isHicnDigitPrefix(out) {
  return /^\d*$/.test(out) && out.length <= 9
}

/**
 * Medicare MBI or legacy HICN while typing: uppercase, reject invalid
 * chars for the active position under either format.
 */
export function sanitizeMedicareMemberIdInput(value) {
  const raw = String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  let out = ''
  for (const ch of raw) {
    if (out.length >= clientInsuranceMedicareMemberIdLength) {
      break
    }
    const i = out.length
    const mbiOk = MEDICARE_MBI_POS_RE[i]?.test(ch)
    const hicnOk = i < 9
      ? isHicnDigitPrefix(out) && /^\d$/.test(ch)
      : /^\d{9}$/.test(out.slice(0, 9)) && /^[A-Z0-9]$/.test(ch)
    if (mbiOk || hicnOk) {
      out += ch
    }
  }

  return out
}

export function isValidMemberId(value) {
  const s = sanitizePlanMemberIdInput(value)
  if (!s) {
    return false
  }

  return PLAN_MEMBER_ID_RE.test(s)
}

export function isValidMedicareMemberId(value) {
  const s = sanitizeMedicareMemberIdInput(value)
  if (!s) {
    return false
  }

  return MEDICARE_MBI_RE.test(s) || MEDICARE_HICN_RE.test(s)
}

export function isValidMedicaidRecipientId(value) {
  const s = sanitizeMedicaidRecipientIdInput(value)
  if (!s) {
    return false
  }

  return MEDICAID_RECIPIENT_ID_RE.test(s)
}

export function isValidGoldenCardMemberId(value) {
  const s = sanitizeGoldenCardMemberIdInput(value)
  if (!s) {
    return false
  }

  return GOLDEN_CARD_ID_RE.test(s)
}

export function isValidOptionalIdentifier(value) {
  const s = sanitizePlanMemberIdInput(value)
  if (!s) {
    return true
  }

  return PLAN_MEMBER_ID_RE.test(s)
}

function compareUsDates(a, b) {
  const da = parseUsDateString(a)
  const db = parseUsDateString(b)
  if (!da || !db) {
    return 0
  }

  return startOfDay(da).getTime() - startOfDay(db).getTime()
}

export function applyPayerSelection(profile, payerOption) {
  if (!payerOption) {
    profile.payerId = null
    profile.payerName = ''
    profile.planName = ''

    return profile
  }
  profile.payerId = payerOption.id
  profile.payerName = payerOption.payer
  profile.planName = payerOption.plan

  return profile
}

export function resolvePayerFromProfile(profile, catalogItems = []) {
  if (profile.payerId) {
    const found = findPayerById(profile.payerId, catalogItems)
    if (found) {
      return found
    }
  }
  if (profile.payerName || profile.planName) {
    return {
      id: profile.payerId || `custom-${profile.id}`,
      payer: profile.payerName,
      plan: profile.planName,
    }
  }

  return null
}

function validateMedicaidField(errors, profile) {
  const type = profile.insuranceType
  const s = trimInsuranceField(profile.medicaidRecipientId)
  if (requiresMedicaidRecipientId(type)) {
    if (!s) {
      errors.medicaidRecipientId = 'insuranceMedicaidIdRequired'
    } else if (!isValidMedicaidRecipientId(s)) {
      errors.medicaidRecipientId = 'insuranceMedicaidIdInvalid'
    }
  } else if (s && !isValidMedicaidRecipientId(s)) {
    errors.medicaidRecipientId = 'insuranceMedicaidIdInvalid'
  }
}

function validateMedicareField(errors, profile) {
  const type = profile.insuranceType
  const s = trimInsuranceField(profile.medicareMemberId)
  if (requiresMedicareMemberId(type)) {
    if (!s) {
      errors.medicareMemberId = 'insuranceMedicareIdRequired'
    } else if (!isValidMedicareMemberId(s)) {
      errors.medicareMemberId = 'insuranceMedicareIdInvalid'
    }
  } else if (s && !isValidMedicareMemberId(s)) {
    errors.medicareMemberId = 'insuranceMedicareIdInvalid'
  }
}

function validateGoldenCardField(errors, profile) {
  const type = profile.insuranceType
  const s = trimInsuranceField(profile.goldenCardMemberId)
  if (requiresGoldenCardMemberId(type)) {
    if (!s) {
      errors.goldenCardMemberId = 'insuranceGoldenCardRequired'
    } else if (!isValidGoldenCardMemberId(s)) {
      errors.goldenCardMemberId = 'insuranceGoldenCardInvalid'
    }
  } else if (s && !isValidGoldenCardMemberId(s)) {
    errors.goldenCardMemberId = 'insuranceGoldenCardInvalid'
  }
}

function validateInsuranceIdentifiers(errors, profile) {
  validateMedicaidField(errors, profile)
  validateMedicareField(errors, profile)
  validateGoldenCardField(errors, profile)

  if (!isValidOptionalIdentifier(profile.otherInsuranceId)) {
    errors.otherInsuranceId = 'insuranceIdentifierInvalid'
  }
}

/**
 * @returns {{ ok: boolean, errors: Record<string, string> }}
 */
export function validateInsuranceProfile(
  profile,
  section,
  options = {},
) {
  const errors = {}
  const excludeId = options.excludeId ?? profile.id
  const payerLabel = trimInsuranceField(
    profile.payerName || profile.planName,
  )

  if (!payerLabel || payerLabel.length > clientInsuranceMaxPayerLength) {
    errors.payer = 'insurancePayerRequired'
  }

  if (!profile.priority) {
    errors.priority = 'insurancePriorityRequired'
  } else if (
    isInsurancePriorityTaken(section, profile.priority, excludeId)
  ) {
    errors.priority = 'insurancePriorityDuplicate'
  }

  if (
    !errors.payer
    && isInsuranceCoverageDuplicate(section, profile, excludeId)
  ) {
    errors.payer = 'insuranceDuplicateCoverage'
  }

  if (!isValidMemberId(profile.memberId)) {
    errors.memberId = 'insuranceMemberIdInvalid'
  }

  if (!profile.insuranceType) {
    errors.insuranceType = 'insuranceTypeRequired'
  }

  if (!isCompleteUsDateString(profile.policyEffectiveDate)) {
    errors.policyEffectiveDate = 'insuranceEffectiveDateRequired'
  }

  const expiration = trimInsuranceField(profile.policyExpirationDate)
  if (
    expiration
    && (
      !isCompleteUsDateString(expiration)
      || compareUsDates(
        expiration,
        profile.policyEffectiveDate,
      ) < 0
    )
  ) {
    errors.policyExpirationDate = 'insuranceExpirationDateInvalid'
  }

  if (!profile.relationshipToSubscriber) {
    errors.relationshipToSubscriber = 'insuranceRelationshipRequired'
  }

  const subscriber = trimInsuranceField(profile.subscriberName)
  if (isSubscriberNameRequired(profile.relationshipToSubscriber)) {
    if (!subscriber) {
      errors.subscriberName = 'insuranceSubscriberNameRequired'
    } else if (
      subscriber.length > clientInsuranceMaxSubscriberNameLength
    ) {
      errors.subscriberName = 'insuranceSubscriberNameMax'
    } else if (!isValidSubscriberName(subscriber)) {
      errors.subscriberName = 'insuranceSubscriberNameInvalid'
    }
  } else if (
    subscriber.length > clientInsuranceMaxSubscriberNameLength
  ) {
    errors.subscriberName = 'insuranceSubscriberNameMax'
  }

  validateInsuranceIdentifiers(errors, profile)

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  }
}

/** Uppercase / strip identifiers to match input sanitizers before save. */
export function normalizeInsuranceIdentifierFields(profile) {
  if (!profile || typeof profile !== 'object') {
    return profile
  }
  profile.memberId = sanitizePlanMemberIdInput(profile.memberId)
  profile.subscriberName = sanitizeSubscriberNameInput(
    profile.subscriberName,
  )
  profile.otherInsuranceId = sanitizePlanMemberIdInput(
    profile.otherInsuranceId,
  )
  profile.medicaidRecipientId = sanitizeMedicaidRecipientIdInput(
    profile.medicaidRecipientId,
  )
  profile.medicareMemberId = sanitizeMedicareMemberIdInput(
    profile.medicareMemberId,
  )
  profile.goldenCardMemberId = sanitizeGoldenCardMemberIdInput(
    profile.goldenCardMemberId,
  )

  return profile
}

export function softDeleteInsuranceProfile(profile) {
  profile.deleted = true
  profile.deletedAt = new Date().toISOString()
}

/**
 * Marks profile inactive locally (new client / offline); keeps row visible.
 * @param {{ reason?: string, notes?: string }} detail
 */
export function applyLocalInsuranceDeactivation(profile, detail = {}) {
  profile.status = clientInsuranceStatusValues.INACTIVE
  profile.deactivationReason = trimInsuranceField(detail.reason)
  profile.deactivationNotes = trimInsuranceField(detail.notes)
  profile.deactivatedAt = new Date().toISOString()
  profile.deactivatedBy = null
  profile.deactivatedByName = null
}

/**
 * Clears deactivation locally and restores date-derived status.
 */
export function applyLocalInsuranceReactivation(profile) {
  profile.deactivationReason = ''
  profile.deactivationNotes = ''
  profile.deactivatedAt = null
  profile.deactivatedBy = null
  profile.deactivatedByName = null
  profile.status = deriveInsuranceStatusFromDates({
    ...profile,
    status: clientInsuranceStatusValues.ACTIVE,
  })
}

/** @deprecated Use applyLocalInsuranceDeactivation */
export function deactivateInsuranceProfile(profile, reason) {
  applyLocalInsuranceDeactivation(profile, {
    reason: typeof reason === 'string' ? reason : reason?.reason,
    notes: typeof reason === 'object' ? reason?.notes : '',
  })
}

export const insurancePriorityOptions = Object.values(
  clientInsurancePriorityValues,
).map(value => ({ label: value, value }))

export const insuranceTypeOptions = Object.values(
  clientInsuranceTypeValues,
).map(value => ({ label: value, value }))

export const insuranceStatusOptions = Object.values(
  clientInsuranceStatusValues,
).map(value => ({ label: value, value }))

export const insuranceRelationshipOptions = Object.values(
  clientInsuranceRelationshipValues,
).map(value => ({ label: value, value }))
