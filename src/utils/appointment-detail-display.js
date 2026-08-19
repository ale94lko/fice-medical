import {
  clientInsurancePriorityValues,
  clientInsuranceRelationshipValues,
} from 'components/constants.js'
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
    ? ` (${t('appointmentDurationMinutes', { count: mins })})`
    : ''
  const cptCode = trim(line?.cptCode)
  const otherCode = formatServiceProcedureCode(line)
  const codePart = cptCode
    ? ` — CPT ${cptCode}`
    : (otherCode ? ` — ${otherCode}` : '')

  return `${name}${duration}${codePart}`
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
