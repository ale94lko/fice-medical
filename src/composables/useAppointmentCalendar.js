import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { calendarSourceIds, calendarViewModes } from
  'src/constants/calendar.js'
import { useCalendarEventSources } from
  'src/composables/useCalendarEventSources.js'
import { listCalendarAppointments } from 'src/utils/appointment-api.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import {
  getAppDateTimeConfig,
  resolveIntlTimeZone,
} from 'src/utils/app-datetime.js'
import {
  addMonthsToMonthKey,
  formatMonthYear,
  formatUtcDateLong,
  monthKeyFromDayKey,
  todayLocalDayKey,
} from 'src/utils/appointment-datetime.js'
import {
  filterCalendarDisplayEvents,
  filterEventsInDayRange,
  groupCalendarEventsByDay,
  mapAppointmentsToCalendarEvents,
} from 'src/utils/calendar-events.js'
import {
  shiftFocusDayKey,
  visibleRangeForView,
  weekDayKeysContaining,
} from 'src/utils/calendar-grid.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { useCalendarPermissions } from
  'src/composables/useCalendarPermissions.js'

export function useAppointmentCalendar() {
  const authStore = useAuthStore()
  const { configData } = storeToRefs(authStore)
  const timeZone = computed(() =>
    resolveIntlTimeZone(
      configData.value?.timezone ?? getAppDateTimeConfig().timezone,
    ),
  )
  const { canSelectClinicianSources } = useCalendarPermissions()
  const viewMode = ref(calendarViewModes.week)
  const focusDayKey = ref(todayLocalDayKey(timeZone.value))
  const sidebarMonthKey = ref(monthKeyFromDayKey(focusDayKey.value))
  const loading = ref(false)
  const loadError = ref('')
  const rawEvents = ref([])
  const selectedEvent = ref(null)
  const detailOpen = ref(false)
  const scrollToNowKey = ref(0)

  const sources = useCalendarEventSources()

  const visibleRange = computed(() =>
    visibleRangeForView(viewMode.value, focusDayKey.value, timeZone.value),
  )

  const displayEvents = computed(() => {
    const inRange = filterEventsInDayRange(
      rawEvents.value,
      visibleRange.value.startDayKey,
      visibleRange.value.endDayKey,
    )

    return filterCalendarDisplayEvents(inRange, {
      enabledSourceIds: sources.enabledSourceIds.value,
      enabledClinicianIds: sources.enabledClinicianIds.value,
      mySourceId: calendarSourceIds.myAppointments,
      clinicianSourceId: calendarSourceIds.clinicianAppointments,
      restrictByClinicianSelection: canSelectClinicianSources.value,
    })
  })

  const eventsByDay = computed(() => {
    const grouped = groupCalendarEventsByDay(displayEvents.value)
    const record = {}

    grouped.forEach((list, dayKey) => {
      record[dayKey] = list
    })

    return record
  })

  const eventDayKeys = computed(() => Object.keys(eventsByDay.value))

  const weekDayKeys = computed(() =>
    weekDayKeysContaining(focusDayKey.value),
  )

  const toolbarTitle = computed(() => {
    if (viewMode.value === calendarViewModes.month) {
      return formatMonthYear(
        monthKeyFromDayKey(focusDayKey.value),
        timeZone.value,
      )
    }
    if (viewMode.value === calendarViewModes.week) {
      const keys = weekDayKeys.value
      if (!keys.length) {
        return ''
      }

      return `${formatUtcDateLong(`${keys[0]}T12:00:00.000Z`, timeZone.value)}`
        + ` – ${formatUtcDateLong(`${keys[6]}T12:00:00.000Z`, timeZone.value)}`
    }

    return formatUtcDateLong(
      `${focusDayKey.value}T12:00:00.000Z`,
      timeZone.value,
    )
  })

  async function loadEvents() {
    loading.value = true
    loadError.value = ''
    const range = visibleRange.value
    /* eslint-disable camelcase -- API query params */
    const params = {
      from_utc: range.fromUtc,
      to_utc: range.toUtc,
      limit: 500,
    }
    /* eslint-enable camelcase */
    const merged = new Map()
    const enabledClinicians = sources.enabledClinicianIds.value
    const myAppointmentsEnabled = sources.isSourceEnabled(
      calendarSourceIds.myAppointments,
    )

    try {
      if (canSelectClinicianSources.value) {
        if (enabledClinicians.length > 0) {
          const appointments = await listCalendarAppointments({
            ...params,
            /* eslint-disable-next-line camelcase */
            clinician_ids: enabledClinicians.join(','),
          })
          const sourceId = myAppointmentsEnabled
            ? calendarSourceIds.myAppointments
            : calendarSourceIds.clinicianAppointments

          mapAppointmentsToCalendarEvents(appointments, {
            sourceId,
            timeZone: timeZone.value,
          }).forEach(event => {
            merged.set(event.id, event)
          })
        }
      } else if (myAppointmentsEnabled) {
        const appointments = await listCalendarAppointments(params)
        mapAppointmentsToCalendarEvents(appointments, {
          sourceId: calendarSourceIds.myAppointments,
          timeZone: timeZone.value,
        }).forEach(event => {
          merged.set(event.id, event)
        })
      }

      rawEvents.value = [...merged.values()]
    } catch (error) {
      if (!isAuthSessionEndUIError(error)) {
        loadError.value = 'calendarLoadError'
      }
      rawEvents.value = []
    } finally {
      loading.value = false
    }
  }

  function goToToday() {
    focusDayKey.value = todayLocalDayKey(timeZone.value)
    sidebarMonthKey.value = monthKeyFromDayKey(focusDayKey.value)
    scrollToNowKey.value += 1
  }

  function shiftVisibleRange(direction) {
    focusDayKey.value = shiftFocusDayKey(
      viewMode.value,
      focusDayKey.value,
      direction,
    )
    sidebarMonthKey.value = monthKeyFromDayKey(focusDayKey.value)
  }

  function setViewMode(mode) {
    viewMode.value = mode
  }

  function setFocusDay(dayKey) {
    if (!dayKey) {
      return
    }
    focusDayKey.value = dayKey
    sidebarMonthKey.value = monthKeyFromDayKey(dayKey)
  }

  function shiftSidebarMonth(delta) {
    sidebarMonthKey.value = addMonthsToMonthKey(
      sidebarMonthKey.value,
      delta,
    )
  }

  function openEventDetail(event) {
    selectedEvent.value = event
    detailOpen.value = true
  }

  function closeEventDetail() {
    detailOpen.value = false
    selectedEvent.value = null
  }

  watch(
    [
      viewMode,
      focusDayKey,
      sources.enabledSourceIds,
      sources.enabledClinicianIds,
    ],
    () => {
      void loadEvents()
    },
    { deep: true, immediate: true },
  )

  return {
    timeZone,
    viewMode,
    focusDayKey,
    sidebarMonthKey,
    loading,
    loadError,
    displayEvents,
    eventsByDay,
    eventDayKeys,
    weekDayKeys,
    toolbarTitle,
    visibleRange,
    sources,
    selectedEvent,
    detailOpen,
    scrollToNowKey,
    goToToday,
    shiftVisibleRange,
    setViewMode,
    setFocusDay,
    shiftSidebarMonth,
    openEventDetail,
    closeEventDetail,
    reloadEvents: loadEvents,
  }
}
