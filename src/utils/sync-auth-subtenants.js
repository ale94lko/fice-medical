import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { normalizeLoginSubtenants } from 'components/helpers.js'
import { useAuthStore } from 'stores/auth-store.js'

function unwrapListRoot(body) {
  const root = body?.data ?? body
  if (Array.isArray(root?.items)) {
    return root
  }
  if (Array.isArray(root)) {
    return { items: root }
  }

  return root
}

/**
 * Refreshes header/session subtenants from the admin API list.
 */
export async function syncAuthSubtenantsFromApi() {
  const authStore = useAuthStore()
  const response = await apiInstance.get(apiPaths.subtenantsList, {
    params: { page: 0, limit: 500 },
  })
  const root = unwrapListRoot(response.data)
  const subtenants = normalizeLoginSubtenants(root?.items ?? [])
  if (!subtenants.length) {
    return subtenants
  }
  authStore.applySubtenants(subtenants, authStore.activeSubtenantId)

  return subtenants
}
