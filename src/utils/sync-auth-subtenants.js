import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { normalizeLoginSubtenants } from 'components/helpers.js'
import { useAuthStore } from 'stores/auth-store.js'
import { fetchSubtenantById } from 'src/utils/subtenant-api.js'

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

function patchActiveSubtenantLogo(detail) {
  const authStore = useAuthStore()
  const activeId = authStore.activeSubtenantId
  if (activeId == null || !detail) {
    return
  }
  const photoFileId = detail.photoFileId ?? null
  const name = String(detail.name ?? '').trim()
  const code = String(detail.code ?? '').trim()
  const state = String(detail.state ?? '').trim().toUpperCase()
  const next = authStore.subtenants.map(item => {
    if (item.id !== activeId) {
      return item
    }

    return {
      ...item,
      ...(name ? { name } : {}),
      ...(code ? { code } : {}),
      ...(state ? { state } : {}),
      photoFileId,
    }
  })
  authStore.applySubtenants(next, activeId)
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

/**
 * Refresh clinic logo (and subtenant metadata) on page load.
 * Prefers the full list; falls back to the active clinic only.
 */
export async function refreshClinicLogoOnPageLoad() {
  const authStore = useAuthStore()
  if (!authStore.token || authStore.activeSubtenantId == null) {
    return
  }
  try {
    await syncAuthSubtenantsFromApi()

    return
  } catch {
    // List may require admin permission; fall back to active clinic.
  }
  try {
    const detail = await fetchSubtenantById(authStore.activeSubtenantId)
    patchActiveSubtenantLogo(detail)
  } catch {
    // Keep logo from stored session when APIs are unavailable.
  }
}
