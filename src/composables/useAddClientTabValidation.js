import { nextTick, ref } from 'vue'
import { useQuasar } from 'quasar'
import {
  ADD_CLIENT_COMING_SOON_TABS,
  tabIndexInOrder,
} from 'src/composables/useAddClientTabAccess.js'
import {
  addClientTabKeys,
  clientFormSections,
} from 'components/constants.js'
import {
  countBasicTabFieldErrors,
  countContactTabFieldErrors,
} from 'src/utils/add-client-form-validation.js'
import { quasarNotifyTypes } from 'components/constants.js'

export function useAddClientTabValidation({
  activeTab,
  formRef,
  form,
  tabOrder,
  unlockThroughIndex,
  t,
  allergiesTabRef,
  fmhTabRef,
  vitalsTabRef,
  getBasicRules,
  getContactRules,
}) {
  const $q = useQuasar()
  const tabErrorCounts = ref({})

  function tabIndex(tab) {
    return tabIndexInOrder(tab, tabOrder)
  }

  function resetTabErrorCounts() {
    tabErrorCounts.value = {}
  }

  function tabErrorCount(tab) {
    return tabErrorCounts.value[tab] ?? 0
  }

  function notifyValidationError(message) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message,
      position: 'top',
    })
  }

  function forEachQFormTabField(tab, fn) {
    if (!formRef.value?.getValidationComponents) {
      return
    }
    const components = formRef.value.getValidationComponents()

    for (const field of components) {
      const panel = field.$el?.closest?.('[data-add-client-tab]')
      if (!panel) {
        continue
      }
      if (panel.getAttribute('data-add-client-tab') !== tab) {
        continue
      }
      fn(field)
    }
  }

  async function showQFormTabFieldErrors(tab) {
    if (!formRef.value?.getValidationComponents) {
      return
    }
    const components = formRef.value.getValidationComponents()

    for (const field of components) {
      const panel = field.$el?.closest?.('[data-add-client-tab]')
      if (!panel) {
        continue
      }
      if (panel.getAttribute('data-add-client-tab') !== tab) {
        continue
      }
      await field.validate()
    }
  }

  function clearQFormTabFieldErrors(tab) {
    forEachQFormTabField(tab, field => {
      if (typeof field.resetValidation === 'function') {
        field.resetValidation()
      }
    })
  }

  /**
   * Tab validation for Next / tab unlock — simple q-form fields only.
   * List add-forms (allergies, vitals, FMH drafts) validate on Add only.
   */
  function countTabErrors(tab) {
    if (ADD_CLIENT_COMING_SOON_TABS.has(tab)) {
      return 0
    }
    if (
      tab === addClientTabKeys.allergies
      || tab === addClientTabKeys.clinical
    ) {
      return 0
    }
    if (tab === addClientTabKeys.basic) {
      return countBasicTabFieldErrors(
        form.value,
        getBasicRules?.(),
      )
    }
    if (tab === addClientTabKeys.contact) {
      return countContactTabFieldErrors(
        form.value[clientFormSections.contact],
        getContactRules?.(),
      )
    }

    return 0
  }

  async function clearTabFieldErrors(tab) {
    if (tab === addClientTabKeys.allergies) {
      allergiesTabRef?.value?.clearSaveValidation?.()

      return
    }
    if (tab === addClientTabKeys.clinical) {
      vitalsTabRef?.value?.clearSaveValidation?.()
      fmhTabRef?.value?.clearSaveValidation?.()

      return
    }
    if (
      tab === addClientTabKeys.basic
      || tab === addClientTabKeys.contact
    ) {
      clearQFormTabFieldErrors(tab)
    }
  }

  async function applyTabFieldErrors(tab) {
    if (
      tab === addClientTabKeys.basic
      || tab === addClientTabKeys.contact
    ) {
      await showQFormTabFieldErrors(tab)
    }
  }

  async function validateTab(tab) {
    const count = countTabErrors(tab)
    if (count === 0) {
      await clearTabFieldErrors(tab)

      return true
    }

    return false
  }

  async function validateCurrentTabAndUnlock() {
    const tab = activeTab.value
    const idx = tabIndex(tab)
    if (idx < 0) {
      return false
    }
    await clearTabFieldErrors(tab)
    const ok = await validateTab(tab)
    if (!ok) {
      tabErrorCounts.value = {
        ...tabErrorCounts.value,
        [tab]: countTabErrors(tab),
      }
      await applyTabFieldErrors(tab)

      return false
    }
    const nextCounts = { ...tabErrorCounts.value }
    delete nextCounts[tab]
    tabErrorCounts.value = nextCounts
    if (idx < tabOrder.length - 1) {
      unlockThroughIndex(idx + 1)
    }

    return true
  }

  async function validateTabsThrough(targetIndex) {
    for (let i = 0; i < targetIndex; i += 1) {
      const tab = tabOrder[i]
      await clearTabFieldErrors(tab)
      const ok = await validateTab(tab)
      if (!ok) {
        activeTab.value = tab

        return false
      }
      unlockThroughIndex(i + 1)
    }

    return true
  }

  async function validateAllTabs() {
    resetTabErrorCounts()
    const counts = {}
    let totalErrors = 0

    for (const tab of tabOrder) {
      const count = countTabErrors(tab)
      if (count > 0) {
        counts[tab] = count
        totalErrors += count
      }
    }

    tabErrorCounts.value = counts

    if (totalErrors === 0) {
      return true
    }

    const firstInvalidTab = tabOrder.find(tab => (counts[tab] ?? 0) > 0)
    if (firstInvalidTab) {
      activeTab.value = firstInvalidTab
      await nextTick()
      await applyTabFieldErrors(firstInvalidTab)
    }

    notifyValidationError(t('addClientSaveValidationSummary'))

    return false
  }

  return {
    tabIndex,
    tabErrorCounts,
    tabErrorCount,
    resetTabErrorCounts,
    validateTab,
    validateCurrentTabAndUnlock,
    validateTabsThrough,
    validateAllTabs,
  }
}
