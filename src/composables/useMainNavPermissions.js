import { computed } from 'vue'
import { permissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import {
  hasAnyPermission,
  hasAssignedPermissions,
  hasPermission,
} from 'src/utils/auth-permissions.js'

const administrationPermissions = [
  permissionNames.viewConfig,
  permissionNames.editConfig,
  permissionNames.viewModules,
  permissionNames.editModules,
  permissionNames.viewPermissions,
  permissionNames.editPermissions,
  permissionNames.viewRoles,
  permissionNames.addRole,
  permissionNames.editRole,
  permissionNames.viewCatalog,
  permissionNames.editCatalog,
  permissionNames.viewPlans,
  permissionNames.editPlans,
  permissionNames.viewTenants,
  permissionNames.viewAuditLog,
  permissionNames.viewSubtenants,
]

const humanResourcesPermissions = [
  permissionNames.viewCredentials,
]

export function useMainNavPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const showDashboard = computed(() =>
    hasAssignedPermissions(permissions.value),
  )

  const showClientMenu = computed(() =>
    hasAnyPermission(
      permissions.value,
      [permissionNames.viewClient, permissionNames.addClient],
    ),
  )

  const showClientList = computed(() =>
    hasPermission(permissions.value, permissionNames.viewClient),
  )

  const showClientAdd = computed(() =>
    hasPermission(permissions.value, permissionNames.addClient),
  )

  const showStaffMenu = computed(() =>
    hasAnyPermission(permissions.value, [
      permissionNames.viewStaffMembers,
      permissionNames.editStaffMembers,
    ]),
  )

  const showStaffAddClinician = computed(() =>
    hasAnyPermission(permissions.value, [
      permissionNames.editStaffMembers,
      permissionNames.addTenantsUser,
    ]),
  )

  const showStaffAddStaff = computed(() =>
    hasAnyPermission(permissions.value, [
      permissionNames.editStaffMembers,
      permissionNames.addTenantsUser,
    ]),
  )

  const showUsersMenu = computed(() =>
    hasAnyPermission(permissions.value, [
      permissionNames.viewTenantsUser,
      permissionNames.addTenantsUser,
    ]),
  )

  const showUsersAdd = computed(() =>
    hasPermission(permissions.value, permissionNames.addTenantsUser),
  )

  const showProvidersMenu = computed(() =>
    hasPermission(permissions.value, permissionNames.viewClinicians),
  )

  const showHumanResourcesMenu = computed(() =>
    hasAnyPermission(permissions.value, humanResourcesPermissions),
  )

  const showHrGeneral = computed(() =>
    hasPermission(permissions.value, permissionNames.viewStaffMembers),
  )

  const showHrEmployees = computed(() =>
    hasPermission(permissions.value, permissionNames.viewStaffMembers),
  )

  const showHrCredentials = computed(() =>
    hasPermission(permissions.value, permissionNames.viewCredentials),
  )

  const showAdminStaffList = computed(() =>
    hasPermission(permissions.value, permissionNames.viewStaffMembers),
  )

  const showBilling = computed(() =>
    hasPermission(permissions.value, permissionNames.viewTenantsBilling),
  )

  const showAdministrationMenu = computed(() =>
    hasAnyPermission(permissions.value, administrationPermissions),
  )

  const showAdminGeneral = computed(() =>
    hasAnyPermission(permissions.value, [
      permissionNames.viewConfig,
      permissionNames.editConfig,
    ]),
  )

  const showAdminUsers = computed(() =>
    hasPermission(permissions.value, permissionNames.viewTenantsUser),
  )

  const showAdminSubtenants = computed(() =>
    hasPermission(permissions.value, permissionNames.viewSubtenants),
  )

  return {
    showDashboard,
    showClientMenu,
    showClientList,
    showClientAdd,
    showStaffMenu,
    showStaffAddClinician,
    showStaffAddStaff,
    showUsersMenu,
    showUsersAdd,
    showProvidersMenu,
    showHumanResourcesMenu,
    showHrGeneral,
    showHrEmployees,
    showHrCredentials,
    showAdminStaffList,
    showBilling,
    showAdministrationMenu,
    showAdminGeneral,
    showAdminSubtenants,
    showAdminUsers,
  }
}

export function canAccessRoute(permissions, meta = {}) {
  if (meta.requiresPermission) {
    return hasPermission(permissions, meta.requiresPermission)
  }
  if (Array.isArray(meta.requiresAnyPermission)
    && meta.requiresAnyPermission.length) {
    return hasAnyPermission(permissions, meta.requiresAnyPermission)
  }

  return true
}
