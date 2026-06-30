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
  calendarTimeGridHeightPx,
  calendarTimeRowHeightPx,
} from 'src/constants/calendar.js'
import { localMinutesNow } from 'src/utils/calendar-now-indicator.js'

function resolveTimeZone(timeZone) {
  return String(timeZone ?? '').trim() || resolveTenantTimeZone()
}

export function snapLocalMinutesToSlot(
  minutes,
  slotMinutes = calendarSlotMinutes,
) {
  const snapped = Math.floor(minutes / slotMinutes) * slotMinutes
  const gridStart = calendarHourStart * 60
  const gridEnd = (calendarHourEnd + 1) * 60

  return Math.max(gridStart, Math.min(snapped, gridEnd - slotMinutes))
}

export function localMinutesFromGridOffsetY(offsetY) {
  const clampedY = Math.max(
    0,
    Math.min(Number(offsetY) || 0, calendarTimeGridHeightPx),
  )
  const raw = calendarHourStart * 60
    + (clampedY / calendarTimeRowHeightPx) * 60

  return snapLocalMinutesToSlot(raw)
}

export function isValidGridBookingTarget(
  dayKey,
  minutesLocal,
  timeZone = resolveTenantTimeZone(),
) {
  const tz = resolveTimeZone(timeZone)
  const { startDayKey, endDayKey } = appointmentSlotQueryRange(
    appointmentSlotLookaheadDays,
    tz,
  )
  if (!isDayKeyInRange(dayKey, startDayKey, endDayKey)) {
    return false
  }

  const gridStart = calendarHourStart * 60
  const gridEnd = (calendarHourEnd + 1) * 60
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
