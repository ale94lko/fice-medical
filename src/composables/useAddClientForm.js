import { computed, ref } from 'vue'
import {
  addClientTabKeys,
  clientAgeUnitValues,
  clientFieldKeys,
  clientFormSections,
  clientNameMaxLength,
} from 'components/constants.js'
import {
  generateClientNumber,
  isAdmissionDateValid,
  isLettersOnly,
  isValidSsnDigits,
  maxAgeForUnit,
  normalizeSsnDigits,
  parseUsDateString,
  snapshotAddClientForm,
  todayDateUs,
} from 'src/utils/client-form.js'
import { createEmptyContactSection } from 'src/utils/client-contact-form.js'
import {
  createEmptyFamilyMedicalHistorySection,
} from 'src/utils/client-family-medical-history.js'
import { createEmptyAllergiesSection } from 'src/utils/client-allergies.js'
import { useAddClientAgeSync } from 'src/composables/useAddClientAgeSync.js'
import {
  useAddClientContactRules,
} from 'src/composables/useAddClientContactRules.js'
import {
  ADD_CLIENT_TAB_ORDER,
  useAddClientTabAccess,
} from 'src/composables/useAddClientTabAccess.js'
import {
  useAddClientTabValidation,
} from 'src/composables/useAddClientTabValidation.js'
import {
  ADD_CLIENT_SUB_TABS,
  ADD_CLIENT_TABS_WITH_SUBTABS,
  useAddClientSubTabs,
} from 'src/composables/useAddClientSubTabs.js'

const TAB_ORDER = ADD_CLIENT_TAB_ORDER

const TAB_LABEL_KEYS = {
  [addClientTabKeys.basic]: 'tabBasicInfo',
  [addClientTabKeys.contact]: 'tabContact',
  [addClientTabKeys.allergies]: 'tabAllergies',
  [addClientTabKeys.assessments]: 'tabAssessments',
  [addClientTabKeys.clinical]: 'tabClinical',
  [addClientTabKeys.careCoordination]: 'tabCareCoordination',
  [addClientTabKeys.financials]: 'tabFinancials',
  [addClientTabKeys.documents]: 'tabDocuments',
}

function resolveAddClientTabLabel(tab, t, activeSubTabKey) {
  const key = TAB_LABEL_KEYS[tab] ?? TAB_LABEL_KEYS[addClientTabKeys.basic]
  const main = t(key)
  if (!ADD_CLIENT_TABS_WITH_SUBTABS.has(tab)) {
    return main
  }
  const subTabs = ADD_CLIENT_SUB_TABS[tab] ?? []
  const sub = subTabs.find(item => item.key === activeSubTabKey)
  if (!sub) {
    return main
  }

  return `${main} / ${t(sub.labelKey)}`
}

export function createEmptyAddClientForm() {
  const ck = clientFieldKeys

  return {
    [ck.clientNumber]: generateClientNumber(),
    [ck.firstName]: '',
    [ck.middleName]: '',
    [ck.lastName]: '',
    [ck.suffix]: '',
    [ck.sex]: '',
    [ck.dob]: '',
    [ck.age]: '',
    [ck.ageUnit]: clientAgeUnitValues.years,
    [ck.socialSecurityNumber]: '',
    [ck.admissionDate]: todayDateUs(),
    [ck.assignedClinician]: '',
    [clientFormSections.contact]: createEmptyContactSection(),
    [clientFormSections.familyMedicalHistory]:
      createEmptyFamilyMedicalHistorySection(),
    [clientFormSections.allergies]: createEmptyAllergiesSection(),
  }
}

