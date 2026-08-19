import {
  appointmentAvailabilityBlockTypes,
} from 'components/constants.js'
import {
  appointmentAvailabilityScrollFocusHour,
  calendarHourStart,
  calendarTimeRowHeightPx,
} from 'src/constants/calendar.js'
import {
  addDaysToDayKey,
  localDayKeyFromUtc,
  localDateTimeToUtcIso,
  resolveTenantTimeZone,
  utcRangeForLocalDay,
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

export function availabilityRangeMinuteSpanForDay(
  range,
  dayKey,
  timeZone = resolveTenantTimeZone(),
) {
  const tz = resolveTimeZone(timeZone)
  const resolvedDayKey = String(dayKey ?? '').trim()
  if (!resolvedDayKey || !range?.startAtUtc || !range?.endAtUtc) {
    return null
  }

  const dayStartMs = Date.parse(utcRangeForLocalDay(resolvedDayKey, tz).fromUtc)
  const dayEndExclusiveMs = Date.parse(
    utcRangeForLocalDay(addDaysToDayKey(resolvedDayKey, 1), tz).fromUtc,
  )
  const rangeStartMs = Date.parse(range.startAtUtc)
  const rangeEndMs = Date.parse(range.endAtUtc)

  if (
    !Number.isFinite(dayStartMs)
    || !Number.isFinite(dayEndExclusiveMs)
    || !Number.isFinite(rangeStartMs)
    || !Number.isFinite(rangeEndMs)
  ) {
    return null
  }

  const clipStartMs = Math.max(rangeStartMs, dayStartMs)
  const clipEndMs = Math.min(rangeEndMs, dayEndExclusiveMs)
  if (clipEndMs <= clipStartMs) {
    return null
  }

  return {
    start: Math.round((clipStartMs - dayStartMs) / 60000),
    end: Math.round((clipEndMs - dayStartMs) / 60000),
  }
}

export function utcRangeOverlapsLocalDay(
  range,
  dayKey,
  timeZone = resolveTenantTimeZone(),
) {
  return availabilityRangeMinuteSpanForDay(range, dayKey, timeZone) != null
}

export function blocksForLocalDay(
  blocks = [],
  dayKey,
  timeZone = resolveTenantTimeZone(),
) {
  const tz = resolveTimeZone(timeZone)
  const resolvedDayKey = String(dayKey ?? '').trim()
  if (!resolvedDayKey) {
    return []
  }

  return blocks.filter(block =>
    block?.startAtUtc
    && block?.endAtUtc
    && utcRangeOverlapsLocalDay(block, resolvedDayKey, tz),
  )
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

function spansOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB
}

export function findBlockConflictAtMinute(
  blocks = [],
  dayKey,
  startMinutes,
  durationMin,
  timeZone = resolveTenantTimeZone(),
  blockTypes = [],
) {
  const duration = Number(durationMin)
  const start = Number(startMinutes)
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(start)) {
    return null
  }

  const end = start + duration
  const tz = resolveTimeZone(timeZone)
  const resolvedDayKey = String(dayKey ?? '').trim()
  if (!resolvedDayKey) {
    return null
  }

  const allowed = new Set(blockTypes)
  for (const block of blocks) {
    if (!allowed.has(block.blockType)) {
      continue
    }
    const span = availabilityRangeMinuteSpanForDay(block, resolvedDayKey, tz)
    if (!span) {
      continue
    }
    if (spansOverlap(start, end, span.start, span.end)) {
      return block
    }
  }

  return null
}

export function findAppointmentConflictAtMinute(
  blocks = [],
  dayKey,
  startMinutes,
  durationMin,
  timeZone = resolveTenantTimeZone(),
) {
  return findBlockConflictAtMinute(
    blocks,
    dayKey,
    startMinutes,
    durationMin,
    timeZone,
    [appointmentAvailabilityBlockTypes.appointment],
  )
}

export function findClientBusyConflictAtMinute(
  blocks = [],
  dayKey,
  startMinutes,
  durationMin,
  timeZone = resolveTenantTimeZone(),
) {
  return findBlockConflictAtMinute(
    blocks,
    dayKey,
    startMinutes,
    durationMin,
    timeZone,
    [appointmentAvailabilityBlockTypes.clientBusy],
  )
}

export function findScheduleBlockOverlapTypesAtMinute(
  blocks = [],
  dayKey,
  startMinutes,
  durationMin,
  timeZone = resolveTenantTimeZone(),
) {
  const duration = Number(durationMin)
  const start = Number(startMinutes)
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(start)) {
    return []
  }

  const end = start + duration
  const tz = resolveTimeZone(timeZone)
  const resolvedDayKey = String(dayKey ?? '').trim()
  if (!resolvedDayKey) {
    return []
  }

  const overlapTypes = new Set()

  for (const block of blocks) {
    if (
      block.blockType !== appointmentAvailabilityBlockTypes.outside
      && block.blockType !== appointmentAvailabilityBlockTypes.break
    ) {
      continue
    }
    const span = availabilityRangeMinuteSpanForDay(block, resolvedDayKey, tz)
    if (!span) {
      continue
    }
    if (spansOverlap(start, end, span.start, span.end)) {
      overlapTypes.add(block.blockType)
    }
  }

  return [...overlapTypes]
}

