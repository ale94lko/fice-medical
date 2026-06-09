/* eslint-disable camelcase -- API request body uses snake_case */
import {
  clientFieldKeys,
  clientFormSections,
  clientInsurancePriorityValues,
  clientInsuranceRelationshipValues,
  clientInsuranceStatusValues,
  clientInsuranceTypeValues,
  clientVitalsPainLevelValues,
} from 'components/constants.js'
import { usDateToIso } from 'src/utils/client-form.js'
import {
  trimInsuranceField,
  visibleInsuranceProfiles,
} from 'src/utils/client-insurance.js'
import { combineRecordedDateTime } from 'src/utils/client-vitals.js'

const ck = clientFieldKeys

function trim(value) {
  return String(value ?? '').trim()
}

function resolveClinicianIdForForm(form) {
  const clinicianRaw = trim(form?.[ck.assignedClinician])
  if (!clinicianRaw) {
    return null
  }
  const clinicianId = Number(clinicianRaw)

  return Number.isFinite(clinicianId) ? clinicianId : null
}

function catalogKeyFromLabel(mapObj, displayValue) {
  const d = trim(displayValue)
  if (!d) {
    return null
  }
  const found = Object.entries(mapObj).find(([, label]) => label === d)

  return found ? found[0] : null
}

function insuranceCardUrl(fileOrUrl) {
  if (fileOrUrl == null) {
    return null
  }
  if (typeof fileOrUrl === 'string') {
    const s = fileOrUrl.trim()

    return s || null
  }

  return null
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
    front_card_url: insuranceCardUrl(profile.frontCardFile),
    back_card_url: insuranceCardUrl(profile.backCardFile),
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

function mapPainLevelToNumber(pain) {
  const key = String(pain ?? '').trim()
  if (key === clientVitalsPainLevelValues.mild) {
    return 2
  }
  if (key === clientVitalsPainLevelValues.moderate) {
    return 5
  }
  if (key === clientVitalsPainLevelValues.severe) {
    return 9
  }

  return 0
}

function takenAtUtcFromEntry(entry) {
  const combined = combineRecordedDateTime(
    entry.recordedDate,
    entry.recordedTime,
  )
  if (!combined) {
    return null
  }

  return combined.toISOString()
}

function mapVitalsEntry(entry, clinicianId) {
  return {
    clinician_id: clinicianId,
    blood_pressure_systolic: entry.systolic ?? null,
    blood_pressure_diastolic: entry.diastolic ?? null,
    heart_rate: entry.heartRate ?? null,
    temperature: entry.temperature ?? null,
    oxygen_saturation: entry.oxygenSaturation ?? null,
    pain_level: mapPainLevelToNumber(entry.painLevel),
    height: entry.height ?? null,
    height_unit: 'IN',
    weight: entry.weight ?? null,
    weight_unit: 'LB',
    notes: trim(entry.notes) || null,
    taken_at_utc: takenAtUtcFromEntry(entry),
  }
}

export function buildVitalsForRegister(form) {
  const section = form?.[clientFormSections.vitals] ?? {}
  const clinicianId = resolveClinicianIdForForm(form)

  return (section.entries ?? [])
    .map(entry => {
      const row = mapVitalsEntry(entry, clinicianId)
      const apiId = entry?.apiId
      if (apiId != null && String(apiId).trim()) {
        const numericId = Number(apiId)
        row.id = Number.isFinite(numericId) ? numericId : apiId
      }

      return row
    })
    .filter(row => row.taken_at_utc != null)
}
