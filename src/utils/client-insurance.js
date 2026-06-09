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
} from 'components/constants.js'
import {
  isCompleteUsDateString,
  parseUsDateString,
  startOfDay,
} from 'src/utils/client-form.js'
import { findPayerById } from 'src/utils/insurance-payers.js'

const GENERIC_MEMBER_ID_RE = new RegExp(
  `^[A-Za-z0-9]{1,${clientInsuranceMaxMemberIdLength}}$`,
)
const MEDICARE_MEMBER_ID_RE = new RegExp(
  `^[A-Za-z0-9]{${clientInsuranceMedicareMemberIdLength}}$`,
)
const MEDICAID_RECIPIENT_ID_RE = new RegExp(
  `^\\d{${clientInsuranceMedicaidRecipientIdLength}}$`,
)
const GOLDEN_CARD_ID_RE = new RegExp(
  `^\\d{${clientInsuranceGoldenCardMemberIdLength}}$`,
)

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
    status: clientInsuranceStatusValues.active,
    frontCardFile: null,
    backCardFile: null,
    deleted: false,
    deletedAt: null,
    deactivationReason: '',
    deactivatedAt: null,
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

export function visibleInsuranceProfiles(section) {
  return (section?.profiles ?? []).filter(profile => !profile.deleted)
}

export function activeInsuranceProfiles(section, excludeId = null) {
  return visibleInsuranceProfiles(section).filter(profile => {
    if (excludeId && profile.id === excludeId) {
      return false
    }

    return profile.status === clientInsuranceStatusValues.active
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

export function isValidMemberId(value) {
  const s = trimInsuranceField(value)
  if (!s) {
    return false
  }

  return GENERIC_MEMBER_ID_RE.test(s)
}

export function isValidMedicareMemberId(value) {
  const s = trimInsuranceField(value)
  if (!s) {
    return false
  }

  return MEDICARE_MEMBER_ID_RE.test(s)
}

export function isValidMedicaidRecipientId(value) {
  const s = trimInsuranceField(value)
  if (!s) {
    return false
  }

  return MEDICAID_RECIPIENT_ID_RE.test(s)
}

export function isValidGoldenCardMemberId(value) {
  const s = trimInsuranceField(value)
  if (!s) {
    return false
  }

  return GOLDEN_CARD_ID_RE.test(s)
}

export function isValidOptionalIdentifier(value) {
  const s = trimInsuranceField(value)
  if (!s) {
    return true
  }

  return GENERIC_MEMBER_ID_RE.test(s)
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
    if (
      !subscriber
      || subscriber.length > clientInsuranceMaxSubscriberNameLength
    ) {
      errors.subscriberName = 'insuranceSubscriberNameRequired'
    }
  } else if (
    subscriber.length > clientInsuranceMaxSubscriberNameLength
  ) {
    errors.subscriberName = 'insuranceSubscriberNameMax'
  }

  validateInsuranceIdentifiers(errors, profile)

  if (!profile.status) {
    errors.status = 'insuranceStatusRequired'
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  }
}

export function softDeleteInsuranceProfile(profile) {
  profile.deleted = true
  profile.deletedAt = new Date().toISOString()
}

/**
 * Marks profile inactive for billing; keeps row visible (not soft-deleted).
 */
export function deactivateInsuranceProfile(profile, reason) {
  profile.status = clientInsuranceStatusValues.inactive
  profile.deactivationReason = trimInsuranceField(reason)
  profile.deactivatedAt = new Date().toISOString()
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
