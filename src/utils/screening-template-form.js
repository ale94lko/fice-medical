import {
  screeningFieldTypes,
  screeningTemplateStatusValues,
} from 'components/constants.js'
import { normalizeScreeningTemplate } from 'src/utils/screening-normalize.js'
import { normalizeTemplateOption } from
  'src/utils/screening-template-metadata.js'

const OPTION_FIELD_TYPES = new Set([
  screeningFieldTypes.select,
  screeningFieldTypes.radio,
  screeningFieldTypes.chips,
])

let keyCounter = 0

function nextKey(prefix) {
  keyCounter += 1

  return `${prefix}-${Date.now()}-${keyCounter}`
}

function trim(value) {
  return String(value ?? '').trim()
}

export function fieldTypeRequiresOptions(fieldType) {
  return OPTION_FIELD_TYPES.has(trim(fieldType).toLowerCase())
}

export function normalizeTemplateStatusValue(status) {
  const upper = trim(status).toUpperCase()
  const allowed = Object.values(screeningTemplateStatusValues)

  return allowed.includes(upper)
    ? upper
    : screeningTemplateStatusValues.active
}

export function createEmptyOptionForm() {
  return {
    label: '',
    value: '',
    score: '',
    decisionValue: '',
    clinicalMeaning: '',
  }
}

export function createEmptyInterpretationRange() {
  return {
    minScore: '',
    maxScore: '',
    code: '',
    label: '',
  }
}

export function createEmptyQuestionForm() {
  return {
    key: nextKey('q'),
    id: null,
    label: '',
    helpText: '',
    fieldType: screeningFieldTypes.text,
    required: false,
    options: [],
  }
}

export function createEmptySectionForm() {
  return {
    key: nextKey('s'),
    id: null,
    title: '',
    description: '',
    questions: [createEmptyQuestionForm()],
  }
}

export function createEmptyScreeningTemplateForm() {
  return {
    id: null,
    name: '',
    description: '',
    category: '',
    status: screeningTemplateStatusValues.active,
    version: 1,
    inUse: false,
    interpretationRanges: [],
    sections: [createEmptySectionForm()],
  }
}

function resolveTemplateInUse(raw = {}) {
  const flag = raw.in_use ?? raw.inUse ?? raw.is_in_use ?? raw.isInUse
    ?? raw.locked ?? raw.is_locked ?? raw.isLocked
  if (typeof flag === 'boolean') {
    return flag
  }
  const count = Number(
    raw.usage_count ?? raw.usageCount
      ?? raw.screening_count ?? raw.screeningCount ?? 0,
  )

  return Number.isFinite(count) && count > 0
}

function optionFormFromNormalized(option) {
  const normalized = normalizeTemplateOption(option)
  if (!normalized) {
    return createEmptyOptionForm()
  }

  return {
    label: normalized.label || '',
    value: normalized.value === normalized.label
      ? ''
      : (normalized.value || ''),
    score: normalized.score == null ? '' : String(normalized.score),
    decisionValue: normalized.decisionValue || '',
    clinicalMeaning: normalized.clinicalMeaning || '',
  }
}

function rangeFormFromNormalized(range) {
  const row = range ?? {}

  return {
    minScore: row.minScore == null && row.min_score == null
      ? ''
      : String(row.minScore ?? row.min_score),
    maxScore: row.maxScore == null && row.max_score == null
      ? ''
      : String(row.maxScore ?? row.max_score),
    code: trim(row.code),
    label: trim(row.label),
  }
}

function questionFormFromNormalized(question) {
  return {
    key: nextKey('q'),
    id: question.id || null,
    label: question.label,
    helpText: question.helpText ?? '',
    fieldType: question.fieldType,
    required: Boolean(question.required),
    options: (question.options ?? [])
      .map(optionFormFromNormalized)
      .filter(option => trim(option.label)),
  }
}

function sectionFormFromNormalized(section) {
  return {
    key: nextKey('s'),
    id: section.id || null,
    title: section.title,
    description: section.description ?? '',
    questions: (section.questions ?? []).map(questionFormFromNormalized),
  }
}

export function screeningTemplateFormFromApi(raw = {}) {
  const normalized = normalizeScreeningTemplate(raw)
  const sections = normalized.sections.map(sectionFormFromNormalized)

  return {
    id: normalized.id || raw.id || null,
    name: normalized.name,
    description: normalized.description ?? '',
    category: normalized.category ?? '',
    status: normalizeTemplateStatusValue(raw.status ?? normalized.status),
    version: normalized.version,
    inUse: resolveTemplateInUse(raw),
    interpretationRanges: (
      normalized.interpretationRanges
      ?? raw.interpretation_ranges
      ?? raw.interpretationRanges
      ?? []
    ).map(rangeFormFromNormalized),
    sections: sections.length ? sections : [createEmptySectionForm()],
  }
}

