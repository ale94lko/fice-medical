import { computed } from 'vue'
import { permissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'

export function useClaimPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewClaims = computed(() =>
    hasPermission(permissions.value, permissionNames.claimView),
  )
  const canGenerateClaim = computed(() =>
    hasPermission(permissions.value, permissionNames.claimGenerate),
  )
  const canVoidClaim = computed(() =>
    hasPermission(permissions.value, permissionNames.claimVoid),
  )

  return {
    canViewClaims,
    canGenerateClaim,
    canVoidClaim,
  }
}
