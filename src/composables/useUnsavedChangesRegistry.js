import { onBeforeUnmount } from 'vue'

let activeChecker = null

export function hasUnsavedChanges() {
  if (!activeChecker) {
    return false
  }
  try {
    return Boolean(activeChecker())
  } catch {
    return false
  }
}

/**
 * Registers a dirty-state checker for the active screen
 * (e.g. client or staff form). Cleared on unmount.
 */
export function useRegisterUnsavedChanges(isDirtyFn) {
  activeChecker = isDirtyFn

  onBeforeUnmount(() => {
    if (activeChecker === isDirtyFn) {
      activeChecker = null
    }
  })
}
