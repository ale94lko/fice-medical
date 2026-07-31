/**
 * US customary BMI calculation and clinical classification.
 * Adults (≥20): WHO / CDC fixed cutoffs.
 * Ages 2–19: CDC 2000 BMI-for-age percentiles (LMS).
 */

import {
  CDC_BMI_LMS_FEMALE,
  CDC_BMI_LMS_MALE,
} from './bmi-cdc-lms-data.js'

/** @typedef {'male' | 'female'} BmiSex */

/**
 * @typedef {object} BmiAgeContext
 * @property {number} ageMonths
 * @property {number} ageYears
 */

/**
 * @typedef {object} BmiClassification
 * @property {string} modifier
 * @property {string} labelKey
 * @property {number | null} [percentile]
 */

export const BMI_US_FACTOR = 703

export const ADULT_BMI_MIN_YEARS = 20
export const PEDIATRIC_BMI_MIN_YEARS = 2
export const PEDIATRIC_BMI_MAX_YEARS = 19

/**
 * @param {unknown} weightLbs
 * @param {unknown} heightIn
 * @returns {number | null}
 */
export function calculateBmiFromUs(weightLbs, heightIn) {
  const weight = toPositiveNumber(weightLbs)
  const height = toPositiveNumber(heightIn)
  if (weight == null || height == null) {
    return null
  }
  const bmi = (weight / (height * height)) * BMI_US_FACTOR

  return Number.isFinite(bmi) ? Math.round(bmi * 10) / 10 : null
}

/**
 * @param {number | null | undefined} bmi
 * @returns {string}
 */
export function formatBmiDisplay(bmi) {
  if (bmi == null || !Number.isFinite(bmi)) {
    return '—'
  }

  return String(bmi)
}

/**
 * @param {unknown} value
 * @returns {BmiSex | null}
 */
export function normalizeBmiSex(value) {
  const raw = String(value ?? '').trim().toLowerCase()
  if (!raw) {
    return null
  }
  if (
    raw === '1'
    || raw === 'm'
    || raw === 'male'
    || raw === 'man'
    || raw === 'boy'
  ) {
    return 'male'
  }
  if (
    raw === '2'
    || raw === 'f'
    || raw === 'female'
    || raw === 'woman'
    || raw === 'girl'
  ) {
    return 'female'
  }
  if (raw.includes('female') || raw.includes('mujer')) {
    return 'female'
  }
  if (raw.includes('male') || raw.includes('hombre')) {
    return 'male'
  }

  return null
}

/**
 * @param {number} bmi
 * @returns {BmiClassification}
 */
export function classifyAdultBmi(bmi) {
  if (bmi < 18.5) {
    return {
      modifier: 'bmi-underweight',
      labelKey: 'vitalsBmiUnderweight',
      percentile: null,
    }
  }
  if (bmi < 25) {
    return {
      modifier: 'bmi-normal',
      labelKey: 'vitalsBmiHealthy',
      percentile: null,
    }
  }
  if (bmi < 30) {
    return {
      modifier: 'bmi-overweight',
      labelKey: 'vitalsBmiOverweight',
      percentile: null,
    }
  }
  if (bmi < 35) {
    return {
      modifier: 'bmi-obesity1',
      labelKey: 'vitalsBmiObesity1',
      percentile: null,
    }
  }
  if (bmi < 40) {
    return {
      modifier: 'bmi-obesity2',
      labelKey: 'vitalsBmiObesity2',
      percentile: null,
    }
  }

  return {
    modifier: 'bmi-obesity3',
    labelKey: 'vitalsBmiObesity3',
    percentile: null,
  }
}

/**
 * @param {number} percentile
 * @returns {BmiClassification}
 */
export function classifyPediatricBmiPercentile(percentile) {
  if (percentile < 5) {
    return {
      modifier: 'bmi-underweight',
      labelKey: 'vitalsBmiUnderweight',
      percentile,
    }
  }
  if (percentile < 85) {
    return {
      modifier: 'bmi-normal',
      labelKey: 'vitalsBmiHealthy',
      percentile,
    }
  }
  if (percentile < 95) {
    return {
      modifier: 'bmi-overweight',
      labelKey: 'vitalsBmiOverweight',
      percentile,
    }
  }

  return {
    modifier: 'bmi-obesity1',
    labelKey: 'vitalsBmiObesity',
    percentile,
  }
}

