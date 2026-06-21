import { computed } from 'vue'
import { clientPermissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasAnyPermission, hasPermission } from 'src/utils/auth-permissions.js'

export function useClientMedicalHistoryPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewMedicalHistory = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.viewMedicalHistory,
      clientPermissionNames.addMedicalHistory,
      clientPermissionNames.editMedicalHistory,
      clientPermissionNames.deleteMedicalHistory,
    ]),
  )
  const canAddMedicalHistory = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.addMedicalHistory),
  )
  const canEditMedicalHistory = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.editMedicalHistory),
  )
  const canDeleteMedicalHistory = computed(() =>
    hasPermission(
      permissions.value,
      clientPermissionNames.deleteMedicalHistory,
    ),
  )

  return {
    canViewMedicalHistory,
    canAddMedicalHistory,
    canEditMedicalHistory,
    canDeleteMedicalHistory,
  }
}
