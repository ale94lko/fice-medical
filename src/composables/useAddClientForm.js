import { computed, ref } from 'vue'
import {
  addClientTabKeys,
  clientAgeUnitValues,
  clientFieldKeys,
  clientFormSections,
} from 'components/constants.js'
import {
  generateClientNumber,
  snapshotAddClientForm,
  todayDateUs,
} from 'src/utils/client-form.js'
import { createEmptyContactSection } from 'src/utils/client-contact-form.js'
import {
  createEmptyFamilyMedicalHistorySection,
} from 'src/utils/client-family-medical-history.js'
import { createEmptyAllergiesSection } from 'src/utils/client-allergies.js'
import { createEmptyInsuranceSection } from 'src/utils/client-insurance.js'
import { createEmptyFollowUpsSection } from 'src/utils/client-follow-ups.js'
import { createEmptyVitalsSection } from 'src/utils/client-vitals.js'
import { useAddClientAgeSync } from 'src/composables/useAddClientAgeSync.js'
import {
  useAddClientFormRules,
} from 'src/composables/useAddClientFormRules.js'
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
  [addClientTabKeys.insurance]: 'tabInsurance',
  [addClientTabKeys.clinical]: 'tabClinical',
  [addClientTabKeys.careCoordination]: 'tabCareCoordination',
  [addClientTabKeys.financials]: 'tabFinancial',
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
    [ck.prefix]: null,
    [ck.suffix]: null,
    [ck.gender]: '',
    [ck.race]: null,
    [ck.ethnicity]: null,
    [ck.dob]: '',
    [ck.age]: '',
    [ck.ageUnit]: clientAgeUnitValues.years,
    [ck.socialSecurityNumber]: '',
    [ck.idNumberMasked]: '',
    [ck.admissionDate]: todayDateUs(),
    [ck.clinicians]: [],
    [ck.status]: 'active',
    [clientFormSections.contact]: createEmptyContactSection(),
    [clientFormSections.familyMedicalHistory]:
      createEmptyFamilyMedicalHistorySection(),
    [clientFormSections.allergies]: createEmptyAllergiesSection(),
    [clientFormSections.insurance]: createEmptyInsuranceSection(),
    [clientFormSections.vitals]: createEmptyVitalsSection(),
    [clientFormSections.labs]: [],
    [clientFormSections.followUps]: createEmptyFollowUpsSection(),
  }
}

export function useAddClientForm(t, catalogs, options = {}) {
  const ck = clientFieldKeys
  const activeTab = ref(addClientTabKeys.basic)
  const initialSnapshot = ref('')
  const formRef = ref(null)
  const form = ref(createEmptyAddClientForm())

  function resolveInitialTab() {
    const candidate = String(options?.initialActiveTab ?? '').trim()
    if (
      candidate
      && Object.values(addClientTabKeys).includes(candidate)
    ) {
      return candidate
    }

    return addClientTabKeys.basic
  }

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

  const { ageFieldsLocked } = useAddClientAgeSync(
    form,
    ck.dob,
    ck.age,
    ck.ageUnit,
    {
      resolveAgeUnitCode: code => catalogs?.resolveAgeUnitCode?.(code),
      watchAgeUnitOptions: () => catalogs?.ageUnitSelectOptions?.value,
    },
  )

  const { rules, contactRules } = useAddClientFormRules(
    t,
    form,
    ageFieldsLocked,
  )

  const genderOptions = catalogs?.genderOptions
  const prefixSelectOptions = catalogs?.prefixSelectOptions
  const suffixSelectOptions = catalogs?.suffixSelectOptions
  const raceSelectOptions = catalogs?.raceSelectOptions
  const ethnicitySelectOptions = catalogs?.ethnicitySelectOptions
  const ageUnitSelectOptions = catalogs?.ageUnitSelectOptions
  const contactTypeSelectOptions = catalogs?.contactTypeSelectOptions
  const relationshipTypeSelectOptions = catalogs?.relationshipTypeSelectOptions

  const assignedClinicianOptions = computed(() => {
    const opts = catalogs?.assignedClinicianSelectOptions
    if (opts && typeof opts.value !== 'undefined') {
      return opts.value
    }

    return []
  })

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

  function applyForm(nextForm) {
    if (!nextForm || typeof nextForm !== 'object') {
      return
    }
    form.value = nextForm
    activeTab.value = resolveInitialTab()
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

  const {
    tabIndex,
    tabErrorCount,
    validateTab,
    validateCurrentTabAndUnlock,
    validateTabsThrough,
    validateAllTabs,
  } = useAddClientTabValidation({
    activeTab,
    formRef,
    form,
    tabOrder: TAB_ORDER,
    unlockThroughIndex,
    allergiesTabRef: options.allergiesTabRef,
    fmhTabRef: options.fmhTabRef,
    vitalsTabRef: options.vitalsTabRef,
    panelScrollRef: options.panelScrollRef,
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
    ageFieldsLocked,
    ageUnitSelectOptions,
    assignedClinicianOptions,
    genderOptions,
    prefixSelectOptions,
    suffixSelectOptions,
    raceSelectOptions,
    ethnicitySelectOptions,
    contactTypeSelectOptions,
    relationshipTypeSelectOptions,
    rules,
    contactRules,
    resetForm,
    applyForm,
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
