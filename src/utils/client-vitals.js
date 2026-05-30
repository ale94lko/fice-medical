import { clientVitalsPainLevelValues } from 'components/constants.js'
import {
  formatDateUs,
  isCompleteUsDateString,
  parseUsDateString,
} from 'src/utils/client-form.js'

export const VITALS_LIMITS = {
  systolic: { min: 1, max: 300 },
  diastolic: { min: 1, max: 200 },
  heartRate: { min: 20, max: 250 },
  respiratoryRate: { min: 5, max: 80 },
  temperature: { min: 90, max: 115 },
  oxygenSaturation: { min: 0, max: 100 },
  weight: { min: 1, max: 1500 },
  height: { min: 1, max: 120 },
  notesMaxLength: 500,
}

let vitalsIdCounter = 0

export function nextVitalsId() {
  vitalsIdCounter += 1

  return `vitals-${vitalsIdCounter}`
}

export function formatTime12h(date = new Date()) {
  const d = date instanceof Date ? date : new Date()
  if (Number.isNaN(d.getTime())) {
    return ''
  }
  let hours = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const period = hours >= 12 ? 'PM' : 'AM'
  hours %= 12
  if (hours === 0) {
    hours = 12
  }

  return `${hours}:${minutes} ${period}`
}

export function parseTime12h(value) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(
    String(value ?? '').trim(),
  )
  if (!m) {
    return null
  }
  let hours = Number(m[1])
  const minutes = Number(m[2])
  const period = m[3].toUpperCase()
  if (
    !Number.isFinite(hours)
    || !Number.isFinite(minutes)
    || minutes < 0
    || minutes > 59
  ) {
    return null
  }
  if (hours < 1 || hours > 12) {
    return null
  }
  if (period === 'PM' && hours !== 12) {
    hours += 12
  }
  if (period === 'AM' && hours === 12) {
    hours = 0
  }

  return { hours, minutes }
}

export function defaultVitalsDateTime() {
  const now = new Date()

  return {
    date: formatDateUs(now),
    time: formatTime12h(now),
  }
}

export function createEmptyVitalsDraft() {
  const { date, time } = defaultVitalsDateTime()

  return {
    systolic: '',
    diastolic: '',
    heartRate: '',
    respiratoryRate: '',
    temperature: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
    painLevel: '',
    notes: '',
    recordedDate: date,
    recordedTime: time,
    recordedBy: '',
  }
}

export function createEmptyVitalsSection() {
  return {
    entries: [],
    draft: createEmptyVitalsDraft(),
    editingId: null,
    recordExpanded: true,
    additionalInfoExpanded: true,
    historyExpanded: true,
  }
}

export function sanitizeIntegerInput(value, maxDigits = 4) {
  return String(value ?? '').replace(/\D/g, '').slice(0, maxDigits)
}

export function sanitizeDecimalInput(value, maxDigits = 5) {
  let s = String(value ?? '').replace(/[^\d.]/g, '')
  const parts = s.split('.')
  if (parts.length > 2) {
    s = `${parts[0]}.${parts.slice(1).join('')}`
  }
  if (s.includes('.')) {
    const [whole, frac = ''] = s.split('.')
    s = `${whole.slice(0, maxDigits)}.${frac.slice(0, 2)}`
  } else {
    s = s.slice(0, maxDigits)
  }

  return s
}

export function parsePositiveInt(value) {
  const s = String(value ?? '').trim()
  if (!s) {
    return null
  }
  if (!/^\d+$/.test(s)) {
    return NaN
  }
  const n = Number(s)

  return Number.isFinite(n) ? n : NaN
}

export function parseDecimal(value) {
  const s = String(value ?? '').trim()
  if (!s) {
    return null
  }
  if (!/^\d+(\.\d+)?$/.test(s)) {
    return NaN
  }
  const n = Number(s)

  return Number.isFinite(n) ? n : NaN
}

export function calculateBmiFromUs(weightLbs, heightIn) {
  const weight = parseDecimal(weightLbs)
  const height = parseDecimal(heightIn)
  if (
    weight == null
    || height == null
    || weight <= 0
    || height <= 0
  ) {
    return null
  }
  const weightKg = weight * 0.45359237
  const heightM = height * 0.0254
  const bmi = weightKg / (heightM * heightM)

  return Number.isFinite(bmi) ? Math.round(bmi * 10) / 10 : null
}

export function formatBmiDisplay(bmi) {
  if (bmi == null || !Number.isFinite(bmi)) {
    return '—'
  }

  return String(bmi)
}

