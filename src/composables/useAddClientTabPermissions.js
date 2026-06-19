import { computed } from 'vue'
import {
  addClientCareCoordinationSubTabKeys,
  addClientClinicalSubTabKeys,
  addClientTabKeys,
  clientPermissionNames,
} from 'components/constants.js'
import {
  ADD_CLIENT_MAIN_TABS,
  ADD_CLIENT_SUB_TABS,
} from 'src/composables/useAddClientSubTabs.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import {
  hasAnyPermission,
  hasPermission,
} from 'src/utils/auth-permissions.js'

const SUB_TAB_VIEW = {
  [addClientClinicalSubTabKeys.familyHistory]: [
    clientPermissionNames.viewTenantData,
    clientPermissionNames.viewClient,
  ],
  [addClientClinicalSubTabKeys.assessments]: [
    clientPermissionNames.viewScreenings,
  ],
  [addClientClinicalSubTabKeys.vitals]: [
    clientPermissionNames.viewVitalsClient,
  ],
  [addClientClinicalSubTabKeys.clinicalNotes]: [
    clientPermissionNames.viewMedicalNotesClient,
  ],
  [addClientClinicalSubTabKeys.carePlans]: [
    clientPermissionNames.viewCarePlans,
  ],
  [addClientClinicalSubTabKeys.labs]: [
    clientPermissionNames.viewLabsClient,
  ],
  [addClientCareCoordinationSubTabKeys.referrals]: [
    clientPermissionNames.viewReferrals,
  ],
  [addClientCareCoordinationSubTabKeys.appointments]: [
    clientPermissionNames.viewAppointmentSlot,
  ],
  [addClientCareCoordinationSubTabKeys.followUps]: [
    clientPermissionNames.viewFollowUps,
  ],
}

const SUB_TAB_EDIT = {
  [addClientClinicalSubTabKeys.familyHistory]: [
    clientPermissionNames.editTenantData,
  ],
  [addClientClinicalSubTabKeys.assessments]: [
    clientPermissionNames.editScreenings,
    clientPermissionNames.addScreenings,
  ],
  [addClientClinicalSubTabKeys.vitals]: [
    clientPermissionNames.editVitalsClient,
    clientPermissionNames.addVitalsClient,
  ],
  [addClientClinicalSubTabKeys.clinicalNotes]: [
    clientPermissionNames.editMedicalNotesClient,
    clientPermissionNames.addMedicalNotesClient,
  ],
  [addClientClinicalSubTabKeys.carePlans]: [
    clientPermissionNames.editCarePlans,
    clientPermissionNames.addCarePlans,
  ],
  [addClientClinicalSubTabKeys.labs]: [
    clientPermissionNames.editLabsClient,
    clientPermissionNames.addLabsClient,
  ],
  [addClientCareCoordinationSubTabKeys.referrals]: [
    clientPermissionNames.editReferrals,
    clientPermissionNames.addReferrals,
  ],
  [addClientCareCoordinationSubTabKeys.appointments]: [
    clientPermissionNames.bookAppointment,
    clientPermissionNames.cancelAppointment,
    clientPermissionNames.rescheduleAppointment,
  ],
  [addClientCareCoordinationSubTabKeys.followUps]: [
    clientPermissionNames.editFollowUps,
    clientPermissionNames.addFollowUps,
  ],
}

const MAIN_TAB_VIEW = {
  [addClientTabKeys.basic]: {
    create: [clientPermissionNames.addClient],
    edit: [
      clientPermissionNames.viewClient,
      clientPermissionNames.editBasicInfoClient,
    ],
  },
  [addClientTabKeys.contact]: {
    create: [
      clientPermissionNames.viewContact,
      clientPermissionNames.editContact,
    ],
    edit: [
      clientPermissionNames.viewContact,
      clientPermissionNames.editContact,
    ],
  },
  [addClientTabKeys.allergies]: {
    create: [
      clientPermissionNames.viewAllergies,
      clientPermissionNames.editAllergies,
    ],
    edit: [
      clientPermissionNames.viewAllergies,
      clientPermissionNames.editAllergies,
    ],
  },
  [addClientTabKeys.insurance]: {
    create: [
      clientPermissionNames.viewClient,
      clientPermissionNames.editTenantData,
      clientPermissionNames.editBasicInfoClient,
    ],
    edit: [
      clientPermissionNames.viewClient,
      clientPermissionNames.editTenantData,
      clientPermissionNames.editBasicInfoClient,
    ],
  },
}

function uniquePermissions(list = []) {
  return [...new Set(list.filter(Boolean))]
}

export function getSubTabViewPermissions(subTabKey) {
  return uniquePermissions([
    ...(SUB_TAB_VIEW[subTabKey] ?? []),
    ...(SUB_TAB_EDIT[subTabKey] ?? []),
  ])
}

function getMainTabViewPermissions(tabKey, isCreate) {
  const entry = MAIN_TAB_VIEW[tabKey]
  if (!entry) {
    return []
  }

  return uniquePermissions(isCreate ? entry.create : entry.edit)
}