function questionHasContent(question) {
  if (trim(question.label) || trim(question.helpText)) {
    return true
  }

  return (question.options ?? []).some(option =>
    trim(option?.label ?? option),
  )
}

function sectionHasContent(section) {
  if (trim(section.title) || trim(section.description)) {
    return true
  }

  return (section.questions ?? []).some(questionHasContent)
}

export function screeningTemplateFormHasContent(form) {
  if (!form) {
    return false
  }
  if (trim(form.name) || trim(form.description) || trim(form.category)) {
    return true
  }

  return (form.sections ?? []).some(sectionHasContent)
}

export function cloneScreeningTemplateForm(form) {
  const base = form ?? createEmptyScreeningTemplateForm()

  return {
    ...createEmptyScreeningTemplateForm(),
    ...base,
    interpretationRanges: (base.interpretationRanges ?? []).map(range => ({
      ...createEmptyInterpretationRange(),
      ...range,
    })),
    sections: (base.sections ?? []).map(section => ({
      ...section,
      key: section.key ?? nextKey('s'),
      questions: (section.questions ?? []).map(question => ({
        ...question,
        key: question.key ?? nextKey('q'),
        options: (question.options ?? []).map(option => (
          typeof option === 'object' && option != null
            ? { ...createEmptyOptionForm(), ...option }
            : { ...createEmptyOptionForm(), label: trim(option) }
        )),
      })),
    })),
  }
}

function optionHasLabel(option) {
  return Boolean(trim(option?.label ?? option))
}

function parseOptionalScore(value) {
  const text = trim(value)
  if (!text) {
    return null
  }
  const n = Number(text)
  if (!Number.isFinite(n)) {
    return undefined
  }

  return n
}

function buildOptionRequest(option) {
  const label = trim(option?.label ?? option)
  if (!label) {
    return null
  }
  const score = parseOptionalScore(option?.score)
  const decisionValue = trim(option?.decisionValue)
  const clinicalMeaning = trim(option?.clinicalMeaning)
  const value = trim(option?.value)
  if (
    score == null
    && !decisionValue
    && !clinicalMeaning
    && (!value || value === label)
  ) {
    return label
  }
  /* eslint-disable camelcase -- API payload uses snake_case */
  const payload = { label }
  if (value && value !== label) {
    payload.value = value
  }
  if (score != null) {
    payload.score = score
  }
  if (decisionValue) {
    payload.decision_value = decisionValue
  }
  if (clinicalMeaning) {
    payload.clinical_meaning = clinicalMeaning
  }
  /* eslint-enable camelcase */

  return payload
}

function buildQuestionRequest(question, index) {
  const fieldType = trim(question.fieldType).toLowerCase()
  /* eslint-disable camelcase -- API payload uses snake_case */
  const payload = {
    label: trim(question.label),
    help_text: trim(question.helpText) || null,
    field_type: fieldType,
    required: Boolean(question.required),
    display_order: index,
  }
  /* eslint-enable camelcase */
  if (fieldTypeRequiresOptions(fieldType)) {
    payload.options = (question.options ?? [])
      .map(buildOptionRequest)
      .filter(Boolean)
  }

  return payload
}

function buildInterpretationRangeRequest(range) {
  const minText = trim(range?.minScore)
  const maxText = trim(range?.maxScore)
  const code = trim(range?.code)
  const label = trim(range?.label)
  if (!minText && !maxText && !code && !label) {
    return null
  }
  /* eslint-disable camelcase -- API payload uses snake_case */
  return {
    min_score: minText === '' ? null : Number(minText),
    max_score: maxText === '' ? null : Number(maxText),
    code: code || null,
    label: label || null,
  }
  /* eslint-enable camelcase */
}

function buildSectionRequest(section, index) {
  /* eslint-disable camelcase -- API payload uses snake_case */
  return {
    title: trim(section.title),
    description: trim(section.description) || null,
    display_order: index,
    questions: (section.questions ?? []).map(buildQuestionRequest),
  }
  /* eslint-enable camelcase */
}

export function buildScreeningTemplateRequest(form = {}, options = {}) {
  const includeStructure = options.includeStructure !== false
  const body = {
    name: trim(form.name),
    description: trim(form.description) || null,
    category: trim(form.category) || null,
    status: normalizeTemplateStatusValue(form.status),
  }
  if (includeStructure) {
    body.sections = (form.sections ?? []).map(buildSectionRequest)
    /* eslint-disable camelcase -- API payload uses snake_case */
    body.interpretation_ranges = (form.interpretationRanges ?? [])
      .map(buildInterpretationRangeRequest)
      .filter(Boolean)
    /* eslint-enable camelcase */
  }

  return body
}

