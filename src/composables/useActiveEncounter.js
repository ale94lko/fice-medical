import { computed, ref, unref, watch } from 'vue'
import { clientPermissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasAnyPermission, hasPermission } from 'src/utils/auth-permissions.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  cancelEncounter,
  completeEncounter,
  encounterApiErrorMessage,
  fetchClientActiveEncounter,
  getCachedActiveEncounter,
  isEncounterConflictError,
  isEncounterInvalidError,
  setCachedActiveEncounter,
  startAppointmentEncounter,
  startClientEncounter,
  toolbarActiveEncounter,
} from 'src/utils/encounter-api.js'
import { isEncounterOpen } from 'src/utils/encounter-normalize.js'

/**
 * Cache + actions for the client's active (IN_PROGRESS) encounter.
 * Shared module cache lets create payloads attach encounter_id
 * without threading props through every clinical dialog.
 *
 * @param {import('vue').MaybeRefOrGetter<
 *   string|number|null|undefined
 * >} clientIdRef
 */
export function useActiveEncounter(clientIdRef) {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const activeEncounter = ref(null)
  const loading = ref(false)
  const actionBusy = ref(false)
  const lastError = ref(null)

  const clientId = computed(() => {
    const raw = typeof clientIdRef === 'function'
      ? clientIdRef()
      : unref(clientIdRef)

    return String(raw ?? '').trim()
  })

  const hasActiveEncounter = computed(() =>
    isEncounterOpen(activeEncounter.value),
  )

  const activeEncounterId = computed(() =>
    activeEncounter.value?.id ?? null,
  )

  const canViewEncounter = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.viewEncounter,
      clientPermissionNames.manageEncounter,
    ]),
  )

  const canManageEncounter = computed(() =>
    hasPermission(
      permissions.value,
      clientPermissionNames.manageEncounter,
    ),
  )

  const canStartEncounter = computed(() =>
    hasAnyPermission(permissions.value, [
      clientPermissionNames.startEncounter,
      clientPermissionNames.manageEncounter,
      clientPermissionNames.manageAppointmentSlots,
    ]),
  )

  function syncFromCache() {
    const id = clientId.value
    if (!id) {
      activeEncounter.value = null

      return
    }
    activeEncounter.value = getCachedActiveEncounter(id)
  }

  async function refreshActiveEncounter() {
    const id = clientId.value
    if (!id || !canViewEncounter.value) {
      activeEncounter.value = null
      if (id) {
        setCachedActiveEncounter(id, null)
      }

      return null
    }
    loading.value = true
    lastError.value = null
    try {
      const encounter = await fetchClientActiveEncounter(id)
      activeEncounter.value = encounter

      return encounter
    } catch (error) {
      if (!isAuthSessionEndUIError(error)) {
        lastError.value = encounterApiErrorMessage(error)
      }
      syncFromCache()
      throw error
    } finally {
      loading.value = false
    }
  }

  async function startEncounter(form = {}) {
    if (hasActiveEncounter.value) {
      const err = new Error('Active encounter already exists')
      err.response = { status: 409 }
      throw err
    }
    actionBusy.value = true
    lastError.value = null
    try {
      const appointmentId = form.appointmentId ?? form.appointment_id
      let encounter
      if (appointmentId != null && String(appointmentId).trim() !== '') {
        encounter = await startAppointmentEncounter(appointmentId)
      } else {
        encounter = await startClientEncounter(clientId.value, {
          ...form,
          clientId: clientId.value,
        })
      }
      activeEncounter.value = encounter

      return encounter
    } catch (error) {
      if (!isAuthSessionEndUIError(error)) {
        lastError.value = encounterApiErrorMessage(error)
      }
      throw error
    } finally {
      actionBusy.value = false
    }
  }

  async function completeActiveEncounter() {
    const encounter = activeEncounter.value
    if (!encounter?.id) {
      return null
    }
    actionBusy.value = true
    lastError.value = null
    try {
      const result = await completeEncounter(
        encounter.id,
        clientId.value,
      )
      activeEncounter.value = null

      return result
    } catch (error) {
      if (!isAuthSessionEndUIError(error)) {
        lastError.value = encounterApiErrorMessage(error)
      }
      throw error
    } finally {
      actionBusy.value = false
    }
  }

  async function cancelActiveEncounter(payload = {}) {
    const encounter = activeEncounter.value
    if (!encounter?.id) {
      return null
    }
    actionBusy.value = true
    lastError.value = null
    try {
      const result = await cancelEncounter(
        encounter.id,
        clientId.value,
        payload,
      )
      activeEncounter.value = null

      return result
    } catch (error) {
      if (!isAuthSessionEndUIError(error)) {
        lastError.value = encounterApiErrorMessage(error)
      }
      throw error
    } finally {
      actionBusy.value = false
    }
  }

  /**
   * Merge encounter_id into a create payload when active.
   */
  function withActiveEncounterId(payload) {
    const body = payload && typeof payload === 'object' ? { ...payload } : {}
    const id = activeEncounterId.value
      ?? getCachedActiveEncounter(clientId.value)?.id
    if (id == null) {
      delete body.encounter_id

      return body
    }
    // eslint-disable-next-line camelcase -- API body
    body.encounter_id = Number(id) || id

    return body
  }

  watch(clientId, (id, prev) => {
    if (id === prev) {
      return
    }
    syncFromCache()
    if (id && canViewEncounter.value) {
      refreshActiveEncounter().catch(() => {})
    }
  }, { immediate: true })

  // Keep local state in sync when toolbar completes/cancels.
  watch(toolbarActiveEncounter, () => {
    syncFromCache()
  })

  return {
    activeEncounter,
    activeEncounterId,
    hasActiveEncounter,
    loading,
    actionBusy,
    lastError,
    canViewEncounter,
    canManageEncounter,
    canStartEncounter,
    refreshActiveEncounter,
    startEncounter,
    completeActiveEncounter,
    cancelActiveEncounter,
    withActiveEncounterId,
    isEncounterConflictError,
    isEncounterInvalidError,
    encounterApiErrorMessage,
  }
}