export function canViewSubTab(modules, subTabKey) {
  const permissions = getSubTabViewPermissions(subTabKey)
  if (!permissions.length) {
    return false
  }

  return hasAnyPermission(modules, permissions)
}

export function canViewMainTab(modules, tabKey, isCreate) {
  switch (tabKey) {
    case addClientTabKeys.basic:
    case addClientTabKeys.contact:
    case addClientTabKeys.allergies:
    case addClientTabKeys.insurance:
      return hasAnyPermission(
        modules,
        getMainTabViewPermissions(tabKey, isCreate),
      )
    case addClientTabKeys.clinical:
    case addClientTabKeys.careCoordination:
      return filterSubTabs(modules, tabKey).length > 0
    case addClientTabKeys.financials:
      return hasPermission(modules, 'VIEW_TENANTS_BILLING')
    case addClientTabKeys.documents:
      return hasPermission(modules, clientPermissionNames.viewTenantData)
    default:
      return false
  }
}

export function filterSubTabs(modules, parentKey) {
  const tabs = ADD_CLIENT_SUB_TABS[parentKey] ?? []
  if (parentKey === addClientTabKeys.financials) {
    return hasPermission(modules, 'VIEW_TENANTS_BILLING') ? tabs : []
  }
  if (parentKey === addClientTabKeys.documents) {
    return hasPermission(modules, clientPermissionNames.viewTenantData)
      ? tabs
      : []
  }

  return tabs.filter(tab => canViewSubTab(modules, tab.key))
}

export function canEditMainTab(modules, tabKey, isCreate) {
  switch (tabKey) {
    case addClientTabKeys.basic:
      return isCreate
        ? hasPermission(modules, clientPermissionNames.addClient)
        : hasPermission(modules, clientPermissionNames.editBasicInfoClient)
    case addClientTabKeys.contact:
      return hasPermission(modules, clientPermissionNames.editContact)
    case addClientTabKeys.allergies:
      return hasPermission(modules, clientPermissionNames.editAllergies)
    case addClientTabKeys.insurance:
      return hasPermission(modules, clientPermissionNames.editTenantData)
        || hasPermission(modules, clientPermissionNames.editBasicInfoClient)
    default:
      return false
  }
}

export function canEditSubTab(modules, subTabKey) {
  const permissions = SUB_TAB_EDIT[subTabKey]
  if (!permissions?.length) {
    return false
  }

  return hasAnyPermission(modules, permissions)
}

export function useAddClientTabPermissions(isCreateMode) {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)
  const isCreate = computed(() => isCreateMode.value === true)

  const visibleMainTabs = computed(() =>
    ADD_CLIENT_MAIN_TABS.filter(
      tab => canViewMainTab(permissions.value, tab.key, isCreate.value),
    ),
  )

  const visibleTabOrder = computed(
    () => visibleMainTabs.value.map(tab => tab.key),
  )

  const visibleSubTabsFor = parentKey => computed(
    () => filterSubTabs(permissions.value, parentKey),
  )

  const canEditBasicInfo = computed(() =>
    canEditMainTab(
      permissions.value,
      addClientTabKeys.basic,
      isCreate.value,
    ),
  )

  const canEditContact = computed(() =>
    canEditMainTab(
      permissions.value,
      addClientTabKeys.contact,
      isCreate.value,
    ),
  )

  const canEditAllergies = computed(() =>
    canEditMainTab(
      permissions.value,
      addClientTabKeys.allergies,
      isCreate.value,
    ),
  )

  const canEditInsurance = computed(() =>
    canEditMainTab(
      permissions.value,
      addClientTabKeys.insurance,
      isCreate.value,
    ),
  )

  const canViewMainTabFor = tabKey => computed(
    () => canViewMainTab(permissions.value, tabKey, isCreate.value),
  )

  const canViewSubTabFor = subTabKey => computed(
    () => canViewSubTab(permissions.value, subTabKey),
  )

  const canEditSubTabFor = subTabKey => computed(
    () => canEditSubTab(permissions.value, subTabKey),
  )

  const canSaveForm = computed(() => {
    if (isCreate.value) {
      return hasPermission(permissions.value, clientPermissionNames.addClient)
    }

    return [
      addClientTabKeys.basic,
      addClientTabKeys.contact,
      addClientTabKeys.allergies,
      addClientTabKeys.insurance,
    ].some(tab => canEditMainTab(permissions.value, tab, false))
      || Object.keys(SUB_TAB_EDIT).some(
        subTabKey => canEditSubTab(permissions.value, subTabKey),
      )
  })

  return {
    visibleMainTabs,
    visibleTabOrder,
    visibleSubTabsFor,
    canEditBasicInfo,
    canEditContact,
    canEditAllergies,
    canEditInsurance,
    canViewMainTabFor,
    canViewSubTabFor,
    canEditSubTabFor,
    canSaveForm,
    filterSubTabsFor: parentKey =>
      filterSubTabs(permissions.value, parentKey),
  }
}
