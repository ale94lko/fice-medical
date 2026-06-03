import {
  calculateBmiFromUs,
  formatBmiDisplay,
} from 'src/utils/client-vitals.js'

export const ASSESSMENT_WEIGHT_MAX_LBS = 1500
export const ASSESSMENT_HEIGHT_MAX_IN = 120

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

export function calculateAssessmentBmi(weight, height) {
  return calculateBmiFromUs(weight, height)
}

export function formatAssessmentBmiDisplay(bmi) {
  return formatBmiDisplay(bmi)
}

export function validateAssessmentMeasurements({ weight, height }, t) {
  const errors = {}
  const weightNum = parseOptionalDecimal(weight)
  const heightNum = parseOptionalDecimal(height)

  if (weight != null && String(weight).trim() !== '') {
    if (!Number.isFinite(weightNum) || weightNum <= 0) {
      errors.weight = t('assessmentWeightInvalid')
    } else if (weightNum > ASSESSMENT_WEIGHT_MAX_LBS) {
      errors.weight = t('assessmentWeightMax', {
        max: ASSESSMENT_WEIGHT_MAX_LBS,
      })
    }
  }

  if (height != null && String(height).trim() !== '') {
    if (!Number.isFinite(heightNum) || heightNum <= 0) {
      errors.height = t('assessmentHeightInvalid')
    } else if (heightNum > ASSESSMENT_HEIGHT_MAX_IN) {
      errors.height = t('assessmentHeightMax', {
        max: ASSESSMENT_HEIGHT_MAX_IN,
      })
    }
  }

  return errors
}

/**
 * Normalizes measurement inputs for API/mock persistence.
 * Recalculates BMI server-side style (ignores client bmi).
 */
export function normalizeAssessmentMeasurements({ weight, height }) {
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
  if (weightNum != null && weightNum > ASSESSMENT_WEIGHT_MAX_LBS) {
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
  if (heightNum != null && heightNum > ASSESSMENT_HEIGHT_MAX_IN) {
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
  const bmi = calculateAssessmentBmi(storedWeight, storedHeight)

  return {
    weight: storedWeight,
    height: storedHeight,
    bmi,
  }
}

export function measurementsToFormValues(assessment) {
  const weight = assessment?.weight
  const height = assessment?.height

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
  const normalized = normalizeAssessmentMeasurements({ weight, height })

  return {
    weight: normalized.weight,
    height: normalized.height,
  }
}
