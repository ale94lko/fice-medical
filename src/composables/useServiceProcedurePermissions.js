import { computed } from 'vue'
import {
  authorizationRequirementValues,
  permissionNames,
  serviceProcedureCategoryValues,
} from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'

function usePermission(permissions, permission) {
  return computed(() => hasPermission(permissions.value, permission))
}

export function useServiceProcedurePermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewServiceProcedures = usePermission(
    permissions,
    permissionNames.viewCatalog,
  )
  const canEditServiceProcedures = usePermission(
    permissions,
    permissionNames.editCatalog,
  )

  return {
    canViewServiceProcedures,
    canEditServiceProcedures,
    canAddServiceProcedure: canEditServiceProcedures,
    canChangeServiceProcedureStatus: canEditServiceProcedures,
  }
}

export function buildServiceProcedureCategoryOptions(t) {
  return [
    {
      label: t('serviceProcedureCategoryClinicalService'),
      value: serviceProcedureCategoryValues.clinicalService,
    },
    {
      label: t('serviceProcedureCategoryTherapy'),
      value: serviceProcedureCategoryValues.therapy,
    },
    {
      label: t('serviceProcedureCategoryEvaluation'),
      value: serviceProcedureCategoryValues.evaluation,
    },
    {
      label: t('serviceProcedureCategoryMedicationManagement'),
      value: serviceProcedureCategoryValues.medicationManagement,
    },
    {
      label: t('serviceProcedureCategoryLabExam'),
      value: serviceProcedureCategoryValues.labExam,
    },
    {
      label: t('serviceProcedureCategoryProcedure'),
      value: serviceProcedureCategoryValues.procedure,
    },
    {
      label: t('serviceProcedureCategoryOther'),
      value: serviceProcedureCategoryValues.other,
    },
  ]
}

export function buildAuthorizationRequirementOptions(t) {
  return [
    {
      label: t('serviceProcedureAuthReqUnknown'),
      value: authorizationRequirementValues.unknown,
    },
    {
      label: t('serviceProcedureAuthReqMayBeRequired'),
      value: authorizationRequirementValues.mayBeRequired,
    },
    {
      label: t('serviceProcedureAuthReqTypicallyRequired'),
      value: authorizationRequirementValues.typicallyRequired,
    },
    {
      label: t('serviceProcedureAuthReqNotUsuallyRequired'),
      value: authorizationRequirementValues.notUsuallyRequired,
    },
  ]
}
