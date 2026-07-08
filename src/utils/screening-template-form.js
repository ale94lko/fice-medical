import {
  screeningFieldTypes,
  screeningTemplateStatusValues,
} from 'components/constants.js'
import { normalizeScreeningTemplate } from 'src/utils/screening-normalize.js'
import { optionLabel } from 'src/utils/screening-template-metadata.js'

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

function questionFormFromNormalized(question) {
  return {
    key: nextKey('q'),
    id: question.id || null,
    label: question.label,
    helpText: question.helpText ?? '',
    fieldType: question.fieldType,
    required: Boolean(question.required),
    options: (question.options ?? []).map(optionLabel).filter(Boolean),
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
    sections: sections.length ? sections : [createEmptySectionForm()],
  }
}

function questionHasContent(question) {
  if (trim(question.label) || trim(question.helpText)) {
    return true
  }

  return (question.options ?? []).some(option => trim(option))
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
    sections: (base.sections ?? []).map(section => ({
      ...section,
      key: section.key ?? nextKey('s'),
      questions: (section.questions ?? []).map(question => ({
        ...question,
        key: question.key ?? nextKey('q'),
        options: [...(question.options ?? [])],
      })),
    })),
  }
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
      .map(option => trim(option))
      .filter(Boolean)
  }

  return payload
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
  }

  return body
}

function validateQuestion(question, t) {
  const errors = {}
  if (!trim(question.label)) {
    errors.label = t('screeningTemplateQuestionLabelRequired')
  }
  if (fieldTypeRequiresOptions(question.fieldType)) {
    const options = (question.options ?? []).map(trim).filter(Boolean)
    if (!options.length) {
      errors.options = t('screeningTemplateOptionsRequired')
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
  }

  return errors
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
