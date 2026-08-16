import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  clientPermissionNames,
  quasarNotifyTypes,
} from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  clearEncounterWatchState,
  ENCOUNTER_AUTO_COMPLETE_MS,
  ENCOUNTER_COUNTDOWN_SEC,
  ENCOUNTER_EXTEND_MS,
  ENCOUNTER_REMINDER_MS,
  formatEncounterElapsedLabel,
  loadEncounterWatchState,
  resolveActiveElapsedMs,
  resolveRouteClientId,
  saveEncounterWatchState,
} from 'src/utils/encounter-session-watch.js'
import {
  completeEncounter,
  encounterApiErrorMessage,
  isEncounterConflictError,
  isEncounterInvalidError,
  toolbarActiveEncounter,
} from 'src/utils/encounter-api.js'
import { isEncounterOpen } from 'src/utils/encounter-normalize.js'

/**
 * Elapsed timer + idle reminders for the toolbar active encounter.
 * Mount once from ActiveEncounterHeaderChip (MainLayout).
 */
export function useActiveEncounterWatchdog() {
  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()
  const $q = useQuasar()
  const authStore = useAuthStore()

  const elapsedLabel = ref('')
  const autoCompleteOpen = ref(false)
  const countdownSeconds = ref(ENCOUNTER_COUNTDOWN_SEC)
  const actionBusy = ref(false)

  let tickTimer = null
  let countdownTimer = null
  let session = null
  let completing = false

  const canManage = computed(() =>
    hasPermission(
      authStore.permissions,
      clientPermissionNames.manageEncounter,
    ),
  )

  function persistSession() {
    if (!session) {
      return
    }
    saveEncounterWatchState(session.encounterId, {
      autoCompleteAtActiveMs: session.autoCompleteAtActiveMs,
      firedReminders: [...session.firedReminders],
    })
  }

  function clearCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
    autoCompleteOpen.value = false
    countdownSeconds.value = ENCOUNTER_COUNTDOWN_SEC
  }

  function resetSession() {
    if (session?.encounterId) {
      clearEncounterWatchState(session.encounterId)
    }
    session = null
    elapsedLabel.value = ''
    clearCountdown()
  }

  function buildSession(entry) {
    const encounter = entry.encounter
    const encounterId = encounter.id
    const stored = loadEncounterWatchState(encounterId)
    const storedAutoAt = Number(stored?.autoCompleteAtActiveMs)
    const autoCompleteAtActiveMs = Number.isFinite(storedAutoAt)
      && storedAutoAt > 0
      ? storedAutoAt
      : ENCOUNTER_AUTO_COMPLETE_MS

    return {
      encounterId,
      clientId: String(entry.clientId ?? encounter.clientId ?? '').trim(),
      clientNumber: String(encounter.clientNumber ?? '').trim(),
      autoCompleteAtActiveMs,
      firedReminders: new Set(stored?.firedReminders ?? []),
      autoCompletePrompted: false,
    }
  }

  function isActivelyTicking(encounter) {
    return Boolean(
      encounter?.isInProgress
      && !encounter.isWaiting
      && !encounter.isReadyToResume,
    )
  }

  function syncSessionFromToolbar() {
    const entry = toolbarActiveEncounter.value
    const encounter = entry?.encounter
    if (!isEncounterOpen(encounter) || encounter.id == null) {
      if (session || autoCompleteOpen.value) {
        resetSession()
      }

      return false
    }
    if (
      !session
      || String(session.encounterId) !== String(encounter.id)
    ) {
      clearCountdown()
      session = buildSession(entry)
      persistSession()
    }

    return isActivelyTicking(encounter) ? 'active' : 'paused'
  }

  function isWorkingOnOtherClient() {
    const chartKey = String(session?.clientNumber ?? '').trim()
    if (!chartKey) {
      return false
    }
    const routeClientId = resolveRouteClientId(route)
    if (!routeClientId) {
      return false
    }

    return routeClientId.toUpperCase() !== chartKey.toUpperCase()
      && routeClientId !== session.clientId
  }

  function goToEncounterClient() {
    const id = String(session?.clientNumber ?? '').trim()
    if (!id) {
      return
    }
    router.push({
      name: 'ClientOverview',
      params: { id },
    })
  }

  function notifyReminder() {
    $q.notify({
      type: quasarNotifyTypes.warning,
      multiLine: true,
      timeout: 10000,
      message: t('activeEncounterOtherClientReminder', {
        elapsed: elapsedLabel.value || '—',
      }),
      actions: [
        {
          label: t('activeEncounterGoToClient'),
          color: 'white',
          handler: goToEncounterClient,
        },
        {
          label: t('close'),
          color: 'white',
        },
      ],
    })
  }

  function notifyError(error) {
    let message = encounterApiErrorMessage(
      error,
      t('activeEncounterActionError'),
    )
    if (isEncounterConflictError(error)) {
      message = t('activeEncounterConflict')
    } else if (isEncounterInvalidError(error)) {
      message = t('activeEncounterInvalid')
    }
    $q.notify({
      type: quasarNotifyTypes.negative,
      message,
    })
  }

  function startAutoCompleteCountdown() {
    if (
      autoCompleteOpen.value
      || countdownTimer
      || completing
      || session?.autoCompletePrompted
    ) {
      return
    }
    if (session) {
      session.autoCompletePrompted = true
    }
    if (!canManage.value) {
      $q.notify({
        type: quasarNotifyTypes.warning,
        multiLine: true,
        timeout: 10000,
        message: t('activeEncounterAutoCompleteViewerNotice'),
      })

      return
    }
    autoCompleteOpen.value = true
    countdownSeconds.value = ENCOUNTER_COUNTDOWN_SEC
    countdownTimer = setInterval(() => {
      countdownSeconds.value -= 1
      if (countdownSeconds.value > 0) {
        return
      }
      clearInterval(countdownTimer)
      countdownTimer = null
      void runAutoComplete()
    }, 1000)
  }

  async function runAutoComplete() {
    if (completing) {
      return
    }
    const entry = toolbarActiveEncounter.value
    if (!isActivelyTicking(entry?.encounter) || !entry.encounter.id) {
      clearCountdown()
      if (session) {
        session.autoCompletePrompted = false
      }

      return
    }
    if (
      session
      && String(session.encounterId) !== String(entry.encounter.id)
    ) {
      clearCountdown()

      return
    }
    completing = true
    actionBusy.value = true
    try {
      await completeEncounter(entry.encounter.id, entry.clientId)
      clearCountdown()
      resetSession()
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('activeEncounterAutoCompleteSuccess'),
      })
    } catch (error) {
      clearCountdown()
      if (isAuthSessionEndUIError(error)) {
        return
      }
      // Already completed elsewhere — treat as done.
      if (isEncounterConflictError(error)
        || isEncounterInvalidError(error)
      ) {
        resetSession()

        return
      }
      notifyError(error)
    } finally {
      completing = false
      actionBusy.value = false
    }
  }

  function onContinueEncounter() {
    if (!session || actionBusy.value) {
      return
    }
    if (!autoCompleteOpen.value && !countdownTimer) {
      return
    }
    clearCountdown()
    const encounter = toolbarActiveEncounter.value?.encounter
    const elapsedMs = resolveActiveElapsedMs(encounter)
    session.autoCompleteAtActiveMs = elapsedMs + ENCOUNTER_EXTEND_MS
    session.autoCompletePrompted = false
    persistSession()
    $q.notify({
      type: quasarNotifyTypes.info,
      message: t('activeEncounterExtended', { minutes: 30 }),
    })
  }

  function evaluateMilestones(elapsedMs) {
    if (!session) {
      return
    }
    ENCOUNTER_REMINDER_MS.forEach(threshold => {
      if (elapsedMs < threshold) {
        return
      }
      if (session.firedReminders.has(threshold)) {
        return
      }
      if (!isWorkingOnOtherClient()) {
        return
      }
      session.firedReminders.add(threshold)
      persistSession()
      notifyReminder()
    })

    if (
      elapsedMs >= session.autoCompleteAtActiveMs
      && !autoCompleteOpen.value
      && !countdownTimer
      && !completing
    ) {
      startAutoCompleteCountdown()
    }
  }

  function tick() {
    const mode = syncSessionFromToolbar()
    if (!mode) {
      return
    }
    const encounter = toolbarActiveEncounter.value?.encounter
    const elapsedMs = resolveActiveElapsedMs(encounter)
    const elapsedSec = Math.max(0, Math.floor(elapsedMs / 1000))
    elapsedLabel.value = formatEncounterElapsedLabel(elapsedSec)
    if (mode !== 'active') {
      if (autoCompleteOpen.value || countdownTimer) {
        if (session) {
          session.autoCompletePrompted = false
        }
        clearCountdown()
      }

      return
    }
    evaluateMilestones(elapsedMs)
  }

  function startTicker() {
    stopTicker()
    tick()
    tickTimer = setInterval(tick, 1000)
  }

  function stopTicker() {
    if (tickTimer) {
      clearInterval(tickTimer)
      tickTimer = null
    }
  }

  watch(toolbarActiveEncounter, () => {
    tick()
  })

  watch(() => route.fullPath, () => {
    if (!session) {
      return
    }
    const encounter = toolbarActiveEncounter.value?.encounter
    if (!isActivelyTicking(encounter)) {
      return
    }
    evaluateMilestones(resolveActiveElapsedMs(encounter))
  })

  onMounted(() => {
    startTicker()
  })

  onBeforeUnmount(() => {
    stopTicker()
    clearCountdown()
  })

  return {
    elapsedLabel,
    autoCompleteOpen,
    countdownSeconds,
    actionBusy,
    onContinueEncounter,
    onConfirmAutoComplete: runAutoComplete,
  }
}
