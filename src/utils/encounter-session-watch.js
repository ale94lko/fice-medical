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
const RESUME_STORAGE_KEY = 'fice.encounterTimerResume.v1'

export function formatEncounterElapsedLabel(totalSeconds) {
  return formatTelehealthElapsedLabel(totalSeconds)
}

function parseIsoToMs(iso) {
  const value = String(iso ?? '').trim()
  if (!value) {
    return null
  }
  const ms = new Date(value).getTime()

  return Number.isFinite(ms) ? ms : null
}

export function parseEncounterStartedAtMs(encounter, fallbackMs = Date.now()) {
  return parseIsoToMs(encounter?.startedAtUtc) ?? fallbackMs
}

function resumeStorageKey(encounterId) {
  return `${RESUME_STORAGE_KEY}:${String(encounterId ?? '').trim()}`
}

export function loadEncounterResumeTimer(encounterId) {
  const id = String(encounterId ?? '').trim()
  if (!id) {
    return null
  }
  try {
    const raw = localStorage.getItem(resumeStorageKey(id))
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }
    const resumedAtMs = Number(parsed.resumedAtMs)
    const baseActiveMs = Number(parsed.baseActiveMs)
    if (!Number.isFinite(resumedAtMs)) {
      return null
    }

    return {
      resumedAtMs,
      baseActiveMs: Number.isFinite(baseActiveMs)
        ? Math.max(0, baseActiveMs)
        : 0,
    }
  } catch {
    return null
  }
}

export function saveEncounterResumeTimer(encounterId, state) {
  const id = String(encounterId ?? '').trim()
  if (!id || !state) {
    return
  }
  try {
    localStorage.setItem(resumeStorageKey(id), JSON.stringify({
      resumedAtMs: state.resumedAtMs,
      baseActiveMs: Math.max(0, Number(state.baseActiveMs) || 0),
    }))
  } catch {
    // Ignore quota / private mode.
  }
}

export function clearEncounterResumeTimer(encounterId) {
  const id = String(encounterId ?? '').trim()
  if (!id) {
    return
  }
  try {
    localStorage.removeItem(resumeStorageKey(id))
  } catch {
    // Ignore.
  }
}

/**
 * Active open time before a reopen (excludes time while completed/cancelled).
 */
export function computeActiveMsBeforeReopen(
  encounter,
  nowMs = Date.now(),
) {
  const id = encounter?.id
  const startedMs = parseIsoToMs(encounter?.startedAtUtc)
  const completedMs = parseIsoToMs(encounter?.completedAtUtc)
    ?? parseIsoToMs(encounter?.cancelledAtUtc)
  const existing = loadEncounterResumeTimer(id)

  if (existing?.resumedAtMs != null) {
    const segmentEnd = completedMs && completedMs > existing.resumedAtMs
      ? completedMs
      : nowMs

    return existing.baseActiveMs
      + Math.max(0, segmentEnd - existing.resumedAtMs)
  }

  if (!startedMs) {
    return 0
  }
  const endMs = completedMs && completedMs > startedMs
    ? completedMs
    : nowMs

  return Math.max(0, endMs - startedMs)
}

/**
 * Persist timer resume so elapsed discounts inactive (completed→reopen) time.
 */
export function markEncounterTimerResumed(before, after = null) {
  const id = after?.id ?? before?.id
  if (id == null) {
    return
  }
  const baseActiveMs = computeActiveMsBeforeReopen(before)
  const resumedAtMs = parseIsoToMs(after?.reopenedAtUtc) ?? Date.now()
  saveEncounterResumeTimer(id, { baseActiveMs, resumedAtMs })
  clearEncounterWatchState(id)
}

/**
 * Effective clock start for elapsed / reminders (wall start minus inactive).
 */
export function resolveEncounterElapsedAnchorMs(
  encounter,
  fallbackMs = Date.now(),
) {
  const resume = loadEncounterResumeTimer(encounter?.id)
  if (resume?.resumedAtMs != null) {
    return resume.resumedAtMs - resume.baseActiveMs
  }

  const startedMs = parseIsoToMs(encounter?.startedAtUtc)
  const reopenedMs = parseIsoToMs(encounter?.reopenedAtUtc)
  const completedMs = parseIsoToMs(encounter?.completedAtUtc)

  if (reopenedMs != null && startedMs != null) {
    let priorActiveMs = 0
    if (
      completedMs != null
      && completedMs > startedMs
      && completedMs <= reopenedMs
    ) {
      priorActiveMs = completedMs - startedMs
    }

    return reopenedMs - priorActiveMs
  }

  return startedMs ?? fallbackMs
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
