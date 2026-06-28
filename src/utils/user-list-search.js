export const USER_LIST_SEARCH_MIN_LENGTH = 2
export const USER_LIST_SEARCH_DEBOUNCE_MS = 300

export function isUserListServerSearchQuery(query) {
  return String(query ?? '').trim().length >= USER_LIST_SEARCH_MIN_LENGTH
}
