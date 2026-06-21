import { clientAllergySeverityValues } from 'components/constants.js'

function normalizeSeverityToken(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

const SEVERE_TOKENS = new Set(['severe', 'high', 'critical'])
const MODERATE_TOKENS = new Set(['moderate', 'medium'])
const MILD_TOKENS = new Set(['mild', 'low'])

export function resolveClientListAllergySeverityModifier(severity) {
  const token = normalizeSeverityToken(severity)
  if (!token) {
    return null
  }

  if (SEVERE_TOKENS.has(token)) {
    return 'severe'
  }
  if (MODERATE_TOKENS.has(token)) {
    return 'moderate'
  }
  if (MILD_TOKENS.has(token)) {
    return 'mild'
  }

  const labelMatch = Object.entries(clientAllergySeverityValues).find(
    ([, label]) => normalizeSeverityToken(label) === token,
  )

  return labelMatch?.[0] ?? null
}

export function resolveClientListAllergySeverityLabel(
  severity,
  modifier,
) {
  if (modifier && clientAllergySeverityValues[modifier]) {
    return clientAllergySeverityValues[modifier]
  }

  return String(severity ?? '').trim()
}

export function clientListAllergySeverityBadgeClass(modifier) {
  if (modifier === 'severe') {
    return 'allergy-severity-badge--severe'
  }
  if (modifier === 'moderate') {
    return 'allergy-severity-badge--moderate'
  }
  if (modifier === 'nka') {
    return 'allergy-severity-badge--nka'
  }

  return 'allergy-severity-badge--mild'
}
