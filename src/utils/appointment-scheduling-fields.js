import { calendarSlotMinutes } from 'src/constants/calendar.js'
import {
  formatUtcTime,
  resolveTenantTimeZone,
} from 'src/utils/appointment-datetime.js'
import {
  buildWindowFromGridSelection,
  findBookingRangeAtMinute,
} from 'src/utils/appointment-availability-ranges.js'
import { parseTime12h } from 'src/utils/client-vitals.js'
import { snapLocalMinutesToSlot } from 'src/utils/calendar-grid-click.js'

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

function localMinutesFromTime12h(time12h) {
  const parsed = parseTime12h(time12h)
  if (!parsed) {
    return null
  }

  return parsed.hours * 60 + parsed.minutes
}

export function normalizeSchedulingTime12h(value) {
  const parsed = parseTime12h(value)
  if (!parsed) {
    return String(value ?? '').trim()
  }

  const hours = parsed.hours
  const minutes = parsed.minutes
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 === 0 ? 12 : hours % 12

  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`
}

export function tryBuildWindowFromSchedulingFields({
  dayKey,
  startTime,
  endTime,
  durationMinutes,
  adjustFrom = 'start',
  ranges = [],
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

  let startMinutes = null
  let endMinutes = null

  if (adjustFrom === 'end') {
    endMinutes = localMinutesFromTime12h(endTime)
    if (endMinutes == null) {
      return { ok: false, reason: 'endTime' }
    }
    startMinutes = snapLocalMinutesToSlot(
      endMinutes - duration,
      calendarSlotMinutes,
    )
  } else {
    const rawStart = localMinutesFromTime12h(startTime)
    if (rawStart == null) {
      return { ok: false, reason: 'startTime' }
    }
    startMinutes = snapLocalMinutesToSlot(rawStart, calendarSlotMinutes)
    endMinutes = startMinutes + duration
  }

  const range = findBookingRangeAtMinute(
    ranges,
    startMinutes,
    duration,
    timeZone,
    preferredClinicianId,
  )
  if (!range) {
    return { ok: false, reason: 'conflict' }
  }

  const window = buildWindowFromGridSelection({
    dayKey: resolvedDayKey,
    minutesLocal: startMinutes,
    durationMin: duration,
    range,
    timeZone,
  })
  if (!window) {
    return { ok: false, reason: 'conflict' }
  }

  return {
    ok: true,
    window,
    fields: windowToSchedulingFields(window, timeZone),
    dayKey: resolvedDayKey,
  }
}
