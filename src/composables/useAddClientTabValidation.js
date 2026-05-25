import { useQuasar } from 'quasar'
import {
  ADD_CLIENT_COMING_SOON_TABS,
  tabIndexInOrder,
} from 'src/composables/useAddClientTabAccess.js'
import { CLINICAL_FAMILY_HISTORY_SUB_TAB } from
  'src/composables/useAddClientSubTabs.js'
import {
  addClientTabKeys,
  clientFormSections,
} from 'components/constants.js'
import {
  validateFamilyMedicalHistoryDraftClear,
} from 'src/utils/client-family-medical-history.js'
import {
  allergyMaxStartYear,
  allergyMinStartYear,
  validateAllergiesDraftClear,
} from 'src/utils/client-allergies.js'
import { quasarNotifyTypes } from 'components/constants.js'

function validateFamilyMedicalHistorySection(form, t, notifyValidationError) {
  const section = form.value[clientFormSections.familyMedicalHistory]
  const result = validateFamilyMedicalHistoryDraftClear(section)
  if (!result.ok && result.errorKey) {
    notifyValidationError(t(result.errorKey))

    return false
  }

  return true
}

export function useAddClientTabValidation({
  activeTab,
  activeSubTab,
  formRef,
  form,
  tabOrder,
  unlockThroughIndex,
  t,
}) {
  const $q = useQuasar()

  function tabIndex(tab) {
    return tabIndexInOrder(tab, tabOrder)
  }

  function notifyValidationError(message) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message,
      position: 'top',
    })
  }

  async function validateTab(tab) {
    if (ADD_CLIENT_COMING_SOON_TABS.has(tab)) {
      return true
    }
    if (tab === addClientTabKeys.clinical) {
      return validateFamilyMedicalHistorySection(
        form,
        t,
        notifyValidationError,
      )
    }
    if (tab === addClientTabKeys.allergies) {
      const section = form.value[clientFormSections.allergies]
      const result = validateAllergiesDraftClear(section)
      if (!result.ok && result.errorKey) {
        notifyValidationError(t(result.errorKey, {
          min: allergyMinStartYear(),
          max: allergyMaxStartYear(),
          maxName: 100,
        }))

        return false
      }

      return true
    }
    if (!formRef.value) {
      return false
    }

    return formRef.value.validate()
  }

  async function validateCurrentTabAndUnlock() {
    const tab = activeTab.value
    const idx = tabIndex(tab)
    if (idx < 0) {
      return false
    }
    const ok = await validateTab(tab)
    if (!ok) {
      if (
        tab === addClientTabKeys.clinical
        && activeSubTab?.value !== CLINICAL_FAMILY_HISTORY_SUB_TAB
      ) {
        activeSubTab.value = CLINICAL_FAMILY_HISTORY_SUB_TAB
      }

      return false
    }
    if (idx < tabOrder.length - 1) {
      unlockThroughIndex(idx + 1)
    }

    return true
  }

  async function validateTabsThrough(targetIndex) {
    for (let i = 0; i < targetIndex; i += 1) {
      const tab = tabOrder[i]
      const ok = await validateTab(tab)
      if (!ok) {
        activeTab.value = tab
        if (
          tab === addClientTabKeys.clinical
          && activeSubTab
        ) {
          activeSubTab.value = CLINICAL_FAMILY_HISTORY_SUB_TAB
        }

        return false
      }
      unlockThroughIndex(i + 1)
    }

    return true
  }

  return {
    tabIndex,
    validateTab,
    validateCurrentTabAndUnlock,
    validateTabsThrough,
  }
}
