import { computed } from 'vue'
import { clientPermissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import {
  hasAnyPermission,
  hasPermission,
} from 'src/utils/auth-permissions.js'

const FOLLOW_UP_VIEW_PERMISSIONS = [
  clientPermissionNames.viewFollowUps,
  clientPermissionNames.addFollowUps,
  clientPermissionNames.editFollowUps,
]

export function useClientFollowUpPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewFollowUps = computed(() =>
    hasAnyPermission(permissions.value, FOLLOW_UP_VIEW_PERMISSIONS),
  )
  const canAddFollowUps = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.addFollowUps),
  )
  const canEditFollowUps = computed(() =>
    hasPermission(permissions.value, clientPermissionNames.editFollowUps),
  )

  return {
    canViewFollowUps,
    canAddFollowUps,
    canEditFollowUps,
  }
}