function validateQuestion(question, t) {
  const errors = {}
  if (!trim(question.label)) {
    errors.label = t('screeningTemplateQuestionLabelRequired')
  }
  if (fieldTypeRequiresOptions(question.fieldType)) {
    const options = (question.options ?? []).filter(optionHasLabel)
    if (!options.length) {
      errors.options = t('screeningTemplateOptionsRequired')
    }
    const invalidScore = (question.options ?? []).some(option =>
      parseOptionalScore(option?.score) === undefined,
    )
    if (invalidScore) {
      errors.options = t('screeningTemplateOptionScoreInvalid')
    }
  }

  return errors
}

function validateSection(section, t) {
  const sectionErrors = { title: '', empty: '', questions: {} }
  if (!trim(section.title)) {
    sectionErrors.title = t('screeningTemplateSectionTitleRequired')
  }
  const questions = section.questions ?? []
  if (!questions.length) {
    sectionErrors.empty = t('screeningTemplateQuestionsRequired')
  }
  questions.forEach(question => {
    const questionErrors = validateQuestion(question, t)
    if (Object.keys(questionErrors).length) {
      sectionErrors.questions[question.key] = questionErrors
    }
  })
  const hasIssues = sectionErrors.title || sectionErrors.empty
    || Object.keys(sectionErrors.questions).length > 0

  return hasIssues ? sectionErrors : null
}

export function validateScreeningTemplateForm(form, t, options = {}) {
  const validateStructure = options.validateStructure !== false
  const errors = { fields: {}, sections: {} }
  if (!trim(form.name)) {
    errors.fields.name = t('screeningTemplateNameRequired')
  }
  if (validateStructure) {
    const sections = form.sections ?? []
    if (!sections.length) {
      errors.fields.sections = t('screeningTemplateSectionsRequired')
    }
    sections.forEach(section => {
      const sectionErrors = validateSection(section, t)
      if (sectionErrors) {
        errors.sections[section.key] = sectionErrors
      }
    })
    const rangeError = validateInterpretationRanges(
      form.interpretationRanges,
      t,
    )
    if (rangeError) {
      errors.fields.interpretationRanges = rangeError
    } else if (
      hasConfiguredInterpretationRanges(form.interpretationRanges)
      && !formHasScoredOption(form)
    ) {
      errors.fields.interpretationRanges = t(
        'screeningTemplateRangesNeedScores',
      )
    }
  }

  return errors
}

function optionHasNumericScore(option) {
  return parseOptionalScore(option?.score) != null
}

function questionHasScoredOption(question) {
  return (question.options ?? []).some(optionHasNumericScore)
}

function formHasScoredOption(form) {
  return (form?.sections ?? []).some(section =>
    (section.questions ?? []).some(questionHasScoredOption),
  )
}

function hasConfiguredInterpretationRanges(ranges) {
  return (ranges ?? [])
    .map(buildInterpretationRangeRequest)
    .filter(Boolean)
    .length > 0
}

function validateInterpretationRanges(ranges, t) {
  const rows = (ranges ?? [])
    .map(buildInterpretationRangeRequest)
    .filter(Boolean)
  if (!rows.length) {
    return ''
  }
  const codes = new Set()
  const ordered = []
  for (const row of rows) {
    if (!Number.isFinite(row.min_score) || !Number.isFinite(row.max_score)) {
      return t('screeningTemplateRangeMinMaxRequired')
    }
    if (row.min_score > row.max_score) {
      return t('screeningTemplateRangeMinGreaterThanMax')
    }
    if (!row.code || !row.label) {
      return t('screeningTemplateRangeCodeLabelRequired')
    }
    const codeKey = String(row.code).toUpperCase()
    if (codes.has(codeKey)) {
      return t('screeningTemplateRangeDuplicateCode')
    }
    codes.add(codeKey)
    ordered.push(row)
  }
  ordered.sort((a, b) => a.min_score - b.min_score)
  for (let i = 1; i < ordered.length; i += 1) {
    if (ordered[i - 1].max_score >= ordered[i].min_score) {
      return t('screeningTemplateRangeOverlap')
    }
  }

  return ''
}

export function screeningTemplateFormHasErrors(errors) {
  if (!errors) {
    return false
  }
  if (Object.keys(errors.fields ?? {}).length) {
    return true
  }

  return Object.keys(errors.sections ?? {}).length > 0
}
