import { clientVitalsPainLevelValues } from 'components/constants.js'
import { calculateBmiFromUs } from 'src/utils/bmi-us.js'
import {
  formatDateUs,
  fullMonthsBetween,
  fullYearsBetween,
  isCompleteUsDateString,
  normalizeAgeUnitKind,
  parseUsDateString,
  startOfDay,
} from 'src/utils/client-form.js'

export {
  calculateBmiFromUs,
  formatBmiDisplay,
} from 'src/utils/bmi-us.js'

export const VITALS_LIMITS = {
  systolic: { min: 1, max: 300 },
  diastolic: { min: 1, max: 180 },
  heartRate: { min: 30, max: 250 },
  respiratoryRate: { min: 0, max: 120 },
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
    heightFeet: '',
    heightInches: '',
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
  }
}

export function sanitizeIntegerInput(value, maxDigits = 4) {
  return String(value ?? '').replace(/\D/g, '').slice(0, maxDigits)
}

export function sanitizeOxygenSaturationInput(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  let result = ''
  for (const ch of digits) {
    const next = `${result}${ch}`
    if (next.length > 3 || Number(next) > 100) {
      break
    }
    result = next
  }

  return result
}

export function wouldOxygenSaturationAcceptDigit(current, digit, selection) {
  if (!/^\d$/.test(String(digit))) {
    return false
  }
  const value = String(current ?? '')
  const start = selection?.start ?? value.length
  const end = selection?.end ?? value.length
  const next = `${value.slice(0, start)}${digit}${value.slice(end)}`
  if (!/^\d*$/.test(next) || next.length > 3) {
    return false
  }

  return Number(next) <= 100
}

export function sanitizeCappedIntegerInput(value, max) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!Number.isFinite(max) || max < 0) {
    return ''
  }
  let result = ''
  for (const ch of digits) {
    const next = `${result}${ch}`
    if (Number(next) > max) {
      break
    }
    result = next
  }

  return result
}

export function getDiastolicInputMax(systolic) {
  let max = VITALS_LIMITS.diastolic.max
  const sys = parsePositiveInt(systolic)
  if (sys != null && !Number.isNaN(sys) && sys > 1) {
    max = Math.min(max, sys - 1)
  }

  return max
}

export function sanitizeBpSystolicInput(value) {
  return sanitizeCappedIntegerInput(value, VITALS_LIMITS.systolic.max)
}

export function sanitizeBpDiastolicInput(value, systolic) {
  return sanitizeCappedIntegerInput(value, getDiastolicInputMax(systolic))
}

export function wouldBpAcceptDigit(current, digit, selection, max) {
  if (!/^\d$/.test(String(digit))) {
    return false
  }
  if (!Number.isFinite(max) || max < 0) {
    return false
  }
  const value = String(current ?? '')
  const start = selection?.start ?? value.length
  const end = selection?.end ?? value.length
  const next = `${value.slice(0, start)}${digit}${value.slice(end)}`
  if (!/^\d*$/.test(next)) {
    return false
  }

  return Number(next) <= max
}

export function sanitizeTemperatureInput(
  value,
  max = VITALS_LIMITS.temperature.max,
) {
  const raw = String(value ?? '').replace(/[^\d.]/g, '')
  let result = ''
  for (const ch of raw) {
    if (ch === '.') {
      if (!result || result.includes('.')) {
        continue
      }
      result += ch
      continue
    }
    const next = `${result}${ch}`
    const [whole, frac = ''] = next.split('.')
    if (whole.length > 3 || frac.length > 1) {
      break
    }
    const numeric = next.endsWith('.') ? Number(whole) : Number(next)
    if (Number.isFinite(numeric) && numeric > max) {
      break
    }
    result = next
  }

  return result
}

