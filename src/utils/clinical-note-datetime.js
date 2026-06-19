import {
  formatDateUs,
  isCompleteUsDateString,
  parseUsDateString,
} from 'src/utils/client-form.js'
import {
  combineRecordedDateTime,
  formatTime12h,
  parseTime12h,
} from 'src/utils/client-vitals.js'

export function defaultClinicalNoteDateTime() {
  const now = new Date()

  return {
    date: formatDateUs(now),
    time: formatTime12h(now),
  }
}

export function isoToClinicalNoteDateTime(iso) {
  const raw = String(iso ?? '').trim()
  if (!raw) {
    return defaultClinicalNoteDateTime()
  }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return defaultClinicalNoteDateTime()
  }

  return {
    date: formatDateUs(date),
    time: formatTime12h(date),
  }
}

export function clinicalNoteDateTimeToIso(dateUs, time12h) {
  const combined = combineRecordedDateTime(dateUs, time12h)
  if (!combined) {
    return null
  }

  return combined.toISOString()
}

export function formatClinicalNoteDateTimeDisplay(iso) {
  const { date, time } = isoToClinicalNoteDateTime(iso)
  if (!date) {
    return '—'
  }
  if (!time) {
    return date
  }

  return `${date} ${time}`
}

export function normalizeClinicalNoteTime(value) {
  const parsed = parseTime12h(value)
  if (!parsed) {
    return String(value ?? '').trim()
  }

  return formatTime12h(
    new Date(2000, 0, 1, parsed.hours, parsed.minutes),
  )
}

export function isClinicalNoteDateTimeAfterNow(dateUs, time12h) {
  const combined = combineRecordedDateTime(dateUs, time12h)
  if (!combined) {
    return false
  }

  return combined.getTime() > Date.now()
}

export function isClinicalNoteDateTimeBeforeAdmission(
  dateUs,
  time12h,
  admissionDateUs,
) {
  const combined = combineRecordedDateTime(dateUs, time12h)
  const admission = parseUsDateString(admissionDateUs)
  if (!combined || !admission) {
    return false
  }
  const admissionStart = new Date(
    admission.getFullYear(),
    admission.getMonth(),
    admission.getDate(),
    0,
    0,
    0,
    0,
  )

  return combined.getTime() < admissionStart.getTime()
}

export function isValidClinicalNoteDateTime(dateUs, time12h) {
  return isCompleteUsDateString(dateUs) && Boolean(parseTime12h(time12h))
}
