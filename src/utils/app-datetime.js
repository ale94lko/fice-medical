/* eslint-disable camelcase -- API config_data field names */
const DEFAULT_CONFIG = {
  timezone: 'UTC',
  locale: 'en_US',
  date_format: 'MM/DD/YYYY',
}

const SUPPORTED_DATE_FORMATS = [
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'YYYY-MM-DD',
  'YYYY/MM/DD',
]

let runtimeConfig = { ...DEFAULT_CONFIG }

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function normalizeAppDateTimeConfig(config = {}) {
  const rawFormat = String(
    config.date_format ?? config.dateFormat ?? DEFAULT_CONFIG.date_format,
  ).trim().toUpperCase()

  return {
    timezone: String(config.timezone ?? DEFAULT_CONFIG.timezone).trim()
      || DEFAULT_CONFIG.timezone,
    locale: String(config.locale ?? DEFAULT_CONFIG.locale).trim()
      || DEFAULT_CONFIG.locale,
    date_format: SUPPORTED_DATE_FORMATS.includes(rawFormat)
      ? rawFormat
      : DEFAULT_CONFIG.date_format,
  }
}

export function setAppDateTimeConfig(config) {
  if (!config) {
    runtimeConfig = { ...DEFAULT_CONFIG }

    return
  }
  runtimeConfig = normalizeAppDateTimeConfig(config)
}

export function getAppDateTimeConfig() {
  return { ...runtimeConfig }
}

export function resolveIntlLocale(locale = runtimeConfig.locale) {
  return String(locale ?? DEFAULT_CONFIG.locale).replace(/_/g, '-')
}

/** Maps login offsets like UTC-08:00 to an IANA zone for Intl. */
export function resolveIntlTimeZone(timezone = runtimeConfig.timezone) {
  const raw = String(timezone ?? DEFAULT_CONFIG.timezone).trim()
  const offsetMatch = /^UTC([+-])(\d{1,2})(?::(\d{2}))?$/i.exec(raw)
  if (offsetMatch) {
    const sign = offsetMatch[1] === '-' ? '+' : '-'
    const hours = Number(offsetMatch[2])
    if (!Number.isFinite(hours) || hours === 0) {
      return 'UTC'
    }

    return `Etc/GMT${sign}${hours}`
  }

  return raw.replace(/_/g, '/')
}

/**
 * Minutes east of UTC for login offsets like UTC-08:00 (-480).
 * Returns null when the timezone is not an offset string.
 */
export function parseUtcOffsetMinutes(timezone = runtimeConfig.timezone) {
  const raw = String(timezone ?? DEFAULT_CONFIG.timezone).trim()
  const offsetMatch = /^UTC([+-])(\d{1,2})(?::(\d{2}))?$/i.exec(raw)
  if (!offsetMatch) {
    return null
  }

  const sign = offsetMatch[1] === '+' ? 1 : -1
  const hours = Number(offsetMatch[2])
  const minutes = Number(offsetMatch[3] ?? 0)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null
  }

  return sign * (hours * 60 + minutes)
}

/** Wall-clock minutes since midnight for login UTC±HH:MM timezones. */
export function localWallClockMinutesNow(
  timezone = runtimeConfig.timezone,
  now = new Date(),
) {
  const offsetMinutes = parseUtcOffsetMinutes(timezone)
  if (offsetMinutes == null) {
    return null
  }

  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
  const dayMinutes = 24 * 60
  const localMinutes = utcMinutes + offsetMinutes

  return ((localMinutes % dayMinutes) + dayMinutes) % dayMinutes
}

