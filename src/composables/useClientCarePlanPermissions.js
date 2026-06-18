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
      || key.startsWith('ADD_')
      || key.startsWith('EDIT_')
      || key.startsWith('SIGN_')
  })
  if (!granular) {
    return true
  }

  return modules.includes(permission)
}

export function useClientCarePlanPermissions() {
  const authStore = useAuthStore()
  const modules = computed(() => authStore.modules)

  const canViewCarePlans = computed(() =>
    hasPermission(modules.value, clientPermissionNames.viewCarePlans),
  )
  const canAddCarePlans = computed(() =>
    hasPermission(modules.value, clientPermissionNames.addCarePlans),
  )
  const canEditCarePlans = computed(() =>
    hasPermission(modules.value, clientPermissionNames.editCarePlans),
  )
  const canSignCarePlans = computed(() =>
    hasPermission(modules.value, clientPermissionNames.signCarePlans),
  )

  return {
    canViewCarePlans,
    canAddCarePlans,
    canEditCarePlans,
    canSignCarePlans,
  }
}
