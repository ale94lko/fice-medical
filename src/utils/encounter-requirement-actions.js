import {
  encounterClinicalSubTabs,
  encounterRequirementActionTypes,
  encounterWorkspaceTabs,
} from 'components/constants.js'

/**
 * Map requirement action.type to in-workspace tab / chart module.
 */
export function resolveRequirementActionTarget(item = {}) {
  const type = String(
    item?.action?.type
    || item?.actionType
    || item?.actionCode
    || '',
  ).trim().toUpperCase()
  const targetId = item?.action?.targetId ?? item?.referenceId ?? null

  switch (type) {
    case encounterRequirementActionTypes.openNote:
      return {
        workspaceTab: encounterWorkspaceTabs.note,
        moduleKey: 'clinical-notes',
      }
    case encounterRequirementActionTypes.openVitals:
      return {
        workspaceTab: encounterWorkspaceTabs.clinical,
        clinicalSubTab: encounterClinicalSubTabs.vitals,
        moduleKey: 'vitals',
      }
    case encounterRequirementActionTypes.openAssessment:
    case encounterRequirementActionTypes.openForm:
    case encounterRequirementActionTypes.openSafetyAssessment:
      return {
        workspaceTab: encounterWorkspaceTabs.clinical,
        clinicalSubTab: encounterClinicalSubTabs.assessments,
        moduleKey: 'assessments',
        screeningTemplateId: targetId,
      }
    case encounterRequirementActionTypes.openMedicationReview:
      return {
        workspaceTab: encounterWorkspaceTabs.clinical,
        clinicalSubTab: encounterClinicalSubTabs.medications,
        review: 'medication',
      }
    case encounterRequirementActionTypes.openCarePlanReview:
      return {
        workspaceTab: encounterWorkspaceTabs.clinical,
        clinicalSubTab: encounterClinicalSubTabs.carePlans,
        review: 'care-plan',
        carePlanId: targetId,
      }
    default:
      return fallbackFromCode(item)
  }
}

function fallbackFromCode(item) {
  const code = String(
    item?.actionCode || item?.code || item?.type || '',
  ).toLowerCase()
  if (code.includes('vital')) {
    return {
      workspaceTab: encounterWorkspaceTabs.clinical,
      clinicalSubTab: encounterClinicalSubTabs.vitals,
      moduleKey: 'vitals',
    }
  }
  if (code.includes('note') || code.includes('soap')) {
    return {
      workspaceTab: encounterWorkspaceTabs.note,
      moduleKey: 'clinical-notes',
    }
  }
  if (code.includes('screen') || code.includes('assess')
    || code.includes('form')) {
    return {
      workspaceTab: encounterWorkspaceTabs.clinical,
      clinicalSubTab: encounterClinicalSubTabs.assessments,
      moduleKey: 'assessments',
    }
  }
  if (code.includes('medication')) {
    return {
      workspaceTab: encounterWorkspaceTabs.clinical,
      clinicalSubTab: encounterClinicalSubTabs.medications,
      review: 'medication',
    }
  }
  if (code.includes('care') || code.includes('plan')) {
    return {
      workspaceTab: encounterWorkspaceTabs.clinical,
      clinicalSubTab: encounterClinicalSubTabs.carePlans,
      review: 'care-plan',
    }
  }

  return {
    workspaceTab: encounterWorkspaceTabs.visit,
  }
}
