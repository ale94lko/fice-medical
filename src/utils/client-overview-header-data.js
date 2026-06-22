import {
  clientFieldKeys as ck,
  clientFormSections,
  clientPreferredCommunicationValues as pref,
} from 'components/constants.js'
import { resolveClientListClinicianEntries } from 'components/helpers.js'
import { formatPhoneUs } from 'src/utils/client-contact-form.js'
import {
  clinicianAvatarStyle,
  clinicianInitialsFromPersonName,
} from 'src/utils/clinician-display.js'
import {
  isoDateToUsDateString,
  normalizeIdNumberMaskedDisplay,
  parseUsDateString,
  startOfDay,
} from 'src/utils/client-form.js'

function trim(value) {
  return String(value ?? '').trim()
}

function formatClientName(form) {
  const parts = [
    form?.[ck.prefix],
    form?.[ck.firstName],
    form?.[ck.middleName],
    form?.[ck.lastName],
    form?.[ck.suffix],
  ].map(trim).filter(Boolean)

  return parts.join(' ') || '—'
}

function clientInitialsFromForm(form) {
  const first = trim(form?.[ck.firstName])
  const last = trim(form?.[ck.lastName])
  const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()

  return initials || '?'
}

function resolveContactPhones(contact) {
  return (contact?.phones ?? [])
    .map((item, index) => {
      const number = formatPhoneUs(trim(item?.number))
      if (!number) {
        return null
      }

      return {
        id: `phone-${index}`,
        value: number,
        type: trim(item?.type),
      }
    })
    .filter(Boolean)
}

function resolveContactEmails(contact) {
  return (contact?.emails ?? [])
    .map((item, index) => {
      const address = trim(item?.address)
      if (!address) {
        return null
      }

      return {
        id: `email-${index}`,
        value: address,
        type: trim(item?.type),
      }
    })
    .filter(Boolean)
}

function resolvePrimaryPhone(contact) {
  return resolveContactPhones(contact)[0]?.value ?? ''
}

function resolvePrimaryEmail(contact) {
  return resolveContactEmails(contact)[0]?.value ?? ''
}

const PREF_COMM_I18N = {
  [pref.email]: 'prefCommEmail',
  [pref.mobilePhone]: 'prefCommMobilePhone',
  [pref.homePhone]: 'prefCommHomePhone',
  [pref.workPhone]: 'prefCommWorkPhone',
  [pref.mail]: 'prefCommMail',
  [pref.pointOfContact]: 'prefCommPointOfContact',
}

function resolvePreferredLanguageLabel(contact, t) {
  const list = contact?.preferredCommunication ?? []
  const meaningful = list.find(item => {
    const value = trim(item)

    return value
      && value !== pref.providerDidNotAsk
      && value !== pref.patientDeclined
  })
  if (!meaningful) {
    return ''
  }
  const key = PREF_COMM_I18N[meaningful]

  return key ? t(key) : meaningful
}

function resolveClinicianCards(form, rawClient, clinicianOptions = []) {
  const fromApi = resolveClientListClinicianEntries(rawClient ?? {})
  if (fromApi.length) {
    return fromApi.map((entry, index) => {
      const nameParts = entry.name.split(' - ')
      const fallbackName = nameParts[0]?.trim() || entry.name

      return {
        id: entry.id,
        name: entry.personName || fallbackName,
        specialty: entry.specialty
          || nameParts.slice(1).join(' - ').trim(),
        initials: entry.initials
          || clinicianInitialsFromPersonName(entry.name),
        avatarStyle: clinicianAvatarStyle(entry.id ?? entry.name),
        isPrimary: index === 0,
      }
    })
  }

  const ids = Array.isArray(form?.[ck.clinicians]) ? form[ck.clinicians] : []
  const byValue = new Map(
    (clinicianOptions ?? []).map(item => [String(item.value), item.label]),
  )

  return ids.map((id, index) => {
    const label = trim(byValue.get(String(id)) ?? id)
    const parts = label.split(' - ')

    return {
      id,
      name: parts[0] || label,
      specialty: parts.slice(1).join(' - ').trim(),
      initials: clinicianInitialsFromPersonName(parts[0] || label),
      avatarStyle: clinicianAvatarStyle(id ?? label),
      isPrimary: index === 0,
    }
  }).filter(card => card.name)
}

function resolveFormFieldLabel(value) {
  if (value == null || value === '') {
    return '—'
  }
  if (typeof value === 'object') {
    const label = trim(value.label)
    if (label) {
      return label
    }
    const nested = trim(value.value)

    return nested || '—'
  }

  return trim(value) || '—'
}

function resolveCatalogFieldLabel(
  field,
  catalogOptions,
  resolveCatalogSelectValue,
) {
  if (field == null || field === '') {
    return '—'
  }
  if (typeof field === 'object') {
    const label = trim(field.label)
    if (label) {
      return label
    }
    const nested = trim(field.value)
    if (!nested) {
      return '—'
    }

    return resolveCatalogFieldLabel(
      nested,
      catalogOptions,
      resolveCatalogSelectValue,
    )
  }

  const resolved = resolveCatalogSelectValue?.(
    catalogOptions,
    trim(field),
  )
  if (resolved && typeof resolved === 'object') {
    return trim(resolved.label) || '—'
  }

  return trim(resolved ?? field) || '—'
}

function formatIdNumberMaskedLine(form) {
  const masked = normalizeIdNumberMaskedDisplay(form?.[ck.idNumberMasked])

  return masked || '—'
}

