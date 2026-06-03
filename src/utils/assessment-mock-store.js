/* eslint-disable camelcase -- mock persistence mirrors API snake_case */
import { ASSESSMENT_TEMPLATE_SEED } from 'src/data/assessment-templates-seed.js'
import { assessmentStatuses } from 'components/constants.js'
import {
  answersMapFromArray,
  answersArrayFromMap,
  validateRequiredAnswers,
} from 'src/utils/assessment-answers.js'
import {
  normalizeAssessmentMeasurements,
} from 'src/utils/assessment-measurements.js'
import {
  normalizeAssessmentRecord,
  normalizeAssessmentTemplate,
  normalizeAssessmentTemplateSummary,
} from 'src/utils/assessment-normalize.js'

function applyRecordMeasurements(record, payload = {}) {
  if (payload?.weight === undefined && payload?.height === undefined) {
    return
  }
  const normalized = normalizeAssessmentMeasurements({
    weight: payload.weight ?? '',
    height: payload.height ?? '',
  })
  record.weight = normalized.weight
  record.height = normalized.height
  record.bmi = normalized.bmi
}

const STORAGE_KEY = 'fice-assessment-mock-v1'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { assessmentsByPatient: {} }
    }
    const parsed = JSON.parse(raw)

    return {
      assessmentsByPatient: parsed?.assessmentsByPatient ?? {},
    }
  } catch {
    return { assessmentsByPatient: {} }
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function nextId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getTemplate(templateId) {
  const found = ASSESSMENT_TEMPLATE_SEED.find(
    item => item.id === templateId,
  )

  return found ? normalizeAssessmentTemplate(found) : null
}

export function mockListTemplates() {
  return ASSESSMENT_TEMPLATE_SEED
    .filter(t => String(t.status ?? 'active').toLowerCase() === 'active')
    .map(normalizeAssessmentTemplateSummary)
}

export function mockGetTemplate(templateId) {
  return getTemplate(templateId)
}

export function mockListPatientAssessments(patientId) {
  const state = loadState()
  const list = state.assessmentsByPatient[String(patientId)] ?? []

  return list.map(item => normalizeAssessmentRecord(item))
}

export function mockCreateAssessment(patientId, payload) {
  const template = getTemplate(payload?.templateId)
  if (!template) {
    throw new Error('Template not found')
  }
  const state = loadState()
  const pid = String(patientId).trim()
  const assessment = {
    id: nextId('asm'),
    patient_id: pid,
    template_id: template.id,
    template_name: template.name,
    status: assessmentStatuses.draft,
    assigned_clinician_id: payload?.assignedClinicianId ?? null,
    assessment_date: payload?.assessmentDate ?? '',
    completed_at: null,
    weight: null,
    height: null,
    bmi: null,
    answers: [],
  }
  applyRecordMeasurements(assessment, payload)
  if (!state.assessmentsByPatient[pid]) {
    state.assessmentsByPatient[pid] = []
  }
  state.assessmentsByPatient[pid].unshift(assessment)
  saveState(state)

  return {
    assessmentId: assessment.id,
    status: assessment.status,
    bmi: assessment.bmi,
  }
}

function findAssessment(state, patientId, assessmentId) {
  const list = state.assessmentsByPatient[String(patientId)] ?? []

  return list.find(item => String(item.id) === String(assessmentId)) ?? null
}

export function mockGetPatientAssessment(patientId, assessmentId) {
  const state = loadState()
  const record = findAssessment(state, patientId, assessmentId)
  if (!record) {
    throw new Error('Assessment not found')
  }
  const template = getTemplate(record.template_id)
  if (!template) {
    throw new Error('Template not found')
  }

  return {
    assessment: normalizeAssessmentRecord(record),
    template,
    answers: (record.answers ?? []).map(a => ({
      questionId: a.question_id ?? a.questionId,
      value: a.value,
    })),
  }
}

export function mockSaveDraft(patientId, assessmentId, payload) {
  const state = loadState()
  const record = findAssessment(state, patientId, assessmentId)
  if (!record) {
    throw new Error('Assessment not found')
  }
  if (record.status === assessmentStatuses.completed) {
    throw new Error('Assessment already completed')
  }
  const answersMap = Array.isArray(payload?.answers)
    ? answersMapFromArray(payload.answers)
    : payload?.answersMap ?? answersMapFromArray(payload?.answers)
  record.answers = answersArrayFromMap(answersMap).map(item => ({
    question_id: item.questionId,
    value: item.value,
  }))
  applyRecordMeasurements(record, payload)
  record.status = assessmentStatuses.draft
  saveState(state)

  return {
    assessmentId: record.id,
    status: record.status,
    bmi: record.bmi,
    message: 'Assessment draft saved successfully.',
  }
}

export function mockCompleteAssessment(patientId, assessmentId, payload) {
  const state = loadState()
  const record = findAssessment(state, patientId, assessmentId)
  if (!record) {
    throw new Error('Assessment not found')
  }
  if (record.status === assessmentStatuses.completed) {
    throw new Error('Assessment already completed')
  }
  const template = getTemplate(record.template_id)
  applyRecordMeasurements(record, payload)
  const answersMap = answersMapFromArray(payload?.answers)
  const errors = validateRequiredAnswers(template, answersMap)
  if (Object.keys(errors).length) {
    const err = new Error('Required fields missing')
    err.code = 'ASSESSMENT_VALIDATION'
    err.validationErrors = errors
    throw err
  }
  record.answers = answersArrayFromMap(answersMap).map(item => ({
    question_id: item.questionId,
    value: item.value,
  }))
  record.status = assessmentStatuses.completed
  record.completed_at = new Date().toISOString()
  saveState(state)

  return {
    assessmentId: record.id,
    status: record.status,
    bmi: record.bmi,
    message: 'Assessment completed successfully.',
  }
}
