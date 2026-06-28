import { computed } from 'vue'
import { permissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'

function usePermission(permissions, permission) {
  return computed(() => hasPermission(permissions.value, permission))
}

export function useUserPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewUsers = usePermission(
    permissions,
    permissionNames.viewTenantsUser,
  )
  const canAddUser = usePermission(
    permissions,
    permissionNames.addTenantsUser,
  )
  const canEditUser = usePermission(
    permissions,
    permissionNames.editTenantsUser,
  )
  const canDeleteUser = usePermission(
    permissions,
    permissionNames.deleteTenantsUser,
  )

  return {
    canViewUsers,
    canAddUser,
    canEditUser,
    canDeleteUser,
  }
}
