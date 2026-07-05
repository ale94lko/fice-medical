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
  buildContactSubTabErrorCounts,
} from 'src/utils/add-client-form-validation.js'
import { useValidationSaveFeedback } from
  'src/composables/useValidationSaveFeedback.js'
import {
  resolvePointOfContactSaveErrorKey,
} from 'src/utils/client-preferred-communication.js'
import {
  resolveMinorGuardianContactSaveErrorKey,
} from 'src/utils/client-minor-guardian-validation.js'
import {
  otherContactIdsMissingContactMethod,
} from 'src/utils/client-contact-form.js'
import {
  contactBusinessRuleExtraErrorCount,
  resolveOtherContactContactMethodSaveErrorKey,
} from 'src/utils/client-other-contact-validation.js'
import { CONTACT_SUB_TAB_SELF } from
  'src/composables/useContactSubTabs.js'

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
  contactTabRef,
  getBasicRules,
  getContactRules,
  validateReferralIntake,
}) {
  const { notifyAndScrollToValidationErrors } = useValidationSaveFeedback()
  const ck = clientFieldKeys
  const tabErrorCounts = ref({})
  const contactSaveBusinessRuleErrorKey = ref(null)
  const contactSubTabErrorCounts = ref({})
  const otherContactMissingContactMethodIds = ref([])

  function resolveTabLevelContactBusinessRuleErrorKey() {
    const contactSection = form.value[clientFormSections.contact]

    return resolvePointOfContactSaveErrorKey(contactSection)
      || resolveMinorGuardianContactSaveErrorKey(form.value)
      || null
  }

  function refreshOtherContactMissingContactMethodIds() {
    const contactSection = form.value[clientFormSections.contact]
    otherContactMissingContactMethodIds.value =
      otherContactIdsMissingContactMethod(contactSection)
  }

  function resolveContactBusinessRuleErrorKey() {
    return resolveTabLevelContactBusinessRuleErrorKey()
      || resolveOtherContactContactMethodSaveErrorKey(
        form.value[clientFormSections.contact],
      )
      || null
  }

  watch(
    () => form.value,
    () => {
      if (otherContactMissingContactMethodIds.value.length) {
        refreshOtherContactMissingContactMethodIds()
      }
      if (contactSaveBusinessRuleErrorKey.value) {
        contactSaveBusinessRuleErrorKey.value =
          resolveTabLevelContactBusinessRuleErrorKey()
      }
    },
    { deep: true },
  )

  function rebuildContactSubTabErrorCounts() {
    const contactSection = form.value[clientFormSections.contact]
    contactSubTabErrorCounts.value = buildContactSubTabErrorCounts(
      contactSection,
      getContactRules?.(),
      CONTACT_SUB_TAB_SELF,
    )
  }

  function tabIndex(tab) {
    return tabIndexInOrder(tab, tabOrder)
  }

  function resetTabErrorCounts() {
    tabErrorCounts.value = {}
    contactSaveBusinessRuleErrorKey.value = null
    contactSubTabErrorCounts.value = {}
    otherContactMissingContactMethodIds.value = []
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
    if (tab === addClientTabKeys.contact) {
      await contactTabRef?.value?.clearSaveValidation?.()

      return
    }
    if (tab === addClientTabKeys.basic) {
      clearQFormTabFieldErrors(tab)
    }
  }

  async function applyTabFieldErrors(tab) {
    if (tab === addClientTabKeys.allergies) {
      allergiesTabRef?.value?.applySaveValidation?.()

      return
    }
    if (tab === addClientTabKeys.contact) {
      await contactTabRef?.value?.applySaveValidation?.()

      return
    }
    if (tab === addClientTabKeys.basic) {
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
      if (tab === addClientTabKeys.contact) {
        rebuildContactSubTabErrorCounts()
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
    const tabLevelBusinessRuleErrorKey =
      resolveTabLevelContactBusinessRuleErrorKey()
    refreshOtherContactMissingContactMethodIds()
    if (tabLevelBusinessRuleErrorKey) {
      contactSaveBusinessRuleErrorKey.value = tabLevelBusinessRuleErrorKey
      const extraErrors = contactBusinessRuleExtraErrorCount(
        tabLevelBusinessRuleErrorKey,
      )
      if (extraErrors > 0) {
        counts[addClientTabKeys.contact] = (
          counts[addClientTabKeys.contact] ?? 0
        ) + extraErrors
        totalErrors += extraErrors
      }
    }

    tabErrorCounts.value = counts

    if (totalErrors === 0) {
      for (const tab of tabOrder) {
        await clearTabFieldErrors(tab)
      }

      return true
    }

    if ((counts[addClientTabKeys.contact] ?? 0) > 0) {
      rebuildContactSubTabErrorCounts()
    }

    const invalidTabs = tabOrder.filter(tab => (counts[tab] ?? 0) > 0)

    // Drop stale q-field error state on tabs that now pass so a
    // later save does not keep highlighting corrected fields.
    for (const tab of tabOrder) {
      if ((counts[tab] ?? 0) === 0) {
        await clearTabFieldErrors(tab)
      }
    }

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
    contactSubTabErrorCounts,
    otherContactMissingContactMethodIds,
  }
}
