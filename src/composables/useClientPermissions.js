import { computed } from 'vue'
import { clientPermissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasAnyPermission, hasPermission } from 'src/utils/auth-permissions.js'

function usePermission(permissions, permission) {
  return computed(() => hasPermission(permissions.value, permission))
}

export function useClientPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewClient = usePermission(
    permissions,
    clientPermissionNames.viewClient,
  )
  const canAddClient = usePermission(
    permissions,
    clientPermissionNames.addClient,
  )
  const canEditBasicInfo = usePermission(
    permissions,
    clientPermissionNames.editBasicInfoClient,
  )
  const canChangeStatus = usePermission(
    permissions,
    clientPermissionNames.changeStatusClient,
  )
  const canArchiveClient = usePermission(
    permissions,
    clientPermissionNames.archiveClient,
  )
  const canViewContact = usePermission(
    permissions,
    clientPermissionNames.viewContact,
  )
  const canEditContact = usePermission(
    permissions,
    clientPermissionNames.editContact,
  )
  const canViewAllergies = usePermission(
    permissions,
    clientPermissionNames.viewAllergies,
  )
  const canEditAllergies = usePermission(
    permissions,
    clientPermissionNames.editAllergies,
  )
  const canViewMedicalHistory = usePermission(
    permissions,
    clientPermissionNames.viewMedicalHistory,
  )
  const canAddMedicalHistory = usePermission(
    permissions,
    clientPermissionNames.addMedicalHistory,
  )
  const canEditMedicalHistory = usePermission(
    permissions,
    clientPermissionNames.editMedicalHistory,
  )
  const canDeleteMedicalHistory = usePermission(
    permissions,
    clientPermissionNames.deleteMedicalHistory,
  )
  const canViewVitals = usePermission(
    permissions,
    clientPermissionNames.viewVitalsClient,
  )
  const canAddVitals = usePermission(
    permissions,
    clientPermissionNames.addVitalsClient,
  )
  const canEditVitals = usePermission(
    permissions,
    clientPermissionNames.editVitalsClient,
  )
  const canViewMedicalNotes = usePermission(
    permissions,
    clientPermissionNames.viewMedicalNotesClient,
  )
  const canEditMedicalNotes = usePermission(
    permissions,
    clientPermissionNames.editMedicalNotesClient,
  )
  const canViewLabs = usePermission(
    permissions,
    clientPermissionNames.viewLabsClient,
  )
  const canAddLabs = usePermission(
    permissions,
    clientPermissionNames.addLabsClient,
  )
  const canEditLabs = usePermission(
    permissions,
    clientPermissionNames.editLabsClient,
  )
  const canDeleteLabs = usePermission(
    permissions,
    clientPermissionNames.deleteLabsClient,
  )
  const canViewScreenings = usePermission(
    permissions,
    clientPermissionNames.viewScreenings,
  )
  const canAddScreenings = usePermission(
    permissions,
    clientPermissionNames.addScreenings,
  )
  const canEditScreenings = usePermission(
    permissions,
    clientPermissionNames.editScreenings,
  )
  const canViewTenantData = usePermission(
    permissions,
    clientPermissionNames.viewTenantData,
  )
  const canEditTenantData = usePermission(
    permissions,
    clientPermissionNames.editTenantData,
  )
  const canViewFollowUps = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.viewFollowUps,
      clientPermissionNames.addFollowUps,
      clientPermissionNames.editFollowUps,
    ]),
  )
  const canAddFollowUps = usePermission(
    permissions,
    clientPermissionNames.addFollowUps,
  )
  const canEditFollowUps = usePermission(
    permissions,
    clientPermissionNames.editFollowUps,
  )
  const canViewCarePlans = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.viewCarePlans,
      clientPermissionNames.addCarePlans,
      clientPermissionNames.editCarePlans,
    ]),
  )
  const canAddCarePlans = usePermission(
    permissions,
    clientPermissionNames.addCarePlans,
  )
  const canEditCarePlans = usePermission(
    permissions,
    clientPermissionNames.editCarePlans,
  )
  const canSignCarePlans = usePermission(
    permissions,
    clientPermissionNames.signCarePlans,
  )
  const canViewAppointments = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.viewAppointmentSlot,
      clientPermissionNames.bookAppointment,
      clientPermissionNames.cancelAppointment,
      clientPermissionNames.rescheduleAppointment,
    ]),
  )
  const canBookAppointment = usePermission(
    permissions,
    clientPermissionNames.bookAppointment,
  )
  const canCancelAppointment = usePermission(
    permissions,
    clientPermissionNames.cancelAppointment,
  )
  const canRescheduleAppointment = usePermission(
    permissions,
    clientPermissionNames.rescheduleAppointment,
  )
  const canManageAppointmentSlots = usePermission(
    permissions,
    clientPermissionNames.manageAppointmentSlots,
  )
  const canViewReferrals = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.viewReferrals,
      clientPermissionNames.addReferrals,
      clientPermissionNames.editReferrals,
    ]),
  )
  const canAddReferrals = usePermission(
    permissions,
    clientPermissionNames.addReferrals,
  )
  const canEditReferrals = usePermission(
    permissions,
    clientPermissionNames.editReferrals,
  )
  const canDeleteReferrals = usePermission(
    permissions,
    clientPermissionNames.deleteReferrals,
  )

  const canEditAnyClientSection = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.editBasicInfoClient,
      clientPermissionNames.editContact,
      clientPermissionNames.editAllergies,
      clientPermissionNames.addMedicalHistory,
      clientPermissionNames.editMedicalHistory,
      clientPermissionNames.editTenantData,
      clientPermissionNames.editVitalsClient,
      clientPermissionNames.addVitalsClient,
      clientPermissionNames.editLabsClient,
      clientPermissionNames.addLabsClient,
      clientPermissionNames.editScreenings,
      clientPermissionNames.addScreenings,
      clientPermissionNames.editMedicalNotesClient,
      clientPermissionNames.editCarePlans,
      clientPermissionNames.addCarePlans,
      clientPermissionNames.editReferrals,
      clientPermissionNames.addReferrals,
      clientPermissionNames.editFollowUps,
      clientPermissionNames.addFollowUps,
      clientPermissionNames.bookAppointment,
    ]),
  )

  return {
    canViewClient,
    canAddClient,
    canEditBasicInfo,
    canChangeStatus,
    canArchiveClient,
    canViewContact,
    canEditContact,
    canViewAllergies,
    canEditAllergies,
    canViewMedicalHistory,
    canAddMedicalHistory,
    canEditMedicalHistory,
    canDeleteMedicalHistory,
    canViewVitals,
    canAddVitals,
    canEditVitals,
    canViewMedicalNotes,
    canEditMedicalNotes,
    canViewLabs,
    canAddLabs,
    canEditLabs,
    canDeleteLabs,
    canViewScreenings,
    canAddScreenings,
    canEditScreenings,
    canViewTenantData,
    canEditTenantData,
    canViewFollowUps,
    canAddFollowUps,
    canEditFollowUps,
    canViewCarePlans,
    canAddCarePlans,
    canEditCarePlans,
    canSignCarePlans,
    canViewAppointments,
    canBookAppointment,
    canCancelAppointment,
    canRescheduleAppointment,
    canManageAppointmentSlots,
    canViewReferrals,
    canAddReferrals,
    canEditReferrals,
    canDeleteReferrals,
    canEditAnyClientSection,
  }
}
