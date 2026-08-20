import {
  addClientTabKeys,
  encounterClinicalSubTabs,
  encounterWorkspaceTabs,
} from 'components/constants.js'

function keyOf(section = {}) {
  return String(section.sectionKey || section.fieldKey || '')
    .trim()
    .toLowerCase()
}

function typeOf(section = {}) {
  return String(section.sourceType || section.sectionType || '')
    .trim()
    .toUpperCase()
}

/**
 * Map a generated Clinical Note section to the FiCE source the provider
 * should edit. AUTO_DATA stays read-only in the note itself.
 */
export function resolveGeneratedNoteEditSource(section = {}) {
  const key = keyOf(section)
  const sourceType = typeOf(section)
  if (!key && !sourceType) {
    return null
  }
  if (key === 'provider' || sourceType === 'PROVIDER') {
    return null
  }
  if (key === 'encounter_info') {
    return null
  }
  if (key === 'chief_complaint'
    || key === 'diagnoses'
    || sourceType === 'REASON_FOR_VISIT'
    || sourceType === 'CHIEF_COMPLAINT') {
    return { workspaceTab: encounterWorkspaceTabs.visit }
  }
  if (sourceType === 'NARRATIVE'
    || sourceType === 'STRUCTURED_SECTION'
    || key.includes('hpi')
    || key === 'ros'
    || key.includes('physical')
    || key.includes('plan')
    || key.includes('additional_notes')
    || key.includes('mse')) {
    return { workspaceTab: encounterWorkspaceTabs.narrative }
  }
  if (sourceType === 'VITALS' || key === 'vitals') {
    return {
      workspaceTab: encounterWorkspaceTabs.clinical,
      clinicalSubTab: encounterClinicalSubTabs.vitals,
    }
  }
  if (sourceType === 'ASSESSMENT'
    || key === 'phq9'
    || key === 'gad7') {
    return {
      workspaceTab: encounterWorkspaceTabs.clinical,
      clinicalSubTab: encounterClinicalSubTabs.assessments,
    }
  }
  if (sourceType === 'DIAGNOSTIC_STUDY'
    || key.includes('diagnostic')) {
    return {
      workspaceTab: encounterWorkspaceTabs.clinical,
      clinicalSubTab: encounterClinicalSubTabs.diagnosticStudies,
    }
  }
  if (sourceType === 'ENCOUNTER_QUALITY_MEASURES'
    || key.includes('hedis')
    || key.includes('quality_measure')) {
    return {
      workspaceTab: encounterWorkspaceTabs.clinical,
      clinicalSubTab: encounterClinicalSubTabs.qualityMeasures,
    }
  }
  if (sourceType === 'FOLLOW_UP' || key.includes('follow')) {
    return { workspaceTab: encounterWorkspaceTabs.followUp }
  }
  if (sourceType === 'MEDICATIONS' || key.includes('medication')) {
    return {
      moduleKey: 'medications',
      tab: addClientTabKeys.clinical,
      subTab: 'medications',
    }
  }
  if (sourceType === 'ALLERGIES' || key === 'allergies') {
    return { moduleKey: 'allergies', tab: addClientTabKeys.allergies }
  }
  if (sourceType === 'MEDICAL_HISTORY'
    || sourceType === 'SURGICAL_HISTORY'
    || sourceType === 'FAMILY_HISTORY'
    || sourceType === 'SOCIAL_HISTORY'
    || key.includes('history')) {
    return {
      moduleKey: 'familyMedicalHistory',
      tab: addClientTabKeys.familyMedicalHistory,
    }
  }

  return null
}