/**
 * @param {number} bmi
 * @param {number} ageMonths
 * @param {BmiSex} sex
 * @returns {number | null} percentile 0–100
 */
export function calculateCdcBmiPercentile(bmi, ageMonths, sex) {
  if (!Number.isFinite(bmi) || bmi <= 0) {
    return null
  }
  if (!Number.isFinite(ageMonths)) {
    return null
  }
  const lms = lookupCdcBmiLms(ageMonths, sex)
  if (!lms) {
    return null
  }
  const z = bmiToZScore(bmi, lms.L, lms.M, lms.S)
  if (!Number.isFinite(z)) {
    return null
  }
  const percentile = normalCdf(z) * 100

  return Math.round(percentile * 10) / 10
}

/**
 * @param {{
 *   bmi: number | null | undefined,
 *   ageContext: BmiAgeContext | null | undefined,
 *   sex: unknown,
 * }} params
 * @returns {BmiClassification | null}
 */
export function resolveBmiClassification({ bmi, ageContext, sex }) {
  if (bmi == null || !Number.isFinite(bmi)) {
    return null
  }
  if (!ageContext) {
    return null
  }
  const { ageYears, ageMonths } = ageContext
  if (!Number.isFinite(ageYears)) {
    return null
  }
  if (ageYears >= ADULT_BMI_MIN_YEARS) {
    return classifyAdultBmi(bmi)
  }
  if (
    ageYears < PEDIATRIC_BMI_MIN_YEARS
    || ageYears > PEDIATRIC_BMI_MAX_YEARS
  ) {
    return null
  }
  const normalizedSex = normalizeBmiSex(sex)
  if (!normalizedSex) {
    return null
  }
  const months = Number.isFinite(ageMonths)
    ? ageMonths
    : ageYears * 12
  const percentile = calculateCdcBmiPercentile(
    bmi,
    months,
    normalizedSex,
  )
  if (percentile == null) {
    return null
  }

  return classifyPediatricBmiPercentile(percentile)
}

/**
 * @param {number} bmi
 * @param {number} L
 * @param {number} M
 * @param {number} S
 * @returns {number}
 */
function bmiToZScore(bmi, L, M, S) {
  if (L === 0) {
    return Math.log(bmi / M) / S
  }

  return ((bmi / M) ** L - 1) / (L * S)
}

/**
 * @param {number} ageMonths
 * @param {BmiSex} sex
 * @returns {{ L: number, M: number, S: number } | null}
 */
function lookupCdcBmiLms(ageMonths, sex) {
  const table = sex === 'female'
    ? CDC_BMI_LMS_FEMALE
    : CDC_BMI_LMS_MALE
  if (!table.length) {
    return null
  }
  const minAge = table[0][0]
  const maxAge = table[table.length - 1][0]
  const age = Math.min(Math.max(ageMonths, minAge), maxAge)
  let lower = table[0]
  let upper = table[table.length - 1]
  for (let i = 0; i < table.length; i += 1) {
    const row = table[i]
    if (row[0] === age) {
      return { L: row[1], M: row[2], S: row[3] }
    }
    if (row[0] < age) {
      lower = row
    }
    if (row[0] > age) {
      upper = row
      break
    }
  }
  if (lower[0] === upper[0]) {
    return { L: lower[1], M: lower[2], S: lower[3] }
  }
  const t = (age - lower[0]) / (upper[0] - lower[0])

  return {
    L: lower[1] + (upper[1] - lower[1]) * t,
    M: lower[2] + (upper[2] - lower[2]) * t,
    S: lower[3] + (upper[3] - lower[3]) * t,
  }
}

/**
 * Standard normal CDF (Abramowitz & Stegun 26.2.17).
 * @param {number} z
 * @returns {number}
 */
function normalCdf(z) {
  const absZ = Math.abs(z)
  const t = 1 / (1 + 0.2316419 * absZ)
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2)
  const p = d * t * (
    0.31938153
    + t * (
      -0.356563782
      + t * (
        1.781477937
        + t * (-1.821255978 + t * 1.330274429)
      )
    )
  )

  return z >= 0 ? 1 - p : p
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function toPositiveNumber(value) {
  const n = Number(String(value ?? '').trim())
  if (!Number.isFinite(n) || n <= 0) {
    return null
  }

  return n
}