export function combineRecordedDateTime(dateUs, time12h) {
  const date = parseUsDateString(dateUs)
  const time = parseTime12h(time12h)
  if (!date || !time) {
    return null
  }
  const combined = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.hours,
    time.minutes,
    0,
    0,
  )

  return combined
}

export function formatRecordedDateTimeDisplay(entry) {
  const datePart = String(entry?.recordedDate ?? '').trim()
  const timePart = String(entry?.recordedTime ?? '').trim()
  if (datePart && timePart) {
    return `${datePart} ${timePart}`
  }

  return datePart || timePart || '—'
}

export function vitalsDraftHasContent(draft) {
  if (!draft) {
    return false
  }
  const keys = [
    'systolic',
    'diastolic',
    'heartRate',
    'respiratoryRate',
    'temperature',
    'oxygenSaturation',
    'weight',
    'height',
    'painLevel',
    'notes',
    'recordedBy',
  ]

  return keys.some(key => String(draft[key] ?? '').trim() !== '')
}

function inRange(n, min, max) {
  return Number.isFinite(n) && n >= min && n <= max
}

function validateRequiredInt(value, min, max) {
  const n = parsePositiveInt(value)
  if (n == null) {
    return 'required'
  }
  if (Number.isNaN(n)) {
    return 'invalid'
  }
  if (n <= 0) {
    return 'positive'
  }
  if (!inRange(n, min, max)) {
    return 'range'
  }

  return null
}

function validateOptionalInt(value, min, max) {
  const s = String(value ?? '').trim()
  if (!s) {
    return null
  }
  const n = parsePositiveInt(value)
  if (n == null || Number.isNaN(n)) {
    return 'invalid'
  }
  if (n < 0) {
    return 'positive'
  }
  if (!inRange(n, min, max)) {
    return 'range'
  }

  return null
}

function validateRequiredDecimal(value, min, max) {
  const s = String(value ?? '').trim()
  if (!s) {
    return 'required'
  }
  const n = parseDecimal(value)
  if (n == null || Number.isNaN(n)) {
    return 'invalid'
  }
  if (n <= 0) {
    return 'positive'
  }
  if (!inRange(n, min, max)) {
    return 'range'
  }

  return null
}

function validateOptionalDecimal(value, min, max) {
  const s = String(value ?? '').trim()
  if (!s) {
    return null
  }
  const n = parseDecimal(value)
  if (n == null || Number.isNaN(n)) {
    return 'invalid'
  }
  if (n < 0) {
    return 'positive'
  }
  if (!inRange(n, min, max)) {
    return 'range'
  }

  return null
}

function validateVitalsMetaFields(draft, errors) {
  const dateStr = String(draft?.recordedDate ?? '').trim()
  if (!dateStr) {
    errors.recordedDate = 'required'
  } else if (!isCompleteUsDateString(dateStr)) {
    errors.recordedDate = 'invalid'
  } else {
    const recorded = combineRecordedDateTime(
      dateStr,
      draft?.recordedTime,
    )
    if (!recorded) {
      errors.recordedTime = 'invalid'
    } else if (recorded.getTime() > Date.now()) {
      errors.recordedDate = 'future'
    }
  }

  const timeStr = String(draft?.recordedTime ?? '').trim()
  if (!timeStr) {
    errors.recordedTime = 'required'
  } else if (!parseTime12h(timeStr)) {
    errors.recordedTime = 'invalid'
  }

  if (!String(draft?.recordedBy ?? '').trim()) {
    errors.recordedBy = 'required'
  }

  const notes = String(draft?.notes ?? '')
  if (notes.length > VITALS_LIMITS.notesMaxLength) {
    errors.notes = 'max'
  }

  const pain = String(draft?.painLevel ?? '').trim()
  if (
    pain
    && !Object.values(clientVitalsPainLevelValues).includes(pain)
  ) {
    errors.painLevel = 'invalid'
  }
}

