const US_DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/
const LETTERS_RE = /^[A-Za-z\s]+$/
const SSN_DIGITS_RE = /^\d{9}$/

export function generateClientNumber() {
  const n = Math.floor(Math.random() * 10_000_000)

  return `MN${String(n).padStart(7, '0')}`
}

export function formatDateUs(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return ''
  }
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yyyy = String(date.getFullYear())

  return `${mm}/${dd}/${yyyy}`
}

export function todayDateUs() {
  return formatDateUs(startOfDay(new Date()))
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function parseUsDateString(value) {
  const m = US_DATE_RE.exec(String(value ?? '').trim())
  if (!m) {
    return null
  }
  const month = Number(m[1]) - 1
  const day = Number(m[2])
  const year = Number(m[3])
  const d = new Date(year, month, day)
  if (
    d.getFullYear() !== year
    || d.getMonth() !== month
    || d.getDate() !== day
  ) {
    return null
  }

  return d
}

export function fullYearsBetween(dob, today) {
  let age = today.getFullYear() - dob.getFullYear()
  const monthDelta = today.getMonth() - dob.getMonth()
  if (
    monthDelta < 0
    || (monthDelta === 0 && today.getDate() < dob.getDate())
  ) {
    age -= 1
  }

  return Math.max(0, age)
}

export function fullMonthsBetween(dob, today) {
  let months = (today.getFullYear() - dob.getFullYear()) * 12
    + (today.getMonth() - dob.getMonth())
  if (today.getDate() < dob.getDate()) {
    months -= 1
  }

  return Math.max(0, months)
}

export function calendarDaysBetween(dob, today) {
  const msPerDay = 24 * 60 * 60 * 1000

  return Math.floor((today.getTime() - dob.getTime()) / msPerDay)
}

/** Inclusive upper bound for expressing age in months (2 full years). */
export const maxMonthsForMonthsAgeUnit = 24

/**
 * Age + unit from DOB:
 * - days: under 1 full month
 * - months: 1+ full months through 24 full months (≤ 2 years)
 * - years: over 24 full months
 */
export function ageAndUnitFromUsDateString(value) {
  const dob = parseUsDateString(value)
  if (!dob) {
    return null
  }
  const today = startOfDay(new Date())
  const years = fullYearsBetween(dob, today)
  const months = fullMonthsBetween(dob, today)
  if (months > maxMonthsForMonthsAgeUnit) {
    return {
      age: Math.min(125, years),
      unit: 'years',
    }
  }
  if (months >= 1) {
    return { age: months, unit: 'months' }
  }
  const days = calendarDaysBetween(dob, today)

  return { age: Math.max(0, days), unit: 'days' }
}

export function ageFromUsDateString(value) {
  const result = ageAndUnitFromUsDateString(value)
  if (!result) {
    return null
  }

  return result.unit === 'years' ? result.age : 0
}

export function normalizeAgeUnitKind(unitCode) {
  const u = String(unitCode ?? '').trim().toLowerCase()
  if (u.includes('day')) {
    return 'days'
  }
  if (u.includes('month')) {
    return 'months'
  }

  return 'years'
}

export function maxAgeForUnit(unitCode) {
  const kind = normalizeAgeUnitKind(unitCode)
  if (kind === 'days') {
    return 31
  }
  if (kind === 'months') {
    return 24
  }

  return 125
}

/** DOB (mm/dd/yyyy) from age + unit, relative to today. */
export function dobUsDateFromAgeAndUnit(
  ageValue,
  unitCode,
  today = new Date(),
) {
  const age = Number(ageValue)
  if (!Number.isFinite(age) || age < 0) {
    return null
  }
  const ref = startOfDay(today)
  const kind = normalizeAgeUnitKind(unitCode)
  const dob = new Date(ref)
  const n = Math.floor(age)
  if (kind === 'days') {
    dob.setDate(dob.getDate() - n)
  } else if (kind === 'months') {
    dob.setMonth(dob.getMonth() - n)
  } else {
    dob.setFullYear(dob.getFullYear() - n)
  }

  return formatDateUs(startOfDay(dob))
}

export function isAdmissionDateValid(value) {
  const d = parseUsDateString(value)
  if (!d) {
    return false
  }

  return d.getTime() <= startOfDay(new Date()).getTime()
}

export function daysInMonth(month, year) {
  const m = Number(month)
  const y = Number(year)
  if (!Number.isFinite(m) || m < 1 || m > 12) {
    return 31
  }
  if (!Number.isFinite(y) || y < 1) {
    return 31
  }

  return new Date(y, m, 0).getDate()
}

function clampMonthDigits(digits) {
  if (!digits.length) {
    return ''
  }
  if (digits.length === 1) {
    const n = Number(digits)

    return n > 1 ? `0${n}` : digits
  }
  let m = Number(digits.slice(0, 2))
  if (m < 1) {
    m = 1
  }
  if (m > 12) {
    m = 12
  }

  return String(m).padStart(2, '0')
}

function clampDayDigits(digits, month, year) {
  if (!digits.length) {
    return ''
  }
  const maxDay = daysInMonth(month, year)
  if (digits.length === 1) {
    const n = Number(digits)

    return n > 3 ? `0${n}` : digits
  }
  let d = Number(digits.slice(0, 2))
  if (d < 1) {
    d = 1
  }
  if (d > maxDay) {
    d = maxDay
  }

  return String(d).padStart(2, '0')
}

function clampYearDigits(digits, minYear, maxYear) {
  if (!digits.length) {
    return ''
  }
  if (digits.length < 4) {
    return digits
  }
  let y = Number(digits.slice(0, 4))
  if (!Number.isFinite(y)) {
    return digits.slice(0, 4)
  }
  if (y < minYear) {
    y = minYear
  }
  if (y > maxYear) {
    y = maxYear
  }

  return String(y)
}

/** Constrains mm/dd/yyyy while typing; blocks invalid calendar dates. */
export function sanitizeUsDateInput(value, options = {}) {
  const { maxToday = false, minYear: minYearOpt } = options
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 8)
  if (!digits.length) {
    return ''
  }

  const currentYear = new Date().getFullYear()
  const minYear = minYearOpt ?? (maxToday ? currentYear - 125 : 1900)
  const maxYear = maxToday ? currentYear : currentYear + 50

  const mm = clampMonthDigits(digits.slice(0, 2))
  const monthNum = Number(mm) || 1

  if (digits.length <= 2) {
    return digits.length === 2 ? `${mm}/` : mm
  }

  const yearForDay = digits.length >= 8
    ? Number(clampYearDigits(digits.slice(4, 8), minYear, maxYear))
    : currentYear
  const dd = clampDayDigits(digits.slice(2, 4), monthNum, yearForDay)

  if (digits.length <= 4) {
    return digits.length === 4 ? `${mm}/${dd}/` : `${mm}/${dd}`
  }

  const yyyy = clampYearDigits(digits.slice(4, 8), minYear, maxYear)
  const result = `${mm}/${dd}/${yyyy}`

  if (result.length !== 10) {
    return result
  }

  const parsed = parseUsDateString(result)
  if (!parsed) {
    return `${mm}/${dd}/`
  }
  if (maxToday && parsed.getTime() > startOfDay(new Date()).getTime()) {
    return todayDateUs()
  }

  return result
}

