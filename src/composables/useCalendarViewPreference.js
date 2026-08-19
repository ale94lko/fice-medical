import { ref } from 'vue'
import { isCalendarViewMode } from 'src/constants/calendar.js'
import {
  fetchCalendarViewMode,
  saveCalendarViewMode,
} from 'src/utils/calendar-view-config-api.js'

export function useCalendarViewPreference(viewMode) {
  const preferenceReady = ref(false)
  let userChanged = false

  async function loadPreference() {
    try {
      const saved = await fetchCalendarViewMode()
      if (userChanged || !isCalendarViewMode(saved)) {
        return
      }
      viewMode.value = saved
    } catch {
      // Keep the default view when the preference cannot be loaded.
    } finally {
      preferenceReady.value = true
    }
  }

  function persistPreference(mode) {
    if (!isCalendarViewMode(mode)) {
      return
    }
    userChanged = true
    void saveCalendarViewMode(mode).catch(() => {
      // Silent: the visible view already changed.
    })
  }

  return {
    preferenceReady,
    persistPreference,
    loadPreference,
  }
}
