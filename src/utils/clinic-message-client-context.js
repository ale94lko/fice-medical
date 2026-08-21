import {
  clientFormSections,
  clientInsurancePriorityValues,
} from 'components/constants.js'
import { formatDate, formatTime } from 'src/utils/app-datetime.js'
import { appointmentCardParts } from
  'src/utils/clinic-message-display.js'
import {
  resolveClientListAllergySeverityLabel,
  resolveClientListAllergySeverityModifier,
  sortClientListAllergyItemsBySeverity,
} from 'src/utils/client-list-allergy-severity.js'
import { visibleInsuranceProfiles } from 'src/utils/client-insurance.js'

const ENDED_APPOINTMENT_STATUSES = new Set([
  'CANCELLED',
  'CANCELED',
  'NO_SHOW',
  'RESCHEDULED',
])
const UPCOMING_LIMIT = 6
const RECENT_LIMIT = 3

function trim(value) {
  return String(value ?? '').trim()
}

function dash(value) {
  return trim(value) || '—'
}

export function appointmentStatusLabel(status, t) {
  const key = `appointmentStatus${String(status ?? '')
    .split('_')
    .map(part => part.charAt(0) + part.slice(1).toLowerCase())
    .join('')}`
  const label = t(key)
  if (!label || label === key) {
    return trim(status) || '—'
  }

  return label
}

function isEndedStatus(status) {
  return ENDED_APPOINTMENT_STATUSES.has(
    String(status ?? '').toUpperCase(),
  )
}

function appointmentWhen(row) {
  const datePart = formatDate(row?.startAtUtc)
  const timePart = formatTime(row?.startAtUtc)
  if (datePart && timePart) {
    return `${datePart} · ${timePart}`
  }

  return datePart || timePart || '—'
}

export function mapAppointmentPanelRow(row, t) {
  const card = appointmentCardParts(row?.startAtUtc)

  return {
    id: row?.appointmentId,
    when: appointmentWhen(row),
    service: trim(row?.servicesLabel || row?.appointmentTypeName),
    clinician: trim(row?.clinicianDisplayName),
    status: appointmentStatusLabel(row?.status, t),
    statusCode: trim(row?.status).toUpperCase(),
    telehealth: Boolean(row?.telemedicine),
    month: card.month,
    day: card.day,
    time: card.time,
  }
}

export function splitClientAppointments(
  appointments,
  now = new Date(),
) {
  const nowMs = now.getTime()
  const upcoming = []
  const recent = []
  const rows = [...(appointments ?? [])].sort((a, b) =>
    String(a?.startAtUtc ?? '').localeCompare(
      String(b?.startAtUtc ?? ''),
    ),
  )
  rows.forEach((row) => {
    const start = Date.parse(row?.startAtUtc)
    if (!Number.isFinite(start) || isEndedStatus(row?.status)) {
      return
    }
    if (start >= nowMs) {
      upcoming.push(row)

      return
    }
    recent.push(row)
  })

  return {
    upcoming: upcoming.slice(0, UPCOMING_LIMIT),
    recent: recent.slice(-RECENT_LIMIT).reverse(),
  }
}

function allergyItemsFromForm(section, t) {
  if (section?.noKnownAllergies) {
    return {
      nka: true,
      items: [{
        id: 'nka',
        label: t('noKnownAllergiesLabel'),
        severe: false,
      }],
    }
  }
  const entries = (section?.entries ?? [])
    .filter(entry => !entry?.deleted && trim(entry?.allergy))
    .map((entry, index) => {
      const severityRaw = trim(entry.severity)
      const modifier = resolveClientListAllergySeverityModifier(
        severityRaw,
      ) ?? 'mild'
      const severityLabel = resolveClientListAllergySeverityLabel(
        severityRaw,
        modifier,
      )

      return {
        id: entry.id || `allergy-${index}`,
        label: trim(entry.allergy),
        severityLabel,
        severe: modifier === 'severe',
        severityModifier: modifier,
      }
    })
  const sorted = sortClientListAllergyItemsBySeverity(entries)

  return { nka: false, items: sorted }
}

function primaryInsurance(section) {
  const profiles = visibleInsuranceProfiles(section)
  if (!profiles.length) {
    return null
  }
  const primary = profiles.find(profile =>
    profile.priority === clientInsurancePriorityValues.primary,
  ) ?? profiles[0]
  const payerName = trim(primary?.payerName || primary?.planName)
  if (!payerName) {
    return null
  }

  return {
    payerName,
    status: trim(primary?.status),
  }
}

function fact(key, label, value) {
  return { key, label, value: dash(value) }
}

export function buildClinicMessageClientSnapshot({
  form,
  header,
  appointments = [],
  t,
} = {}) {
  const split = splitClientAppointments(appointments)
  const allergies = allergyItemsFromForm(
    form?.[clientFormSections.allergies],
    t,
  )
  const insurance = primaryInsurance(
    form?.[clientFormSections.insurance],
  )
  const clinicians = Array.isArray(header?.clinicians)
    ? header.clinicians
    : []

  return {
    facts: [
      fact('dob', t('clientOverviewDobAge'), header?.dobAgeLine),
      fact('gender', t('gender'), header?.gender),
      fact(
        'language',
        t('preferredLanguage'),
        header?.preferredLanguage,
      ),
      fact('phone', t('phone'), header?.phone),
      fact('email', t('email'), header?.email),
    ],
    statusLabel: header?.statusLabel || '',
    clinicians,
    allergies,
    insurance,
    upcoming: split.upcoming.map(row =>
      mapAppointmentPanelRow(row, t),
    ),
    recent: split.recent.map(row =>
      mapAppointmentPanelRow(row, t),
    ),
  }
}
