import { appointmentSlotLookaheadDays } from 'components/constants.js'
import {
  appointmentSlotQueryRange,
  isDayKeyInRange,
  resolveTenantTimeZone,
  todayLocalDayKey,
} from 'src/utils/appointment-datetime.js'
import {
  calendarHourEnd,
  calendarHourStart,
  calendarSlotMinutes,
  calendarTimeRowHeightPx,
} from 'src/constants/calendar.js'
import { localMinutesNow } from 'src/utils/calendar-now-indicator.js'

function resolveTimeZone(timeZone) {
  return String(timeZone ?? '').trim() || resolveTenantTimeZone()
}

export function snapLocalMinutesToSlot(
  minutes,
  slotMinutes = calendarSlotMinutes,
  gridHourStart = calendarHourStart,
  gridHourEnd = calendarHourEnd,
) {
  const snapped = Math.floor(minutes / slotMinutes) * slotMinutes
  const gridStart = gridHourStart * 60
  const gridEnd = (gridHourEnd + 1) * 60

  return Math.max(gridStart, Math.min(snapped, gridEnd - slotMinutes))
}

export function localMinutesFromGridOffsetY(
  offsetY,
  rowHeightPx = calendarTimeRowHeightPx,
  gridHourStart = calendarHourStart,
  gridHourEnd = calendarHourEnd,
  slotMinutes = calendarSlotMinutes,
) {
  const hourCount = gridHourEnd - gridHourStart + 1
  const gridHeight = hourCount * rowHeightPx
  const clampedY = Math.max(
    0,
    Math.min(Number(offsetY) || 0, gridHeight),
  )
  const raw = gridHourStart * 60
    + (clampedY / rowHeightPx) * 60
  const gridStart = gridHourStart * 60
  const gridEnd = (gridHourEnd + 1) * 60

  if (slotMinutes <= 1) {
    return Math.max(gridStart, Math.min(Math.round(raw), gridEnd - 1))
  }

  return snapLocalMinutesToSlot(
    raw,
    slotMinutes,
    gridHourStart,
    gridHourEnd,
  )
}

export function isValidGridBookingTarget(
  dayKey,
  minutesLocal,
  timeZone = resolveTenantTimeZone(),
  gridHourStart = calendarHourStart,
  gridHourEnd = calendarHourEnd,
) {
  const tz = resolveTimeZone(timeZone)
  const { startDayKey, endDayKey } = appointmentSlotQueryRange(
    appointmentSlotLookaheadDays,
    tz,
  )
  if (!isDayKeyInRange(dayKey, startDayKey, endDayKey)) {
    return false
  }

  const gridStart = gridHourStart * 60
  const gridEnd = (gridHourEnd + 1) * 60
  if (minutesLocal < gridStart || minutesLocal >= gridEnd) {
    return false
  }

  const today = todayLocalDayKey(tz)
  if (dayKey === today && minutesLocal < localMinutesNow(tz)) {
    return false
  }

  return true
}

export function gridOffsetYFromClick(event) {
  const grid = event?.currentTarget
  if (!grid?.getBoundingClientRect) {
    return null
  }

  const rect = grid.getBoundingClientRect()

  return event.clientY - rect.top
}
