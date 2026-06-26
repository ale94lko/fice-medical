import {
  calculateBmiFromUs,
  formatBmiDisplay,
} from 'src/utils/client-vitals.js'

export const SCREENING_WEIGHT_MAX_LBS = 1500
export const SCREENING_HEIGHT_MAX_IN = 120

function parseOptionalDecimal(value) {
  const s = String(value ?? '').trim()
  if (!s) {
    return null
  }
  const n = Number(s)
  if (!Number.isFinite(n)) {
    return NaN
  }

  return n
}

export function calculateScreeningBmi(weight, height) {
  return calculateBmiFromUs(weight, height)
}

export function formatScreeningBmiDisplay(bmi) {
  return formatBmiDisplay(bmi)
}

export function validateScreeningMeasurements({ weight, height }, t) {
  const errors = {}
  const weightNum = parseOptionalDecimal(weight)
  const heightNum = parseOptionalDecimal(height)

  if (weight != null && String(weight).trim() !== '') {
    if (!Number.isFinite(weightNum) || weightNum <= 0) {
      errors.weight = t('screeningWeightInvalid')
    } else if (weightNum > SCREENING_WEIGHT_MAX_LBS) {
      errors.weight = t('screeningWeightMax', {
        max: SCREENING_WEIGHT_MAX_LBS,
      })
    }
  }

  if (height != null && String(height).trim() !== '') {
    if (!Number.isFinite(heightNum) || heightNum <= 0) {
      errors.height = t('screeningHeightInvalid')
    } else if (heightNum > SCREENING_HEIGHT_MAX_IN) {
      errors.height = t('screeningHeightMax', {
        max: SCREENING_HEIGHT_MAX_IN,
      })
    }
  }

  return errors
}

/**
 * Normalizes measurement inputs for API/mock persistence.
 * Recalculates BMI server-side style (ignores client bmi).
 */
export function normalizeScreeningMeasurements({ weight, height }) {
  const weightRaw = String(weight ?? '').trim()
  const heightRaw = String(height ?? '').trim()
  const weightNum = weightRaw ? parseOptionalDecimal(weightRaw) : null
  const heightNum = heightRaw ? parseOptionalDecimal(heightRaw) : null

  if (weightRaw && (!Number.isFinite(weightNum) || weightNum <= 0)) {
    const err = new Error('Invalid weight')
    err.code = 'MEASUREMENT_VALIDATION'
    err.field = 'weight'
    throw err
  }
  if (weightNum != null && weightNum > SCREENING_WEIGHT_MAX_LBS) {
    const err = new Error('Weight exceeds maximum')
    err.code = 'MEASUREMENT_VALIDATION'
    err.field = 'weight'
    throw err
  }

  if (heightRaw && (!Number.isFinite(heightNum) || heightNum <= 0)) {
    const err = new Error('Invalid height')
    err.code = 'MEASUREMENT_VALIDATION'
    err.field = 'height'
    throw err
  }
  if (heightNum != null && heightNum > SCREENING_HEIGHT_MAX_IN) {
    const err = new Error('Height exceeds maximum')
    err.code = 'MEASUREMENT_VALIDATION'
    err.field = 'height'
    throw err
  }

  const storedWeight = weightNum != null
    ? Math.round(weightNum * 100) / 100
    : null
  const storedHeight = heightNum != null
    ? Math.round(heightNum * 100) / 100
    : null
  const bmi = calculateScreeningBmi(storedWeight, storedHeight)

  return {
    weight: storedWeight,
    height: storedHeight,
    bmi,
  }
}

export function measurementsToFormValues(screening) {
  const weight = screening?.weight
  const height = screening?.height

  return {
    weight: weight != null && Number.isFinite(Number(weight))
      ? String(weight)
      : '',
    height: height != null && Number.isFinite(Number(height))
      ? String(height)
      : '',
  }
}

export function buildMeasurementsApiPayload({ weight, height }) {
  const normalized = normalizeScreeningMeasurements({ weight, height })

  return {
    weight: normalized.weight,
    height: normalized.height,
  }
}
