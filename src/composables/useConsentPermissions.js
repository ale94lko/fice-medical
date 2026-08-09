import { computed } from 'vue'
import { permissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'

function usePermission(permissions, permission) {
  return computed(() => hasPermission(permissions.value, permission))
}

export function useConsentPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canView = usePermission(permissions, permissionNames.consentView)
  const canCreate = usePermission(permissions, permissionNames.consentCreate)
  const canEdit = usePermission(permissions, permissionNames.consentEdit)
  const canPublish = usePermission(permissions, permissionNames.consentPublish)
  const canAssign = usePermission(permissions, permissionNames.consentAssign)
  const canSign = usePermission(permissions, permissionNames.consentSign)
  const canRevoke = usePermission(permissions, permissionNames.consentRevoke)
  const canDelete = usePermission(permissions, permissionNames.consentDelete)
  const canDownload = usePermission(
    permissions,
    permissionNames.consentDownload,
  )
  const canAuditView = usePermission(
    permissions,
    permissionNames.consentAuditView,
  )

  const canAccessAdminTemplates = computed(
    () => canView.value || canCreate.value || canEdit.value,
  )

  return {
    canView,
    canCreate,
    canEdit,
    canPublish,
    canAssign,
    canSign,
    canRevoke,
    canDelete,
    canDownload,
    canAuditView,
    canAccessAdminTemplates,
  }
}
