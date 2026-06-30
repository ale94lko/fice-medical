import { appointmentBookingMaxServices } from 'components/constants.js'

function parsePositiveInt(value) {
  const n = Number(value)

  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}

export function resolveServiceDefaultDuration(service) {
  const min = parsePositiveInt(service?.minDurationMin)
  const max = parsePositiveInt(service?.maxDurationMin)
  const configured = parsePositiveInt(service?.defaultDurationMin)
  if (configured != null) {
    return configured
  }
  if (min != null && max != null && min === max) {
    return min
  }
  if (min != null && max != null) {
    return min
  }

  return min ?? max ?? null
}

export function isServiceFixedDuration(service) {
  const min = parsePositiveInt(service?.minDurationMin)
  const max = parsePositiveInt(service?.maxDurationMin)
  if (min != null && max != null && min === max) {
    return true
  }

  return Boolean(
    service?.fixedDuration
    && parsePositiveInt(service?.defaultDurationMin) != null,
  )
}

export function isDurationWithinServiceRange(service, durationMin) {
  const value = parsePositiveInt(durationMin)
  if (value == null) {
    return false
  }
  if (isServiceFixedDuration(service)) {
    return value === parsePositiveInt(service.minDurationMin)
  }
  const min = parsePositiveInt(service?.minDurationMin)
  const max = parsePositiveInt(service?.maxDurationMin)
  if (min == null || max == null) {
    return true
  }

  return value >= min && value <= max
}

export function formatServiceDurationSummary(service, t) {
  const fixed = service?.fixedDuration ?? isServiceFixedDuration(service)
  const defaultMin = parsePositiveInt(service?.durationMin)
    ?? resolveServiceDefaultDuration(service)
  const min = parsePositiveInt(service?.minDurationMin)
  const max = parsePositiveInt(service?.maxDurationMin)

  if (fixed && defaultMin != null) {
    return t('appointmentServiceCatalogDurationFixed', {
      count: defaultMin,
    })
  }
  if (min != null && max != null && max > min) {
    return t('appointmentServiceCatalogDurationRange', { min, max })
  }
  if (defaultMin != null) {
    return t('appointmentServiceCatalogDurationFixed', {
      count: defaultMin,
    })
  }

  return ''
}

export function formatServiceCatalogOptionLabel(service, t) {
  const name = String(service?.name ?? '').trim()
  const cptCode = String(service?.cptCode ?? '').trim()
  const durationSummary = formatServiceDurationSummary(service, t)
  const parts = [name]
  if (cptCode) {
    parts.push(`CPT ${cptCode}`)
  }
  if (durationSummary) {
    parts.push(durationSummary)
  }

  return parts.filter(Boolean).join(' · ')
}

export function buildServiceLine(service, durationMin = null) {
  const resolvedDuration = parsePositiveInt(durationMin)
    ?? resolveServiceDefaultDuration(service)

  return {
    serviceId: service.id,
    name: service.name,
    cptCode: service.cptCode ?? '',
    hcpcsCode: service.hcpcsCode ?? '',
    defaultFee: service.defaultFee ?? null,
    minDurationMin: service.minDurationMin ?? null,
    maxDurationMin: service.maxDurationMin ?? null,
    fixedDuration: isServiceFixedDuration(service),
    durationMin: resolvedDuration,
  }
}

export function sumServiceLineDurations(lines = []) {
  return lines.reduce((total, line) => {
    const mins = parsePositiveInt(line?.durationMin)

    return total + (mins ?? 0)
  }, 0)
}

export function canAddMoreServices(currentCount) {
  return currentCount < appointmentBookingMaxServices
}

export function formatFeeLabel(fee, t) {
  const value = Number(fee)
  if (!Number.isFinite(value)) {
    return '—'
  }

  return t('appointmentSuggestedFeeValue', {
    amount: value.toFixed(2),
  })
}

export function formatCodesSummary(lines = []) {
  const codes = []
  for (const line of lines) {
    if (line?.cptCode) {
      codes.push(line.cptCode)
    }
    if (line?.hcpcsCode) {
      codes.push(line.hcpcsCode)
    }
  }

  return [...new Set(codes)].join(', ') || '—'
}

export function sumSuggestedFees(lines = []) {
  return lines.reduce((total, line) => {
    const fee = Number(line?.defaultFee)

    return total + (Number.isFinite(fee) ? fee : 0)
  }, 0)
}

export function buildDurationPreviewFromLines(lines = []) {
  const durations = lines
    .map(line => parsePositiveInt(line?.durationMin))
    .filter(value => value != null)
  const total = durations.reduce((sum, value) => sum + value, 0)
  const allFixed = lines.length > 0 && lines.every(line => line.fixedDuration)
  const mins = lines
    .map(line => parsePositiveInt(line?.minDurationMin))
    .filter(value => value != null)
  const maxs = lines
    .map(line => parsePositiveInt(line?.maxDurationMin))
    .filter(value => value != null)

  return {
    defaultDurationMin: total || null,
    minDurationMin: mins.length ? mins.reduce((a, b) => a + b, 0) : null,
    maxDurationMin: maxs.length ? maxs.reduce((a, b) => a + b, 0) : null,
    fixedDuration: allFixed,
    durationEditable: !allFixed,
    suggestedFee: sumSuggestedFees(lines),
    cptCode: formatCodesSummary(lines.filter(line => line.cptCode)),
    services: lines.map(line => ({
      id: line.serviceId,
      name: line.name,
      /* eslint-disable camelcase -- preview DTO */
      duration_min: line.durationMin,
      cpt_code: line.cptCode || null,
      /* eslint-enable camelcase */
    })),
  }
}
