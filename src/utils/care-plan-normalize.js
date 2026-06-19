/* eslint-disable camelcase -- API payload keys use snake_case */
import {
  carePlanGoalStatuses,
  carePlanOutcomeSourceTypes,
  carePlanProgressDirections,
  carePlanProgressStatuses,
  carePlanStatuses,
} from 'components/constants.js'
import { isoDateToUsDateString } from 'src/utils/client-form.js'
import { refreshCarePlanProgress } from 'src/utils/care-plan-orders.js'
import { formatClinicianDisplayLabel } from 'src/utils/clinician-display.js'

function trim(value) {
  return String(value ?? '').trim()
}

function parseOptionalNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const num = Number(value)

  return Number.isFinite(num) ? num : null
}

function normalizeProgress(raw) {
  if (!raw) {
    return { status: carePlanProgressStatuses.notMeasured, percent: null }
  }

  return {
    status: raw.status ?? carePlanProgressStatuses.notMeasured,
    percent: parseOptionalNumber(raw.percent),
  }
}

function normalizeClinicianRef(raw) {
  if (!raw) {
    return { id: null, name: '' }
  }
  const id = parseOptionalNumber(raw.id ?? raw.clinician_id)
  const name = formatClinicianDisplayLabel(raw)

  return {
    id,
    name,
  }
}

export function normalizeOutcomeMeasure(raw) {
  const row = raw ?? {}

  return {
    id: parseOptionalNumber(row.id) ?? row.id,
    goalId: parseOptionalNumber(row.goal_id ?? row.goalId),
    measureName: trim(row.measure_name ?? row.measureName),
    description: trim(row.description),
    baseline: parseOptionalNumber(row.baseline),
    currentValue: parseOptionalNumber(row.current_value ?? row.currentValue),
    target: parseOptionalNumber(row.target),
    direction: row.direction ?? carePlanProgressDirections.lowerIsBetter,
    unit: trim(row.unit),
    frequency: trim(row.frequency),
    sourceType: row.source_type ?? row.sourceType
      ?? carePlanOutcomeSourceTypes.manual,
    notes: trim(row.notes),
    progress: normalizeProgress(row.progress),
  }
}

export function normalizeIntervention(raw) {
  const row = raw ?? {}
  const clinician = normalizeClinicianRef(
    row.responsible_clinician ?? row.responsibleClinician,
  )

  return {
    id: parseOptionalNumber(row.id) ?? row.id,
    goalId: parseOptionalNumber(row.goal_id ?? row.goalId),
    title: trim(row.title),
    description: trim(row.description),
    frequency: trim(row.frequency),
    responsibleClinicianId: parseOptionalNumber(
      row.responsible_clinician_id ?? row.responsibleClinicianId,
    ) ?? clinician.id,
    responsibleClinicianName: clinician.name,
    notes: trim(row.notes),
  }
}

export function normalizeCarePlanGoal(raw) {
  const row = raw ?? {}
  const measures = (row.outcome_measures ?? row.outcomeMeasures ?? [])
    .map(normalizeOutcomeMeasure)
  const interventions = (row.interventions ?? [])
    .map(normalizeIntervention)

  return {
    id: parseOptionalNumber(row.id) ?? row.id,
    carePlanId: parseOptionalNumber(row.care_plan_id ?? row.carePlanId),
    title: trim(row.title),
    description: trim(row.description),
    successCriteria: trim(row.success_criteria ?? row.successCriteria),
    status: row.status ?? carePlanGoalStatuses.inProgress,
    priority: trim(row.priority) || 'medium',
    baseline: parseOptionalNumber(row.baseline),
    target: parseOptionalNumber(row.target),
    direction: row.direction ?? carePlanProgressDirections.lowerIsBetter,
    targetDate: isoDateToUsDateString(row.target_date ?? row.targetDate) ?? '',
    outcomeMeasures: measures,
    interventions,
    progress: normalizeProgress(row.progress),
  }
}

