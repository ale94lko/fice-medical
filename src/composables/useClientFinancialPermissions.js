import { computed } from 'vue'
import { permissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'

export function useClientFinancialPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canViewFinancial = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.clientFinancialView,
    ),
  )
  const canViewLedger = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.clientLedgerView,
    ),
  )
  const canReverseLedger = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.clientLedgerReverse,
    ),
  )
  const canViewPayments = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.clientPaymentView,
    ),
  )
  const canCreatePayment = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.clientPaymentCreate,
    ),
  )
  const canAllocatePayment = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.clientPaymentAllocate,
    ),
  )
  const canReversePayment = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.clientPaymentReverse,
    ),
  )

  return {
    canViewFinancial,
    canViewLedger,
    canReverseLedger,
    canViewPayments,
    canCreatePayment,
    canAllocatePayment,
    canReversePayment,
  }
}
