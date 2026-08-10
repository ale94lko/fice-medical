export const APPOINTMENT_LIST_SEARCH_MIN_LENGTH = 3

export const APPOINTMENT_LIST_SEARCH_DEBOUNCE_MS = 350

export function isAppointmentListServerSearchQuery(query) {
  return String(query ?? '').trim().length
    >= APPOINTMENT_LIST_SEARCH_MIN_LENGTH
}
