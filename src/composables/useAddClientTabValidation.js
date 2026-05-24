import {
  ADD_CLIENT_COMING_SOON_TABS,
  tabIndexInOrder,
} from 'src/composables/useAddClientTabAccess.js'

export function useAddClientTabValidation({
  activeTab,
  formRef,
  tabOrder,
  unlockThroughIndex,
}) {
  function tabIndex(tab) {
    return tabIndexInOrder(tab, tabOrder)
  }

  async function validateTab(tab) {
    if (ADD_CLIENT_COMING_SOON_TABS.has(tab)) {
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
