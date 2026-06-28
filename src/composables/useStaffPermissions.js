import { computed } from 'vue'
import { permissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasAnyPermission, hasPermission } from 'src/utils/auth-permissions.js'

function usePermission(permissions, permission) {
  return computed(() => hasPermission(permissions.value, permission))
}

export function useStaffPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewStaff = usePermission(
    permissions,
    permissionNames.viewStaffMembers,
  )
  const canEditStaff = usePermission(
    permissions,
    permissionNames.editStaffMembers,
  )
  const canAddStaff = computed(() =>
    hasAnyPermission(permissions.value, [
      permissionNames.editStaffMembers,
      permissionNames.addTenantsUser,
    ]),
  )
  const canAddClinician = computed(() =>
    hasAnyPermission(permissions.value, [
      permissionNames.editStaffMembers,
      permissionNames.addTenantsUser,
    ]),
  )
  const canChangeStatus = usePermission(
    permissions,
    permissionNames.editStaffMembers,
  )
  const canCreateSystemUser = usePermission(
    permissions,
    permissionNames.addTenantsUser,
  )

  return {
    canViewStaff,
    canEditStaff,
    canAddStaff,
    canAddClinician,
    canChangeStatus,
    canCreateSystemUser,
  }
}