export function useAddClientForm(t, catalogs, options = {}) {
  const ck = clientFieldKeys
  const activeTab = ref(addClientTabKeys.basic)
  const initialSnapshot = ref('')
  const formRef = ref(null)

  const form = ref(createEmptyAddClientForm())

  const {
    hasSubTabs,
    currentSubTabs,
    activeSubTab,
    resetSubTabs,
  } = useAddClientSubTabs(activeTab)

  const {
    resetTabAccess,
    unlockThroughIndex,
  } = useAddClientTabAccess()

  useAddClientAgeSync(
    form,
    ck.dob,
    ck.age,
    ck.ageUnit,
    {
      resolveAgeUnitCode: code => catalogs?.resolveAgeUnitCode?.(code),
      watchAgeUnitOptions: () => catalogs?.ageUnitSelectOptions?.value,
    },
  )

  const sexOptions = catalogs?.sexOptions
  const suffixSelectOptions = catalogs?.suffixSelectOptions
  const ageUnitSelectOptions = catalogs?.ageUnitSelectOptions

  function resetForm() {
    const next = createEmptyAddClientForm()
    if (catalogs?.defaultAgeUnitValue) {
      next[ck.ageUnit] = catalogs.defaultAgeUnitValue()
    }
    form.value = next
    activeTab.value = addClientTabKeys.basic
    initialSnapshot.value = snapshotAddClientForm(form.value)
    resetTabAccess()
    resetSubTabs()
  }

  function markPristine() {
    initialSnapshot.value = snapshotAddClientForm(form.value)
  }

  function isDirty() {
    return snapshotAddClientForm(form.value) !== initialSnapshot.value
  }

  function requiredRule(message) {
    return val => {
      const s = String(val ?? '').trim()

      return s.length > 0 || message
    }
  }

  function lettersFormatRule(maxLen) {
    return val => {
      const s = String(val ?? '').trim()
      if (!s) {
        return true
      }
      if (!isLettersOnly(s, maxLen)) {
        return t('lettersOnlyMax', { max: maxLen })
      }

      return true
    }
  }

  function lettersRule(message, maxLen, required = false) {
    return val => {
      const s = String(val ?? '').trim()
      if (!s) {
        return required ? message : true
      }
      if (!isLettersOnly(s, maxLen)) {
        return t('lettersOnlyMax', { max: maxLen })
      }

      return true
    }
  }

  function usDateRule(message, required = false, { maxToday = false } = {}) {
    return val => {
      const s = String(val ?? '').trim()
      if (!s) {
        return required ? message : true
      }
      if (!parseUsDateString(s)) {
        return message
      }
      if (maxToday && !isAdmissionDateValid(s)) {
        return message
      }

      return true
    }
  }

  function admissionDateRule() {
    return val => {
      const s = String(val ?? '').trim()
      if (!s) {
        return t('admissionDateRequired')
      }
      if (!isAdmissionDateValid(s)) {
        return t('admissionDateNotFuture')
      }

      return true
    }
  }

  function ageRule() {
    return val => {
      const s = String(val ?? '').trim()
      if (!s) {
        return true
      }
      const n = Number(s)
      const max = maxAgeForUnit(form.value[ck.ageUnit])
      if (!Number.isFinite(n) || n < 0 || n > max) {
        return t('ageRange', { max })
      }

      return true
    }
  }

  function ssnRule() {
    return () => {
      const digits = normalizeSsnDigits(form.value[ck.socialSecurityNumber])

      return isValidSsnDigits(digits) || t('ssnInvalid')
    }
  }

  const { contactRules } = useAddClientContactRules(t, lettersRule)

  const rules = computed(() => ({
    firstName: [
      requiredRule(t('firstNameRequired')),
      lettersFormatRule(clientNameMaxLength),
    ],
    middleName: [
      lettersFormatRule(clientNameMaxLength),
    ],
    lastName: [
      requiredRule(t('lastNameRequired')),
      lettersFormatRule(clientNameMaxLength),
    ],
    dob: [usDateRule(t('dobInvalid'), false, { maxToday: true })],
    admissionDate: [admissionDateRule()],
    age: [ageRule()],
    ssn: [ssnRule()],
  }))

  const {
    tabIndex,
    tabErrorCount,
    validateTab,
    validateCurrentTabAndUnlock,
    validateTabsThrough,
    validateAllTabs,
  } = useAddClientTabValidation({
    activeTab,
    activeSubTab,
    formRef,
    form,
    tabOrder: TAB_ORDER,
    unlockThroughIndex,
    t,
    allergiesTabRef: options.allergiesTabRef,
    fmhTabRef: options.fmhTabRef,
    getBasicRules: () => rules.value,
    getContactRules: () => contactRules.value,
  })

  function tabLabelFor(tab) {
    const subKey = tab === activeTab.value
      ? activeSubTab.value
      : ADD_CLIENT_SUB_TABS[tab]?.[0]?.key

    return resolveAddClientTabLabel(tab, t, subKey)
  }

  function goNextTab() {
    const idx = tabIndex(activeTab.value)
    if (idx < 0 || idx >= TAB_ORDER.length - 1) {
      return
    }
    activeTab.value = TAB_ORDER[idx + 1]
  }

  function goPreviousTab() {
    const idx = tabIndex(activeTab.value)
    if (idx <= 0) {
      return
    }
    activeTab.value = TAB_ORDER[idx - 1]
  }

  function canGoNext() {
    return tabIndex(activeTab.value) < TAB_ORDER.length - 1
  }

  function canGoPrevious() {
    return tabIndex(activeTab.value) > 0
  }

  return {
    ck,
    contactSectionKey: clientFormSections.contact,
    form,
    formRef,
    activeTab,
    activeSubTab,
    hasSubTabs,
    currentSubTabs,
    addClientTabKeys,
    ageUnitSelectOptions,
    assignedClinicianOptions: [],
    sexOptions,
    suffixSelectOptions,
    rules,
    contactRules,
    resetForm,
    markPristine,
    isDirty,
    goNextTab,
    canGoNext,
    goPreviousTab,
    canGoPrevious,
    validateTab,
    validateCurrentTabAndUnlock,
    validateTabsThrough,
    validateAllTabs,
    tabErrorCount,
    tabIndex,
    tabLabelFor,
    TAB_ORDER,
    createEmptyForm: createEmptyAddClientForm,
  }
}
