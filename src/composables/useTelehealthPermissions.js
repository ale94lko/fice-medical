import { computed } from 'vue'
import { clientPermissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import {
  hasAnyPermission,
  hasPermission,
} from 'src/utils/auth-permissions.js'

export function useTelehealthPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewTelehealth = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.viewTelehealth,
      clientPermissionNames.joinTelehealth,
      clientPermissionNames.createTelehealth,
      clientPermissionNames.manageTelehealth,
    ]),
  )

  const canCreateTelehealth = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.createTelehealth,
      clientPermissionNames.manageTelehealth,
    ]),
  )

  const canJoinTelehealth = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.joinTelehealth,
      clientPermissionNames.viewTelehealth,
      clientPermissionNames.createTelehealth,
      clientPermissionNames.manageTelehealth,
    ]),
  )

  const canAdmitTelehealth = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.admitTelehealth,
      clientPermissionNames.manageTelehealth,
    ]),
  )

  const canStartTelehealth = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.startTelehealth,
      clientPermissionNames.manageTelehealth,
    ]),
  )

  const canFinishTelehealth = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.finishTelehealth,
      clientPermissionNames.manageTelehealth,
    ]),
  )

  const canChatTelehealth = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.chatTelehealth,
      clientPermissionNames.joinTelehealth,
      clientPermissionNames.manageTelehealth,
    ]),
  )

  const canUploadTelehealthFiles = computed(() =>
    hasPermission(
      permissions.value,
      clientPermissionNames.uploadTelehealthFiles,
    ),
  )

  const canDeleteTelehealthFiles = computed(() =>
    hasPermission(
      permissions.value,
      clientPermissionNames.deleteTelehealthFiles,
    ),
  )

  return {
    canViewTelehealth,
    canCreateTelehealth,
    canJoinTelehealth,
    canAdmitTelehealth,
    canStartTelehealth,
    canFinishTelehealth,
    canChatTelehealth,
    canUploadTelehealthFiles,
    canDeleteTelehealthFiles,
  }
}