function resolveClinicianContextRange(
  availableRanges = [],
  preferredClinicianId = null,
) {
  if (preferredClinicianId != null) {
    const preferred = availableRanges.find(
      range => String(range.clinicianId) === String(preferredClinicianId),
    )
    if (preferred) {
      return preferred
    }
  }

  if (availableRanges[0]) {
    return availableRanges[0]
  }

  return {
    clinicianId: preferredClinicianId ?? null,
    clinicianDisplayName: '',
  }
}

export function resolveBookingAtMinute({
  dayKey,
  minutesLocal,
  durationMin,
  availableRanges = [],
  blocks = [],
  allowOverScheduleBlocks = false,
  timeZone = resolveTenantTimeZone(),
  preferredClinicianId = null,
}) {
  const duration = Number(durationMin)
  const minute = Number(minutesLocal)
  const resolvedDayKey = String(dayKey ?? '').trim()
  if (
    !resolvedDayKey
    || !Number.isFinite(duration)
    || duration <= 0
    || !Number.isFinite(minute)
  ) {
    return { ok: false, reason: 'conflict' }
  }

  if (findClientBusyConflictAtMinute(
    blocks,
    resolvedDayKey,
    minute,
    duration,
    timeZone,
  )) {
    return { ok: false, reason: 'clientConflict' }
  }

  if (!allowOverScheduleBlocks && findAppointmentConflictAtMinute(
    blocks,
    resolvedDayKey,
    minute,
    duration,
    timeZone,
  )) {
    return { ok: false, reason: 'appointmentConflict' }
  }

  const scheduleBlockOverlaps = findScheduleBlockOverlapTypesAtMinute(
    blocks,
    resolvedDayKey,
    minute,
    duration,
    timeZone,
  )

  const range = findBookingRangeAtMinute(
    availableRanges,
    minute,
    duration,
    timeZone,
    preferredClinicianId,
  )

  if (!range && !allowOverScheduleBlocks) {
    if (!preferredClinicianId && !availableRanges.length) {
      return { ok: false, reason: 'clinicianRequired' }
    }

    return { ok: false, reason: 'conflict' }
  }

  const bookingRange = range ?? resolveClinicianContextRange(
    availableRanges,
    preferredClinicianId,
  )

  const window = buildWindowFromGridSelection({
    dayKey: resolvedDayKey,
    minutesLocal: minute,
    durationMin: duration,
    range: bookingRange,
    timeZone,
  })
  if (!window) {
    return { ok: false, reason: 'conflict' }
  }

  return {
    ok: true,
    window,
    range: bookingRange,
    scheduleBlockOverlaps,
  }
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

export function clipWindowToDuration(window, durationMin) {
  if (!window?.startAtUtc) {
    return window
  }
  const duration = Number(durationMin)
  if (!Number.isFinite(duration) || duration <= 0) {
    return window
  }
  const startMs = Date.parse(window.startAtUtc)
  if (!Number.isFinite(startMs)) {
    return window
  }

  return {
    ...window,
    endAtUtc: new Date(startMs + duration * 60 * 1000).toISOString(),
    durationMin: duration,
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

  const clipped = clipWindowToDuration(window, durationMin) ?? window
  const tz = resolveTimeZone(timeZone)
  const span = availabilityRangeMinuteSpan(
    {
      startAtUtc: clipped.startAtUtc,
      endAtUtc: clipped.endAtUtc,
    },
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
    clientBusy: 2,
    appointment: 3,
    available: 4,
  }

  return blocks
    .filter(block =>
      block?.startAtUtc
      && block?.endAtUtc
      && block.blockType !== appointmentAvailabilityBlockTypes.available
      && utcRangeOverlapsLocalDay(block, dayKey, tz),
    )
    .map(block => ({
      ...block,
      span: availabilityRangeMinuteSpanForDay(block, dayKey, tz),
    }))
    .filter(block => block.span && block.span.end > block.span.start)
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
    clientId: block.clientId ?? null,
    clientNumber: block.clientNumber ?? null,
    clientDisplayName: block.clientDisplayName,
    servicesLabel: block.servicesLabel,
    serviceProcedures: block.serviceProcedures ?? [],
    clinicianDisplayName: block.clinicianDisplayName,
    startAtUtc: block.startAtUtc,
    endAtUtc: block.endAtUtc,
    durationMin: block.durationMin,
    status: block.status,
    telemedicine: block.telemedicine === true,
    telehealthInviteUrl: block.telehealthInviteUrl || null,
    telehealthSessionId: block.telehealthSessionId ?? null,
    placeOfServiceId: block.placeOfServiceId ?? null,
    placeOfServiceName: block.placeOfServiceName || null,
    placeOfServiceCode: block.placeOfServiceCode || null,
    placeOfServiceDisplayName: block.placeOfServiceDisplayName || null,
  }
}

export function windowMatchesDay(window, dayKey, timeZone) {
  if (!window?.startAtUtc || !dayKey) {
    return false
  }

  return localDayKeyFromUtc(window.startAtUtc, resolveTimeZone(timeZone))
    === dayKey
}