export function validateVitalsDraft(draft) {
  const errors = {}
  const sys = validateRequiredInt(
    draft?.systolic,
    VITALS_LIMITS.systolic.min,
    VITALS_LIMITS.systolic.max,
  )
  const dia = validateRequiredInt(
    draft?.diastolic,
    VITALS_LIMITS.diastolic.min,
    VITALS_LIMITS.diastolic.max,
  )
  const hr = validateRequiredInt(
    draft?.heartRate,
    VITALS_LIMITS.heartRate.min,
    VITALS_LIMITS.heartRate.max,
  )
  const temp = validateRequiredDecimal(
    draft?.temperature,
    VITALS_LIMITS.temperature.min,
    VITALS_LIMITS.temperature.max,
  )
  const rr = validateOptionalInt(
    draft?.respiratoryRate,
    VITALS_LIMITS.respiratoryRate.min,
    VITALS_LIMITS.respiratoryRate.max,
  )
  const spo2 = validateOptionalInt(
    draft?.oxygenSaturation,
    VITALS_LIMITS.oxygenSaturation.min,
    VITALS_LIMITS.oxygenSaturation.max,
  )
  const weight = validateOptionalDecimal(
    draft?.weight,
    VITALS_LIMITS.weight.min,
    VITALS_LIMITS.weight.max,
  )
  const height = validateOptionalDecimal(
    draft?.height,
    VITALS_LIMITS.height.min,
    VITALS_LIMITS.height.max,
  )

  if (sys) {
    errors.systolic = sys
  }
  if (dia) {
    errors.diastolic = dia
  }
  if (hr) {
    errors.heartRate = hr
  }
  if (temp) {
    errors.temperature = temp
  }
  if (rr) {
    errors.respiratoryRate = rr
  }
  if (spo2) {
    errors.oxygenSaturation = spo2
  }
  if (weight) {
    errors.weight = weight
  }
  if (height) {
    errors.height = height
  }

  validateVitalsMetaFields(draft, errors)

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  }
}

export function getVitalsDraftFieldErrorKeys(section) {
  if (!vitalsDraftHasContent(section?.draft)) {
    return {}
  }
  const result = validateVitalsDraft(section.draft)

  return result.ok ? {} : result.errors
}

export function countVitalsDraftFieldErrors(section) {
  const errors = getVitalsDraftFieldErrorKeys(section)

  return Object.keys(errors).length
}

export function normalizeVitalsEntry(draft) {
  const bmi = calculateBmiFromUs(draft.weight, draft.height)

  return {
    systolic: parsePositiveInt(draft.systolic),
    diastolic: parsePositiveInt(draft.diastolic),
    heartRate: parsePositiveInt(draft.heartRate),
    respiratoryRate: parsePositiveInt(draft.respiratoryRate) ?? null,
    temperature: parseDecimal(draft.temperature),
    oxygenSaturation: parsePositiveInt(draft.oxygenSaturation) ?? null,
    weight: parseDecimal(draft.weight) ?? null,
    height: parseDecimal(draft.height) ?? null,
    bmi,
    painLevel: String(draft.painLevel ?? '').trim() || null,
    notes: String(draft.notes ?? '').trim(),
    recordedDate: String(draft.recordedDate ?? '').trim(),
    recordedTime: String(draft.recordedTime ?? '').trim(),
    recordedBy: String(draft.recordedBy ?? '').trim(),
  }
}

export function draftFromVitalsEntry(entry) {
  return {
    systolic: entry?.systolic != null ? String(entry.systolic) : '',
    diastolic: entry?.diastolic != null ? String(entry.diastolic) : '',
    heartRate: entry?.heartRate != null ? String(entry.heartRate) : '',
    respiratoryRate:
      entry?.respiratoryRate != null
        ? String(entry.respiratoryRate)
        : '',
    temperature:
      entry?.temperature != null ? String(entry.temperature) : '',
    oxygenSaturation:
      entry?.oxygenSaturation != null
        ? String(entry.oxygenSaturation)
        : '',
    weight: entry?.weight != null ? String(entry.weight) : '',
    height: entry?.height != null ? String(entry.height) : '',
    painLevel: entry?.painLevel ?? '',
    notes: entry?.notes ?? '',
    recordedDate: entry?.recordedDate ?? '',
    recordedTime: entry?.recordedTime ?? '',
    recordedBy: entry?.recordedBy ?? '',
  }
}

export function sortVitalsEntriesDesc(entries) {
  return [...(entries ?? [])].sort((a, b) => {
    const da = combineRecordedDateTime(
      a.recordedDate,
      a.recordedTime,
    )
    const db = combineRecordedDateTime(
      b.recordedDate,
      b.recordedTime,
    )
    const ta = da?.getTime() ?? 0
    const tb = db?.getTime() ?? 0

    return tb - ta
  })
}

export function painLevelLabel(value, t) {
  const map = {
    [clientVitalsPainLevelValues.mild]: t('vitalsPainMild'),
    [clientVitalsPainLevelValues.moderate]: t('vitalsPainModerate'),
    [clientVitalsPainLevelValues.severe]: t('vitalsPainSevere'),
  }

  return map[value] ?? '—'
}
