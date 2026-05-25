import { computed, ref, watch } from 'vue'
import { addClientTabKeys } from 'components/constants.js'

export const ADD_CLIENT_MAIN_TABS = [
  {
    key: addClientTabKeys.basic,
    icon: 'badge',
    labelKey: 'tabBasicInfo',
  },
  {
    key: addClientTabKeys.contact,
    icon: 'contacts',
    labelKey: 'tabContact',
  },
  {
    key: addClientTabKeys.allergies,
    icon: 'medication',
    labelKey: 'tabAllergies',
  },
  {
    key: addClientTabKeys.assessments,
    icon: 'assignment',
    labelKey: 'tabAssessments',
  },
  {
    key: addClientTabKeys.clinical,
    icon: 'medical_services',
    labelKey: 'tabClinical',
    hasSubTabs: true,
  },
  {
    key: addClientTabKeys.careCoordination,
    icon: 'hub',
    labelKey: 'tabCareCoordination',
    hasSubTabs: true,
  },
  {
    key: addClientTabKeys.financials,
    icon: 'payments',
    labelKey: 'tabFinancials',
    hasSubTabs: true,
  },
  {
    key: addClientTabKeys.documents,
    icon: 'description',
    labelKey: 'tabDocuments',
    hasSubTabs: true,
  },
]

export const ADD_CLIENT_SUB_TABS = {
  [addClientTabKeys.clinical]: [
    {
      key: 'vitals',
      icon: 'monitor_heart',
      labelKey: 'subTabVitals',
    },
    {
      key: 'labs',
      icon: 'science',
      labelKey: 'subTabLabs',
    },
    {
      key: 'carePlans',
      icon: 'assignment',
      labelKey: 'subTabCarePlans',
    },
    {
      key: 'familyHistory',
      icon: 'groups',
      labelKey: 'tabFamilyMedicalHistory',
    },
    {
      key: 'clinicalNotes',
      icon: 'description',
      labelKey: 'subTabClinicalNotes',
    },
  ],
  [addClientTabKeys.careCoordination]: [
    {
      key: 'referrals',
      icon: 'share',
      labelKey: 'subTabReferrals',
    },
    {
      key: 'careTeam',
      icon: 'groups',
      labelKey: 'subTabCareTeam',
    },
    {
      key: 'coordinationNotes',
      icon: 'description',
      labelKey: 'subTabCoordinationNotes',
    },
  ],
  [addClientTabKeys.financials]: [
    {
      key: 'billing',
      icon: 'payments',
      labelKey: 'subTabBilling',
    },
    {
      key: 'insurance',
      icon: 'health_and_safety',
      labelKey: 'subTabInsurance',
    },
    {
      key: 'authorizations',
      icon: 'verified',
      labelKey: 'subTabAuthorizations',
    },
  ],
  [addClientTabKeys.documents]: [
    {
      key: 'clientDocuments',
      icon: 'folder',
      labelKey: 'subTabClientDocuments',
    },
    {
      key: 'forms',
      icon: 'description',
      labelKey: 'subTabForms',
    },
  ],
}

export const ADD_CLIENT_TABS_WITH_SUBTABS = new Set(
  Object.keys(ADD_CLIENT_SUB_TABS),
)

export const CLINICAL_FAMILY_HISTORY_SUB_TAB = 'familyHistory'

export function useAddClientSubTabs(activeTab) {
  const activeSubTabByParent = ref({})

  const hasSubTabs = computed(
    () => ADD_CLIENT_TABS_WITH_SUBTABS.has(activeTab.value),
  )

  const currentSubTabs = computed(
    () => ADD_CLIENT_SUB_TABS[activeTab.value] ?? [],
  )

  const activeSubTab = computed({
    get() {
      const parent = activeTab.value
      const tabs = ADD_CLIENT_SUB_TABS[parent]
      if (!tabs?.length) {
        return ''
      }
      const stored = activeSubTabByParent.value[parent]
      if (stored && tabs.some(tab => tab.key === stored)) {
        return stored
      }

      return tabs[0].key
    },
    set(value) {
      activeSubTabByParent.value = {
        ...activeSubTabByParent.value,
        [activeTab.value]: value,
      }
    },
  })

  function resetSubTabs() {
    activeSubTabByParent.value = {}
  }

  watch(activeTab, parent => {
    if (!ADD_CLIENT_TABS_WITH_SUBTABS.has(parent)) {
      return
    }
    const tabs = ADD_CLIENT_SUB_TABS[parent]
    const stored = activeSubTabByParent.value[parent]
    if (!stored || !tabs.some(tab => tab.key === stored)) {
      activeSubTabByParent.value = {
        ...activeSubTabByParent.value,
        [parent]: tabs[0].key,
      }
    }
  })

  return {
    hasSubTabs,
    currentSubTabs,
    activeSubTab,
    resetSubTabs,
  }
}
