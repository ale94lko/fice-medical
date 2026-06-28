export const STAFF_LIST_SEARCH_DEBOUNCE_MS = 350
export const STAFF_LIST_SEARCH_MIN_LENGTH = 1

export function isStaffListServerSearchQuery(query) {
  return String(query ?? '').trim().length >= STAFF_LIST_SEARCH_MIN_LENGTH
}
