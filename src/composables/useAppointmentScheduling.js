/* eslint-disable camelcase -- API query params use snake_case */
import { computed, ref } from 'vue'
import { appointmentSlotLookaheadDays } from 'components/constants.js'
import { listAvailableSlotsInRange } from 'src/utils/appointment-api.js'
import {
  addMonthsToMonthKey,
  appointmentSlotQueryRange,
  calendarDaysForMonth,
  firstAvailableDayKey,
  formatMonthYear,
  groupSlotsByLocalDay,
  isDayKeyInRange,
  localDayKeyFromUtc,
  monthKeyFromDayKey,
  resolveTenantTimeZone,
  todayLocalDayKey,
} from 'src/utils/appointment-datetime.js'

export function useAppointmentScheduling(getFilters) {
  const timeZone = resolveTenantTimeZone()
  const slots = ref([])
  const slotsLoading = ref(false)
  const selectedDayKey = ref('')
  const selectedSlotId = ref(null)
  const visibleMonthKey = ref(
    monthKeyFromDayKey(todayLocalDayKey(timeZone)),
  )

  const queryRange = computed(() =>
    appointmentSlotQueryRange(appointmentSlotLookaheadDays, timeZone),
  )

  const slotsByDay = computed(() =>
    groupSlotsByLocalDay(slots.value, timeZone),
  )

  const availableDayKeys = computed(() =>
    [...slotsByDay.value.keys()].sort(),
  )

  const calendarDays = computed(() =>
    calendarDaysForMonth(visibleMonthKey.value),
  )

  const selectedDaySlots = computed(() =>
    slotsByDay.value.get(selectedDayKey.value) ?? [],
  )

  const selectedSlot = computed(() =>
    selectedDaySlots.value.find(
      row => row.slotId === selectedSlotId.value,
    ) ?? null,
  )

  const monthLabel = computed(() =>
    formatMonthYear(visibleMonthKey.value, timeZone),
  )

  const canGoPrevMonth = computed(() => {
    const prevKey = addMonthsToMonthKey(visibleMonthKey.value, -1)
    const prevDays = calendarDaysForMonth(prevKey)
    const { startDayKey, endDayKey } = queryRange.value

    return prevDays.some(day =>
      isDayKeyInRange(day, startDayKey, endDayKey),
    )
  })

  const canGoNextMonth = computed(() => {
    const nextKey = addMonthsToMonthKey(visibleMonthKey.value, 1)
    const nextDays = calendarDaysForMonth(nextKey)
    const { startDayKey, endDayKey } = queryRange.value

    return nextDays.some(day =>
      isDayKeyInRange(day, startDayKey, endDayKey),
    )
  })

  function clearSelectedSlot() {
    selectedSlotId.value = null
  }

  async function loadSlotsWindow() {
    const filters = getFilters?.() ?? {}
    if (!filters.appointmentTypeId) {
      slots.value = []
      selectedDayKey.value = ''
      clearSelectedSlot()

      return
    }
    const { fromUtc, toUtc, startDayKey, endDayKey } = queryRange.value
    slotsLoading.value = true
    try {
      const loaded = await listAvailableSlotsInRange({
        from_utc: fromUtc,
        to_utc: toUtc,
        appointment_type_id: filters.appointmentTypeId,
        clinician_id: filters.clinicianId ?? undefined,
        telemedicine: filters.telemedicine ?? undefined,
      })
      slots.value = loaded.filter(slot =>
        isDayKeyInRange(
          localDayKeyFromUtc(slot.startAtUtc, timeZone),
          startDayKey,
          endDayKey,
        ),
      )
      const firstDay = firstAvailableDayKey(slots.value, timeZone)
      if (firstDay) {
        selectedDayKey.value = firstDay
        visibleMonthKey.value = monthKeyFromDayKey(firstDay)
      } else {
        selectedDayKey.value = ''
        visibleMonthKey.value = monthKeyFromDayKey(startDayKey)
      }
      clearSelectedSlot()
    } finally {
      slotsLoading.value = false
    }
  }

  async function refreshSlots() {
    await loadSlotsWindow()
  }

  function setVisibleMonth(monthKey) {
    visibleMonthKey.value = monthKey
  }

  function shiftVisibleMonth(delta) {
    const nextKey = addMonthsToMonthKey(visibleMonthKey.value, delta)
    if (delta < 0 && !canGoPrevMonth.value) {
      return
    }
    if (delta > 0 && !canGoNextMonth.value) {
      return
    }
    visibleMonthKey.value = nextKey
    const stillVisible = calendarDaysForMonth(nextKey).includes(
      selectedDayKey.value,
    )
    if (!stillVisible) {
      clearSelectedSlot()
    }
  }

  function selectDay(dayKey) {
    if (!dayHasAvailability(dayKey)) {
      return
    }
    selectedDayKey.value = dayKey
    clearSelectedSlot()
  }

  function selectSlot(slotId) {
    selectedSlotId.value = slotId
  }

  function dayHasAvailability(dayKey) {
    const { startDayKey, endDayKey } = queryRange.value
    if (!isDayKeyInRange(dayKey, startDayKey, endDayKey)) {
      return false
    }

    return slotsByDay.value.has(dayKey)
  }

  return {
    timeZone,
    slots,
    slotsLoading,
    selectedDayKey,
    selectedSlotId,
    visibleMonthKey,
    queryRange,
    slotsByDay,
    availableDayKeys,
    calendarDays,
    selectedDaySlots,
    selectedSlot,
    monthLabel,
    canGoPrevMonth,
    canGoNextMonth,
    loadSlotsWindow,
    setVisibleMonth,
    shiftVisibleMonth,
    refreshSlots,
    selectDay,
    selectSlot,
    dayHasAvailability,
    clearSelectedSlot,
  }
}
