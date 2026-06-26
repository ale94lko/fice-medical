/* eslint-disable camelcase -- mock persistence mirrors API snake_case */
import { SCREENING_TEMPLATE_SEED } from 'src/data/screening-templates-seed.js'
import { screeningStatuses } from 'components/constants.js'
import {
  answersMapFromArray,
  answersArrayFromMap,
  validateRequiredAnswers,
} from 'src/utils/screening-answers.js'
import {
  normalizeScreeningMeasurements,
} from 'src/utils/screening-measurements.js'
import {
  normalizeScreeningRecord,
  normalizeScreeningTemplate,
  normalizeScreeningTemplateSummary,
} from 'src/utils/screening-normalize.js'

function applyRecordMeasurements(record, payload = {}) {
  if (payload?.weight === undefined && payload?.height === undefined) {
    return
  }
  const normalized = normalizeScreeningMeasurements({
    weight: payload.weight ?? '',
    height: payload.height ?? '',
  })
  record.weight = normalized.weight
  record.height = normalized.height
  record.bmi = normalized.bmi
}

const STORAGE_KEY = 'fice-screening-mock-v1'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { screeningsByPatient: {} }
    }
    const parsed = JSON.parse(raw)

    return {
      screeningsByPatient: parsed?.screeningsByPatient ?? {},
    }
  } catch {
    return { screeningsByPatient: {} }
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function nextId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getTemplate(templateId) {
  const found = SCREENING_TEMPLATE_SEED.find(
    item => item.id === templateId,
  )

  return found ? normalizeScreeningTemplate(found) : null
}

export function mockListTemplates() {
  return SCREENING_TEMPLATE_SEED
    .filter(t => String(t.status ?? 'active').toLowerCase() === 'active')
    .map(normalizeScreeningTemplateSummary)
}

export function mockGetTemplate(templateId) {
  return getTemplate(templateId)
}

export function mockListClientScreenings(patientId) {
  const state = loadState()
  const list = state.screeningsByPatient[String(patientId)] ?? []

  return list.map(item => normalizeScreeningRecord(item))
}

export function mockCreateClientScreening(patientId, payload) {
  const template = getTemplate(payload?.templateId)
  if (!template) {
    throw new Error('Template not found')
  }
  const state = loadState()
  const pid = String(patientId).trim()
  const screening = {
    id: nextId('scr'),
    patient_id: pid,
    template_id: template.id,
    template_name: template.name,
    status: screeningStatuses.draft,
    assigned_clinician_id: payload?.assignedClinicianId ?? null,
    screening_date: payload?.screeningDate ?? '',
    completed_at: null,
    weight: null,
    height: null,
    bmi: null,
    answers: [],
  }
  applyRecordMeasurements(screening, payload)
  if (!state.screeningsByPatient[pid]) {
    state.screeningsByPatient[pid] = []
  }
  state.screeningsByPatient[pid].unshift(screening)
  saveState(state)

  return {
    screeningId: screening.id,
    status: screening.status,
    bmi: screening.bmi,
  }
}

function findScreening(state, patientId, screeningId) {
  const list = state.screeningsByPatient[String(patientId)] ?? []

  return list.find(item => String(item.id) === String(screeningId)) ?? null
}

export function mockGetClientScreening(patientId, screeningId) {
  const state = loadState()
  const record = findScreening(state, patientId, screeningId)
  if (!record) {
    throw new Error('Screening not found')
  }
  const template = getTemplate(record.template_id)
  if (!template) {
    throw new Error('Template not found')
  }

  return {
    screening: normalizeScreeningRecord(record),
    template,
    answers: (record.answers ?? []).map(a => ({
      questionId: a.question_id ?? a.questionId,
      value: a.value,
    })),
  }
}

export function mockSaveDraft(patientId, screeningId, payload) {
  const state = loadState()
  const record = findScreening(state, patientId, screeningId)
  if (!record) {
    throw new Error('Screening not found')
  }
  if (record.status === screeningStatuses.completed) {
    throw new Error('Screening already completed')
  }
  const answersMap = Array.isArray(payload?.answers)
    ? answersMapFromArray(payload.answers)
    : payload?.answersMap ?? answersMapFromArray(payload?.answers)
  record.answers = answersArrayFromMap(answersMap).map(item => ({
    question_id: item.questionId,
    value: item.value,
  }))
  applyRecordMeasurements(record, payload)
  record.status = screeningStatuses.draft
  saveState(state)

  return {
    screeningId: record.id,
    status: record.status,
    bmi: record.bmi,
    message: 'Screening draft saved successfully.',
  }
}

export function mockCompleteScreening(patientId, screeningId, payload) {
  const state = loadState()
  const record = findScreening(state, patientId, screeningId)
  if (!record) {
    throw new Error('Screening not found')
  }
  if (record.status === screeningStatuses.completed) {
    throw new Error('Screening already completed')
  }
  const template = getTemplate(record.template_id)
  applyRecordMeasurements(record, payload)
  const answersMap = answersMapFromArray(payload?.answers)
  const errors = validateRequiredAnswers(template, answersMap)
  if (Object.keys(errors).length) {
    const err = new Error('Required fields missing')
    err.code = 'SCREENING_VALIDATION'
    err.validationErrors = errors
    throw err
  }
  record.answers = answersArrayFromMap(answersMap).map(item => ({
    question_id: item.questionId,
    value: item.value,
  }))
  record.status = screeningStatuses.completed
  record.completed_at = new Date().toISOString()
  saveState(state)

  return {
    screeningId: record.id,
    status: record.status,
    bmi: record.bmi,
    message: 'Screening completed successfully.',
  }
}
