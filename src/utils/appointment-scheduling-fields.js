import {
  formatUtcTime,
  resolveTenantTimeZone,
} from 'src/utils/appointment-datetime.js'
import {
  resolveBookingAtMinute,
} from 'src/utils/appointment-availability-ranges.js'
import { parseTime12h } from 'src/utils/client-vitals.js'

const MINUTES_PER_DAY = 24 * 60

export function emptySchedulingFields() {
  return {
    startTime: '',
    endTime: '',
  }
}

export function windowToSchedulingFields(
  window,
  timeZone = resolveTenantTimeZone(),
) {
  if (!window?.startAtUtc) {
    return emptySchedulingFields()
  }

  return {
    startTime: formatUtcTime(window.startAtUtc, timeZone),
    endTime: formatUtcTime(window.endAtUtc, timeZone),
  }
}

export function localMinutesFromTime12h(time12h) {
  const parsed = parseTime12h(time12h)
  if (!parsed) {
    return null
  }

  return parsed.hours * 60 + parsed.minutes
}

export function formatLocalMinutesAsTime12h(totalMinutes) {
  const normalized = ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY)
    % MINUTES_PER_DAY
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 === 0 ? 12 : hours % 12

  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`
}

export function normalizeSchedulingTime12h(value) {
  const parsed = parseTime12h(value)
  if (!parsed) {
    return String(value ?? '').trim()
  }

  return formatLocalMinutesAsTime12h(
    parsed.hours * 60 + parsed.minutes,
  )
}

export function coupleSchedulingFields({
  startTime,
  endTime,
  durationMinutes,
  adjustFrom = 'start',
}) {
  const duration = Number(durationMinutes)
  if (!Number.isFinite(duration) || duration <= 0) {
    return {
      startTime: normalizeSchedulingTime12h(startTime),
      endTime: normalizeSchedulingTime12h(endTime),
    }
  }

  if (adjustFrom === 'end') {
    const endMinutes = localMinutesFromTime12h(endTime)
    if (endMinutes == null) {
      return {
        startTime: normalizeSchedulingTime12h(startTime),
        endTime: normalizeSchedulingTime12h(endTime),
      }
    }

    return {
      startTime: formatLocalMinutesAsTime12h(endMinutes - duration),
      endTime: normalizeSchedulingTime12h(endTime),
    }
  }

  const startMinutes = localMinutesFromTime12h(startTime)
  if (startMinutes == null) {
    return {
      startTime: normalizeSchedulingTime12h(startTime),
      endTime: normalizeSchedulingTime12h(endTime),
    }
  }

  return {
    startTime: normalizeSchedulingTime12h(startTime),
    endTime: formatLocalMinutesAsTime12h(startMinutes + duration),
  }
}

export function tryBuildWindowFromSchedulingFields({
  dayKey,
  startTime,
  endTime,
  durationMinutes,
  adjustFrom = 'start',
  ranges = [],
  blocks = [],
  allowOverScheduleBlocks = false,
  timeZone = resolveTenantTimeZone(),
  preferredClinicianId = null,
}) {
  const duration = Number(durationMinutes)
  if (!Number.isFinite(duration) || duration <= 0) {
    return { ok: false, reason: 'duration' }
  }

  const resolvedDayKey = String(dayKey ?? '').trim()
  if (!resolvedDayKey) {
    return { ok: false, reason: 'date' }
  }

  const coupled = coupleSchedulingFields({
    startTime,
    endTime,
    durationMinutes: duration,
    adjustFrom,
  })
  const startMinutes = localMinutesFromTime12h(coupled.startTime)
  const endMinutes = localMinutesFromTime12h(coupled.endTime)
  if (startMinutes == null || endMinutes == null) {
    return {
      ok: false,
      reason: adjustFrom === 'end' ? 'endTime' : 'startTime',
    }
  }

  if (endMinutes - startMinutes !== duration) {
    return { ok: false, reason: 'duration' }
  }

  const result = resolveBookingAtMinute({
    dayKey: resolvedDayKey,
    minutesLocal: startMinutes,
    durationMin: duration,
    availableRanges: ranges,
    blocks,
    allowOverScheduleBlocks,
    timeZone,
    preferredClinicianId,
  })
  if (!result.ok) {
    return { ok: false, reason: result.reason ?? 'conflict' }
  }

  return {
    ok: true,
    window: result.window,
    fields: windowToSchedulingFields(result.window, timeZone),
    dayKey: resolvedDayKey,
    scheduleBlockOverlaps: result.scheduleBlockOverlaps ?? [],
  }
}
