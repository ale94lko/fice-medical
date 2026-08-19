export const CLINIC_DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5]

export function normalizeWeekdays(days) {
  return [...new Set(
    (Array.isArray(days) ? days : [])
      .map(Number)
      .filter(day => day >= 1 && day <= 7),
  )].sort((left, right) => left - right)
}

export function parseWorkingWeekdays(raw) {
  const root = raw ?? {}
  const list = Array.isArray(root)
    ? root
    : (root.days_of_week ?? root.daysOfWeek ?? [])
  const days = normalizeWeekdays(list)

  return days.length ? days : [...CLINIC_DEFAULT_WEEKDAYS]
}

export function isWorkingWeekday(day, workingWeekdays) {
  const days = normalizeWeekdays(workingWeekdays)
  const enabled = days.length
    ? days
    : CLINIC_DEFAULT_WEEKDAYS

  return enabled.includes(Number(day))
}
