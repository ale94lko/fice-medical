import { formatTelehealthElapsedLabel } from
  'src/utils/telehealth-normalize.js'

/** Remind when open this long (only if viewing another client). */
export const ENCOUNTER_REMINDER_MS = [
  60 * 60 * 1000,
  90 * 60 * 1000,
]

/** First auto-complete warning after this open duration. */
export const ENCOUNTER_AUTO_COMPLETE_MS = 2 * 60 * 60 * 1000

/** Countdown before auto-complete. */
export const ENCOUNTER_COUNTDOWN_SEC = 10

/** Extra time when the user chooses Continue. */
export const ENCOUNTER_EXTEND_MS = 30 * 60 * 1000

const STORAGE_KEY = 'fice.activeEncounterWatch.v1'

export function formatEncounterElapsedLabel(totalSeconds) {
  return formatTelehealthElapsedLabel(totalSeconds)
}

export function parseEncounterStartedAtMs(encounter, fallbackMs = Date.now()) {
  const iso = String(encounter?.startedAtUtc ?? '').trim()
  if (iso) {
    const ms = new Date(iso).getTime()
    if (Number.isFinite(ms)) {
      return ms
    }
  }

  return fallbackMs
}

function storageKey(encounterId) {
  return `${STORAGE_KEY}:${String(encounterId ?? '').trim()}`
}

export function loadEncounterWatchState(encounterId) {
  const id = String(encounterId ?? '').trim()
  if (!id) {
    return null
  }
  try {
    const raw = sessionStorage.getItem(storageKey(id))
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    return {
      autoCompleteAtMs: Number(parsed.autoCompleteAtMs) || null,
      firedReminders: Array.isArray(parsed.firedReminders)
        ? parsed.firedReminders.map(Number).filter(Number.isFinite)
        : [],
    }
  } catch {
    return null
  }
}

export function saveEncounterWatchState(encounterId, state) {
  const id = String(encounterId ?? '').trim()
  if (!id || !state) {
    return
  }
  try {
    sessionStorage.setItem(storageKey(id), JSON.stringify({
      autoCompleteAtMs: state.autoCompleteAtMs ?? null,
      firedReminders: [...(state.firedReminders ?? [])],
    }))
  } catch {
    // Ignore quota / private mode.
  }
}

export function clearEncounterWatchState(encounterId) {
  const id = String(encounterId ?? '').trim()
  if (!id) {
    return
  }
  try {
    sessionStorage.removeItem(storageKey(id))
  } catch {
    // Ignore.
  }
}

/**
 * Client id from a client chart route, or null (list/add/other pages).
 */
export function resolveRouteClientId(route) {
  const path = String(route?.path ?? '')
  if (!path.includes('/clients/')) {
    return null
  }
  if (
    path.endsWith('/clients/add')
    || route?.name === 'AddClient'
  ) {
    return null
  }
  const id = String(route?.params?.id ?? '').trim()

  return id || null
}
