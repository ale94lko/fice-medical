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

export function ageFromUsDateString(value) {
  const dob = parseUsDateString(value)
  if (!dob) {
    return null
  }
  const today = startOfDay(new Date())
  let age = today.getFullYear() - dob.getFullYear()
  const monthDelta = today.getMonth() - dob.getMonth()
  if (
    monthDelta < 0
    || (monthDelta === 0 && today.getDate() < dob.getDate())
  ) {
    age -= 1
  }

  return Math.max(0, Math.min(125, age))
}

export function isAdmissionDateValid(value) {
  const d = parseUsDateString(value)
  if (!d) {
    return false
  }

  return d.getTime() <= startOfDay(new Date()).getTime()
}

export function isLettersOnly(value, maxLen) {
  const s = String(value ?? '').trim()
  if (!s) {
    return true
  }

  return LETTERS_RE.test(s) && s.length <= maxLen
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

export function snapshotAddClientForm(form) {
  return JSON.stringify(form)
}
