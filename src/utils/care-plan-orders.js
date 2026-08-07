import {
  carePlanGoalStatuses,
  carePlanOutcomeSourceTypes,
  carePlanPriorities,
  carePlanProgressDirections,
  carePlanStatuses,
} from 'components/constants.js'
import { todayDateUs } from 'src/utils/client-form.js'
import { calculateOutcomeMeasureProgress } from
  'src/utils/care-plan-progress.js'

let localIdCounter = 0

export function nextCarePlanLocalId(prefix = 'local') {
  localIdCounter += 1

  return `${prefix}-${localIdCounter}`
}

export function isServerNumericId(id) {
  const s = String(id ?? '').trim()

  return /^\d+$/.test(s)
}

export function isTemporaryCarePlanId(id) {
  return !isServerNumericId(id)
}

export function createEmptyOutcomeMeasure() {
  return {
    id: nextCarePlanLocalId('measure'),
    measureName: '',
    description: '',
    baseline: null,
    currentValue: null,
    target: null,
    direction: carePlanProgressDirections.lowerIsBetter,
    unit: '',
    frequency: '',
    sourceType: carePlanOutcomeSourceTypes.manual,
    notes: '',
    measuredDate: '',
    measurementNotes: '',
    recordedByName: '',
    measurements: [],
    progress: { status: 'NOT_MEASURED', percent: null },
  }
}

export function applyOutcomeMeasureReading(measure, reading = {}) {
  const history = [...(measure?.measurements ?? [])]
  const previousValue = measure?.currentValue
  if (previousValue != null && previousValue !== '') {
    history.push({
      id: nextCarePlanLocalId('reading'),
      value: previousValue,
      measuredDate: measure?.measuredDate || '',
      notes: measure?.measurementNotes || '',
      recordedByName: measure?.recordedByName || '',
    })
  }

  return {
    ...measure,
    measurements: history,
    currentValue: reading.currentValue ?? null,
    measuredDate: String(reading.measuredDate ?? '').trim(),
    measurementNotes: String(reading.notes ?? '').trim(),
    recordedByName: String(reading.recordedByName ?? '').trim(),
  }
}

/**
 * History rows for Measurement History dialog (newest first).
 * Includes current reading plus archived measurements.
 */
export function buildOutcomeMeasureHistoryRows(measure = {}) {
  const rows = []
  const currentValue = measure.currentValue
  if (currentValue != null && currentValue !== '') {
    rows.push({
      id: `${measure.id || 'measure'}-current`,
      measuredDate: measure.measuredDate || '',
      value: currentValue,
      notes: measure.measurementNotes || '',
      recordedByName: measure.recordedByName || '',
      isCurrent: true,
      progress: calculateOutcomeMeasureProgress(
        measure.baseline,
        currentValue,
        measure.target,
        measure.direction,
      ),
    })
  }
  const archived = [...(measure.measurements ?? [])].reverse()
  for (const item of archived) {
    rows.push({
      id: item.id || nextCarePlanLocalId('reading'),
      measuredDate: item.measuredDate || '',
      value: item.value,
      notes: item.notes || '',
      recordedByName: item.recordedByName || '',
      isCurrent: false,
      progress: calculateOutcomeMeasureProgress(
        measure.baseline,
        item.value,
        measure.target,
        measure.direction,
      ),
    })
  }

  return rows
}

export function measurementProgressTone(percent) {
  if (percent == null) {
    return 'none'
  }
  if (percent <= 0) {
    return 'baseline'
  }
  if (percent >= 100) {
    return 'achieved'
  }
  if (percent >= 50) {
    return 'onTrack'
  }

  return 'inProgress'
}

export function createEmptyIntervention() {
  return {
    id: nextCarePlanLocalId('intervention'),
    title: '',
    description: '',
    frequency: '',
    responsibleClinicianId: null,
    responsibleClinicianName: '',
    notes: '',
  }
}

export function createEmptyCarePlanGoal() {
  return {
    id: nextCarePlanLocalId('goal'),
    title: '',
    description: '',
    successCriteria: '',
    status: carePlanGoalStatuses.inProgress,
    priority: carePlanPriorities.medium,
    targetDate: '',
    outcomeMeasures: [],
    interventions: [],
    progress: { status: 'NOT_MEASURED', percent: null },
  }
}

export function createEmptyCarePlan() {
  return {
    id: '',
    name: '',
    problem: '',
    description: '',
    status: carePlanStatuses.active,
    startDate: todayDateUs(),
    targetDate: '',
    clinicianId: null,
    clinicianName: '',
    priority: carePlanPriorities.medium,
    signed: false,
    signedAt: null,
    signature: '',
    goals: [],
    progress: { status: 'NOT_MEASURED', percent: null },
  }
}

export function cloneCarePlan(plan) {
  return JSON.parse(JSON.stringify(plan ?? createEmptyCarePlan()))
}

export function refreshGoalProgress(goal) {
  const measures = (goal.outcomeMeasures ?? []).map(measure => {
    const progress = calculateOutcomeMeasureProgress(
      measure.baseline,
      measure.currentValue,
      measure.target,
      measure.direction,
    )

    return { ...measure, progress }
  })
  const measured = measures.filter(m => m.progress?.percent != null)
  let goalProgress = { status: 'NOT_MEASURED', percent: null }
  if (measured.length) {
    const sum = measured.reduce(
      (acc, m) => acc + Number(m.progress.percent),
      0,
    )
    goalProgress = {
      status: 'MEASURED',
      percent: Math.round((sum / measured.length) * 100) / 100,
    }
  }

  return {
    ...goal,
    outcomeMeasures: measures,
    progress: goalProgress,
  }
}

export function refreshCarePlanProgress(plan) {
  const goals = (plan.goals ?? []).map(refreshGoalProgress)
  const measuredGoals = goals.filter(
    g => g.progress?.status === 'MEASURED' && g.progress.percent != null,
  )
  let planProgress = { status: 'NOT_MEASURED', percent: null }
  if (measuredGoals.length) {
    const sum = measuredGoals.reduce(
      (acc, g) => acc + Number(g.progress.percent),
      0,
    )
    planProgress = {
      status: 'MEASURED',
      percent: Math.round((sum / measuredGoals.length) * 100) / 100,
    }
  }

  return { ...plan, goals, progress: planProgress }
}

export const CARE_PLAN_FREQUENCY_OPTIONS = [
  'Daily',
  'Weekly',
  'Bi-weekly',
  'Monthly',
  'As needed',
]

export const CARE_PLAN_MEASURE_OPTIONS = [
  'GAD-7',
  'PHQ-9',
  'Weight',
  'BMI',
  'Blood Pressure',
  'A1C',
]
