import { computed } from 'vue'
import {
  clinicalResourceStatusValues,
  clinicalResourceTypeValues,
  permissionNames,
} from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'
import {
  hasClinicalResourcePinRole,
  resolveCurrentUserRoleNames,
} from 'src/utils/clinical-resource-user-roles.js'

function usePermission(permissions, permission) {
  return computed(() => hasPermission(permissions.value, permission))
}

export function useClinicalResourcePermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewClinicalResources = usePermission(
    permissions,
    permissionNames.viewClinicalResources,
  )
  const canManageClinicalResources = usePermission(
    permissions,
    permissionNames.manageClinicalResources,
  )

  return {
    canViewClinicalResources,
    canManageClinicalResources,
    canAddClinicalResource: canManageClinicalResources,
    canEditClinicalResource: canManageClinicalResources,
  }
}

export function buildClinicalResourceTypeOptions(t) {
  return [
    {
      label: t('clinicalResourceTypeExternalLink'),
      value: clinicalResourceTypeValues.externalLink,
    },
    {
      label: t('clinicalResourceTypeDocument'),
      value: clinicalResourceTypeValues.document,
    },
  ]
}

export function buildClinicalResourceStatusOptions(t) {
  return [
    {
      label: t('clinicalResourceStatusActive'),
      value: clinicalResourceStatusValues.active,
    },
    {
      label: t('clinicalResourceStatusInactive'),
      value: clinicalResourceStatusValues.inactive,
    },
    {
      label: t('clinicalResourceStatusArchived'),
      value: clinicalResourceStatusValues.archived,
    },
  ]
}

export function buildClinicalResourceStatusFilterOptions(t) {
  return [
    {
      label: t('clinicalResourceFilterStatusAll'),
      value: null,
    },
    ...buildClinicalResourceStatusOptions(t).filter(
      option => option.value !== clinicalResourceStatusValues.archived,
    ),
  ]
}

export function buildClinicalResourceTypeFilterOptions(t) {
  return [
    {
      label: t('clinicalResourceFilterTypeAll'),
      value: null,
    },
    ...buildClinicalResourceTypeOptions(t),
  ]
}

export async function resolveCanPinClinicalResources(t) {
  const roleNames = await resolveCurrentUserRoleNames(t)

  return hasClinicalResourcePinRole(roleNames)
}