function resolveStatusLabel(status, t) {
  const raw = trim(status) || 'active'
  const lower = raw.toLowerCase()
  if (lower === 'active') {
    return t('active')
  }
  if (lower === 'inactive') {
    return t('inactive')
  }
  if (lower === 'pending') {
    return t('pending')
  }
  if (lower === 'closed') {
    return t('closed')
  }

  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function formatAppointmentUsDate(startAtUtc) {
  const raw = trim(startAtUtc)
  if (!raw) {
    return '—'
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return isoDateToUsDateString(raw.slice(0, 10)) || raw
  }

  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

function formatAppointmentDateTimeLine(startAtUtc) {
  const raw = trim(startAtUtc)
  if (!raw) {
    return '—'
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return isoDateToUsDateString(raw.slice(0, 10)) || raw
  }

  const datePart = date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return `${datePart} • ${timePart}`
}

function formatAppointmentDateTime(startAtUtc) {
  const raw = trim(startAtUtc)
  if (!raw) {
    return '—'
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return isoDateToUsDateString(raw.slice(0, 10)) || raw
  }

  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return `${datePart} - ${timePart}`
}

function formatAppointmentDate(startAtUtc) {
  return formatAppointmentUsDate(startAtUtc)
}

function resolveAppointmentSummary(appointments = []) {
  const dated = (appointments ?? [])
    .map(item => ({
      sortKey: trim(item.startAtUtc).slice(0, 19),
      dateTime: formatAppointmentDateTime(item.startAtUtc),
      dateTimeLine: formatAppointmentDateTimeLine(item.startAtUtc),
      date: formatAppointmentDate(item.startAtUtc),
      clinician: trim(item.clinicianDisplayName),
    }))
    .filter(item => item.sortKey)

  if (!dated.length) {
    return {
      nextAppointment: null,
      lastVisit: null,
    }
  }

  dated.sort((a, b) => a.sortKey.localeCompare(b.sortKey))
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = dated.find(item => item.sortKey.slice(0, 10) >= today)
  const past = [...dated].reverse().find(
    item => item.sortKey.slice(0, 10) < today,
  )

  return {
    nextAppointment: upcoming
      ? {
        dateTime: upcoming.dateTime,
        dateTimeLine: upcoming.dateTimeLine,
        clinician: upcoming.clinician,
      }
      : null,
    lastVisit: past
      ? {
        date: past.date,
        clinician: past.clinician,
      }
      : null,
  }
}

function formatClientSinceDuration(admissionDateUs, t) {
  const start = parseUsDateString(admissionDateUs)
  if (!start) {
    return ''
  }

  const today = startOfDay(new Date())
  const diffMs = today.getTime() - start.getTime()
  if (diffMs < 0) {
    return ''
  }

  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (days < 7) {
    return t('clientOverviewDurationDays', { count: days || 1 })
  }
  if (days < 60) {
    const weeks = Math.max(1, Math.round(days / 7))

    return t('clientOverviewDurationWeeks', { count: weeks })
  }

  const months = Math.max(1, Math.round(days / 30))

  return t('clientOverviewDurationMonths', { count: months })
}

function formatDobAgeLine(form, t) {
  const dob = trim(form?.[ck.dob])
  const age = trim(form?.[ck.age])
  if (!dob && !age) {
    return '—'
  }
  if (!age) {
    return dob
  }

  const unit = trim(form?.[ck.ageUnit]) || 'years'
  const unitLabel = unit === 'years'
    ? t('clientOverviewAgeYears', { count: Number(age) || age })
    : age

  return dob ? `${dob} (${unitLabel})` : unitLabel
}

export function buildClientOverviewHeaderData(
  form,
  {
    rawClient = null,
    clinicianOptions = [],
    raceSelectOptions = [],
    ethnicitySelectOptions = [],
    resolveCatalogSelectValue = null,
    appointments = [],
    t,
  } = {},
) {
  const contact = form?.[clientFormSections.contact] ?? {}
  const appointmentSummary = resolveAppointmentSummary(appointments)
  const admissionDate = trim(form?.[ck.admissionDate])

  return {
    fullName: formatClientName(form),
    clientNumber: trim(form?.[ck.clientNumber]),
    clientInitials: clientInitialsFromForm(form),
    status: trim(form?.[ck.status]) || 'active',
    statusLabel: resolveStatusLabel(form?.[ck.status], t),
    dobAgeLine: formatDobAgeLine(form, t),
    gender: resolveFormFieldLabel(form?.[ck.gender]),
    race: resolveCatalogFieldLabel(
      form?.[ck.race],
      raceSelectOptions,
      resolveCatalogSelectValue,
    ),
    ethnicity: resolveCatalogFieldLabel(
      form?.[ck.ethnicity],
      ethnicitySelectOptions,
      resolveCatalogSelectValue,
    ),
    idNumberMasked: formatIdNumberMaskedLine(form),
    phones: resolveContactPhones(contact),
    emails: resolveContactEmails(contact),
    phone: resolvePrimaryPhone(contact),
    email: resolvePrimaryEmail(contact),
    preferredLanguage: resolvePreferredLanguageLabel(contact, t),
    clinicians: resolveClinicianCards(form, rawClient, clinicianOptions),
    nextAppointment: appointmentSummary.nextAppointment,
    lastVisit: appointmentSummary.lastVisit,
    clientSince: {
      date: admissionDate || '—',
      duration: formatClientSinceDuration(admissionDate, t),
    },
  }
}
