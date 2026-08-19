import {
  clientInsurancePriorityValues,
  clientInsuranceRelationshipValues,
  clientGenderValues,
} from 'components/constants.js'
import { formatPhoneUs } from 'src/utils/client-contact-form.js'
import { isoDateToUsDateString } from 'src/utils/client-form.js'
import {
  formatServiceProcedureCode,
} from 'src/utils/appointment-normalize.js'
import {
  visibleInsuranceProfiles,
} from 'src/utils/client-insurance.js'
import { clinicianInitialsFromPersonName } from
  'src/utils/clinician-display.js'

function trim(value) {
  return String(value ?? '').trim()
}

export function appointmentClientInitials(name) {
  return clinicianInitialsFromPersonName(name) || '?'
}

export function formatAppointmentServicesSummary(record, t) {
  const lines = record?.serviceProcedures ?? []
  const fallbackDuration = Number(record?.durationMin)
  if (lines.length) {
    return lines
      .map(line => formatServiceLineSummary(line, fallbackDuration, t))
      .filter(Boolean)
      .join(', ')
  }
  const name = trim(record?.appointmentTypeName)
  if (!name) {
    return '—'
  }
  const duration = Number.isFinite(fallbackDuration) && fallbackDuration > 0
    && !nameIncludesDuration(name)
    ? ` (${t('appointmentDurationMinutes', { count: fallbackDuration })})`
    : ''

  return `${name}${duration}`
}

function formatServiceLineSummary(line, fallbackDuration, t) {
  const name = trim(line?.name)
  if (!name) {
    return ''
  }
  const mins = Number(line?.durationMin) || fallbackDuration
  const duration = Number.isFinite(mins) && mins > 0
    && !nameIncludesDuration(name)
    ? ` (${t('appointmentDurationMinutes', { count: mins })})`
    : ''
  const cptCode = trim(line?.cptCode)
  const otherCode = formatServiceProcedureCode(line)
  const codePart = cptCode
    ? ` — CPT ${cptCode}`
    : (otherCode ? ` — ${otherCode}` : '')

  return `${name}${duration}${codePart}`
}

function nameIncludesDuration(name) {
  return /\(\s*\d+\s*min(?:utes?)?\s*\)/i.test(name)
}

export function pickAppointmentInsurance(section, insuranceProfileId) {
  const profiles = visibleInsuranceProfiles(section)
  if (!profiles.length) {
    return null
  }
  const byId = profiles.find(profile =>
    Number(profile.apiId) === Number(insuranceProfileId),
  )
  if (byId) {
    return byId
  }
  const primary = profiles.find(profile =>
    profile.priority === clientInsurancePriorityValues.primary,
  )

  return primary || profiles[0]
}

export function formatInsurancePayer(profile) {
  const payer = trim(profile?.payerName)
  const plan = trim(profile?.planName)
  if (payer && plan && payer !== plan) {
    return `${payer} (${plan})`
  }

  return payer || plan
}

export function insuranceServiceId(profile) {
  return trim(profile?.otherInsuranceId)
    || trim(profile?.medicaidRecipientId)
    || trim(profile?.medicareMemberId)
    || trim(profile?.goldenCardMemberId)
}

export function isInsuranceSubscriberOther(profile) {
  const relationship = trim(profile?.relationshipToSubscriber)
  if (!relationship) {
    return Boolean(trim(profile?.subscriberName))
  }

  return relationship !== clientInsuranceRelationshipValues.self
}

export function appointmentLocationFromSubtenant(subtenant) {
  return {
    name: trim(subtenant?.name) || '—',
    address: trim(subtenant?.billingAddress) || '—',
  }
}

export function formatAppointmentDobAge(header, t) {
  const dob = trim(header?.dobDisplay)
  const ageLabel = trim(header?.ageLabel)
  const yearsMatch = ageLabel.match(/^(\d+)/)
  const years = yearsMatch ? Number(yearsMatch[1]) : NaN
  const isYearUnit = /year|año/i.test(ageLabel)
  if (dob && isYearUnit && Number.isFinite(years) && years >= 0) {
    return `${dob}, ${t('appointmentDetailAgeYears', { count: years })}`
  }
  if (dob && ageLabel) {
    return `${dob}, ${ageLabel}`
  }

  return dob || ageLabel || trim(header?.dobAgeLine)
}

export function genderIconName(genderLabel, formGender) {
  const code = String(formGender ?? '').trim().toLowerCase()
  if (code === String(clientGenderValues.female).toLowerCase()) {
    return 'female'
  }
  if (code === String(clientGenderValues.male).toLowerCase()) {
    return 'male'
  }
  const label = String(genderLabel ?? '').toLowerCase()
  if (label.includes('female') || label.includes('mujer')) {
    return 'female'
  }
  if (label.includes('male') || label.includes('hombre')) {
    return 'male'
  }

  return ''
}

export function buildAppointmentClientHeader(record, t) {
  const name = trim(record?.clientDisplayName)
  const summary = record?.clientSummary
  if (!name && !summary) {
    return null
  }
  const gender = trim(summary?.gender)
  const age = Number(summary?.age)
  const unit = trim(summary?.ageUnit)
  const isYears = !unit || /year|año/i.test(unit)
  const dobDisplay = isoDateToUsDateString(summary?.dob)
    || trim(summary?.dob)
  const ageLabel = Number.isFinite(age) && age >= 0
    ? (isYears
      ? t('appointmentDetailAgeYears', { count: age })
      : String(age))
    : ''

  return {
    fullName: name || '—',
    clientInitials: trim(summary?.initials)
      || appointmentClientInitials(name),
    photoFileId: summary?.photoFileId ?? null,
    dobAgeLine: summary
      ? formatAppointmentDobAge({ dobDisplay, ageLabel }, t)
      : '',
    gender,
    phone: formatPhoneUs(summary?.phone) || trim(summary?.phone),
    addressLine: trim(summary?.address),
    genderIcon: genderIconName(gender, gender),
  }
}

export function buildAppointmentInsuranceView(insurance) {
  if (insurance == null) {
    return null
  }
  const payer = trim(insurance.payer)
  const memberId = trim(insurance.memberId)
  const serviceId = trim(insurance.serviceId)
  const subscriberName = trim(insurance.subscriberName)
  const relationship = trim(insurance.relationshipToSubscriber)

  return {
    payer,
    memberId,
    serviceId,
    subscriberName,
    relationship,
    empty: !payer && !memberId && !serviceId,
    showSubscriber: isInsuranceSubscriberOther({
      relationshipToSubscriber: relationship,
      subscriberName,
    }),
  }
}
