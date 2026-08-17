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
  const canSubmitClaim = computed(() =>
    hasPermission(permissions.value, permissionNames.claimSubmit),
  )
  const canViewSubmission = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.claimViewSubmission,
    )
    || canViewClaims.value,
  )
  const canRetryTechnicalSubmission = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.claimRetryTechnicalSubmission,
    ),
  )
  const canManageSubmissionRoute = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.claimManageSubmissionRoute,
    ),
  )

  return {
    canViewClaims,
    canGenerateClaim,
    canVoidClaim,
    canSubmitClaim,
    canViewSubmission,
    canRetryTechnicalSubmission,
    canManageSubmissionRoute,
  }
}
