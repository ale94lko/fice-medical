import { clinicianInitialsFromPersonName } from
  'src/utils/clinician-display.js'
import {
  formatDate,
  formatTime,
  fromUtc,
  getAppDateTimeConfig,
  resolveIntlLocale,
} from 'src/utils/app-datetime.js'

export function initialsFromDisplayName(name) {
  return clinicianInitialsFromPersonName(name)
}

export function firstGivenName(name) {
  const token = String(name ?? '').trim().split(/\s+/)[0]

  return token || ''
}

const PLACEHOLDER_STAFF_NAMES = new Set([
  'clinic',
  'clinica',
  'clínica',
])

export function usableStaffSenderName(value) {
  const name = String(value ?? '').trim()
  if (!name || name.includes('@')) {
    return ''
  }
  if (PLACEHOLDER_STAFF_NAMES.has(name.toLowerCase())) {
    return ''
  }

  return name
}

function sameDay(a, b) {
  return a.year === b.year
    && a.month === b.month
    && a.day === b.day
}

export function formatInboxStamp(value, t) {
  const parts = fromUtc(value)
  const now = fromUtc(new Date().toISOString())
  if (!parts || !now) {
    return formatDate(value) || formatTime(value)
  }
  if (sameDay(parts, now)) {
    return formatTime(value)
  }
  const prev = new Date(now.year, now.month - 1, now.day)
  prev.setDate(prev.getDate() - 1)
  if (
    parts.year === prev.getFullYear()
    && parts.month === prev.getMonth() + 1
    && parts.day === prev.getDate()
  ) {
    return t('portalMessagesYesterday')
  }

  return formatDate(value)
}

export function formatThreadDateLabel(value) {
  const parts = fromUtc(value)
  if (!parts) {
    return formatDate(value)
  }
  const config = getAppDateTimeConfig()

  return new Intl.DateTimeFormat(
    resolveIntlLocale(config.locale),
    { month: 'short', day: 'numeric', year: 'numeric' },
  ).format(new Date(parts.year, parts.month - 1, parts.day))
}

export function groupMessagesByDate(messages) {
  const groups = []
  ;(messages ?? []).forEach((msg) => {
    const key = formatDate(msg?.createdAt) || '_'
    const last = groups[groups.length - 1]
    if (!last || last.key !== key) {
      groups.push({
        key,
        label: formatThreadDateLabel(msg?.createdAt) || key,
        messages: [msg],
      })

      return
    }
    last.messages.push(msg)
  })

  return groups
}

export function appointmentCardParts(startAtUtc) {
  const time = formatTime(startAtUtc)
  const parts = fromUtc(startAtUtc)
  if (!parts) {
    return {
      month: '',
      day: '',
      time,
    }
  }
  const config = getAppDateTimeConfig()
  const month = new Intl.DateTimeFormat(
    resolveIntlLocale(config.locale),
    { month: 'short' },
  ).format(new Date(parts.year, parts.month - 1, 1))
    .replace('.', '')
    .toUpperCase()

  return {
    month,
    day: String(parts.day),
    time,
  }
}
