import {
  appointmentAvailabilityBlockTypes,
} from 'components/constants.js'
import {
  appointmentAvailabilityScrollFocusHour,
  calendarHourStart,
  calendarTimeRowHeightPx,
} from 'src/constants/calendar.js'
import {
  localDateTimeToUtcIso,
  localDayKeyFromUtc,
  resolveTenantTimeZone,
} from 'src/utils/appointment-datetime.js'
import {
  localMinutesFromUtc,
} from 'src/utils/calendar-events.js'

function resolveTimeZone(timeZone) {
  return String(timeZone ?? '').trim() || resolveTenantTimeZone()
}

export function availabilityRangeMinuteSpan(range, timeZone) {
  const tz = resolveTimeZone(timeZone)
  const start = localMinutesFromUtc(range.startAtUtc, tz)
  const end = localMinutesFromUtc(range.endAtUtc, tz)

  return { start, end }
}

export function computeAvailabilityRangeStyle(
  range,
  timeZone,
  rowHeightPx = calendarTimeRowHeightPx,
) {
  return computeMinuteSegmentStyle(
    availabilityRangeMinuteSpan(range, timeZone),
    rowHeightPx,
  )
}

export function computeMinuteSegmentStyle(
  { start, end },
  rowHeightPx = calendarTimeRowHeightPx,
) {
  const gridStart = calendarHourStart * 60
  const topPx = ((start - gridStart) / 60) * rowHeightPx
  const heightPx = Math.max(
    rowHeightPx / 8,
    ((end - start) / 60) * rowHeightPx,
  )

  return {
    top: `${topPx}px`,
    height: `${heightPx}px`,
  }
}

export function formatOccupiedSegmentTitle(start, end) {
  const pad = value => String(value).padStart(2, '0')
  const startLabel = `${pad(Math.floor(start / 60))}:${pad(start % 60)}`
  const endLabel = `${pad(Math.floor(end / 60))}:${pad(end % 60)}`

  return `${startLabel} – ${endLabel}`
}

export function findBookingRangeAtMinute(
  ranges = [],
  minutesLocal,
  durationMin,
  timeZone = resolveTenantTimeZone(),
  preferredClinicianId = null,
) {
  const duration = Number(durationMin)
  const minute = Number(minutesLocal)
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(minute)) {
    return null
  }

  const tz = resolveTimeZone(timeZone)
  const matches = []

  for (const range of ranges) {
    const { start, end } = availabilityRangeMinuteSpan(range, tz)
    if (minute >= start && minute + duration <= end) {
      matches.push(range)
    }
  }

  if (!matches.length) {
    return null
  }

  if (preferredClinicianId != null) {
    const preferred = matches.find(
      range => String(range.clinicianId) === String(preferredClinicianId),
    )
    if (preferred) {
      return preferred
    }
  }

  return matches[0]
}

export function buildWindowFromGridSelection({
  dayKey,
  minutesLocal,
  durationMin,
  range,
  timeZone = resolveTenantTimeZone(),
}) {
  const hour = Math.floor(minutesLocal / 60)
  const minute = minutesLocal % 60
  const startAtUtc = localDateTimeToUtcIso(
    dayKey,
    hour,
    minute,
    resolveTimeZone(timeZone),
  )
  if (!startAtUtc) {
    return null
  }

  const startMs = Date.parse(startAtUtc)
  const endAtUtc = Number.isFinite(startMs)
    ? new Date(startMs + Number(durationMin) * 60 * 1000).toISOString()
    : ''

  return {
    startAtUtc,
    endAtUtc,
    clinicianId: range?.clinicianId ?? null,
    clinicianDisplayName: range?.clinicianDisplayName ?? '',
    durationMin: Number(durationMin),
  }
}

