import { computed } from 'vue'
import { clientPermissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'

function hasPermission(modules, permission) {
  if (!Array.isArray(modules) || !modules.length) {
    return true
  }
  const granular = modules.some(item => {
    const key = String(item ?? '').trim()

    return key.startsWith('VIEW_')
      || key.startsWith('BOOK_')
      || key.startsWith('CANCEL_')
      || key.startsWith('RESCHEDULE_')
      || key.startsWith('MANAGE_')
  })
  if (!granular) {
    return true
  }

  return modules.includes(permission)
}

export function useClientAppointmentPermissions() {
  const authStore = useAuthStore()
  const modules = computed(() => authStore.modules)

  const canViewAppointments = computed(() =>
    hasPermission(modules.value, clientPermissionNames.viewAppointmentSlot),
  )
  const canBookAppointment = computed(() =>
    hasPermission(modules.value, clientPermissionNames.bookAppointment),
  )
  const canCancelAppointment = computed(() =>
    hasPermission(modules.value, clientPermissionNames.cancelAppointment),
  )
  const canRescheduleAppointment = computed(() =>
    hasPermission(
      modules.value,
      clientPermissionNames.rescheduleAppointment,
    ),
  )
  const canManageAppointmentSlots = computed(() =>
    hasPermission(
      modules.value,
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
