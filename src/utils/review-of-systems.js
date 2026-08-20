export const reviewOfSystemsDefinition = 'REVIEW_OF_SYSTEMS'

export const reviewOfSystemsStatuses = {
  negative: 'NEGATIVE',
  positive: 'POSITIVE',
  notReviewed: 'NOT_REVIEWED',
}

export const reviewOfSystemsIssueCodes = {
  status: 'STATUS_REQUIRED',
  details: 'DETAILS_REQUIRED',
}

export const reviewOfSystems = [
  { key: 'constitutional', labelKey: 'rosSystemConstitutional' },
  { key: 'eyes', labelKey: 'rosSystemEyes' },
  { key: 'ent_mouth', labelKey: 'rosSystemEntMouth' },
  { key: 'cardiovascular', labelKey: 'rosSystemCardiovascular' },
  { key: 'respiratory', labelKey: 'rosSystemRespiratory' },
  { key: 'gastrointestinal', labelKey: 'rosSystemGastrointestinal' },
  { key: 'genitourinary', labelKey: 'rosSystemGenitourinary' },
  { key: 'musculoskeletal', labelKey: 'rosSystemMusculoskeletal' },
  { key: 'skin', labelKey: 'rosSystemSkin' },
  { key: 'neurologic', labelKey: 'rosSystemNeurologic' },
  { key: 'psychiatric', labelKey: 'rosSystemPsychiatric' },
  { key: 'endocrine', labelKey: 'rosSystemEndocrine' },
  {
    key: 'hematologic_lymphatic',
    labelKey: 'rosSystemHematologic',
  },
  {
    key: 'allergic_immunologic',
    labelKey: 'rosSystemAllergic',
  },
]

export function parseJsonObject(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw
  }
  if (typeof raw !== 'string' || !raw.trim()) {
    return {}
  }
  try {
    const parsed = JSON.parse(raw)

    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {}
  } catch {
    return {}
  }
}

export function parseStructuredDefinition(raw) {
  const parsed = parseJsonObject(raw)
  const token = String(parsed.definition || '').trim().toUpperCase()
  if (token === reviewOfSystemsDefinition) {
    return reviewOfSystemsDefinition
  }
  if (token === 'PHYSICAL_EXAM'
    || token === 'MENTAL_STATUS_EXAM'
    || token === 'ASSESSMENT_PLAN') {
    return token
  }

  return 'CUSTOM'
}

export function isReviewOfSystemsSection(field) {
  const key = String(field?.fieldKey || field?.sectionKey || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')
  if (key === 'review_of_systems' || key === 'ros') {
    return true
  }

  return parseStructuredDefinition(
    field?.configurationJson ?? field?.configuration_json,
  ) === reviewOfSystemsDefinition
}

function normalizeStatus(value) {
  const token = String(value || '').trim().toUpperCase().replace(/ /g, '_')
  if (token === reviewOfSystemsStatuses.negative
    || token === reviewOfSystemsStatuses.positive
    || token === reviewOfSystemsStatuses.notReviewed) {
    return token
  }

  return null
}

export function emptyReviewOfSystemsValues() {
  const values = {}
  reviewOfSystems.forEach(system => {
    values[system.key] = { status: null, details: '' }
  })

  return values
}

export function parseReviewOfSystemsValues(raw) {
  const parsed = parseJsonObject(raw)
  const source = parsed.values && typeof parsed.values === 'object'
    ? parsed.values
    : parsed
  const values = emptyReviewOfSystemsValues()
  reviewOfSystems.forEach(system => {
    const row = source[system.key]
    if (!row || typeof row !== 'object') {
      return
    }
    values[system.key] = {
      status: normalizeStatus(row.status),
      details: String(row.details ?? '').trim(),
    }
  })

  return values
}

export function serializeReviewOfSystemsValues(values) {
  const next = {}
  reviewOfSystems.forEach(system => {
    const row = values?.[system.key] || {}
    const status = normalizeStatus(row.status)
    const details = String(row.details || '').trim()
    if (!status && !details) {
      return
    }
    const item = {}
    if (status) {
      item.status = status
    }
    if (details) {
      item.details = details
    }
    next[system.key] = item
  })

  return JSON.stringify({
    section: reviewOfSystemsDefinition,
    values: next,
  })
}

export function reviewOfSystemsNeedsDetails(status) {
  return normalizeStatus(status) === reviewOfSystemsStatuses.positive
}

export function reviewOfSystemsIssues(values, required) {
  const issues = []
  reviewOfSystems.forEach(system => {
    const row = values?.[system.key] || {}
    const status = normalizeStatus(row.status)
    const details = String(row.details || '').trim()
    if (!status) {
      if (required) {
        issues.push({
          key: system.key,
          labelKey: system.labelKey,
          code: reviewOfSystemsIssueCodes.status,
        })
      }

      return
    }
    if (status === reviewOfSystemsStatuses.positive && !details) {
      issues.push({
        key: system.key,
        labelKey: system.labelKey,
        code: reviewOfSystemsIssueCodes.details,
      })
    }
  })

  return issues
}

export function reviewOfSystemsAnsweredCount(values) {
  return reviewOfSystems.filter(system => {
    const row = values?.[system.key] || {}
    const status = normalizeStatus(row.status)
    if (!status) {
      return false
    }
    if (status === reviewOfSystemsStatuses.positive
      && !String(row.details || '').trim()) {
      return false
    }

    return true
  }).length
}

export function isReviewOfSystemsComplete(values) {
  return reviewOfSystemsIssues(values, true).length === 0
}
