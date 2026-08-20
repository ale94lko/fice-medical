export const assessmentPlanDefinition = 'ASSESSMENT_PLAN'

export const assessmentPlanIssueCodes = {
  plan: 'PLAN_REQUIRED',
}

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

export function normalizeDiagnosisCode(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[.\s]/g, '')
}

function asNumber(value) {
  const n = Number(value)

  return Number.isFinite(n) ? n : null
}

function parseStoredItems(raw) {
  const parsed = parseJsonObject(raw)
  const source = parsed.values
  const rows = Array.isArray(source)
    ? source
    : (source && typeof source === 'object' ? Object.values(source) : [])

  return rows.map(row => {
    if (!row || typeof row !== 'object') {
      return null
    }

    return {
      encounterDiagnosisId: asNumber(
        row.encounterDiagnosisId ?? row.encounter_diagnosis_id,
      ),
      diagnosisCode: String(
        row.diagnosisCode ?? row.diagnosis_code ?? '',
      ).trim(),
      diagnosisDescription: String(
        row.diagnosisDescription
          ?? row.diagnosis_description
          ?? '',
      ).trim(),
      isPrimary: row.isPrimary === true || row.is_primary === true,
      plan: String(row.plan ?? '').trim(),
    }
  }).filter(Boolean)
}

export function orderedEncounterDiagnoses(diagnoses) {
  return [...(diagnoses || [])].sort((a, b) => {
    const primaryA = a?.isPrimary ? 0 : 1
    const primaryB = b?.isPrimary ? 0 : 1
    if (primaryA !== primaryB) {
      return primaryA - primaryB
    }
    const seqA = Number(a?.sequenceNo) || 0
    const seqB = Number(b?.sequenceNo) || 0
    if (seqA !== seqB) {
      return seqA - seqB
    }

    return (Number(a?.id) || 0) - (Number(b?.id) || 0)
  })
}

export function isAssessmentPlanSection(field) {
  const parsed = parseJsonObject(
    field?.configurationJson ?? field?.configuration_json,
  )
  const token = String(
    parsed.definition || field?.structuredDefinition || '',
  ).trim().toUpperCase()
  if (token === assessmentPlanDefinition) {
    return true
  }
  const type = String(field?.sectionType || '').toUpperCase()
  const key = String(field?.fieldKey || field?.sectionKey || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')
  const planKey = key === 'assessment_plan'
    || key === 'assessment_and_plan'
    || key === 'plan_documentation'
    || key === 'plan'
  if (!planKey) {
    return false
  }
  if (key === 'plan') {
    return type === 'STRUCTURED_SECTION'
  }

  return true
}

export function resolveAssessmentPlanRows(diagnoses, raw) {
  const ordered = orderedEncounterDiagnoses(diagnoses)
  const stored = parseStoredItems(raw)
  const currentIds = new Set(
    ordered.map(row => row.id).filter(id => id != null),
  )
  const used = new Set()

  return ordered.map(diagnosis => {
    let storedIndex = stored.findIndex(item =>
      item.encounterDiagnosisId != null
      && item.encounterDiagnosisId === diagnosis.id)
    if (storedIndex < 0) {
      const code = normalizeDiagnosisCode(diagnosis.icd10Code)
      storedIndex = stored.findIndex((item, index) => {
        if (used.has(index)) {
          return false
        }
        if (item.encounterDiagnosisId != null
          && currentIds.has(item.encounterDiagnosisId)) {
          return false
        }

        return code
          && code === normalizeDiagnosisCode(item.diagnosisCode)
      })
    }
    let plan = ''
    if (storedIndex >= 0) {
      used.add(storedIndex)
      plan = stored[storedIndex].plan || ''
    }

    return {
      diagnosis,
      plan,
    }
  })
}

export function serializeAssessmentPlanValues(rows) {
  const values = (rows || []).map(row => {
    const diagnosis = row.diagnosis || {}
    const plan = String(row.plan || '').trim()
    const payload = {
      encounterDiagnosisId: diagnosis.id ?? null,
      diagnosisCode: diagnosis.icd10Code || '',
      diagnosisDescription: diagnosis.description || '',
      isPrimary: Boolean(diagnosis.isPrimary),
    }
    if (plan) {
      payload.plan = plan
    }

    return payload
  })

  return JSON.stringify({
    section: assessmentPlanDefinition,
    values,
  })
}

export function assessmentPlanIssues(rows, required) {
  if (!required) {
    return []
  }
  if (!rows.length) {
    return [{
      key: 'no-diagnoses',
      code: assessmentPlanIssueCodes.plan,
      diagnosis: null,
    }]
  }

  return rows.filter(row => !String(row.plan || '').trim()).map(row => ({
    key: String(row.diagnosis?.id ?? row.diagnosis?.icd10Code),
    code: assessmentPlanIssueCodes.plan,
    diagnosis: row.diagnosis,
  }))
}

export function assessmentPlanAnsweredCount(rows) {
  return rows.filter(row => String(row.plan || '').trim()).length
}

export function diagnosisHeading(diagnosis) {
  const code = String(diagnosis?.icd10Code || '').trim()
  const description = String(diagnosis?.description || '').trim()
  if (code && description) {
    return `${code} — ${description}`
  }

  return code || description
}
