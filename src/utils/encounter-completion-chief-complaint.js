import {
  encounterRequirementActionTypes,
  encounterRequirementStatuses,
  encounterRequirementTypes,
} from 'components/constants.js'

export const CHIEF_COMPLAINT_REQUIREMENT_CODE = 'CHIEF_COMPLAINT'

/**
 * Resolve chief complaint text from an encounter snapshot.
 */
export function resolveEncounterChiefComplaint(encounter) {
  return String(
    encounter?.chiefComplaint
    ?? encounter?.notes
    ?? '',
  ).trim()
}

export function hasEncounterChiefComplaint(encounter) {
  return resolveEncounterChiefComplaint(encounter).length > 0
}

function isChiefComplaintRequirement(item) {
  const type = String(item?.type ?? '').toUpperCase()
  const code = String(item?.code ?? '').toUpperCase()

  return type === encounterRequirementTypes.chiefComplaint
    || code === CHIEF_COMPLAINT_REQUIREMENT_CODE
}

function buildChiefComplaintRequirement(completed, labels = {}) {
  const actionLabel = String(labels.actionLabel ?? '').trim()
  const status = completed
    ? encounterRequirementStatuses.satisfied
    : encounterRequirementStatuses.pending

  return {
    id: null,
    type: encounterRequirementTypes.chiefComplaint,
    code: CHIEF_COMPLAINT_REQUIREMENT_CODE,
    label: String(labels.label ?? '').trim() || 'Chief Complaint',
    description: String(labels.description ?? '').trim(),
    scope: 'ENCOUNTER',
    purpose: 'ENCOUNTER_COMPLETION',
    severity: 'BLOCKING',
    status,
    required: true,
    blocking: true,
    waivable: false,
    displayOrder: -1,
    referenceId: null,
    referenceType: '',
    action: {
      type: encounterRequirementActionTypes.openVisit,
      label: actionLabel,
      targetId: null,
    },
    actionLabel,
    actionCode: encounterRequirementActionTypes.openVisit,
    completed,
  }
}

function recountCompletion(requirements, optionalActions, base = {}) {
  const requiredItems = requirements.filter(item => item.required)
  const satisfiedCount = requiredItems.filter(item => item.completed).length
  const requiredCount = requiredItems.length
  const remainingCount = Math.max(0, requiredCount - satisfiedCount)
  const missingRequirements = requiredItems.filter(item => !item.completed)

  return {
    ...base,
    satisfiedCount,
    completedCount: satisfiedCount,
    requiredCount,
    remainingCount,
    canComplete: remainingCount === 0,
    requirements,
    optionalActions,
    missingRequirements,
  }
}

/**
 * Ensure Chief Complaint is a required completion checklist item and
 * sync its satisfied state from the encounter field.
 * Also normalizes SERVICE action labels for the checklist UI.
 */
export function withChiefComplaintRequirement(
  completion,
  encounter,
  labels = {},
) {
  const base = completion != null && typeof completion === 'object'
    ? completion
    : {}
  const requirements = Array.isArray(base.requirements)
    ? [...base.requirements]
    : []
  const optionalActions = Array.isArray(base.optionalActions)
    ? base.optionalActions
    : []
  const completed = hasEncounterChiefComplaint(encounter)
  const nextItem = buildChiefComplaintRequirement(completed, labels)
  const existingIdx = requirements.findIndex(isChiefComplaintRequirement)

  if (existingIdx >= 0) {
    const prev = requirements[existingIdx]
    const waived = prev.status === encounterRequirementStatuses.waived
    const itemCompleted = waived || completed
    requirements[existingIdx] = {
      ...prev,
      ...nextItem,
      id: prev.id,
      waivable: prev.waivable === true,
      status: waived
        ? encounterRequirementStatuses.waived
        : nextItem.status,
      completed: itemCompleted,
      label: prev.label || nextItem.label,
      description: nextItem.description,
      actionLabel: nextItem.actionLabel || prev.actionLabel,
      action: {
        ...(prev.action || {}),
        ...(nextItem.action || {}),
        label: nextItem.actionLabel
          || prev.actionLabel
          || prev.action?.label,
      },
    }
  } else {
    requirements.unshift(nextItem)
  }

  const addServiceLabel = String(labels.addServiceAction ?? '').trim()
  const withServiceActions = addServiceLabel
    ? requirements.map((item) => {
      if (!isServiceRequirement(item)) {
        return item
      }

      return {
        ...item,
        actionLabel: addServiceLabel,
        action: {
          ...(item.action || {}),
          label: addServiceLabel,
        },
      }
    })
    : requirements

  return recountCompletion(withServiceActions, optionalActions, base)
}

function isServiceRequirement(item) {
  const type = String(item?.type ?? '').toUpperCase()
  const code = String(item?.code ?? '').toUpperCase()
  const label = String(item?.label ?? '').toLowerCase()

  return type === encounterRequirementTypes.service
    || code === encounterRequirementTypes.service
    || code.includes('SERVICE')
    || label.includes('at least one service')
}
