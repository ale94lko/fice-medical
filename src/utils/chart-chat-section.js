import {
  addClientClinicalSubTabKeys,
  addClientTabKeys,
} from 'components/constants.js'

export const chartChatIntents = {
  allergies: 'ALLERGIES',
  medications: 'MEDICATIONS',
  lastAppointment: 'LAST_APPOINTMENT',
}

export function chartChatSection(intent) {
  const key = String(intent ?? '').trim().toUpperCase()
  if (key === chartChatIntents.allergies) {
    return {
      intent: key,
      tab: addClientTabKeys.allergies,
      subTab: '',
      labelKey: 'tabAllergies',
    }
  }
  if (key === chartChatIntents.medications) {
    return {
      intent: key,
      tab: addClientTabKeys.clinical,
      subTab: addClientClinicalSubTabKeys.medications,
      labelKey: 'subTabMedications',
    }
  }
  if (key === chartChatIntents.lastAppointment) {
    return {
      intent: key,
      tab: addClientTabKeys.appointments,
      subTab: '',
      labelKey: 'tabAppointments',
    }
  }

  return null
}
