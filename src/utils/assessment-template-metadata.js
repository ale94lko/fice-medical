/**
 * Optional clinical / measurement metadata on template questions and options.
 * Preserved for future Care Plan outcome measures; not shown in MVP UI.
 */

export function optionalString(value) {
  const s = String(value ?? '').trim()

  return s || null
}

export function optionalBoolean(value) {
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true
  }
  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false
  }

  return null
}

export function optionalNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) ? n : null
}

function tokenFromLabel(label) {
  return String(label ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * Normalizes one template option (string legacy or structured object).
 * @returns {{ label: string, value: string, score: number|null }}
 */
export function normalizeTemplateOption(raw, index = 0) {
  if (raw == null) {
    return null
  }
  if (typeof raw === 'string' || typeof raw === 'number') {
    const label = String(raw).trim()
    if (!label) {
      return null
    }

    return {
      label,
      value: label,
      score: null,
      clinicalValue: null,
    }
  }
  if (typeof raw !== 'object') {
    return null
  }

  const label = String(
    raw.label ?? raw.name ?? raw.text ?? raw.title ?? '',
  ).trim()
  if (!label) {
    return null
  }
  const value = String(
    raw.value ?? raw.code ?? raw.key ?? tokenFromLabel(label) ?? index,
  ).trim()
  const score = optionalNumber(
    raw.score ?? raw.clinical_value ?? raw.clinicalValue,
  )

  return {
    label,
    value: value || label,
    score,
    clinicalValue: score,
  }
}

export function normalizeTemplateOptionList(raw) {
  if (!Array.isArray(raw)) {
    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      if (!trimmed) {
        return []
      }
      try {
        const parsed = JSON.parse(trimmed)

        return normalizeTemplateOptionList(parsed)
      } catch {
        return []
      }
    }

    return []
  }

  return raw
    .map((item, index) => normalizeTemplateOption(item, index))
    .filter(Boolean)
}

export function normalizeQuestionClinicalMetadata(question) {
  const q = question ?? {}

  return {
    clinicalKey: optionalString(q.clinical_key ?? q.clinicalKey),
    measurementEnabled: Boolean(
      q.measurement_enabled ?? q.measurementEnabled ?? false,
    ),
    measurementType: optionalString(
      q.measurement_type ?? q.measurementType,
    ),
    measurementDirection: optionalString(
      q.measurement_direction ?? q.measurementDirection,
    ),
    measurementUnit: optionalString(
      q.measurement_unit ?? q.measurementUnit,
    ),
    scoreGroup: optionalString(q.score_group ?? q.scoreGroup),
  }
}

export function normalizeSectionClinicalMetadata(section) {
  const s = section ?? {}

  return {
    clinicalKey: optionalString(s.clinical_key ?? s.clinicalKey),
    measurementEnabled: Boolean(
      s.measurement_enabled ?? s.measurementEnabled ?? false,
    ),
    scoreGroup: optionalString(s.score_group ?? s.scoreGroup),
  }
}

export function optionLabel(option) {
  if (option == null) {
    return ''
  }
  if (typeof option === 'string' || typeof option === 'number') {
    return String(option).trim()
  }

  return String(option.label ?? option.value ?? '').trim()
}

export function optionValue(option) {
  if (option == null) {
    return ''
  }
  if (typeof option === 'string' || typeof option === 'number') {
    return String(option).trim()
  }

  return String(option.value ?? option.label ?? '').trim()
}

export function optionKey(option, index = 0) {
  const value = optionValue(option)

  return value || `opt-${index}`
}

export function optionClinicalScore(option) {
  if (option == null || typeof option !== 'object') {
    return null
  }

  return optionalNumber(
    option.score ?? option.clinicalValue ?? option.clinical_value,
  )
}

/** FormSelect / q-option shape; value is what gets stored in answers. */
export function optionsForSelectField(options) {
  return (options ?? []).map(opt => ({
    label: optionLabel(opt),
    value: optionValue(opt),
  }))
}

export function findOptionByStoredValue(options, storedValue) {
  const needle = String(storedValue ?? '').trim()
  if (!needle) {
    return null
  }

  return (options ?? []).find(
    opt => optionValue(opt) === needle || optionLabel(opt) === needle,
  ) ?? null
}

/**
 * Resolves numeric clinical value from an answer (for future outcome measures).
 */
export function resolveAnswerClinicalValue(question, answerValue) {
  const options = question?.options ?? []
  if (Array.isArray(answerValue)) {
    return answerValue
      .map(val => optionClinicalScore(findOptionByStoredValue(options, val)))
      .filter(score => score != null)
  }
  const direct = optionalNumber(answerValue)
  if (direct != null) {
    return direct
  }
  const option = findOptionByStoredValue(options, answerValue)

  return optionClinicalScore(option)
}

export function findQuestionByClinicalKey(template, clinicalKey) {
  const key = String(clinicalKey ?? '').trim()
  if (!key || !template?.sections) {
    return null
  }
  for (const section of template.sections) {
    for (const question of section.questions ?? []) {
      if (question.clinicalMetadata?.clinicalKey === key) {
        return { section, question }
      }
    }
  }

  return null
}

export function listMeasurementQuestions(template) {
  const list = []
  for (const section of template?.sections ?? []) {
    for (const question of section.questions ?? []) {
      if (question.clinicalMetadata?.measurementEnabled) {
        list.push({ section, question })
      }
    }
  }

  return list
}