/** YYYY-MM-DD in a login UTC±HH:MM timezone. */
export function localDayKeyFromLoginOffset(
  iso,
  timezone = runtimeConfig.timezone,
) {
  const offsetMinutes = parseUtcOffsetMinutes(timezone)
  if (offsetMinutes == null) {
    return null
  }

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  const localMs = date.getTime() + offsetMinutes * 60 * 1000
  const local = new Date(localMs)
  const year = local.getUTCFullYear()
  const month = String(local.getUTCMonth() + 1).padStart(2, '0')
  const day = String(local.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function dateFormatSeparator(format) {
  if (format.includes('/')) {
    return '/'
  }
  if (format.includes('-')) {
    return '-'
  }
  if (format.includes('.')) {
    return '.'
  }

  return '/'
}

function displayDateRegex(format) {
  const sep = escapeRegex(dateFormatSeparator(format))
  const pattern = format
    .replace(/YYYY/g, '(\\d{4})')
    .replace(/MM/g, '(\\d{2})')
    .replace(/DD/g, '(\\d{2})')
    .replace(/\//g, sep)
    .replace(/-/g, sep)

  return new RegExp(`^${pattern}$`)
}

function datePartsFromDisplayMatch(format, match) {
  const tokens = format.split(/[^A-Z]+/).filter(Boolean)
  const parts = { year: NaN, month: NaN, day: NaN }
  tokens.forEach((token, index) => {
    const value = Number(match[index + 1])
    if (token === 'MM') {
      parts.month = value - 1
    } else if (token === 'DD') {
      parts.day = value
    } else if (token === 'YYYY') {
      parts.year = value
    }
  })

  return parts
}

function calendarDateFromParts(parts) {
  const { year, month, day } = parts
  const hasValidParts = Number.isFinite(year)
    && Number.isFinite(month)
    && Number.isFinite(day)
  if (!hasValidParts) {
    return null
  }
  const date = new Date(year, month, day)
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month
    || date.getDate() !== day
  ) {
    return null
  }

  return date
}

export function parseApiDateOnly(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return null
  }
  const datePart = raw.includes('T') ? raw.split('T')[0] : raw.slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart)
  if (!match) {
    return null
  }

  return calendarDateFromParts({
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
  })
}

export function parseDisplayDate(
  value,
  config = getAppDateTimeConfig(),
) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return null
  }
  const format = config.date_format
  const match = displayDateRegex(format).exec(raw)
  if (match) {
    return calendarDateFromParts(datePartsFromDisplayMatch(format, match))
  }

  return parseApiDateOnly(raw)
}

export function formatApiDateOnly(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return ''
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function formatDisplayDate(
  date,
  config = getAppDateTimeConfig(),
) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return ''
  }
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = String(date.getFullYear())

  return config.date_format
    .replace(/YYYY/g, year)
    .replace(/MM/g, month)
    .replace(/DD/g, day)
}

/** Display date (tenant format) → API date-only YYYY-MM-DD. */
export function displayDateToApi(
  value,
  config = getAppDateTimeConfig(),
) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) {
    return ''
  }
  const parsed = parseDisplayDate(trimmed, config)
  if (parsed) {
    return formatApiDateOnly(parsed)
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  return ''
}

/** API date-only or datetime → display date (tenant format). */
export function apiDateToDisplay(
  value,
  config = getAppDateTimeConfig(),
) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }
  const parsed = parseApiDateOnly(raw)
  if (parsed) {
    return formatDisplayDate(parsed, config)
  }
  if (parseDisplayDate(raw, config)) {
    return raw
  }

  return ''
}

export function isCompleteDisplayDateString(
  value,
  config = getAppDateTimeConfig(),
) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return false
  }

  return displayDateRegex(config.date_format).test(raw)
}

function clampMonthDigits(digits) {
  if (!digits.length) {
    return ''
  }
  if (digits.length === 1) {
    const value = Number(digits)

    return value > 1 ? `0${value}` : digits
  }
  let month = Number(digits.slice(0, 2))
  if (month < 1) {
    month = 1
  }
  if (month > 12) {
    month = 12
  }

  return String(month).padStart(2, '0')
}

function clampDayDigits(digits, month, year) {
  if (!digits.length) {
    return ''
  }
  const maxDay = daysInMonth(month, year)
  if (digits.length === 1) {
    const value = Number(digits)

    return value > 3 ? `0${value}` : digits
  }
  let day = Number(digits.slice(0, 2))
  if (day < 1) {
    day = 1
  }
  if (day > maxDay) {
    day = maxDay
  }

  return String(day).padStart(2, '0')
}

function clampYearDigits(digits, minYear, maxYear) {
  if (!digits.length) {
    return ''
  }
  if (digits.length < 4) {
    return digits
  }
  let year = Number(digits.slice(0, 4))
  if (!Number.isFinite(year)) {
    return digits.slice(0, 4)
  }
  if (year < minYear) {
    year = minYear
  }
  if (year > maxYear) {
    year = maxYear
  }

  return String(year)
}

