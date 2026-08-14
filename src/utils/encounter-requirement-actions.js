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
        reviewGeneratedNote: true,
      }
    case encounterRequirementActionTypes.openNarrative:
      return {
        workspaceTab: encounterWorkspaceTabs.narrative,
      }
    case encounterRequirementActionTypes.openVisit:
      return {
        workspaceTab: encounterWorkspaceTabs.visit,
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
    case encounterRequirementActionTypes.openResults:
      return {
        workspaceTab: encounterWorkspaceTabs.clinical,
        clinicalSubTab: encounterClinicalSubTabs.labs,
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
  if (code.includes('chief') || code.includes('complaint')) {
    return {
      workspaceTab: encounterWorkspaceTabs.visit,
    }
  }
  if (code.includes('service')) {
    return {
      workspaceTab: encounterWorkspaceTabs.visit,
    }
  }
  if (code.includes('narrative')) {
    return {
      workspaceTab: encounterWorkspaceTabs.narrative,
    }
  }
  if (code.includes('note') || code.includes('soap')) {
    return {
      reviewGeneratedNote: true,
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
  if (code.includes('result') || code.includes('lab')) {
    return {
      workspaceTab: encounterWorkspaceTabs.clinical,
      clinicalSubTab: encounterClinicalSubTabs.labs,
    }
  }

  return {
    workspaceTab: encounterWorkspaceTabs.visit,
  }
}
