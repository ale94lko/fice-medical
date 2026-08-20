/**
 * Mosteller Body Surface Area from Height and Weight of the same
 * Vitals set. Matches API normalization: height → cm, weight → kg.
 */

const CM_PER_INCH = 2.54
const KG_PER_LB = 0.45359237

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

/**
 * @param {unknown} heightIn
 * @returns {number | null}
 */
export function inchesToCm(heightIn) {
  const inches = toPositiveNumber(heightIn)
  if (inches == null) {
    return null
  }

  return Math.round(inches * CM_PER_INCH * 100) / 100
}

/**
 * @param {unknown} weightLbs
 * @returns {number | null}
 */
export function lbsToKg(weightLbs) {
  const pounds = toPositiveNumber(weightLbs)
  if (pounds == null) {
    return null
  }

  return Math.round(pounds * KG_PER_LB * 1000) / 1000
}

/**
 * @param {unknown} heightCm
 * @param {unknown} weightKg
 * @returns {number | null}
 */
export function calculateBsaFromMetric(heightCm, weightKg) {
  const height = toPositiveNumber(heightCm)
  const weight = toPositiveNumber(weightKg)
  if (height == null || weight == null) {
    return null
  }
  const bsa = Math.sqrt((height * weight) / 3600)
  if (!Number.isFinite(bsa) || bsa <= 0) {
    return null
  }

  return Math.round(bsa * 100) / 100
}

/**
 * @param {unknown} weightLbs
 * @param {unknown} heightIn
 * @returns {number | null}
 */
export function calculateBsaFromUs(weightLbs, heightIn) {
  return calculateBsaFromMetric(
    inchesToCm(heightIn),
    lbsToKg(weightLbs),
  )
}

/**
 * @param {number | null | undefined} bsa
 * @param {{ withUnit?: boolean }} [options]
 * @returns {string}
 */
export function formatBsaDisplay(bsa, options = {}) {
  const n = typeof bsa === 'number' ? bsa : Number(bsa)
  if (!Number.isFinite(n) || n <= 0) {
    return '—'
  }
  const value = n.toFixed(2)
  if (options.withUnit) {
    return `${value} m²`
  }

  return value
}
