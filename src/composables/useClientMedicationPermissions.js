import { computed } from 'vue'
import { clientPermissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'

export function useClientMedicationPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewMedications = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.viewMedications),
  )
  const canAddMedications = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.addMedications),
  )
  const canEditMedications = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.editMedications),
  )
  const canDeleteMedications = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.deleteMedications),
  )
  const canViewPharmacies = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.viewPharmacies),
  )
  const canAddPharmacies = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.addPharmacies),
  )
  const canEditPharmacies = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.editPharmacies),
  )
  const canDeletePharmacies = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.deletePharmacies),
  )

  return {
    canViewMedications,
    canAddMedications,
    canEditMedications,
    canDeleteMedications,
    canViewPharmacies,
    canAddPharmacies,
    canEditPharmacies,
    canDeletePharmacies,
  }
}
