import { computed } from 'vue'
import { permissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'

export function useSuperbillPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewSuperbills = computed(() =>
    hasPermission(permissions.value, permissionNames.superbillView),
  )
  const canReviewSuperbill = computed(() =>
    hasPermission(permissions.value, permissionNames.superbillReview),
  )
  const canReopenSuperbill = computed(() =>
    hasPermission(permissions.value, permissionNames.superbillReopen),
  )
  const canVoidSuperbill = computed(() =>
    hasPermission(permissions.value, permissionNames.superbillVoid),
  )
  const canEditBillingFields = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.superbillEditBillingFields,
    ),
  )
  const canHoldSuperbill = computed(() =>
    hasPermission(permissions.value, permissionNames.superbillHold),
  )
  const canReleaseHold = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.superbillReleaseHold,
    ),
  )

  return {
    canViewSuperbills,
    canReviewSuperbill,
    canReopenSuperbill,
    canVoidSuperbill,
    canEditBillingFields,
    canHoldSuperbill,
    canReleaseHold,
  }
}
