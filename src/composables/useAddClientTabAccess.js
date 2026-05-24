import { ref } from 'vue'
import { addClientTabKeys } from 'components/constants.js'

export const ADD_CLIENT_TAB_ORDER = [
  addClientTabKeys.basic,
  addClientTabKeys.contact,
  addClientTabKeys.familyMedicalHistory,
  addClientTabKeys.allergies,
  addClientTabKeys.assessments,
  addClientTabKeys.clinical,
  addClientTabKeys.careCoordination,
  addClientTabKeys.financials,
  addClientTabKeys.documents,
]

export const ADD_CLIENT_COMING_SOON_TABS = new Set([
  addClientTabKeys.allergies,
  addClientTabKeys.assessments,
  addClientTabKeys.clinical,
  addClientTabKeys.careCoordination,
  addClientTabKeys.financials,
  addClientTabKeys.documents,
])

export function tabIndexInOrder(tab, order = ADD_CLIENT_TAB_ORDER) {
  return order.indexOf(tab)
}

export function useAddClientTabAccess() {
  const unlockedTabMaxIndex = ref(0)

  function resetTabAccess() {
    unlockedTabMaxIndex.value = 0
  }

  function isTabEnabled(tab) {
    const idx = tabIndexInOrder(tab)

    return idx >= 0 && idx <= unlockedTabMaxIndex.value
  }

  function unlockThroughIndex(index) {
    if (index < 0) {
      return
    }
    const max = ADD_CLIENT_TAB_ORDER.length - 1
    unlockedTabMaxIndex.value = Math.min(
      Math.max(unlockedTabMaxIndex.value, index),
      max,
    )
  }

  return {
    unlockedTabMaxIndex,
    resetTabAccess,
    isTabEnabled,
    unlockThroughIndex,
  }
}
