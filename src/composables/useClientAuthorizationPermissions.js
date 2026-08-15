import { computed } from 'vue'
import { clientPermissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasAnyPermission, hasPermission } from 'src/utils/auth-permissions.js'

export function useClientAuthorizationPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewAuthorizations = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.authorizationView,
      clientPermissionNames.authorizationCreate,
      clientPermissionNames.authorizationEdit,
    ]),
  )
  const canCreateAuthorizations = computed(() =>
    hasPermission(
      permissions.value,
      clientPermissionNames.authorizationCreate,
    ),
  )
  const canEditAuthorizations = computed(() =>
    hasPermission(
      permissions.value,
      clientPermissionNames.authorizationEdit,
    ),
  )
  const canCancelAuthorizations = computed(() =>
    hasPermission(
      permissions.value,
      clientPermissionNames.authorizationCancel,
    ),
  )
  const canApproveAuthorizations = computed(() =>
    hasPermission(
      permissions.value,
      clientPermissionNames.authorizationApprove,
    ),
  )
  const canDenyAuthorizations = computed(() =>
    hasPermission(
      permissions.value,
      clientPermissionNames.authorizationDeny,
    ),
  )
  const canAttachDocuments = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.authorizationAttachDocument,
      clientPermissionNames.authorizationEdit,
      clientPermissionNames.authorizationCreate,
    ]),
  )

  return {
    canViewAuthorizations,
    canCreateAuthorizations,
    canEditAuthorizations,
    canCancelAuthorizations,
    canApproveAuthorizations,
    canDenyAuthorizations,
    canAttachDocuments,
  }
}
