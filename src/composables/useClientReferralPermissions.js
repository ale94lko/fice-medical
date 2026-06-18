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
      || key.startsWith('DELETE_')
  })
  if (!granular) {
    return true
  }

  return modules.includes(permission)
}

export function useClientReferralPermissions() {
  const authStore = useAuthStore()
  const modules = computed(() => authStore.modules)

  const canViewReferrals = computed(() =>
    hasPermission(modules.value, clientPermissionNames.viewReferrals),
  )
  const canAddReferrals = computed(() =>
    hasPermission(modules.value, clientPermissionNames.addReferrals),
  )
  const canEditReferrals = computed(() =>
    hasPermission(modules.value, clientPermissionNames.editReferrals),
  )
  const canDeleteReferrals = computed(() =>
    hasPermission(modules.value, clientPermissionNames.deleteReferrals),
  )

  return {
    canViewReferrals,
    canAddReferrals,
    canEditReferrals,
    canDeleteReferrals,
  }
}