export function isCompleteUsDateString(value) {
  return US_DATE_RE.test(String(value ?? '').trim())
}

export function isLettersOnly(value, maxLen) {
  const s = String(value ?? '').trim()
  if (!s) {
    return true
  }

  return LETTERS_RE.test(s) && s.length <= maxLen
}

/** Strips non-letters (A–Z, spaces) and caps length while typing. */
export function sanitizeLettersOnlyInput(value, maxLen) {
  const limit = Number(maxLen)
  const safeMax = Number.isFinite(limit) && limit > 0 ? limit : 30

  return String(value ?? '')
    .replace(/[^A-Za-z\s]/g, '')
    .slice(0, safeMax)
}

export function normalizeSsnDigits(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 9)
}

export function formatSsnMasked(digits) {
  const d = normalizeSsnDigits(digits)
  if (d.length <= 4) {
    return d
  }
  const last4 = d.slice(-4)

  return `***-**-${last4}`
}

export function isValidSsnDigits(digits) {
  const d = normalizeSsnDigits(digits)
  if (!d) {
    return true
  }

  return SSN_DIGITS_RE.test(d)
}

export function usDateToIso(value) {
  const d = parseUsDateString(value)

  if (!d) {
    return ''
  }
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${y}-${m}-${day}`
}

/** ISO date or datetime → mm/dd/yyyy for form fields. */
export function isoDateToUsDateString(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }
  if (US_DATE_RE.test(raw)) {
    return raw
  }
  const datePart = raw.includes('T') ? raw.split('T')[0] : raw.slice(0, 10)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart)
  if (!m) {
    return ''
  }

  return `${m[2]}/${m[3]}/${m[1]}`
}

export function snapshotAddClientForm(form) {
  return JSON.stringify(form)
}