export function wouldTemperatureAcceptChar(current, char, selection) {
  if (!/^[\d.]$/.test(String(char))) {
    return false
  }
  const value = String(current ?? '')
  const start = selection?.start ?? value.length
  const end = selection?.end ?? value.length
  const next = `${value.slice(0, start)}${char}${value.slice(end)}`
  if (next.endsWith('.') && (next.match(/\./g) || []).length === 1) {
    const whole = next.slice(0, -1)
    if (!/^\d+$/.test(whole)) {
      return false
    }

    return Number(whole) <= VITALS_LIMITS.temperature.max
  }

  return sanitizeTemperatureInput(next) === next
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

export function combineFeetInchesToTotal(feetVal, inchesVal) {
  const feetStr = String(feetVal ?? '').trim()
  const inchesStr = String(inchesVal ?? '').trim()
  if (!feetStr && !inchesStr) {
    return null
  }
  const feet = feetStr ? parsePositiveInt(feetStr) : 0
  const inches = inchesStr ? parsePositiveInt(inchesStr) : 0
  if (
    feet == null
    || Number.isNaN(feet)
    || inches == null
    || Number.isNaN(inches)
  ) {
    return NaN
  }
  if (feet < 0 || inches < 0 || inches >= 12) {
    return NaN
  }

  return feet * 12 + inches
}

export function splitInchesToFeetParts(totalInches) {
  const n = parseDecimal(totalInches)
  if (n == null || Number.isNaN(n) || n <= 0) {
    return { feet: '', inches: '' }
  }
  const rounded = Math.round(n)
  let feet = Math.floor(rounded / 12)
  let inches = rounded % 12
  if (inches >= 12) {
    feet += 1
    inches = 0
  }

  return {
    feet: String(feet),
    inches: String(inches),
  }
}

export function formatHeightFtIn(totalInches) {
  const n = Number(totalInches)
  if (!Number.isFinite(n) || n <= 0) {
    return '—'
  }
  const { feet, inches } = splitInchesToFeetParts(n)
  if (!feet && !inches) {
    return '—'
  }

  return `${feet || '0'}'${inches || '0'}"`
}

export function draftHeightToInches(draft) {
  return combineFeetInchesToTotal(
    draft?.heightFeet,
    draft?.heightInches,
  )
}

/**
 * SpO2 bands from pulse-oximeter chart (non-overlapping).
 * 95–100 normal, 91–94 concerning, 86–90 low,
 * 80–85 brain effects, ≤79 cyanosis.
 */
export function resolveOxygenSaturationLevel(value) {
  const n = parsePositiveInt(value)
  if (n == null || Number.isNaN(n)) {
    return null
  }
  if (n > 100) {
    return null
  }
  if (n >= 95) {
    return {
      modifier: 'normal',
      labelKey: 'vitalsSpo2Normal',
    }
  }
  if (n >= 91) {
    return {
      modifier: 'concerning',
      labelKey: 'vitalsSpo2Concerning',
    }
  }
  if (n >= 86) {
    return {
      modifier: 'low',
      labelKey: 'vitalsSpo2Low',
    }
  }
  if (n >= 80) {
    return {
      modifier: 'brain',
      labelKey: 'vitalsSpo2Brain',
    }
  }

  return {
    modifier: 'cyanosis',
    labelKey: 'vitalsSpo2Cyanosis',
  }
}

/**
 * Body temperature bands (°F) from clinical thermometer chart.
 * >107.6 death, 105.8–107.6 hyperthermia, 100.4–105.8 fever,
 * 96.8–100.4 normal, <96.8 hypothermia.
 */
export function resolveTemperatureLevel(value) {
  const raw = String(value ?? '').trim().replace(/\.$/, '')
  const n = parseDecimal(raw)
  if (n == null || Number.isNaN(n)) {
    return null
  }
  if (n > 107.6) {
    return {
      modifier: 'death',
      labelKey: 'vitalsTempDeath',
    }
  }
  if (n >= 105.8) {
    return {
      modifier: 'hyperthermia',
      labelKey: 'vitalsTempHyperthermia',
    }
  }
  if (n >= 100.4) {
    return {
      modifier: 'fever',
      labelKey: 'vitalsTempFever',
    }
  }
  if (n >= 96.8) {
    return {
      modifier: 'average',
      labelKey: 'vitalsTempNormal',
    }
  }

  return {
    modifier: 'hypothermia',
    labelKey: 'vitalsTempHypothermia',
  }
}

/**
 * Adult BP categories (ACC/AHA chart) plus hypotension.
 * Hypotension: systolic < 90 or diastolic < 60.
 * Evaluated after hypertensive stages so high readings win.
 */
export function resolveBloodPressureLevel(systolic, diastolic) {
  const sys = parsePositiveInt(systolic)
  const dia = parsePositiveInt(diastolic)
  if (
    sys == null
    || dia == null
    || Number.isNaN(sys)
    || Number.isNaN(dia)
  ) {
    return null
  }
  if (sys > 180 || dia > 120) {
    return {
      modifier: 'bp-crisis',
      labelKey: 'vitalsBpCrisis',
    }
  }
  if (sys >= 140 || dia >= 90) {
    return {
      modifier: 'bp-stage2',
      labelKey: 'vitalsBpStage2',
    }
  }
  if (sys >= 130 || dia >= 80) {
    return {
      modifier: 'bp-stage1',
      labelKey: 'vitalsBpStage1',
    }
  }
  if (sys < 90 || dia < 60) {
    return {
      modifier: 'bp-hypotension',
      labelKey: 'vitalsBpHypotension',
    }
  }
  if (sys >= 120 && sys <= 129 && dia < 80) {
    return {
      modifier: 'bp-elevated',
      labelKey: 'vitalsBpElevated',
    }
  }
  if (sys < 120 && dia < 80) {
    return {
      modifier: 'normal',
      labelKey: 'vitalsBpNormal',
    }
  }

  return null
}

const HEART_RATE_AGE_BANDS = [
  {
    id: 'newborn',
    match: ({ ageMonths }) => ageMonths <= 1,
    normalMin: 90,
    normalMax: 160,
    alertLow: 90,
    alertHigh: 180,
  },
  {
    id: 'infant',
    match: ({ ageMonths }) => ageMonths > 1 && ageMonths <= 12,
    normalMin: 80,
    normalMax: 140,
    alertLow: 80,
    alertHigh: 160,
  },
  {
    id: 'toddler',
    match: ({ ageYears }) => ageYears >= 1 && ageYears <= 3,
    normalMin: 75,
    normalMax: 120,
    alertLow: 70,
    alertHigh: 140,
  },
  {
    id: 'preschool',
    match: ({ ageYears }) => ageYears > 3 && ageYears <= 5,
    normalMin: 70,
    normalMax: 110,
    alertLow: 65,
    alertHigh: 130,
  },
  {
    id: 'school',
    match: ({ ageYears }) => ageYears > 5 && ageYears <= 12,
    normalMin: 60,
    normalMax: 100,
    alertLow: 60,
    alertHigh: 120,
  },
  {
    id: 'adolescent',
    match: ({ ageYears }) => ageYears > 12 && ageYears < 18,
    normalMin: 60,
    normalMax: 100,
    alertLow: 55,
    alertHigh: 110,
  },
  {
    id: 'adult',
    match: () => true,
    normalMin: 60,
    normalMax: 100,
    alertLow: 40,
    alertHigh: 130,
  },
]

/** Used when DOB and age are both missing. */
export const DEFAULT_ADULT_VITALS_AGE_CONTEXT = {
  ageYears: 30,
  ageMonths: 360,
}

export function resolvePatientAgeContextForVitals({
  dobUs,
  age,
  ageUnit,
  asOfDateUs,
} = {}) {
  const asOf = isCompleteUsDateString(asOfDateUs)
    ? parseUsDateString(asOfDateUs)
    : startOfDay(new Date())
  if (!asOf) {
    return { ...DEFAULT_ADULT_VITALS_AGE_CONTEXT }
  }
  const dob = parseUsDateString(dobUs)
  if (dob) {
    return {
      ageMonths: fullMonthsBetween(dob, asOf),
      ageYears: fullYearsBetween(dob, asOf),
    }
  }
  const ageText = String(age ?? '').trim()
  if (!ageText) {
    return { ...DEFAULT_ADULT_VITALS_AGE_CONTEXT }
  }
  const n = Number(ageText)
  if (!Number.isFinite(n) || n < 0) {
    return { ...DEFAULT_ADULT_VITALS_AGE_CONTEXT }
  }
  const kind = normalizeAgeUnitKind(ageUnit)
  if (kind === 'days') {
    const ageMonths = Math.floor(n / 30)

    return { ageMonths, ageYears: 0 }
  }
  if (kind === 'months') {
    return {
      ageMonths: n,
      ageYears: Math.floor(n / 12),
    }
  }

  return {
    ageMonths: n * 12,
    ageYears: n,
  }
}

export function resolveHeartRateThresholds(ageContext) {
  if (!ageContext) {
    return null
  }
  const band = HEART_RATE_AGE_BANDS.find(item => item.match(ageContext))
  if (!band) {
    return null
  }

  return {
    id: band.id,
    normalMin: band.normalMin,
    normalMax: band.normalMax,
    alertLow: band.alertLow,
    alertHigh: band.alertHigh,
  }
}

export function resolveHeartRateLevel(value, ageContext) {
  const n = parsePositiveInt(value)
  if (n == null || Number.isNaN(n)) {
    return null
  }
  const thresholds = resolveHeartRateThresholds(ageContext)
  if (!thresholds) {
    return null
  }
  if (n < thresholds.alertLow) {
    return {
      modifier: 'hr-bradycardia',
      labelKey: 'vitalsHrBradycardia',
    }
  }
  if (n > thresholds.alertHigh) {
    return {
      modifier: 'hr-tachycardia',
      labelKey: 'vitalsHrTachycardia',
    }
  }
  if (n >= thresholds.normalMin && n <= thresholds.normalMax) {
    return {
      modifier: 'normal',
      labelKey: 'vitalsHrNormal',
    }
  }

  return {
    modifier: 'hr-yellow',
    labelKey: 'vitalsHrYellow',
  }
}

export function sanitizeHeartRateInput(value) {
  return sanitizeCappedIntegerInput(value, VITALS_LIMITS.heartRate.max)
}

const RESPIRATORY_RATE_AGE_BANDS = [
  {
    id: 'newborn',
    match: ({ ageMonths }) => ageMonths <= 1,
    normalMin: 30,
    normalMax: 60,
    alertLow: 30,
    alertHigh: 60,
  },
  {
    id: 'infant',
    match: ({ ageMonths }) => ageMonths > 1 && ageMonths <= 12,
    normalMin: 30,
    normalMax: 60,
    alertLow: 30,
    alertHigh: 60,
  },
  {
    id: 'toddler',
    match: ({ ageYears }) => ageYears >= 1 && ageYears <= 3,
    normalMin: 24,
    normalMax: 40,
    alertLow: 20,
    alertHigh: 40,
  },
  {
    id: 'preschool',
    match: ({ ageYears }) => ageYears > 3 && ageYears <= 5,
    normalMin: 22,
    normalMax: 34,
    alertLow: 18,
    alertHigh: 34,
  },
  {
    id: 'school',
    match: ({ ageYears }) => ageYears > 5 && ageYears <= 12,
    normalMin: 18,
    normalMax: 30,
    alertLow: 14,
    alertHigh: 30,
  },
  {
    id: 'adolescent',
    match: ({ ageYears }) => ageYears > 12 && ageYears <= 18,
    normalMin: 12,
    normalMax: 20,
    alertLow: 10,
    alertHigh: 24,
  },
  {
    id: 'adult',
    match: ({ ageYears }) => ageYears >= 19 && ageYears <= 64,
    normalMin: 12,
    normalMax: 20,
    alertLow: 10,
    alertHigh: 24,
  },
  {
    id: 'older',
    match: () => true,
    normalMin: 12,
    normalMax: 20,
    alertLow: 10,
    alertHigh: 24,
  },
]

export function resolveRespiratoryRateThresholds(ageContext) {
  if (!ageContext) {
    return null
  }
  const band = RESPIRATORY_RATE_AGE_BANDS.find(
    item => item.match(ageContext),
  )
  if (!band) {
    return null
  }

  return {
    id: band.id,
    normalMin: band.normalMin,
    normalMax: band.normalMax,
    alertLow: band.alertLow,
    alertHigh: band.alertHigh,
  }
}

export function resolveRespiratoryRateLevel(value, ageContext) {
  const n = parsePositiveInt(value)
  if (n == null || Number.isNaN(n)) {
    return null
  }
  const thresholds = resolveRespiratoryRateThresholds(ageContext)
  if (!thresholds) {
    return null
  }
  if (n < thresholds.alertLow) {
    return {
      modifier: 'rr-slow',
      labelKey: 'vitalsRrSlow',
    }
  }
  if (n > thresholds.alertHigh) {
    return {
      modifier: 'rr-fast',
      labelKey: 'vitalsRrFast',
    }
  }
  if (n >= thresholds.normalMin && n <= thresholds.normalMax) {
    return {
      modifier: 'normal',
      labelKey: 'vitalsRrNormal',
    }
  }

  return {
    modifier: 'rr-yellow',
    labelKey: 'vitalsRrYellow',
  }
}

export function sanitizeRespiratoryRateInput(value) {
  return sanitizeCappedIntegerInput(
    value,
    VITALS_LIMITS.respiratoryRate.max,
  )
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
    'heightFeet',
    'heightInches',
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
  if (min > 0 && n <= 0) {
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

function validateOptionalHeight(draft) {
  const feetStr = String(draft?.heightFeet ?? '').trim()
  const inchesStr = String(draft?.heightInches ?? '').trim()
  if (!feetStr && !inchesStr) {
    return null
  }
  const total = combineFeetInchesToTotal(feetStr, inchesStr)
  if (total == null || Number.isNaN(total)) {
    return 'invalid'
  }
  if (total <= 0) {
    return 'positive'
  }
  if (!inRange(
    total,
    VITALS_LIMITS.height.min,
    VITALS_LIMITS.height.max,
  )) {
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
  const height = validateOptionalHeight(draft)

  if (sys) {
    errors.systolic = sys
  }
  if (dia) {
    errors.diastolic = dia
  }
  if (!sys && !dia) {
    const sysN = parsePositiveInt(draft?.systolic)
    const diaN = parsePositiveInt(draft?.diastolic)
    if (
      sysN != null
      && diaN != null
      && !Number.isNaN(sysN)
      && !Number.isNaN(diaN)
      && diaN >= sysN
    ) {
      errors.diastolic = 'order'
    }
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
  const heightInches = draftHeightToInches(draft)
  const height = Number.isFinite(heightInches) ? heightInches : null
  const bmi = calculateBmiFromUs(draft.weight, height)

  return {
    systolic: parsePositiveInt(draft.systolic),
    diastolic: parsePositiveInt(draft.diastolic),
    heartRate: parsePositiveInt(draft.heartRate),
    respiratoryRate: parsePositiveInt(draft.respiratoryRate) ?? null,
    temperature: parseDecimal(draft.temperature),
    oxygenSaturation: parsePositiveInt(draft.oxygenSaturation) ?? null,
    weight: parseDecimal(draft.weight) ?? null,
    height,
    bmi,
    painLevel: String(draft.painLevel ?? '').trim() || null,
    notes: String(draft.notes ?? '').trim(),
    recordedDate: String(draft.recordedDate ?? '').trim(),
    recordedTime: String(draft.recordedTime ?? '').trim(),
    recordedBy: String(draft.recordedBy ?? '').trim(),
  }
}

export function draftFromVitalsEntry(entry) {
  const heightParts = splitInchesToFeetParts(entry?.height)

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
    heightFeet: heightParts.feet,
    heightInches: heightParts.inches,
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
