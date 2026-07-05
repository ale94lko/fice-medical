import { nextTick, ref, watch } from 'vue'
import {
  ADD_CLIENT_COMING_SOON_TABS,
  tabIndexInOrder,
} from 'src/composables/useAddClientTabAccess.js'
import {
  addClientTabKeys,
  clientFieldKeys,
  clientFormSections,
} from 'components/constants.js'
import {
  allergyEntriesDobInvalidIds,
  countAllergyDraftFieldErrors,
} from 'src/utils/client-allergies.js'
import {
  countBasicTabFieldErrors,
  countContactTabFieldErrors,
} from 'src/utils/add-client-form-validation.js'
import { useValidationSaveFeedback } from
  'src/composables/useValidationSaveFeedback.js'
import {
  resolvePointOfContactSaveErrorKey,
} from 'src/utils/client-preferred-communication.js'
import {
  resolveMinorGuardianContactSaveErrorKey,
} from 'src/utils/client-minor-guardian-validation.js'

export function useAddClientTabValidation({
  activeTab,
  formRef,
  form,
  tabOrder,
  unlockThroughIndex,
  allergiesTabRef,
  fmhTabRef,
  vitalsTabRef,
  panelScrollRef,
  getBasicRules,
  getContactRules,
  validateReferralIntake,
}) {
  const { notifyAndScrollToValidationErrors } = useValidationSaveFeedback()
  const ck = clientFieldKeys
  const tabErrorCounts = ref({})
  const contactSaveBusinessRuleErrorKey = ref(null)

  function resolveContactBusinessRuleErrorKey() {
    const contactSection = form.value[clientFormSections.contact]

    return resolvePointOfContactSaveErrorKey(contactSection)
      || resolveMinorGuardianContactSaveErrorKey(form.value)
      || null
  }

  watch(
    () => form.value,
    () => {
      if (!contactSaveBusinessRuleErrorKey.value) {
        return
      }
      contactSaveBusinessRuleErrorKey.value =
        resolveContactBusinessRuleErrorKey()
    },
    { deep: true },
  )

  function tabIndex(tab) {
    return tabIndexInOrder(tab, tabOrder)
  }

  function resetTabErrorCounts() {
    tabErrorCounts.value = {}
    contactSaveBusinessRuleErrorKey.value = null
  }

  function tabErrorCount(tab) {
    return tabErrorCounts.value[tab] ?? 0
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
   * Tab validation for Next / tab unlock — q-form fields plus allergies
   * (draft + existing rows vs DOB). Clinical lists validate on Add only.
   */
  function countTabErrors(tab) {
    if (ADD_CLIENT_COMING_SOON_TABS.has(tab)) {
      return 0
    }
    if (tab === addClientTabKeys.clinical) {
      return 0
    }
    if (tab === addClientTabKeys.basic) {
      return countBasicTabFieldErrors(
        form.value,
        getBasicRules?.(),
        {
          validateReferralIntake: validateReferralIntake?.() ?? false,
        },
      )
    }
    if (tab === addClientTabKeys.contact) {
      return countContactTabFieldErrors(
        form.value[clientFormSections.contact],
        getContactRules?.(),
      )
    }
    if (tab === addClientTabKeys.allergies) {
      const birthContext = {
        dobUs: String(form.value[ck.dob] ?? '').trim(),
        age: form.value[ck.age],
        ageUnit: form.value[ck.ageUnit],
      }
      const sec = form.value[clientFormSections.allergies]
      const draftErrs = countAllergyDraftFieldErrors(sec, birthContext)
      const rowErrs = allergyEntriesDobInvalidIds(
        sec?.entries ?? [],
        birthContext,
      ).length

      return draftErrs + rowErrs
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
    if (tab === addClientTabKeys.allergies) {
      allergiesTabRef?.value?.applySaveValidation?.()

      return
    }
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

    const businessRuleErrorKey = resolveContactBusinessRuleErrorKey()
    if (businessRuleErrorKey) {
      contactSaveBusinessRuleErrorKey.value = businessRuleErrorKey
      counts[addClientTabKeys.contact] = (
        counts[addClientTabKeys.contact] ?? 0
      ) + 1
      totalErrors += 1
    }

    tabErrorCounts.value = counts

    if (totalErrors === 0) {
      return true
    }

    const invalidTabs = tabOrder.filter(tab => (counts[tab] ?? 0) > 0)

    // Visit every invalid tab so its fields mount (tab panels use
    // keep-alive) and show their error state, not just the tab the
    // user lands on. We still finish on the first invalid tab.
    for (const tab of invalidTabs) {
      activeTab.value = tab
      await nextTick()
      await applyTabFieldErrors(tab)
    }

    const firstInvalidTab = invalidTabs[0]
    if (firstInvalidTab && activeTab.value !== firstInvalidTab) {
      activeTab.value = firstInvalidTab
      await nextTick()
    }

    await notifyAndScrollToValidationErrors(panelScrollRef, {
      skipNotify: Boolean(businessRuleErrorKey),
    })

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
    contactSaveBusinessRuleErrorKey,
  }
}
