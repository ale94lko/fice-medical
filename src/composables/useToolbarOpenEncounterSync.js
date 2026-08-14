import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { clientPermissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasAnyPermission } from 'src/utils/auth-permissions.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  hydrateToolbarOpenEncounters,
  restoreToolbarOpenEncounters,
} from 'src/utils/encounter-api.js'

/**
 * Keep the header Encounter chip populated on every MainLayout route.
 */
export function useToolbarOpenEncounterSync() {
  const authStore = useAuthStore()

  const canView = computed(() =>
    hasAnyPermission(authStore.permissions, [
      clientPermissionNames.viewEncounter,
      clientPermissionNames.manageEncounter,
    ]),
  )

  async function refresh() {
    if (!canView.value) {
      return
    }
    try {
      await hydrateToolbarOpenEncounters()
    } catch (error) {
      if (isAuthSessionEndUIError(error)) {
        return
      }
    }
  }

  function onWindowFocus() {
    void refresh()
  }

  restoreToolbarOpenEncounters()

  onMounted(() => {
    void refresh()
    window.addEventListener('focus', onWindowFocus)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('focus', onWindowFocus)
  })

  watch(canView, (ok) => {
    if (ok) {
      void refresh()
    }
  })

  watch(
    () => authStore.activeSubtenantId,
    () => {
      void refresh()
    },
  )
}
