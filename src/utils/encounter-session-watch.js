import { encounterStatuses } from 'components/constants.js'
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
      paused: Boolean(parsed.paused),
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
      paused: Boolean(state.paused),
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

function encounterStatusToken(encounter) {
  return String(encounter?.status ?? '').trim().toUpperCase()
}

function isPausedEncounter(encounter) {
  const status = encounterStatusToken(encounter)

  return status === encounterStatuses.waitingForResults
    || status === encounterStatuses.readyToResume
}

function minutesToMs(value) {
  const minutes = Number(value)

  return Number.isFinite(minutes) && minutes > 0
    ? minutes * 60 * 1000
    : 0
}

function waitingMsFromEncounter(encounter) {
  return minutesToMs(encounter?.wait?.waitingMinutes)
}

function wallActiveMs(encounter, nowMs) {
  const startedMs = parseIsoToMs(encounter?.startedAtUtc)
  if (!startedMs) {
    return 0
  }
  const reopenedMs = parseIsoToMs(encounter?.reopenedAtUtc)
  const completedMs = parseIsoToMs(encounter?.completedAtUtc)
  const waitingMs = waitingMsFromEncounter(encounter)

  if (reopenedMs != null) {
    let priorActiveMs = 0
    if (
      completedMs != null
      && completedMs > startedMs
      && completedMs <= reopenedMs
    ) {
      priorActiveMs = completedMs - startedMs
    }

    return Math.max(
      0,
      nowMs - (reopenedMs - priorActiveMs) - waitingMs,
    )
  }

  return Math.max(0, nowMs - startedMs - waitingMs)
}

/**
 * Live clinical elapsed. Frozen while paused; does not include wait time.
 */
export function resolveActiveElapsedMs(
  encounter,
  nowMs = Date.now(),
) {
  const resume = loadEncounterResumeTimer(encounter?.id)
  if (resume?.paused) {
    return Math.max(0, resume.baseActiveMs)
  }
  if (isPausedEncounter(encounter)) {
    return computeActiveMsAfterPause(encounter, nowMs)
  }
  if (resume?.resumedAtMs != null) {
    return resume.baseActiveMs
      + Math.max(0, nowMs - resume.resumedAtMs)
  }

  return wallActiveMs(encounter, nowMs)
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
 * Clinical time only: excludes WAITING_FOR_RESULTS / READY_TO_RESUME.
 */
export function computeActiveMsAfterPause(
  encounter,
  nowMs = Date.now(),
) {
  const waitingSinceMs = parseIsoToMs(encounter?.wait?.waitingSince)
  const existing = loadEncounterResumeTimer(encounter?.id)

  if (existing?.paused) {
    return Math.max(0, existing.baseActiveMs)
  }
  if (existing?.resumedAtMs != null) {
    const pauseAtMs = waitingSinceMs
      && waitingSinceMs > existing.resumedAtMs
      ? waitingSinceMs
      : nowMs

    return existing.baseActiveMs
      + Math.max(0, pauseAtMs - existing.resumedAtMs)
  }

  const clinicalMs = minutesToMs(
    encounter?.wait?.activeClinicalMinutes,
  )
  if (clinicalMs > 0) {
    return clinicalMs
  }

  const startedMs = parseIsoToMs(encounter?.startedAtUtc)
  if (startedMs && waitingSinceMs && waitingSinceMs > startedMs) {
    return waitingSinceMs - startedMs
  }

  const waitingMs = waitingMsFromEncounter(encounter)
  if (startedMs && waitingMs > 0) {
    return Math.max(0, nowMs - startedMs - waitingMs)
  }

  return computeActiveMsBeforeReopen(encounter, nowMs)
}

/**
 * Persist timer resume so elapsed discounts inactive time
 * (completed→reopen, or pause→resume).
 */
export function markEncounterTimerResumed(before, after = null) {
  const id = after?.id ?? before?.id
  if (id == null) {
    return
  }
  const existing = loadEncounterResumeTimer(id)
  let baseActiveMs = computeActiveMsBeforeReopen(before)
  if (existing?.paused) {
    baseActiveMs = existing.baseActiveMs
  } else if (isPausedEncounter(before)) {
    baseActiveMs = computeActiveMsAfterPause(before)
  }
  const resumedAtMs = parseIsoToMs(after?.reopenedAtUtc) ?? Date.now()
  saveEncounterResumeTimer(id, {
    baseActiveMs,
    resumedAtMs,
    paused: false,
  })
  if (!existing?.paused) {
    clearEncounterWatchState(id)
  }
}

/**
 * Freeze clinical elapsed at the moment the clinician pauses.
 */
export function markEncounterTimerPaused(
  encounter,
  nowMs = Date.now(),
) {
  const id = encounter?.id
  if (id == null) {
    return
  }
  const existing = loadEncounterResumeTimer(id)
  let baseActiveMs
  if (existing?.paused) {
    baseActiveMs = existing.baseActiveMs
  } else if (existing?.resumedAtMs != null) {
    baseActiveMs = existing.baseActiveMs
      + Math.max(0, nowMs - existing.resumedAtMs)
  } else {
    baseActiveMs = wallActiveMs(encounter, nowMs)
  }
  saveEncounterResumeTimer(id, {
    baseActiveMs,
    resumedAtMs: nowMs,
    paused: true,
  })
}

/**
 * Continue ticking after a failed pause request.
 */
export function unfreezeEncounterTimer(
  encounter,
  nowMs = Date.now(),
) {
  const id = encounter?.id
  if (id == null) {
    return
  }
  const existing = loadEncounterResumeTimer(id)
  if (!existing?.paused) {
    return
  }
  saveEncounterResumeTimer(id, {
    baseActiveMs: existing.baseActiveMs,
    resumedAtMs: nowMs,
    paused: false,
  })
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
  const waitingMs = waitingMsFromEncounter(encounter)

  if (reopenedMs != null && startedMs != null) {
    let priorActiveMs = 0
    if (
      completedMs != null
      && completedMs > startedMs
      && completedMs <= reopenedMs
    ) {
      priorActiveMs = completedMs - startedMs
    }

    return reopenedMs - priorActiveMs + waitingMs
  }

  if (startedMs != null && waitingMs > 0) {
    return startedMs + waitingMs
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
      autoCompleteAtActiveMs: Number(parsed.autoCompleteAtActiveMs)
        || null,
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
      autoCompleteAtActiveMs: state.autoCompleteAtActiveMs ?? null,
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