export function daysInMonth(month, year) {
  const monthNumber = Number(month)
  const yearNumber = Number(year)
  if (!Number.isFinite(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return 31
  }
  if (!Number.isFinite(yearNumber) || yearNumber < 1) {
    return 31
  }

  return new Date(yearNumber, monthNumber, 0).getDate()
}

function joinDisplayDateParts(parts, format) {
  const month = parts.month ?? ''
  const day = parts.day ?? ''
  const year = parts.year ?? ''
  const separator = dateFormatSeparator(format)
  const tokens = format.split(/[^A-Z]+/).filter(Boolean)

  return tokens.map(token => {
    if (token === 'MM') {
      return month
    }
    if (token === 'DD') {
      return day
    }

    return year
  }).join(separator)
}

function sanitizeMonthFirstDisplayDate(
  digits,
  format,
  { minYear, maxYear, currentYear },
) {
  const separator = dateFormatSeparator(format)
  const month = clampMonthDigits(digits.slice(0, 2))
  const monthNumber = Number(month) || 1
  if (digits.length <= 2) {
    return digits.length === 2 ? `${month}${separator}` : month
  }
  const yearForDay = digits.length >= 8
    ? Number(clampYearDigits(digits.slice(4, 8), minYear, maxYear))
    : currentYear
  const day = clampDayDigits(digits.slice(2, 4), monthNumber, yearForDay)
  if (digits.length <= 4) {
    return digits.length === 4
      ? `${month}${separator}${day}${separator}`
      : `${month}${separator}${day}`
  }
  const year = clampYearDigits(digits.slice(4, 8), minYear, maxYear)

  return joinDisplayDateParts({ month, day, year }, format)
}

function sanitizeDayFirstDisplayDate(
  digits,
  format,
  { minYear, maxYear, currentYear },
) {
  const separator = dateFormatSeparator(format)
  const day = clampDayDigits(
    digits.slice(0, 2),
    Number(digits.slice(2, 4)) || 1,
    currentYear,
  )
  if (digits.length <= 2) {
    return digits.length === 2 ? `${day}${separator}` : day
  }
  const month = clampMonthDigits(digits.slice(2, 4))
  const monthNumber = Number(month) || 1
  if (digits.length <= 4) {
    return digits.length === 4
      ? `${day}${separator}${month}${separator}`
      : `${day}${separator}${month}`
  }
  const yearForDay = digits.length >= 8
    ? Number(clampYearDigits(digits.slice(4, 8), minYear, maxYear))
    : currentYear
  const clampedDay = clampDayDigits(digits.slice(0, 2), monthNumber, yearForDay)
  const year = clampYearDigits(digits.slice(4, 8), minYear, maxYear)

  return joinDisplayDateParts({
    month,
    day: clampedDay,
    year,
  }, format)
}

function sanitizeYearFirstDisplayDate(
  digits,
  format,
  { minYear, maxYear, currentYear },
) {
  const separator = dateFormatSeparator(format)
  let year = clampYearDigits(digits.slice(0, 4), minYear, maxYear)
  if (digits.length <= 4) {
    return digits.length === 4 ? `${year}${separator}` : year
  }
  const month = clampMonthDigits(digits.slice(4, 6))
  const monthNumber = Number(month) || 1
  if (digits.length <= 6) {
    return digits.length === 6
      ? `${year}${separator}${month}${separator}`
      : `${year}${separator}${month}`
  }
  const yearForDay = digits.length >= 8
    ? Number(clampYearDigits(digits.slice(0, 4), minYear, maxYear))
    : currentYear
  const day = clampDayDigits(digits.slice(6, 8), monthNumber, yearForDay)
  year = clampYearDigits(digits.slice(0, 4), minYear, maxYear)

  return joinDisplayDateParts({ month, day, year }, format)
}

function incompleteDisplayDatePrefix(result, format) {
  const separator = dateFormatSeparator(format)
  const tokens = format.split(/[^A-Z]+/).filter(Boolean)
  const parts = result.split(separator)
  if (tokens[0] === 'YYYY') {
    return `${parts[0] ?? ''}${separator}${parts[1] ?? ''}${separator}`
  }
  if (tokens[0] === 'DD') {
    return `${parts[0] ?? ''}${separator}${parts[1] ?? ''}${separator}`
  }

  return `${parts[0] ?? ''}${separator}${parts[1] ?? ''}${separator}`
}

function sanitizeDisplayDateByFormat(value, format, options = {}) {
  const { maxToday = false, minYear: minYearOpt } = options
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 8)
  if (!digits.length) {
    return ''
  }

  const currentYear = new Date().getFullYear()
  const minYear = minYearOpt ?? (maxToday ? currentYear - 125 : 1900)
  const maxYear = maxToday ? currentYear : currentYear + 50
  const tokens = format.split(/[^A-Z]+/).filter(Boolean)
  const sanitizeOptions = { minYear, maxYear, maxToday, currentYear }
  let result = ''
  if (tokens[0] === 'YYYY') {
    result = sanitizeYearFirstDisplayDate(digits, format, sanitizeOptions)
  } else if (tokens[0] === 'DD') {
    result = sanitizeDayFirstDisplayDate(digits, format, sanitizeOptions)
  } else {
    result = sanitizeMonthFirstDisplayDate(digits, format, sanitizeOptions)
  }

  if (!isCompleteDisplayDateString(result, { date_format: format })) {
    return incompleteDisplayDatePrefix(result, format)
  }

  const parsed = parseDisplayDate(result, { date_format: format })
  if (!parsed) {
    return incompleteDisplayDatePrefix(result, format)
  }
  if (maxToday && parsed.getTime() > startOfDay(new Date()).getTime()) {
    return formatDisplayDate(startOfDay(new Date()), { date_format: format })
  }

  return result
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function sanitizeDisplayDateInput(
  value,
  options = {},
  config = getAppDateTimeConfig(),
) {
  return sanitizeDisplayDateByFormat(
    value,
    config.date_format,
    options,
  )
}

export function displayDateMask(config = getAppDateTimeConfig()) {
  return config.date_format
    .replace(/YYYY/g, '####')
    .replace(/MM/g, '##')
    .replace(/DD/g, '##')
}

export function displayDatePlaceholder(config = getAppDateTimeConfig()) {
  return config.date_format.toLowerCase()
}

export function quasarDatePickerMask(config = getAppDateTimeConfig()) {
  return config.date_format.replace(/-/g, '/')
}

export function parseApiDateTime(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return null
  }
  const date = new Date(raw)

  return Number.isNaN(date.getTime()) ? null : date
}

