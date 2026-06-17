import { computed, ref, watch } from 'vue'
import {
  addClientClinicalSubTabKeys,
  addClientCareCoordinationSubTabKeys,
  addClientTabKeys,
} from 'components/constants.js'

export const CLINICAL_FAMILY_HISTORY_SUB_TAB =
  addClientClinicalSubTabKeys.familyHistory

export const CLINICAL_VITALS_SUB_TAB = addClientClinicalSubTabKeys.vitals

export const CLINICAL_ASSESSMENTS_SUB_TAB =
  addClientClinicalSubTabKeys.assessments

export const CLINICAL_LABS_SUB_TAB = addClientClinicalSubTabKeys.labs

export const CARE_COORDINATION_FOLLOW_UPS_SUB_TAB =
  addClientCareCoordinationSubTabKeys.followUps

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
    key: addClientTabKeys.insurance,
    icon: 'health_and_safety',
    labelKey: 'tabInsurance',
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
    labelKey: 'tabFinancial',
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
      key: addClientClinicalSubTabKeys.familyHistory,
      icon: 'groups',
      labelKey: 'subTabFamilyHistory',
    },
    {
      key: addClientClinicalSubTabKeys.assessments,
      icon: 'assignment',
      labelKey: 'subTabAssessments',
    },
    {
      key: addClientClinicalSubTabKeys.vitals,
      icon: 'monitor_heart',
      labelKey: 'subTabVitals',
    },
    {
      key: addClientClinicalSubTabKeys.clinicalNotes,
      icon: 'description',
      labelKey: 'subTabClinicalNotes',
    },
    {
      key: addClientClinicalSubTabKeys.carePlans,
      icon: 'assignment_turned_in',
      labelKey: 'subTabCarePlans',
    },
    {
      key: addClientClinicalSubTabKeys.labs,
      icon: 'science',
      labelKey: 'subTabLabs',
    },
  ],
  [addClientTabKeys.careCoordination]: [
    {
      key: addClientCareCoordinationSubTabKeys.referrals,
      icon: 'share',
      labelKey: 'subTabReferrals',
    },
    {
      key: addClientCareCoordinationSubTabKeys.appointments,
      icon: 'event',
      labelKey: 'subTabAppointments',
    },
    {
      key: addClientCareCoordinationSubTabKeys.careTeam,
      icon: 'groups',
      labelKey: 'subTabCareTeam',
    },
    {
      key: addClientCareCoordinationSubTabKeys.authorizations,
      icon: 'verified',
      labelKey: 'subTabAuthorizations',
    },
    {
      key: addClientCareCoordinationSubTabKeys.tasks,
      icon: 'task_alt',
      labelKey: 'subTabTasks',
    },
    {
      key: addClientCareCoordinationSubTabKeys.followUps,
      icon: 'update',
      labelKey: 'subTabFollowUps',
    },
  ],
  [addClientTabKeys.financials]: [
    {
      key: 'billing',
      icon: 'payments',
      labelKey: 'subTabBilling',
    },
    {
      key: 'claims',
      icon: 'receipt_long',
      labelKey: 'subTabClaims',
    },
    {
      key: 'payments',
      icon: 'paid',
      labelKey: 'subTabPayments',
    },
  ],
  [addClientTabKeys.documents]: [
    {
      key: 'attachments',
      icon: 'attach_file',
      labelKey: 'subTabAttachments',
    },
    {
      key: 'consents',
      icon: 'draw',
      labelKey: 'subTabConsents',
    },
    {
      key: 'signedForms',
      icon: 'fact_check',
      labelKey: 'subTabSignedForms',
    },
    {
      key: 'scannedDocs',
      icon: 'document_scanner',
      labelKey: 'subTabScannedDocs',
    },
  ],
}

export const ADD_CLIENT_TABS_WITH_SUBTABS = new Set(
  Object.keys(ADD_CLIENT_SUB_TABS),
)

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
