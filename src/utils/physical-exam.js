export const physicalExamDefinition = 'PHYSICAL_EXAM'

export const physicalExamStatuses = {
  normal: 'NORMAL',
  abnormal: 'ABNORMAL',
  notExamined: 'NOT_EXAMINED',
  deferred: 'DEFERRED',
}

export const physicalExamIssueCodes = {
  status: 'STATUS_REQUIRED',
  findings: 'FINDINGS_REQUIRED',
}

export const physicalExamAreas = [
  {
    key: 'constitutional_general',
    labelKey: 'peAreaConstitutional',
    allowDeferred: false,
  },
  { key: 'eyes', labelKey: 'peAreaEyes', allowDeferred: false },
  { key: 'ent_mouth', labelKey: 'peAreaEntMouth', allowDeferred: false },
  { key: 'neck', labelKey: 'peAreaNeck', allowDeferred: false },
  {
    key: 'cardiovascular',
    labelKey: 'peAreaCardiovascular',
    allowDeferred: false,
  },
  {
    key: 'respiratory',
    labelKey: 'peAreaRespiratory',
    allowDeferred: false,
  },
  {
    key: 'gastrointestinal_abdomen',
    labelKey: 'peAreaGastrointestinal',
    allowDeferred: false,
  },
  {
    key: 'genitourinary',
    labelKey: 'peAreaGenitourinary',
    allowDeferred: true,
  },
  {
    key: 'musculoskeletal',
    labelKey: 'peAreaMusculoskeletal',
    allowDeferred: false,
  },
  { key: 'skin', labelKey: 'peAreaSkin', allowDeferred: false },
  {
    key: 'neurologic',
    labelKey: 'peAreaNeurologic',
    allowDeferred: false,
  },
  {
    key: 'psychiatric',
    labelKey: 'peAreaPsychiatric',
    allowDeferred: false,
  },
  {
    key: 'lymphatic',
    labelKey: 'peAreaLymphatic',
    allowDeferred: false,
  },
  { key: 'breast', labelKey: 'peAreaBreast', allowDeferred: true },
]

function parseJsonObject(raw) {
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

function normalizeStatus(value, area) {
  const token = String(value || '').trim().toUpperCase().replace(/ /g, '_')
  if (token === physicalExamStatuses.normal
    || token === physicalExamStatuses.abnormal
    || token === physicalExamStatuses.notExamined) {
    return token
  }
  if (token === physicalExamStatuses.deferred && area?.allowDeferred) {
    return token
  }

  return null
}

export function isPhysicalExamSection(field) {
  const key = String(field?.fieldKey || field?.sectionKey || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')
  if (key === 'physical_exam' || key === 'physical_examination') {
    return true
  }
  const parsed = parseJsonObject(
    field?.configurationJson ?? field?.configuration_json,
  )
  const token = String(parsed.definition || '').trim().toUpperCase()

  return token === physicalExamDefinition
}

export function emptyPhysicalExamValues() {
  const values = {}
  physicalExamAreas.forEach(area => {
    values[area.key] = { status: null, findings: '', reason: '' }
  })

  return values
}

export function parsePhysicalExamValues(raw) {
  const parsed = parseJsonObject(raw)
  const source = parsed.values && typeof parsed.values === 'object'
    ? parsed.values
    : parsed
  const values = emptyPhysicalExamValues()
  physicalExamAreas.forEach(area => {
    const row = source[area.key]
    if (!row || typeof row !== 'object') {
      return
    }
    values[area.key] = {
      status: normalizeStatus(row.status, area),
      findings: String(row.findings ?? '').trim(),
      reason: String(row.reason ?? '').trim(),
    }
  })

  return values
}

export function serializePhysicalExamValues(values) {
  const next = {}
  physicalExamAreas.forEach(area => {
    const row = values?.[area.key] || {}
    const status = normalizeStatus(row.status, area)
    const findings = String(row.findings || '').trim()
    const reason = String(row.reason || '').trim()
    if (!status && !findings && !reason) {
      return
    }
    const item = {}
    if (status) {
      item.status = status
    }
    if (findings) {
      item.findings = findings
    }
    if (reason) {
      item.reason = reason
    }
    next[area.key] = item
  })

  return JSON.stringify({
    section: physicalExamDefinition,
    values: next,
  })
}

export function physicalExamNeedsFindings(status) {
  return status === physicalExamStatuses.abnormal
}

export function physicalExamNeedsReason(status, area) {
  return status === physicalExamStatuses.deferred && area?.allowDeferred
}

export function physicalExamIssues(values, required) {
  const issues = []
  physicalExamAreas.forEach(area => {
    const row = values?.[area.key] || {}
    const status = normalizeStatus(row.status, area)
    const findings = String(row.findings || '').trim()
    if (!status) {
      if (required) {
        issues.push({
          key: area.key,
          labelKey: area.labelKey,
          code: physicalExamIssueCodes.status,
        })
      }

      return
    }
    if (status === physicalExamStatuses.abnormal && !findings) {
      issues.push({
        key: area.key,
        labelKey: area.labelKey,
        code: physicalExamIssueCodes.findings,
      })
    }
  })

  return issues
}

export function physicalExamAnsweredCount(values) {
  return physicalExamAreas.filter(area => {
    const row = values?.[area.key] || {}
    const status = normalizeStatus(row.status, area)
    if (!status) {
      return false
    }
    if (status === physicalExamStatuses.abnormal
      && !String(row.findings || '').trim()) {
      return false
    }

    return true
  }).length
}

export function physicalExamStatusOptions(area, t) {
  const options = [
    { label: t('peSelectStatus'), value: '' },
    { label: t('peStatusNormal'), value: physicalExamStatuses.normal },
    {
      label: t('peStatusAbnormal'),
      value: physicalExamStatuses.abnormal,
    },
    {
      label: t('peStatusNotExamined'),
      value: physicalExamStatuses.notExamined,
    },
  ]
  if (area?.allowDeferred) {
    options.push({
      label: t('peStatusDeferred'),
      value: physicalExamStatuses.deferred,
    })
  }

  return options
}
