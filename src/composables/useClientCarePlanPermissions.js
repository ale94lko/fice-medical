import { computed } from 'vue'
import { clientPermissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'

export function useClientCarePlanPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewCarePlans = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.viewCarePlans),
  )
  const canAddCarePlans = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.addCarePlans),
  )
  const canEditCarePlans = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.editCarePlans),
  )
  const canSignCarePlans = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.signCarePlans),
  )

  return {
    canViewCarePlans,
    canAddCarePlans,
    canEditCarePlans,
    canSignCarePlans,
  }
}
