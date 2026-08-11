/* eslint-disable camelcase -- API request body uses snake_case */
import {
  clientFormSections,
  clientInsurancePriorityValues,
  clientInsuranceRelationshipValues,
  clientInsuranceStatusValues,
  clientInsuranceTypeValues,
} from 'components/constants.js'
import { usDateToIso } from 'src/utils/client-form.js'
import {
  trimInsuranceField,
  visibleInsuranceProfiles,
} from 'src/utils/client-insurance.js'
import {
  resolvePrimaryClinicianIdForApi,
} from 'src/utils/client-clinicians-form.js'
import { insuranceCardFileIdForApi } from 'src/utils/insurance-card-file.js'
import { vitalsEntryToApiPayload } from 'src/utils/vitals-normalize.js'

function trim(value) {
  return String(value ?? '').trim()
}

function catalogKeyFromLabel(mapObj, displayValue) {
  const d = trim(displayValue)
  if (!d) {
    return null
  }
  const found = Object.entries(mapObj).find(([, label]) => label === d)

  return found ? found[0] : null
}

function payerPlanName(profile) {
  const parts = [
    trimInsuranceField(profile.payerName),
    trimInsuranceField(profile.planName),
  ].filter(Boolean)

  return parts.join(' ').trim() || null
}

function insuranceProfileIsSendable(profile) {
  return Boolean(
    payerPlanName(profile)
    && trimInsuranceField(profile.memberId)
    && profile.priority
    && profile.insuranceType
  )
}

function mapInsuranceProfile(profile) {
  const payload = {
    payer_plan_name: payerPlanName(profile),
    insurance_priority: catalogKeyFromLabel(
      clientInsurancePriorityValues,
      profile.priority,
    ),
    member_id: trimInsuranceField(profile.memberId),
    insurance_type: catalogKeyFromLabel(
      clientInsuranceTypeValues,
      profile.insuranceType,
    ),
    policy_effective_date: usDateToIso(profile.policyEffectiveDate) || null,
    policy_expiration_date: usDateToIso(profile.policyExpirationDate) || null,
    relationship_to_subscriber: catalogKeyFromLabel(
      clientInsuranceRelationshipValues,
      profile.relationshipToSubscriber,
    ),
    subscriber_name: trimInsuranceField(profile.subscriberName) || null,
    medicaid_id: trimInsuranceField(profile.medicaidRecipientId) || null,
    medicare_id: trimInsuranceField(profile.medicareMemberId) || null,
    assistance_program_id: trimInsuranceField(profile.goldenCardMemberId)
      || null,
    assistance_program_name: null,
    other_insurance_id: trimInsuranceField(profile.otherInsuranceId) || null,
    insurance_status: catalogKeyFromLabel(
      clientInsuranceStatusValues,
      profile.status,
    ) || 'active',
    deactivation_reason: trimInsuranceField(profile.deactivationReason) || null,
    front_card_file_id: insuranceCardFileIdForApi(profile.frontCardFile),
    back_card_file_id: insuranceCardFileIdForApi(profile.backCardFile),
  }

  const apiId = profile?.apiId
  if (apiId != null && String(apiId).trim()) {
    const numericId = Number(apiId)
    payload.id = Number.isFinite(numericId) ? numericId : apiId
  }

  return payload
}

export function buildInsuranceForRegister(form) {
  const section = form?.[clientFormSections.insurance] ?? {}

  return visibleInsuranceProfiles(section)
    .filter(insuranceProfileIsSendable)
    .map(mapInsuranceProfile)
    .filter(
      row => row.payer_plan_name
        && row.insurance_priority
        && row.insurance_type
        && row.member_id,
    )
}

export function relationshipTokenForApi(value) {
  const t = trim(value)
  if (!t) {
    return ''
  }

  return t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function buildMedicalHistoryForRegister(form) {
  const section = form?.[clientFormSections.familyMedicalHistory] ?? {}

  return (section.entries ?? [])
    .map(entry => {
      const row = {
        relationship: relationshipTokenForApi(entry?.familyRelationship),
        medical_condition: trim(entry?.medicalConditions),
      }
      const apiId = entry?.apiId
      if (apiId != null && String(apiId).trim()) {
        const numericId = Number(apiId)
        row.id = Number.isFinite(numericId) ? numericId : apiId
      }

      return row
    })
    .filter(
      row => row.relationship && row.medical_condition,
    )
}

/**
 * New vitals only (no apiId). Persisted vitals use /vitals API.
 */
export function buildVitalsForRegister(form) {
  const section = form?.[clientFormSections.vitals] ?? {}
  const fallbackClinicianId = resolvePrimaryClinicianIdForApi(form)

  return (section.entries ?? [])
    .filter(entry => {
      const apiId = entry?.apiId

      return apiId == null || String(apiId).trim() === ''
    })
    .map(entry => vitalsEntryToApiPayload(entry, {
      clinicianId: fallbackClinicianId,
    }))
    .filter(row => row.taken_at_utc != null)
}