export function computeSelectedAppointmentStyle(
  window,
  durationMin,
  timeZone = resolveTenantTimeZone(),
  rowHeightPx = calendarTimeRowHeightPx,
) {
  if (!window?.startAtUtc) {
    return null
  }

  const tz = resolveTimeZone(timeZone)
  const endAtUtc = window.endAtUtc
    || new Date(
      Date.parse(window.startAtUtc) + Number(durationMin) * 60 * 1000,
    ).toISOString()
  const span = availabilityRangeMinuteSpan(
    { startAtUtc: window.startAtUtc, endAtUtc },
    tz,
  )

  return computeMinuteSegmentStyle(span, rowHeightPx)
}

export function calendarBlocksForDay(
  blocks = [],
  dayKey,
  timeZone = resolveTenantTimeZone(),
) {
  const tz = resolveTimeZone(timeZone)
  const layerOrder = {
    outside: 0,
    break: 1,
    appointment: 2,
    available: 3,
  }

  return blocks
    .filter(block =>
      block?.startAtUtc
      && block?.endAtUtc
      && block.blockType !== appointmentAvailabilityBlockTypes.available
      && localDayKeyFromUtc(block.startAtUtc, tz) === dayKey,
    )
    .map(block => ({
      ...block,
      span: availabilityRangeMinuteSpan(block, tz),
    }))
    .sort((a, b) => {
      const layerDiff = (layerOrder[a.blockType] ?? 0)
        - (layerOrder[b.blockType] ?? 0)
      if (layerDiff !== 0) {
        return layerDiff
      }

      return a.span.start - b.span.start
    })
}

export function findFirstAvailableStartMinute(
  freeRanges = [],
  dayKey,
  durationMin,
  timeZone = resolveTenantTimeZone(),
) {
  const duration = Number(durationMin)
  if (!dayKey || !Number.isFinite(duration) || duration <= 0) {
    return null
  }

  const tz = resolveTimeZone(timeZone)
  const sorted = freeRanges
    .filter(range => localDayKeyFromUtc(range.startAtUtc, tz) === dayKey)
    .map(range => availabilityRangeMinuteSpan(range, tz))
    .filter(span => span.end > span.start)
    .sort((a, b) => a.start - b.start)

  for (const span of sorted) {
    if (span.end - span.start >= duration) {
      return span.start
    }
  }

  return null
}

export function resolveAvailabilityScrollFocusMinute(
  freeRanges = [],
  dayKey,
  durationMin,
  timeZone = resolveTenantTimeZone(),
  focusHourStart = appointmentAvailabilityScrollFocusHour,
) {
  const focusMinute = focusHourStart * 60
  const firstAvailable = findFirstAvailableStartMinute(
    freeRanges,
    dayKey,
    durationMin,
    timeZone,
  )
  if (firstAvailable == null) {
    return focusMinute
  }

  return Math.max(firstAvailable, focusMinute)
}

export function scrollContainerToMinute(
  containerEl,
  minutesLocal,
  rowHeightPx = calendarTimeRowHeightPx,
) {
  if (!containerEl || !Number.isFinite(minutesLocal)) {
    return
  }

  const gridStart = calendarHourStart * 60
  const topPx = ((minutesLocal - gridStart) / 60) * rowHeightPx
  const target = topPx - containerEl.clientHeight / 3
  containerEl.scrollTop = Math.max(0, target)
}

export function calendarBlockToAppointmentRecord(block) {
  if (!block) {
    return null
  }

  return {
    appointmentId: block.appointmentId,
    appointmentNumber: block.appointmentNumber,
    clientDisplayName: block.clientDisplayName,
    servicesLabel: block.servicesLabel,
    serviceProcedures: block.serviceProcedures ?? [],
    clinicianDisplayName: block.clinicianDisplayName,
    startAtUtc: block.startAtUtc,
    endAtUtc: block.endAtUtc,
    durationMin: block.durationMin,
    status: block.status,
  }
}

export function windowMatchesDay(window, dayKey, timeZone) {
  if (!window?.startAtUtc || !dayKey) {
    return false
  }

  return localDayKeyFromUtc(window.startAtUtc, resolveTimeZone(timeZone))
    === dayKey
}
