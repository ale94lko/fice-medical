import { computed } from 'vue'
import { permissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'

function usePermission(permissions, permission) {
  return computed(() => hasPermission(permissions.value, permission))
}

export function useSubtenantPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewSubtenants = usePermission(
    permissions,
    permissionNames.viewSubtenants,
  )
  const canEditSubtenants = usePermission(
    permissions,
    permissionNames.editSubtenants,
  )

  return {
    canViewSubtenants,
    canEditSubtenants,
    canAddSubtenant: canEditSubtenants,
    canDeleteSubtenant: canEditSubtenants,
  }
}
