import { computed } from 'vue'
import { clientPermissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasAnyPermission, hasPermission } from 'src/utils/auth-permissions.js'

export function useClientReferralPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewReferrals = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.viewReferrals,
      clientPermissionNames.addReferrals,
      clientPermissionNames.editReferrals,
    ]),
  )
  const canAddReferrals = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.addReferrals),
  )
  const canEditReferrals = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.editReferrals),
  )
  const canDeleteReferrals = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.deleteReferrals),
  )

  return {
    canViewReferrals,
    canAddReferrals,
    canEditReferrals,
    canDeleteReferrals,
  }
}
