import { computed } from 'vue'
import { clientPermissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'

export function useClientClinicalNotePermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewClinicalNotes = computed(() =>
    hasPermission(
      permissions.value,
      clientPermissionNames.viewMedicalNotesClient,
    ),
  )
  const canAddClinicalNotes = computed(() =>
    hasPermission(
      permissions.value,
      clientPermissionNames.addMedicalNotesClient,
    ),
  )
  const canEditClinicalNotes = computed(() =>
    hasPermission(
      permissions.value,
      clientPermissionNames.editMedicalNotesClient,
    ),
  )
  const canDeleteClinicalNotes = computed(() =>
    hasPermission(
      permissions.value,
      clientPermissionNames.deleteMedicalNotesClient,
    ),
  )
  const canSignClinicalNotes = computed(() =>
    hasPermission(
      permissions.value,
      clientPermissionNames.signMedicalNotesClient,
    ),
  )

  return {
    canViewClinicalNotes,
    canAddClinicalNotes,
    canEditClinicalNotes,
    canDeleteClinicalNotes,
    canSignClinicalNotes,
  }
}
