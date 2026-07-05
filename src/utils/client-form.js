import {
  apiDateToDisplay,
  displayDateToApi,
  formatDisplayDate,
  getAppDateTimeConfig,
  isCompleteDisplayDateString,
  parseDisplayDate,
  sanitizeDisplayDateInput,
  startOfDay as appStartOfDay,
} from 'src/utils/app-datetime.js'

const LETTERS_RE = /^[A-Za-z\s]+$/
const SSN_PATTERN =
  /^(?!000|666|9\d\d)\d{3}-?(?!00)\d{2}-?(?!0000)\d{4}$/
const ITIN_PATTERN = /^9\d{2}-?\d{2}-?\d{4}$/

export function generateClientNumber() {
  const n = Math.floor(Math.random() * 10_000_000)

  return `MN${String(n).padStart(7, '0')}`
}

export function formatDateUs(date) {
  return formatDisplayDate(date, getAppDateTimeConfig())
}

export function todayDateUs() {
  return formatDateUs(startOfDay(new Date()))
}

export function startOfDay(date) {
  return appStartOfDay(date)
}

export function parseUsDateString(value) {
  return parseDisplayDate(value, getAppDateTimeConfig())
}

/** Calendar year from patient DOB (mm/dd/yyyy), or null if missing/invalid. */
export function birthYearFromUsDob(dobUs) {
  const d = parseUsDateString(dobUs)

  return d ? d.getFullYear() : null
}

/**
 * Birth year for validation when DOB is unknown but age + unit are set.
 * Prefers explicit DOB; otherwise infers DOB from age relative to today.
 */
export function resolvePatientBirthYear({
  dobUs,
  age,
  ageUnit,
} = {}) {
  const fromDob = birthYearFromUsDob(dobUs)
  if (fromDob != null) {
    return fromDob
  }

  const ageText = String(age ?? '').trim()
  if (!ageText) {
    return null
  }

  const inferredDob = dobUsDateFromAgeAndUnit(age, ageUnit)

  return birthYearFromUsDob(inferredDob)
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

export { daysInMonth } from 'src/utils/app-datetime.js'

/** Constrains tenant display date while typing. */
export function sanitizeUsDateInput(value, options = {}) {
  return sanitizeDisplayDateInput(value, options, getAppDateTimeConfig())
}

export function isCompleteUsDateString(value) {
  return isCompleteDisplayDateString(value, getAppDateTimeConfig())
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

/** @deprecated use normalizeSsnDigits — same behavior for SSN/ITIN field */
export const normalizeTaxIdDigits = normalizeSsnDigits

export function formatTaxIdWithDashes(digits) {
  const d = normalizeSsnDigits(digits)
  if (d.length !== 9) {
    return d
  }

  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

export function formatTaxIdInput(digits) {
  const d = normalizeSsnDigits(digits)
  if (!d.length) {
    return ''
  }
  if (d.length <= 3) {
    return d
  }
  if (d.length <= 5) {
    return `${d.slice(0, 3)}-${d.slice(3)}`
  }

  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

export function formatSsnMasked(digits) {
  const d = normalizeSsnDigits(digits)
  if (!d.length) {
    return ''
  }
  if (d.length !== 9) {
    return formatTaxIdInput(d)
  }
  const last4 = d.slice(5)

  return `###-##-${last4}`
}

/**
 * Normalizes API masked tax id (e.g. ***-**-1455) to ###-##-1455 for display.
 */
export function normalizeIdNumberMaskedDisplay(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }
  if (/[*#]/.test(raw)) {
    const digits = raw.replace(/\D/g, '')
    const last4 = digits.slice(-4)
    if (last4.length === 4) {
      return `###-##-${last4}`
    }

    return raw.replace(/\*/g, '#')
  }
  const digits = normalizeSsnDigits(raw)
  if (digits.length === 9) {
    return formatSsnMasked(digits)
  }

  return raw
}

export function hasStoredIdNumberMasked(form, fieldKeys = null) {
  const ck = fieldKeys ?? {
    idNumberMasked: 'idNumberMasked',
  }
  const masked = normalizeIdNumberMaskedDisplay(form?.[ck.idNumberMasked])

  return masked.length > 0
}

export function isValidTaxIdDigits(digits) {
  const d = normalizeSsnDigits(digits)
  if (!d) {
    return true
  }
  if (d.length !== 9) {
    return false
  }
  const formatted = formatTaxIdWithDashes(d)

  return SSN_PATTERN.test(formatted) || ITIN_PATTERN.test(formatted)
}

export function isValidSsnDigits(digits) {
  return isValidTaxIdDigits(digits)
}

/**
 * SSN block rules validated while typing (not applied to ITIN / leading 9).
 * Returns an i18n message key, or null if no block violation yet.
 */
export function getSsnBlockValidationErrorKey(digits) {
  const d = normalizeSsnDigits(digits)
  if (!d.length || d[0] === '9') {
    return null
  }
  if (d.length >= 3) {
    const area = d.slice(0, 3)
    if (area === '000') {
      return 'ssnAreaCannotBe000'
    }
    if (area === '666') {
      return 'ssnAreaCannotBe666'
    }
    const areaNum = Number(area)
    if (areaNum >= 900 && areaNum <= 999) {
      return 'ssnAreaCannotBe900To999'
    }
  }
  if (d.length >= 5) {
    const group = d.slice(3, 5)
    if (group === '00') {
      return 'ssnGroupCannotBe00'
    }
  }
  if (d.length >= 9) {
    const serial = d.slice(5, 9)
    if (serial === '0000') {
      return 'ssnSerialCannotBe0000'
    }
  }

  return null
}

/**
 * Infers SSN vs ITIN while the user types (before 9 digits are complete).
 * ITIN always starts with 9; SSN area cannot be 000, 666, or 9xx.
 */
export function detectTaxIdType(digits) {
  const d = normalizeSsnDigits(digits)
  if (!d.length) {
    return null
  }
  if (d.length === 9) {
    const formatted = formatTaxIdWithDashes(d)
    if (ITIN_PATTERN.test(formatted)) {
      return 'ITIN'
    }
    if (SSN_PATTERN.test(formatted)) {
      return 'SSN'
    }

    return null
  }
  if (d[0] === '9') {
    return 'ITIN'
  }
  if (d.length >= 3) {
    const area = d.slice(0, 3)
    if (area === '000' || area === '666') {
      return null
    }

    return 'SSN'
  }
  if (d[0] >= '1' && d[0] <= '8') {
    return 'SSN'
  }

  return null
}

export function usDateToIso(value) {
  return displayDateToApi(value, getAppDateTimeConfig())
}

/** Date (YYYY-MM-DD / ISO datetime) → tenant display format for form fields. */
export function isoDateToUsDateString(value) {
  return apiDateToDisplay(value, getAppDateTimeConfig())
}

export function snapshotAddClientForm(form) {
  return JSON.stringify(form)
}