/** Local display datetime or Date → API ISO 8601 UTC. */
export function displayDateTimeToApi(
  value,
  config = getAppDateTimeConfig(),
) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }
  if (/^\d{4}-\d{2}-\d{2}T.+Z$/i.test(raw)) {
    return raw
  }
  const parsed = parseApiDateTime(raw)
  if (parsed) {
    return parsed.toISOString()
  }
  const dateOnly = parseDisplayDate(raw, config)
  if (dateOnly) {
    return utcIsoForLocalDayStart(dateOnly, config.timezone)
  }

  return ''
}

export function apiDateTimeToIso(value) {
  const parsed = parseApiDateTime(value)

  return parsed ? parsed.toISOString() : ''
}

export function apiDateTimeToDisplay(
  value,
  config = getAppDateTimeConfig(),
) {
  const parsed = parseApiDateTime(value)
  if (!parsed) {
    return ''
  }
  const timeZone = resolveIntlTimeZone(config.timezone)
  const locale = resolveIntlLocale(config.locale)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(parsed)
  const year = Number(parts.find(part => part.type === 'year')?.value)
  const month = Number(parts.find(part => part.type === 'month')?.value) - 1
  const day = Number(parts.find(part => part.type === 'day')?.value)
  const datePart = formatDisplayDate(new Date(year, month, day), config)
  const timePart = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(parsed)

  return timePart ? `${datePart} ${timePart}` : datePart
}

function getTimeZoneOffsetMs(date, timeZone) {
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const local = new Date(date.toLocaleString('en-US', { timeZone }))

  return utc.getTime() - local.getTime()
}

function utcIsoForLocalDayStart(localDate, timezone) {
  const year = localDate.getFullYear()
  const month = localDate.getMonth()
  const day = localDate.getDate()
  const noonUtc = new Date(Date.UTC(year, month, day, 12))
  const timeZone = resolveIntlTimeZone(timezone)
  const offsetMs = getTimeZoneOffsetMs(noonUtc, timeZone)
  const startLocalAsUtc = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
  const fromUtc = new Date(startLocalAsUtc.getTime() + offsetMs)

  return fromUtc.toISOString()
}
