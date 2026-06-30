import {
  addDaysToDayKey,
  addMonthsToMonthKey,
  calendarDaysForMonth,
  localDayKeyFromParts,
  monthKeyFromDayKey,
  utcRangeForLocalDay,
} from 'src/utils/appointment-datetime.js'
import {
  calendarViewModes,
} from 'src/constants/calendar.js'

export const calendarWeekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function buildMonthGridCells(monthKey) {
  const days = calendarDaysForMonth(monthKey)
  if (!days.length) {
    return []
  }

  const first = days[0]
  const firstDate = new Date(
    Number(first.slice(0, 4)),
    Number(first.slice(5, 7)) - 1,
    Number(first.slice(8, 10)),
  )
  const offset = firstDate.getDay()
  const cells = []

  for (let i = offset - 1; i >= 0; i -= 1) {
    const date = new Date(firstDate)
    date.setDate(firstDate.getDate() - (i + 1))
    const dayKey = localDayKeyFromParts(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    )
    cells.push({
      key: `lead-${dayKey}`,
      empty: false,
      dayKey,
      label: date.getDate(),
      inMonth: false,
    })
  }

  days.forEach(dayKey => {
    cells.push({
      key: dayKey,
      empty: false,
      dayKey,
      label: Number(dayKey.split('-')[2]),
      inMonth: true,
    })
  })

  const last = days[days.length - 1]
  const lastDate = new Date(
    Number(last.slice(0, 4)),
    Number(last.slice(5, 7)) - 1,
    Number(last.slice(8, 10)),
  )
  let trail = 1
  while (cells.length % 7 !== 0) {
    const date = new Date(lastDate)
    date.setDate(lastDate.getDate() + trail)
    const dayKey = localDayKeyFromParts(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    )
    cells.push({
      key: `trail-${dayKey}`,
      empty: false,
      dayKey,
      label: date.getDate(),
      inMonth: false,
    })
    trail += 1
  }

  return cells
}

export function weekDayKeysContaining(anchorDayKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(anchorDayKey ?? ''))
  if (!match) {
    return []
  }

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  )
  const sunday = new Date(date)
  sunday.setDate(date.getDate() - date.getDay())
  const keys = []

  for (let i = 0; i < 7; i += 1) {
    const day = new Date(sunday)
    day.setDate(sunday.getDate() + i)
    keys.push(localDayKeyFromParts(
      day.getFullYear(),
      day.getMonth() + 1,
      day.getDate(),
    ))
  }

  return keys
}

export function shiftFocusDayKey(viewMode, focusDayKey, direction) {
  const delta = direction < 0 ? -1 : 1

  if (viewMode === calendarViewModes.month) {
    const monthKey = monthKeyFromDayKey(focusDayKey)
    const nextMonth = addMonthsToMonthKey(monthKey, delta)
    const days = calendarDaysForMonth(nextMonth)

    return days[0] ?? focusDayKey
  }

  if (viewMode === calendarViewModes.week) {
    return addDaysToDayKey(focusDayKey, delta * 7)
  }

  return addDaysToDayKey(focusDayKey, delta)
}

export function visibleRangeForView(viewMode, focusDayKey, timeZone) {
  let startDayKey = focusDayKey
  let endDayKey = focusDayKey

  if (viewMode === calendarViewModes.month) {
    const monthKey = monthKeyFromDayKey(focusDayKey)
    const cells = buildMonthGridCells(monthKey)
    const dayKeys = cells.filter(cell => !cell.empty).map(cell => cell.dayKey)
    startDayKey = dayKeys[0] ?? focusDayKey
    endDayKey = dayKeys[dayKeys.length - 1] ?? focusDayKey
  } else if (viewMode === calendarViewModes.week) {
    const weekKeys = weekDayKeysContaining(focusDayKey)
    startDayKey = weekKeys[0] ?? focusDayKey
    endDayKey = weekKeys[weekKeys.length - 1] ?? focusDayKey
  } else if (viewMode === calendarViewModes.agenda) {
    startDayKey = focusDayKey
    endDayKey = addDaysToDayKey(focusDayKey, 30)
  }

  const fromUtc = utcRangeForLocalDay(startDayKey, timeZone).fromUtc
  const toUtc = utcRangeForLocalDay(endDayKey, timeZone).toUtc

  return {
    startDayKey,
    endDayKey,
    fromUtc,
    toUtc,
  }
}

export function buildHourLabels(startHour, endHour) {
  const labels = []
  for (let hour = startHour; hour <= endHour; hour += 1) {
    const period = hour >= 12 ? 'PM' : 'AM'
    const display = hour % 12 === 0 ? 12 : hour % 12
    labels.push({
      hour,
      label: `${display} ${period}`,
    })
  }

  return labels
}
