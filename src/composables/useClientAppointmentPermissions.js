import { computed } from 'vue'
import { clientPermissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasAnyPermission, hasPermission } from 'src/utils/auth-permissions.js'

export function useClientAppointmentPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewAppointments = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.viewAppointmentSlot,
      clientPermissionNames.bookAppointment,
      clientPermissionNames.cancelAppointment,
      clientPermissionNames.rescheduleAppointment,
    ]),
  )
  const canBookAppointment = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.bookAppointment),
  )
  const canCancelAppointment = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.cancelAppointment),
  )
  const canRescheduleAppointment = computed(() =>
    hasPermission(
      permissions.value,
      clientPermissionNames.rescheduleAppointment,
    ),
  )
  const canManageAppointmentSlots = computed(() =>
    hasPermission(
      permissions.value,
      clientPermissionNames.manageAppointmentSlots,
    ),
  )

  return {
    canViewAppointments,
    canBookAppointment,
    canCancelAppointment,
    canRescheduleAppointment,
    canManageAppointmentSlots,
  }
}
