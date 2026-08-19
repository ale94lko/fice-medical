import { computed, ref } from 'vue'

const calendarPagePending = ref(false)

export function beginCalendarPageLoading() {
  calendarPagePending.value = true
}

export function endCalendarPageLoading() {
  calendarPagePending.value = false
}

export function useCalendarPageLoading() {
  return {
    calendarPagePending: computed(() => calendarPagePending.value),
  }
}
