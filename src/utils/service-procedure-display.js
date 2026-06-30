export function formatServiceProcedureDuration(minDuration, maxDuration, t) {
  const min = Number(minDuration)
  const max = Number(maxDuration)
  const hasMin = Number.isFinite(min) && min > 0
  const hasMax = Number.isFinite(max) && max > 0

  if (hasMin && hasMax) {
    if (min === max) {
      return t('serviceProcedureDurationMinutes', { count: min })
    }

    return t('serviceProcedureDurationRangeMinutes', { min, max })
  }
  if (hasMin) {
    return t('serviceProcedureDurationMinutes', { count: min })
  }
  if (hasMax) {
    return t('serviceProcedureDurationMinutes', { count: max })
  }

  return '—'
}
