import { computed } from 'vue'
import { permissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'

export function useDenialPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canView = computed(() =>
    hasPermission(permissions.value, permissionNames.denialView),
  )
  const canWork = computed(() =>
    hasPermission(permissions.value, permissionNames.denialWork),
  )
  const canAssign = computed(() =>
    hasPermission(permissions.value, permissionNames.denialAssign),
  )
  const canCorrect = computed(() =>
    hasPermission(permissions.value, permissionNames.denialCorrectClaim),
  )
  const canReplace = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.denialCreateReplacement,
    ),
  )
  const canAppeal = computed(() =>
    hasPermission(permissions.value, permissionNames.denialCreateAppeal),
  )
  const canResolve = computed(() =>
    hasPermission(permissions.value, permissionNames.denialResolve),
  )
  const canWriteOff = computed(() =>
    hasPermission(permissions.value, permissionNames.denialWriteOff),
  )

  return {
    canView,
    canWork,
    canAssign,
    canCorrect,
    canReplace,
    canAppeal,
    canResolve,
    canWriteOff,
  }
}
