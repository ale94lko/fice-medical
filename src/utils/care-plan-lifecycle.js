import {
  carePlanGoalStatuses,
  carePlanStatuses,
} from 'components/constants.js'

export function isCarePlanDraft(status) {
  return status === carePlanStatuses.draft
}

export function isCarePlanActive(status) {
  return status === carePlanStatuses.active
}

export function isCarePlanTerminal(status) {
  return status === carePlanStatuses.completed
    || status === carePlanStatuses.archived
    || status === carePlanStatuses.cancelled
}

export function isGoalInProgress(status) {
  return status === carePlanGoalStatuses.inProgress
}

export function canEditCarePlanGeneral(plan, mode) {
  if (mode === 'view') {
    return false
  }

  return isCarePlanDraft(plan?.status)
}

export function canAddCarePlanGoals(plan, mode) {
  if (mode === 'view' || isCarePlanTerminal(plan?.status)) {
    return false
  }

  return isCarePlanDraft(plan?.status) || isCarePlanActive(plan?.status)
}

export function canEditExistingGoal(plan, mode) {
  return canEditCarePlanGeneral(plan, mode)
}

export function canLifecycleGoal(plan, goal, mode) {
  if (mode === 'view' || isCarePlanTerminal(plan?.status)) {
    return false
  }
  if (!isCarePlanActive(plan?.status)) {
    return false
  }

  return isGoalInProgress(goal?.status)
}

export function canRecordGoalMeasurement(plan, goal) {
  if (isCarePlanTerminal(plan?.status) || !isCarePlanActive(plan?.status)) {
    return false
  }

  return isGoalInProgress(goal?.status)
}
