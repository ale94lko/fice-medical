import { computed } from 'vue'
import { permissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'

export function useDocumentGenerationPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const canGenerateDocuments = computed(() =>
    hasPermission(permissions.value, permissionNames.generateDocuments),
  )
  const canViewFiles = computed(() =>
    hasPermission(permissions.value, permissionNames.viewFiles),
  )

  return {
    canGenerateDocuments,
    canViewFiles,
  }
}
