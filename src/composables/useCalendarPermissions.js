import { computed } from 'vue'
import {
  clientPermissionNames,
  permissionNames,
} from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import {
  hasAnyPermission,
  hasPermission,
} from 'src/utils/auth-permissions.js'

const calendarViewPermissions = [
  clientPermissionNames.viewAppointmentSlot,
  clientPermissionNames.bookAppointment,
  clientPermissionNames.cancelAppointment,
  clientPermissionNames.rescheduleAppointment,
  clientPermissionNames.manageAppointmentSlots,
]

export function useCalendarPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewCalendar = computed(() =>
    hasAnyPermission(permissions.value, calendarViewPermissions),
  )

  const canSelectClinicianSources = computed(() =>
    hasAnyPermission(permissions.value, [
      permissionNames.viewStaffMembers,
      permissionNames.viewClinicians,
      clientPermissionNames.manageAppointmentSlots,
    ]),
  )

  const canBookAppointment = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.bookAppointment),
  )

  return {
    canViewCalendar,
    canSelectClinicianSources,
    canBookAppointment,
  }
}
