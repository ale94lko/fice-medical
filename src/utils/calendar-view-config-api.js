import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  calendarViewModes,
  isCalendarViewMode,
} from 'src/constants/calendar.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

export function parseCalendarViewMode(payload) {
  const root = unwrapData(payload)
  const mode = String(
    root?.view_mode ?? root?.viewMode ?? '',
  ).trim()
  if (isCalendarViewMode(mode)) {
    return mode
  }

  return calendarViewModes.week
}

export async function fetchCalendarViewMode() {
  const response = await apiInstance.get(apiPaths.calendarViewConfig)

  return parseCalendarViewMode(response.data)
}

export async function saveCalendarViewMode(viewMode) {
  const response = await apiInstance.put(
    apiPaths.calendarViewConfig,
    { viewMode },
  )

  return parseCalendarViewMode(response.data)
}
