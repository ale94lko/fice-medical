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
  parseEncounterStartedAtMs,
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
      autoCompleteAtMs: session.autoCompleteAtMs,
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
    const startedAtMs = parseEncounterStartedAtMs(encounter)
    const stored = loadEncounterWatchState(encounterId)
    const defaultAutoAt = startedAtMs + ENCOUNTER_AUTO_COMPLETE_MS
    const autoCompleteAtMs = Number.isFinite(stored?.autoCompleteAtMs)
      && stored.autoCompleteAtMs > startedAtMs
      ? stored.autoCompleteAtMs
      : defaultAutoAt

    return {
      encounterId,
      clientId: String(entry.clientId ?? encounter.clientId ?? '').trim(),
      startedAtMs,
      autoCompleteAtMs,
      firedReminders: new Set(stored?.firedReminders ?? []),
      autoCompletePrompted: false,
    }
  }

  function syncSessionFromToolbar() {
    const entry = toolbarActiveEncounter.value
    const encounter = entry?.encounter
    if (!encounter?.isInProgress || encounter.id == null) {
      if (session) {
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

    return true
  }

  function isWorkingOnOtherClient() {
    if (!session?.clientId) {
      return false
    }
    const routeClientId = resolveRouteClientId(route)
    if (!routeClientId) {
      return false
    }

    return routeClientId !== session.clientId
  }

  function goToEncounterClient() {
    if (!session?.clientId) {
      return
    }
    router.push({
      name: 'ClientOverview',
      params: { id: session.clientId },
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
    if (!entry?.encounter?.isInProgress || !entry.encounter.id) {
      clearCountdown()
      resetSession()

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
      if (session?.encounterId) {
        clearEncounterWatchState(session.encounterId)
      }
      session = null
      elapsedLabel.value = ''
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
        if (session?.encounterId) {
          clearEncounterWatchState(session.encounterId)
        }
        session = null
        elapsedLabel.value = ''

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
    session.autoCompleteAtMs = Date.now() + ENCOUNTER_EXTEND_MS
    session.autoCompletePrompted = false
    persistSession()
    $q.notify({
      type: quasarNotifyTypes.info,
      message: t('activeEncounterExtended', { minutes: 30 }),
    })
  }

  function evaluateMilestones(nowMs) {
    if (!session) {
      return
    }
    const elapsed = nowMs - session.startedAtMs
    ENCOUNTER_REMINDER_MS.forEach(threshold => {
      if (elapsed < threshold) {
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
      nowMs >= session.autoCompleteAtMs
      && !autoCompleteOpen.value
      && !countdownTimer
      && !completing
    ) {
      startAutoCompleteCountdown()
    }
  }

  function tick() {
    if (!syncSessionFromToolbar()) {
      return
    }
    const nowMs = Date.now()
    const elapsedSec = Math.max(
      0,
      Math.floor((nowMs - session.startedAtMs) / 1000),
    )
    elapsedLabel.value = formatEncounterElapsedLabel(elapsedSec)
    evaluateMilestones(nowMs)
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
    evaluateMilestones(Date.now())
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
