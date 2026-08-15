import { computed } from 'vue'
import {
  clientPermissionNames,
  permissionNames,
} from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasAnyPermission, hasPermission } from
  'src/utils/auth-permissions.js'

function manageOr(permissions, permission) {
  return hasAnyPermission(permissions, [
    permission,
    clientPermissionNames.manageEncounter,
  ])
}

export function useEncounterPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canManageEncounter = computed(() =>
    hasPermission(
      permissions.value,
      clientPermissionNames.manageEncounter,
    ),
  )
  const canCompleteEncounter = computed(() =>
    manageOr(
      permissions.value,
      clientPermissionNames.completeEncounter,
    ),
  )
  const canCancelEncounter = computed(() =>
    manageOr(
      permissions.value,
      clientPermissionNames.cancelEncounter,
    ),
  )
  const canReopenEncounter = computed(() =>
    manageOr(
      permissions.value,
      clientPermissionNames.reopenEncounter,
    ),
  )
  const canWaiveRequirement = computed(() =>
    manageOr(
      permissions.value,
      clientPermissionNames.waiveEncounterRequirement,
    ),
  )
  const canGenerateSuperbill = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.completeEncounter,
      clientPermissionNames.manageEncounter,
      permissionNames.superbillView,
    ]),
  )
  const canViewSuperbill = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.superbillView,
    ),
  )

  return {
    canManageEncounter,
    canCompleteEncounter,
    canCancelEncounter,
    canReopenEncounter,
    canWaiveRequirement,
    canGenerateSuperbill,
    canViewSuperbill,
  }
}
