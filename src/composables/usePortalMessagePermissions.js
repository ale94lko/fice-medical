import { computed } from 'vue'
import { permissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import {
  hasAnyPermission,
  hasPermission,
} from 'src/utils/auth-permissions.js'

export function usePortalMessagePermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canView = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.viewPortalMessages,
    ),
  )
  const canSend = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.sendPortalMessages,
    ),
  )
  const canAccess = computed(() =>
    hasAnyPermission(permissions.value, [
      permissionNames.viewPortalMessages,
      permissionNames.sendPortalMessages,
    ]),
  )

  return { canView, canSend, canAccess }
}
