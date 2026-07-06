import {
  apiDateTimeToDisplay,
  getAppDateTimeConfig,
  parseApiDateTime,
  resolveIntlLocale,
  resolveIntlTimeZone,
} from 'src/utils/app-datetime.js'
import { clinicianInitialsFromPersonName } from
  'src/utils/clinician-display.js'

const ROLE_BADGE_TONES = ['primary', 'info', 'violet', 'amber']

function hashString(value) {
  let hash = 0
  const text = String(value ?? '')

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0
  }

  return Math.abs(hash)
}

export function resolveUserInitials(name, email) {
  const fromName = clinicianInitialsFromPersonName(name)
  if (fromName && fromName !== '?') {
    return fromName
  }

  const localPart = String(email ?? '').split('@')[0] ?? ''
  const parts = localPart.split(/[._-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return '?'
}

export function resolveRoleBadgeTone(roleName, index = 0) {
  const key = String(roleName ?? '').trim()
  if (!key) {
    return ROLE_BADGE_TONES[index % ROLE_BADGE_TONES.length]
  }

  return ROLE_BADGE_TONES[hashString(key) % ROLE_BADGE_TONES.length]
}

function formatTimeOnly(date, config = getAppDateTimeConfig()) {
  const timeZone = resolveIntlTimeZone(config.timezone)
  const locale = resolveIntlLocale(config.locale)

  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function formatLongDate(date, config = getAppDateTimeConfig()) {
  const timeZone = resolveIntlTimeZone(config.timezone)
  const locale = resolveIntlLocale(config.locale)

  return new Intl.DateTimeFormat(locale, {
    timeZone,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function dayKey(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  return [
    parts.find(part => part.type === 'year')?.value,
    parts.find(part => part.type === 'month')?.value,
    parts.find(part => part.type === 'day')?.value,
  ].join('-')
}

export function formatUserLastLogin(value, t) {
  const parsed = parseApiDateTime(value)
  if (!parsed) {
    return ''
  }

  const config = getAppDateTimeConfig()
  const timeZone = resolveIntlTimeZone(config.timezone)
  const now = new Date()
  const timeLabel = formatTimeOnly(parsed, config)
  const todayKey = dayKey(now, timeZone)
  const valueKey = dayKey(parsed, timeZone)

  if (valueKey === todayKey) {
    return t('userListLastLoginToday', { time: timeLabel })
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (valueKey === dayKey(yesterday, timeZone)) {
    return t('userListLastLoginYesterday', { time: timeLabel })
  }

  const longDate = formatLongDate(parsed, config)
  const fallback = apiDateTimeToDisplay(value, config)

  return longDate || fallback || ''
}

export function formatUserCreatedAt(value) {
  return apiDateTimeToDisplay(value) || ''
}

export function resolveUserAvatarStyle(seed) {
  const tones = [
    { background: '#ccfbf1', color: '#0f766e' },
    { background: '#dbeafe', color: '#1d4ed8' },
    { background: '#ede9fe', color: '#6d28d9' },
    { background: '#ffedd5', color: '#c2410c' },
    { background: '#fce7f3', color: '#be185d' },
    { background: '#dcfce7', color: '#15803d' },
  ]
  const palette = tones[hashString(seed) % tones.length]

  return {
    backgroundColor: palette.background,
    color: palette.color,
  }
}