export function normalizeCarePlanSummary(raw) {
  const row = raw ?? {}
  const clinician = normalizeClinicianRef(row.clinician)

  return {
    id: parseOptionalNumber(row.id) ?? row.id,
    clientId: parseOptionalNumber(row.client_id ?? row.clientId),
    name: trim(row.name),
    status: row.status ?? carePlanStatuses.active,
    problem: trim(row.problem),
    description: trim(row.description),
    startDate: isoDateToUsDateString(row.start_date ?? row.startDate) ?? '',
    targetDate: isoDateToUsDateString(row.target_date ?? row.targetDate) ?? '',
    clinicianId: parseOptionalNumber(row.clinician_id ?? row.clinicianId)
      ?? clinician.id,
    clinicianName: clinician.name,
    priority: trim(row.priority) || 'medium',
    signed: Boolean(row.signed),
    signedAt: row.signed_at ?? row.signedAt ?? null,
    progress: normalizeProgress(row.progress),
    goalsCount: Number(row.goals_count ?? row.goalsCount ?? 0),
  }
}

export function normalizeCarePlanDetail(raw) {
  const row = raw ?? {}
  const goals = (row.goals ?? []).map(normalizeCarePlanGoal)
  const summary = normalizeCarePlanSummary(row)

  return refreshCarePlanProgress({
    ...summary,
    signature: trim(row.signature),
    goals,
  })
}

export function mapCarePlansListFromApi(rawList) {
  const list = Array.isArray(rawList) ? rawList : []

  return list.map(normalizeCarePlanSummary)
}

function dateToApi(value) {
  const raw = trim(value)
  if (!raw) {
    return null
  }
  const parts = raw.split('/')
  if (parts.length === 3) {
    const [month, day, year] = parts

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return raw
}

export function carePlanToApiPayload(plan) {
  return {
    name: trim(plan.name),
    problem: trim(plan.problem) || null,
    description: trim(plan.description) || null,
    start_date: dateToApi(plan.startDate),
    target_date: dateToApi(plan.targetDate),
    clinician_id: parseOptionalNumber(plan.clinicianId),
    priority: trim(plan.priority) || null,
    status: plan.status ?? carePlanStatuses.active,
  }
}

export function carePlanGoalToApiPayload(goal) {
  return {
    title: trim(goal.title),
    description: trim(goal.description) || null,
    success_criteria: trim(goal.successCriteria) || null,
    status: goal.status ?? carePlanGoalStatuses.inProgress,
    priority: trim(goal.priority) || null,
    baseline: parseOptionalNumber(goal.baseline),
    target: parseOptionalNumber(goal.target),
    direction: goal.direction ?? carePlanProgressDirections.lowerIsBetter,
    target_date: dateToApi(goal.targetDate),
  }
}

export function outcomeMeasureToApiPayload(measure) {
  return {
    measure_name: trim(measure.measureName),
    description: trim(measure.description) || null,
    baseline: parseOptionalNumber(measure.baseline),
    current_value: parseOptionalNumber(measure.currentValue),
    target: parseOptionalNumber(measure.target),
    direction: measure.direction ?? carePlanProgressDirections.lowerIsBetter,
    unit: trim(measure.unit) || null,
    frequency: trim(measure.frequency) || null,
    source_type: measure.sourceType ?? carePlanOutcomeSourceTypes.manual,
    notes: trim(measure.notes) || null,
  }
}

export function interventionToApiPayload(intervention) {
  return {
    title: trim(intervention.title),
    description: trim(intervention.description) || null,
    frequency: trim(intervention.frequency) || null,
    responsible_clinician_id: parseOptionalNumber(
      intervention.responsibleClinicianId,
    ),
    notes: trim(intervention.notes) || null,
  }
}

export function normalizeCarePlanOption(raw) {
  const summary = normalizeCarePlanSummary(raw)

  return {
    value: summary.id,
    label: summary.name || summary.problem || `#${summary.id}`,
  }
}
