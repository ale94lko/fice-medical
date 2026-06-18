/* eslint-disable camelcase -- mock persistence mirrors API snake_case */
import {
  carePlanGoalStatuses,
  carePlanOutcomeSourceTypes,
  carePlanProgressDirections,
  carePlanStatuses,
} from 'components/constants.js'
import { refreshCarePlanProgress } from 'src/utils/care-plan-orders.js'
import {
  normalizeCarePlanDetail,
  normalizeCarePlanSummary,
} from 'src/utils/care-plan-normalize.js'

const STORAGE_KEY = 'fice-care-plan-mock-v2'

let idCounter = 100

function nextId() {
  idCounter += 1

  return idCounter
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { plansByClient: {}, seededClients: {} }
    }
    const parsed = JSON.parse(raw)

    return {
      plansByClient: parsed?.plansByClient ?? {},
      seededClients: parsed?.seededClients ?? {},
    }
  } catch {
    return { plansByClient: {}, seededClients: {} }
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function buildSeedPlans(clientId) {
  const clinician = {
    id: 5,
    first_name: 'John',
    last_name: 'Smith',
  }
  const plan1 = refreshCarePlanProgress(normalizeCarePlanDetail({
    id: nextId(),
    client_id: Number(clientId) || clientId,
    name: 'Anxiety Management Plan',
    status: carePlanStatuses.active,
    problem: 'Anxiety',
    description: '8-week CBT-oriented plan for anxiety symptoms.',
    start_date: '2026-05-01',
    target_date: '2026-08-30',
    clinician_id: 5,
    clinician,
    priority: 'medium',
    signed: true,
    signed_at: '2026-05-02T10:00:00',
    goals: [{
      id: nextId(),
      title: 'Reduce anxiety symptoms',
      description: 'Decrease severity of anxiety symptoms.',
      success_criteria: 'GAD-7 score below 8',
      status: carePlanGoalStatuses.inProgress,
      priority: 'medium',
      baseline: 14,
      target: 8,
      direction: carePlanProgressDirections.lowerIsBetter,
      target_date: '2026-08-30',
      outcome_measures: [{
        id: nextId(),
        measure_name: 'GAD-7 Score',
        baseline: 14,
        current_value: 10,
        target: 8,
        direction: carePlanProgressDirections.lowerIsBetter,
        unit: 'score',
        frequency: 'weekly',
        source_type: carePlanOutcomeSourceTypes.manual,
      }],
      interventions: [{
        id: nextId(),
        title: 'Cognitive Behavioral Therapy (CBT)',
        frequency: 'Weekly',
        responsible_clinician_id: 5,
        responsible_clinician: clinician,
      }, {
        id: nextId(),
        title: 'Mindfulness Practice',
        frequency: 'Daily',
        responsible_clinician_id: 5,
        responsible_clinician: clinician,
      }],
    }, {
      id: nextId(),
      title: 'Improve sleep quality',
      status: carePlanGoalStatuses.inProgress,
      priority: 'low',
      target_date: '2026-08-15',
      outcome_measures: [],
      interventions: [],
    }],
  }))
  const plan2 = refreshCarePlanProgress(normalizeCarePlanDetail({
    id: nextId(),
    client_id: Number(clientId) || clientId,
    name: 'Weight Management Plan',
    status: carePlanStatuses.active,
    problem: 'Obesity',
    start_date: '2026-04-01',
    target_date: '2026-10-01',
    clinician_id: 5,
    clinician,
    priority: 'high',
    signed: false,
    goals: [{
      id: nextId(),
      title: 'Achieve target weight',
      status: carePlanGoalStatuses.inProgress,
      baseline: 120,
      target: 140,
      direction: carePlanProgressDirections.higherIsBetter,
      target_date: '2026-10-01',
      outcome_measures: [{
        id: nextId(),
        measure_name: 'Weight',
        baseline: 120,
        current_value: 128,
        target: 140,
        direction: carePlanProgressDirections.higherIsBetter,
        unit: 'lbs',
        source_type: carePlanOutcomeSourceTypes.manual,
      }],
      interventions: [],
    }],
  }))
  const plan3 = refreshCarePlanProgress(normalizeCarePlanDetail({
    id: nextId(),
    client_id: Number(clientId) || clientId,
    name: 'Post-Surgery Recovery Plan',
    status: carePlanStatuses.completed,
    problem: 'Post-operative recovery',
    start_date: '2026-01-01',
    target_date: '2026-03-01',
    clinician_id: 5,
    clinician,
    priority: 'medium',
    signed: true,
    signed_at: '2026-01-02T09:00:00',
    goals: [{
      id: nextId(),
      title: 'Restore mobility',
      status: carePlanGoalStatuses.completed,
      target_date: '2026-03-01',
      outcome_measures: [{
        id: nextId(),
        measure_name: 'Mobility score',
        baseline: 2,
        current_value: 10,
        target: 10,
        direction: carePlanProgressDirections.higherIsBetter,
        source_type: carePlanOutcomeSourceTypes.manual,
      }],
      interventions: [],
    }],
  }))

  return [plan1, plan2, plan3]
}

function ensureClientPlans(state, clientId) {
  const cid = String(clientId).trim()
  if (!state.plansByClient[cid]) {
    state.plansByClient[cid] = []
  }
  if (!state.seededClients[cid]) {
    state.plansByClient[cid] = buildSeedPlans(cid)
    state.seededClients[cid] = true
    saveState(state)
  }

  return state.plansByClient[cid]
}

function findPlan(state, clientId, planId) {
  const list = state.plansByClient[String(clientId)] ?? []

  return list.find(item => String(item.id) === String(planId)) ?? null
}

function isPlanLocked(plan) {
  return plan.signed
    || plan.status === carePlanStatuses.completed
    || plan.status === carePlanStatuses.archived
}

export function mockListClientCarePlans(
  clientId,
  { status = null, page = 0, limit = 20 } = {},
) {
  const state = loadState()
  let list = ensureClientPlans(state, clientId)
  if (status) {
    list = list.filter(item => item.status === status)
  }
  const total = list.length
  const offset = page * limit
  const items = list
    .slice(offset, offset + limit)
    .map(item => normalizeCarePlanSummary(refreshCarePlanProgress(item)))

  return { items, pagination: { limit, offset, page, total, total_pages: 1 } }
}

export function mockGetClientCarePlan(clientId, planId) {
  const state = loadState()
  ensureClientPlans(state, clientId)
  const record = findPlan(state, clientId, planId)
  if (!record) {
    throw new Error('Care plan not found')
  }

  return refreshCarePlanProgress({ ...record })
}

export function mockCreateClientCarePlan(clientId, payload) {
  const state = loadState()
  const list = ensureClientPlans(state, clientId)
  const record = refreshCarePlanProgress(normalizeCarePlanDetail({
    ...payload,
    id: nextId(),
    client_id: Number(clientId) || clientId,
    signed: false,
    goals: payload.goals ?? [],
  }))
  list.unshift(record)
  saveState(state)

  return record
}

export function mockUpdateClientCarePlan(clientId, planId, payload) {
  const state = loadState()
  const record = findPlan(state, clientId, planId)
  if (!record) {
    throw new Error('Care plan not found')
  }
  if (isPlanLocked(record)) {
    throw new Error('Signed care plans cannot be structurally modified')
  }
  Object.assign(record, payload)
  const updated = refreshCarePlanProgress(record)
  Object.assign(record, updated)
  saveState(state)

  return { ...record }
}

export function mockUpdateCarePlanStatus(clientId, planId, status) {
  const state = loadState()
  const record = findPlan(state, clientId, planId)
  if (!record) {
    throw new Error('Care plan not found')
  }
  record.status = status
  saveState(state)

  return normalizeCarePlanSummary(refreshCarePlanProgress(record))
}

export function mockSignCarePlan(clientId, planId, signature) {
  const state = loadState()
  const record = findPlan(state, clientId, planId)
  if (!record) {
    throw new Error('Care plan not found')
  }
  record.signed = true
  record.signed_at = new Date().toISOString()
  record.signature = signature
  saveState(state)

  return normalizeCarePlanDetail(refreshCarePlanProgress(record))
}

export function mockUpdateOutcomeMeasureCurrentValue(
  clientId,
  planId,
  goalId,
  measureId,
  currentValue,
) {
  const state = loadState()
  const record = findPlan(state, clientId, planId)
  if (!record) {
    throw new Error('Care plan not found')
  }
  const goal = (record.goals ?? []).find(
    g => String(g.id) === String(goalId),
  )
  if (!goal) {
    throw new Error('Goal not found')
  }
  const measure = (goal.outcome_measures ?? goal.outcomeMeasures ?? [])
    .find(m => String(m.id) === String(measureId))
  if (!measure) {
    throw new Error('Outcome measure not found')
  }
  measure.current_value = currentValue
  measure.currentValue = currentValue
  const updated = refreshCarePlanProgress(record)
  Object.assign(record, updated)
  saveState(state)

  return updated
}

export function mockSaveCarePlanTree(clientId, plan) {
  const state = loadState()
  const list = ensureClientPlans(state, clientId)
  const existingIndex = list.findIndex(
    item => String(item.id) === String(plan.id),
  )
  const normalized = refreshCarePlanProgress(normalizeCarePlanDetail(plan))
  if (existingIndex >= 0) {
    const existing = list[existingIndex]
    if (isPlanLocked(existing)) {
      throw new Error('Signed care plans cannot be structurally modified')
    }
    list[existingIndex] = normalized
  } else {
    normalized.id = normalized.id || nextId()
    list.unshift(normalized)
  }
  saveState(state)

  return normalized
}

export function mockListClientCarePlanOptions(clientId) {
  const { items } = mockListClientCarePlans(clientId, {
    status: carePlanStatuses.active,
  })

  return items
}
