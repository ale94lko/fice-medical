import {
  clientInsuranceMaxMemberIdLength,
  clientInsuranceMaxPayerLength,
  clientInsuranceMaxSubscriberNameLength,
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

const MEMBER_ID_RE = /^[A-Za-z0-9 -]+$/

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

  return (
    MEMBER_ID_RE.test(s)
    && s.length <= clientInsuranceMaxMemberIdLength
  )
}

export function isValidOptionalIdentifier(value) {
  const s = trimInsuranceField(value)
  if (!s) {
    return true
  }

  return (
    MEMBER_ID_RE.test(s)
    && s.length <= clientInsuranceMaxMemberIdLength
  )
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

export function resolvePayerFromProfile(profile) {
  if (profile.payerId) {
    const found = findPayerById(profile.payerId)
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

function validateInsuranceIdentifiers(errors, profile) {
  const type = profile.insuranceType
  if (requiresMedicaidRecipientId(type)) {
    if (!isValidMemberId(profile.medicaidRecipientId)) {
      errors.medicaidRecipientId = 'insuranceMedicaidIdRequired'
    }
  } else if (!isValidOptionalIdentifier(profile.medicaidRecipientId)) {
    errors.medicaidRecipientId = 'insuranceIdentifierInvalid'
  }

  if (requiresMedicareMemberId(type)) {
    if (!isValidMemberId(profile.medicareMemberId)) {
      errors.medicareMemberId = 'insuranceMedicareIdRequired'
    }
  } else if (!isValidOptionalIdentifier(profile.medicareMemberId)) {
    errors.medicareMemberId = 'insuranceIdentifierInvalid'
  }

  if (requiresGoldenCardMemberId(type)) {
    if (!isValidMemberId(profile.goldenCardMemberId)) {
      errors.goldenCardMemberId = 'insuranceGoldenCardRequired'
    }
  } else if (!isValidOptionalIdentifier(profile.goldenCardMemberId)) {
    errors.goldenCardMemberId = 'insuranceIdentifierInvalid'
  }

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
