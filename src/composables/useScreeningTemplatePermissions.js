import { computed } from 'vue'
import {
  clientPermissionNames,
  permissionNames,
  screeningFieldTypes,
  screeningTemplateStatusValues,
} from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'

function usePermission(permissions, permission) {
  return computed(() => hasPermission(permissions.value, permission))
}

export function useScreeningTemplatePermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canManageScreeningTemplates = usePermission(
    permissions,
    permissionNames.manageScreeningTemplates,
  )
  const canViewScreenings = usePermission(
    permissions,
    clientPermissionNames.viewScreenings,
  )

  return {
    canManageScreeningTemplates,
    canViewScreenings,
    canViewScreeningTemplates: canManageScreeningTemplates,
    canEditScreeningTemplates: canManageScreeningTemplates,
    canAddScreeningTemplate: canManageScreeningTemplates,
  }
}

export function buildScreeningFieldTypeOptions(t) {
  return [
    { label: t('screeningFieldTypeText'), value: screeningFieldTypes.text },
    {
      label: t('screeningFieldTypeTextarea'),
      value: screeningFieldTypes.textarea,
    },
    { label: t('screeningFieldTypeDate'), value: screeningFieldTypes.date },
    { label: t('screeningFieldTypeNumber'), value: screeningFieldTypes.number },
    { label: t('screeningFieldTypeSelect'), value: screeningFieldTypes.select },
    { label: t('screeningFieldTypeRadio'), value: screeningFieldTypes.radio },
    { label: t('screeningFieldTypeChips'), value: screeningFieldTypes.chips },
    { label: t('screeningFieldTypeYesNo'), value: screeningFieldTypes.yesNo },
  ]
}

export function buildScreeningTemplateStatusOptions(t) {
  return [
    {
      label: t('screeningTemplateStatusActive'),
      value: screeningTemplateStatusValues.active,
    },
    {
      label: t('screeningTemplateStatusInactive'),
      value: screeningTemplateStatusValues.inactive,
    },
    {
      label: t('screeningTemplateStatusArchived'),
      value: screeningTemplateStatusValues.archived,
    },
  ]
}
