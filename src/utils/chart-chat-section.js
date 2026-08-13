import {
  addClientClinicalSubTabKeys,
  addClientTabKeys,
} from 'components/constants.js'

export const chartChatIntents = {
  demographics: 'DEMOGRAPHICS',
  allergies: 'ALLERGIES',
  medicalHistory: 'MEDICAL_HISTORY',
  screenings: 'SCREENINGS',
  vitals: 'VITALS',
  clinicalNotes: 'CLINICAL_NOTES',
  carePlans: 'CARE_PLANS',
  labs: 'LABS',
  medications: 'MEDICATIONS',
}

const sectionByIntent = {
  [chartChatIntents.demographics]: {
    tab: addClientTabKeys.basic,
    subTab: '',
    labelKey: 'tabBasicInfo',
  },
  [chartChatIntents.allergies]: {
    tab: addClientTabKeys.allergies,
    subTab: '',
    labelKey: 'tabAllergies',
  },
  [chartChatIntents.medicalHistory]: {
    tab: addClientTabKeys.clinical,
    subTab: addClientClinicalSubTabKeys.familyHistory,
    labelKey: 'subTabFamilyHistory',
  },
  [chartChatIntents.screenings]: {
    tab: addClientTabKeys.clinical,
    subTab: addClientClinicalSubTabKeys.screenings,
    labelKey: 'subTabScreenings',
  },
  [chartChatIntents.vitals]: {
    tab: addClientTabKeys.clinical,
    subTab: addClientClinicalSubTabKeys.vitals,
    labelKey: 'subTabVitals',
  },
  [chartChatIntents.clinicalNotes]: {
    tab: addClientTabKeys.clinical,
    subTab: addClientClinicalSubTabKeys.clinicalNotes,
    labelKey: 'subTabClinicalNotes',
  },
  [chartChatIntents.carePlans]: {
    tab: addClientTabKeys.clinical,
    subTab: addClientClinicalSubTabKeys.carePlans,
    labelKey: 'subTabCarePlans',
  },
  [chartChatIntents.labs]: {
    tab: addClientTabKeys.clinical,
    subTab: addClientClinicalSubTabKeys.labs,
    labelKey: 'subTabLabs',
  },
  [chartChatIntents.medications]: {
    tab: addClientTabKeys.clinical,
    subTab: addClientClinicalSubTabKeys.medications,
    labelKey: 'subTabMedications',
  },
}

export function chartChatSection(intent) {
  const key = String(intent ?? '').trim().toUpperCase()
  const mapped = sectionByIntent[key]
  if (!mapped) {
    return null
  }

  return {
    intent: key,
    tab: mapped.tab,
    subTab: mapped.subTab,
    labelKey: mapped.labelKey,
  }
}
