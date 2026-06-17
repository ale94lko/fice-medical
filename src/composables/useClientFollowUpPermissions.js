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
  })
  if (!granular) {
    return true
  }

  return modules.includes(permission)
}

export function useClientFollowUpPermissions() {
  const authStore = useAuthStore()

  const canViewFollowUps = computed(() =>
    hasPermission(authStore.modules, clientPermissionNames.viewFollowUps),
  )
  const canAddFollowUps = computed(() =>
    hasPermission(authStore.modules, clientPermissionNames.addFollowUps),
  )
  const canEditFollowUps = computed(() =>
    hasPermission(authStore.modules, clientPermissionNames.editFollowUps),
  )

  return {
    canViewFollowUps,
    canAddFollowUps,
    canEditFollowUps,
  }
}
