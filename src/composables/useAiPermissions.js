import { computed } from 'vue'
import { permissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'

export function useAiPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canManageSuggestion = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.manageAiSuggestion,
    ),
  )

  const canManageConfig = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.manageAiConfig,
    ),
  )

  const canUseClinicalSummary = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.useAiClinicalSummary,
    ),
  )

  const canUseScribe = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.useAiScribe,
    ),
  )

  const canUseCodingAssistant = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.useAiCodingAssistant,
    ),
  )

  const canUseCarePlanDraft = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.useAiCarePlanDraft,
    ),
  )

  function canReviewFeature(featurePermissionGranted) {
    return Boolean(featurePermissionGranted)
      || canManageSuggestion.value
  }

  return {
    canManageSuggestion,
    canManageConfig,
    canUseClinicalSummary,
    canUseScribe,
    canUseCodingAssistant,
    canUseCarePlanDraft,
    canReviewFeature,
  }
}
