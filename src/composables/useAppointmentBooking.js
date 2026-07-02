import { computed, ref } from 'vue'
import {
  appointmentAvailabilityPickerDefaultMode,
  appointmentAvailabilityPickerModes,
  appointmentAvailabilityRangesLimit,
  appointmentSlotLookaheadDays,
} from 'components/constants.js'
import {
  buildServiceLine,
  sumServiceLineDurations,
} from 'src/utils/appointment-booking.js'
import {
  appointmentSlotQueryRange,
  calendarDaysForMonth,
  formatMonthYear,
  isDayKeyInRange,
  localDayKeyFromUtc,
  monthKeyFromDayKey,
  resolveTenantTimeZone,
  todayLocalDayKey,
} from 'src/utils/appointment-datetime.js'
import {
  blocksForLocalDay,
  findFirstAvailableStartMinute,
  resolveBookingAtMinute,
  findScheduleBlockOverlapTypesAtMinute,
} from 'src/utils/appointment-availability-ranges.js'
import {
  appointmentBookingGridSlotMinutes,
  calendarHourStart,
} from 'src/constants/calendar.js'
import {
  isValidGridBookingTarget,
  localMinutesFromGridOffsetY,
} from 'src/utils/calendar-grid-click.js'
import {
  fetchAppointmentDurationPreview,
  listAppointmentAvailability,
  listAppointmentAvailabilityRanges,
} from 'src/utils/appointment-api.js'
import {
  coupleSchedulingFields,
  emptySchedulingFields,
  localMinutesFromTime12h,
  tryBuildWindowFromSchedulingFields,
  windowToSchedulingFields,
} from 'src/utils/appointment-scheduling-fields.js'
import { localMinutesFromUtc } from 'src/utils/calendar-events.js'

function availabilityKey(window) {
  return [
    window?.startAtUtc,
    window?.clinicianId,
  ].join('|')
}

export function useAppointmentBooking(getFilters, options = {}) {
  const timeZone = resolveTenantTimeZone()
  const pickerMode = ref(
    options.pickerMode ?? appointmentAvailabilityPickerDefaultMode,
  )
  const availabilityLoading = ref(false)
  const availabilityWindows = ref([])
  const availabilityBlocks = ref([])
  const selectedDayKey = ref('')
  const selectedWindowKey = ref('')
  const selectedWindowRef = ref(null)
  const visibleMonthKey = ref(
    monthKeyFromDayKey(todayLocalDayKey(timeZone)),
  )
  const durationPreview = ref(null)
  const schedulingFields = ref(emptySchedulingFields())
  const schedulingFieldError = ref('')
  const schedulingNeedsOverlapping = ref(false)
  const allowOverScheduleBlocks = ref(false)

  const isRangesPickerMode = computed(() =>
    pickerMode.value === appointmentAvailabilityPickerModes.ranges,
  )

  const queryRange = computed(() =>
    appointmentSlotQueryRange(appointmentSlotLookaheadDays, timeZone),
  )

  const windowsByDay = computed(() => {
    const map = new Map()
    for (const window of availabilityWindows.value) {
      const dayKey = localDayKeyFromUtc(window.startAtUtc, timeZone)
      if (!dayKey) {
        continue
      }
      if (!map.has(dayKey)) {
        map.set(dayKey, [])
      }
      map.get(dayKey).push(window)
    }
    for (const list of map.values()) {
      list.sort((a, b) =>
        String(a.startAtUtc).localeCompare(String(b.startAtUtc)),
      )
    }

    return map
  })

  const calendarDays = computed(() =>
    calendarDaysForMonth(visibleMonthKey.value),
  )

  const selectedDayWindows = computed(() =>
    windowsByDay.value.get(selectedDayKey.value) ?? [],
  )

  const selectedDayBlocks = computed(() =>
    blocksForLocalDay(
      availabilityBlocks.value,
      selectedDayKey.value,
      timeZone,
    ),
  )

  const selectedWindow = computed(() => selectedWindowRef.value)

  const scheduleBlockOverlapTypes = computed(() => {
    if (!allowOverScheduleBlocks.value || !selectedWindowRef.value) {
      return []
    }

    const durationMinutes = resolveDurationMinutes()
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return []
    }

    const dayKey = selectedDayKey.value
      || localDayKeyFromUtc(selectedWindowRef.value.startAtUtc, timeZone)
    const startMinutes = localMinutesFromUtc(
      selectedWindowRef.value.startAtUtc,
      timeZone,
    )

    return findScheduleBlockOverlapTypesAtMinute(
      availabilityBlocks.value,
      dayKey,
      startMinutes,
      durationMinutes,
      timeZone,
    )
  })

  const monthLabel = computed(() =>
    formatMonthYear(visibleMonthKey.value, timeZone),
  )

  function resolveDurationMinutes() {
    const filters = getFilters?.() ?? {}

    return Number(
      filters.durationMinutes ?? durationPreview.value?.default_duration_min,
    )
  }

  function clearSelectedWindow() {
    selectedWindowKey.value = ''
    selectedWindowRef.value = null
    schedulingFields.value = emptySchedulingFields()
    schedulingFieldError.value = ''
    schedulingNeedsOverlapping.value = false
  }

  function markSchedulingNeedsOverlapping(window) {
    selectedWindowRef.value = null
    selectedWindowKey.value = ''
    schedulingFieldError.value = ''
    schedulingNeedsOverlapping.value = true
    schedulingFields.value = windowToSchedulingFields(window, timeZone)
  }

  function handleUnresolvedBooking({
    dayKey,
    minutesLocal,
    durationMinutes,
    reason,
    preferredClinicianId = null,
  }) {
    if (reason === 'appointmentConflict') {
      schedulingNeedsOverlapping.value = false
      schedulingFieldError.value = 'appointmentConflict'

      return
    }

    if (allowOverScheduleBlocks.value) {
      schedulingNeedsOverlapping.value = false
      schedulingFieldError.value = ''

      return
    }

    const withOverlap = resolveBookingAtMinute({
      dayKey,
      minutesLocal,
      durationMin: durationMinutes,
      availableRanges: windowsByDay.value.get(dayKey) ?? [],
      blocks: availabilityBlocks.value,
      allowOverScheduleBlocks: true,
      timeZone,
      preferredClinicianId,
    })

    if (withOverlap.ok) {
      markSchedulingNeedsOverlapping(withOverlap.window)
      if (dayKey) {
        selectedDayKey.value = dayKey
      }

      return
    }

    schedulingNeedsOverlapping.value = false
    schedulingFieldError.value = ''
  }

  function clearAvailability() {
    availabilityWindows.value = []
    availabilityBlocks.value = []
    selectedDayKey.value = ''
    allowOverScheduleBlocks.value = false
    clearSelectedWindow()
  }

  function dayHasAvailability(dayKey) {
    const { startDayKey, endDayKey } = queryRange.value
    if (!isDayKeyInRange(dayKey, startDayKey, endDayKey)) {
      return false
    }

    if (windowsByDay.value.has(dayKey)) {
      return true
    }

    if (isRangesPickerMode.value && allowOverScheduleBlocks.value) {
      return true
    }

    return false
  }

  function revalidateSelectedWindow() {
    if (!selectedWindowRef.value) {
      return
    }

    const durationMinutes = resolveDurationMinutes()
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return
    }

    const dayKey = selectedDayKey.value
      || localDayKeyFromUtc(selectedWindowRef.value.startAtUtc, timeZone)
    const startMinutes = localMinutesFromUtc(
      selectedWindowRef.value.startAtUtc,
      timeZone,
    )
    const filters = getFilters?.() ?? {}
    const result = resolveBookingAtMinute({
      dayKey,
      minutesLocal: startMinutes,
      durationMin: durationMinutes,
      availableRanges: windowsByDay.value.get(dayKey) ?? [],
      blocks: availabilityBlocks.value,
      allowOverScheduleBlocks: allowOverScheduleBlocks.value,
      timeZone,
      preferredClinicianId: filters.clinicianId ?? null,
    })

    if (!result.ok) {
      const startMinutes = localMinutesFromUtc(
        selectedWindowRef.value.startAtUtc,
        timeZone,
      )
      handleUnresolvedBooking({
        dayKey,
        minutesLocal: startMinutes,
        durationMinutes,
        reason: result.reason,
        preferredClinicianId: filters.clinicianId ?? null,
      })

      return
    }

    schedulingNeedsOverlapping.value = false
    selectWindow(result.window)
  }

  function setAllowOverScheduleBlocks(value) {
    allowOverScheduleBlocks.value = Boolean(value)
    if (value && schedulingNeedsOverlapping.value) {
      schedulingNeedsOverlapping.value = false
      applySchedulingFields('start')

      return
    }
    revalidateSelectedWindow()
  }

  function applySchedulingFields(adjustFrom) {
    const durationMinutes = resolveDurationMinutes()
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return false
    }

    const dayKey = selectedDayKey.value
    if (!dayKey) {
      schedulingFieldError.value = 'date'

      return false
    }
    const filters = getFilters?.() ?? {}
    const result = tryBuildWindowFromSchedulingFields({
      dayKey,
      startTime: schedulingFields.value.startTime,
      endTime: schedulingFields.value.endTime,
      durationMinutes,
      adjustFrom,
      ranges: windowsByDay.value.get(dayKey) ?? [],
      blocks: availabilityBlocks.value,
      allowOverScheduleBlocks: allowOverScheduleBlocks.value,
      timeZone,
      preferredClinicianId: filters.clinicianId ?? null,
    })

    if (!result.ok) {
      const coupled = coupleSchedulingFields({
        startTime: schedulingFields.value.startTime,
        endTime: schedulingFields.value.endTime,
        durationMinutes,
        adjustFrom,
      })
      const startMinutes = localMinutesFromTime12h(coupled.startTime)
      if (startMinutes != null) {
        handleUnresolvedBooking({
          dayKey,
          minutesLocal: startMinutes,
          durationMinutes,
          reason: result.reason,
          preferredClinicianId: filters.clinicianId ?? null,
        })
      } else {
        schedulingNeedsOverlapping.value = false
        schedulingFieldError.value = ''
      }

      return false
    }

    schedulingNeedsOverlapping.value = false
    schedulingFieldError.value = ''
    if (result.dayKey && dayHasAvailability(result.dayKey)) {
      selectedDayKey.value = result.dayKey
      visibleMonthKey.value = monthKeyFromDayKey(result.dayKey)
    }
    selectedWindowRef.value = result.window
    selectedWindowKey.value = availabilityKey(result.window)
    schedulingFields.value = result.fields

    return true
  }

  function setSchedulingStartTime(startTime) {
    schedulingFields.value = {
      ...schedulingFields.value,
      ...coupleSchedulingFields({
        startTime,
        endTime: schedulingFields.value.endTime,
        durationMinutes: resolveDurationMinutes(),
        adjustFrom: 'start',
      }),
    }
  }

  function setSchedulingEndTime(endTime) {
    schedulingFields.value = {
      ...schedulingFields.value,
      ...coupleSchedulingFields({
        startTime: schedulingFields.value.startTime,
        endTime,
        durationMinutes: resolveDurationMinutes(),
        adjustFrom: 'end',
      }),
    }
  }

  function commitSchedulingStartTime() {
    const normalized = coupleSchedulingFields({
      startTime: schedulingFields.value.startTime,
      endTime: schedulingFields.value.endTime,
      durationMinutes: resolveDurationMinutes(),
      adjustFrom: 'start',
    })
    schedulingFields.value = {
      ...schedulingFields.value,
      ...normalized,
    }
    applySchedulingFields('start')
  }

  function commitSchedulingEndTime() {
    const normalized = coupleSchedulingFields({
      startTime: schedulingFields.value.startTime,
      endTime: schedulingFields.value.endTime,
      durationMinutes: resolveDurationMinutes(),
      adjustFrom: 'end',
    })
    schedulingFields.value = {
      ...schedulingFields.value,
      ...normalized,
    }
    applySchedulingFields('end')
  }

  function selectFirstAvailableForDay(dayKey) {
    const durationMinutes = resolveDurationMinutes()
    if (!dayKey || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      clearSelectedWindow()

      return false
    }

    const ranges = windowsByDay.value.get(dayKey) ?? []
    if (!ranges.length && !allowOverScheduleBlocks.value) {
      clearSelectedWindow()

      return false
    }

    if (isRangesPickerMode.value) {
      const filters = getFilters?.() ?? {}
      let minutesLocal = findFirstAvailableStartMinute(
        ranges,
        dayKey,
        durationMinutes,
        timeZone,
      )
      if (minutesLocal == null && allowOverScheduleBlocks.value) {
        minutesLocal = calendarHourStart * 60
      }
      if (minutesLocal == null) {
        clearSelectedWindow()

        return false
      }
      const result = resolveBookingAtMinute({
        dayKey,
        minutesLocal,
        durationMin: durationMinutes,
        availableRanges: ranges,
        blocks: availabilityBlocks.value,
        allowOverScheduleBlocks: allowOverScheduleBlocks.value,
        timeZone,
        preferredClinicianId: filters.clinicianId ?? null,
      })
      if (!result.ok) {
        clearSelectedWindow()

        return false
      }
      selectWindow(result.window)

      return true
    }

    selectWindow(ranges[0])

    return true
  }

  function selectDay(dayKey) {
    if (!dayHasAvailability(dayKey)) {
      return
    }
    selectedDayKey.value = dayKey
    if (!selectFirstAvailableForDay(dayKey)) {
      clearSelectedWindow()
    }
  }

  function selectWindow(window) {
    if (!window) {
      return
    }
    selectedWindowRef.value = window
    selectedWindowKey.value = availabilityKey(window)
    selectedDayKey.value = localDayKeyFromUtc(window.startAtUtc, timeZone)
    schedulingFields.value = windowToSchedulingFields(window, timeZone)
    schedulingFieldError.value = ''
    schedulingNeedsOverlapping.value = false
  }

  function selectGridTime({ dayKey, offsetY }) {
    const durationMinutes = resolveDurationMinutes()
    if (!dayKey || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return
    }

    const minutesLocal = localMinutesFromGridOffsetY(
      offsetY,
      undefined,
      undefined,
      undefined,
      appointmentBookingGridSlotMinutes,
    )
    if (!isValidGridBookingTarget(dayKey, minutesLocal, timeZone)) {
      return
    }
    const ranges = windowsByDay.value.get(dayKey) ?? []
    const filters = getFilters?.() ?? {}
    const result = resolveBookingAtMinute({
      dayKey,
      minutesLocal,
      durationMin: durationMinutes,
      availableRanges: ranges,
      blocks: availabilityBlocks.value,
      allowOverScheduleBlocks: allowOverScheduleBlocks.value,
      timeZone,
      preferredClinicianId: filters.clinicianId ?? null,
    })
    if (!result.ok) {
      handleUnresolvedBooking({
        dayKey,
        minutesLocal,
        durationMinutes,
        reason: result.reason,
        preferredClinicianId: filters.clinicianId ?? null,
      })

      return
    }

    selectWindow(result.window)
  }

  async function refreshDurationPreview() {
    const filters = getFilters?.() ?? {}
    const serviceIds = filters.serviceProcedureIds ?? []
    if (!serviceIds.length) {
      durationPreview.value = null

      return null
    }
    const preview = await fetchAppointmentDurationPreview(
      serviceIds,
      filters.durationMinutes ?? undefined,
    )
    durationPreview.value = preview

    return preview
  }

  async function loadAvailability() {
    const filters = getFilters?.() ?? {}
    const serviceIds = filters.serviceProcedureIds ?? []
    const durationMinutes = Number(
      filters.durationMinutes ?? durationPreview.value?.default_duration_min,
    )
    if (!serviceIds.length || !Number.isFinite(durationMinutes)
      || durationMinutes <= 0) {
      clearAvailability()

      return
    }

    const { fromUtc, toUtc } = queryRange.value
    const query = {
      /* eslint-disable camelcase -- API query params */
      from_utc: fromUtc,
      to_utc: toUtc,
      duration_minutes: durationMinutes,
      service_procedure_ids: serviceIds,
      clinician_id: filters.clinicianId ?? undefined,
      /* eslint-enable camelcase */
    }

    availabilityLoading.value = true
    try {
      if (isRangesPickerMode.value) {
        const { availableRanges, blocks } =
          await listAppointmentAvailabilityRanges({
            ...query,
            limit: appointmentAvailabilityRangesLimit,
          })
        availabilityWindows.value = availableRanges
        availabilityBlocks.value = blocks
      } else {
        const windows = await listAppointmentAvailability({
          ...query,
          limit: 50,
        })
        availabilityWindows.value = windows
        availabilityBlocks.value = []
      }
      const firstDay = [...windowsByDay.value.keys()].sort()[0] ?? ''
      if (firstDay) {
        selectedDayKey.value = firstDay
        visibleMonthKey.value = monthKeyFromDayKey(firstDay)
        selectFirstAvailableForDay(firstDay)
      } else {
        selectedDayKey.value = ''
        clearSelectedWindow()
      }
    } finally {
      availabilityLoading.value = false
    }
  }

  function applyBookingHint(hint) {
    const dayKey = String(hint?.dayKey ?? '').trim()
    const minutesLocal = Number(hint?.minutesLocal)
    if (!dayKey) {
      return false
    }

    const dayWindows = windowsByDay.value.get(dayKey) ?? []
    if (!dayWindows.length) {
      selectedDayKey.value = dayKey
      visibleMonthKey.value = monthKeyFromDayKey(dayKey)

      return false
    }

    let best = dayWindows[0]
    if (Number.isFinite(minutesLocal)) {
      let bestDiff = Infinity
      for (const window of dayWindows) {
        const startMinutes = localMinutesFromUtc(window.startAtUtc, timeZone)
        const diff = Math.abs(startMinutes - minutesLocal)
        if (diff < bestDiff) {
          bestDiff = diff
          best = window
        }
      }
    }

    if (isRangesPickerMode.value && Number.isFinite(minutesLocal)) {
      const durationMinutes = Number(
        getFilters?.()?.durationMinutes
        ?? durationPreview.value?.default_duration_min,
      )
      const result = resolveBookingAtMinute({
        dayKey,
        minutesLocal,
        durationMin: durationMinutes,
        availableRanges: dayWindows,
        blocks: availabilityBlocks.value,
        allowOverScheduleBlocks: allowOverScheduleBlocks.value,
        timeZone,
        preferredClinicianId: getFilters?.()?.clinicianId ?? null,
      })
      if (result.ok) {
        selectWindow(result.window)

        return true
      }
    }

    selectWindow(best)

    return true
  }

  function shiftVisibleMonth(delta) {
    const match = /^(\d{4})-(\d{2})$/.exec(visibleMonthKey.value)
    if (!match) {
      return
    }
    const date = new Date(Number(match[1]), Number(match[2]) - 1 + delta, 1)
    visibleMonthKey.value = `${date.getFullYear()}-${
      String(date.getMonth() + 1).padStart(2, '0')
    }`
  }

  return {
    timeZone,
    pickerMode,
    isRangesPickerMode,
    availabilityLoading,
    availabilityWindows,
    availabilityBlocks,
    selectedDayBlocks,
    selectedDayKey,
    selectedWindowKey,
    selectedWindow,
    visibleMonthKey,
    calendarDays,
    selectedDayWindows,
    monthLabel,
    durationPreview,
    schedulingFields,
    schedulingFieldError,
    schedulingNeedsOverlapping,
    allowOverScheduleBlocks,
    scheduleBlockOverlapTypes,
    setAllowOverScheduleBlocks,
    dayHasAvailability,
    clearAvailability,
    clearSelectedWindow,
    selectDay,
    selectWindow,
    selectGridTime,
    setSchedulingStartTime,
    setSchedulingEndTime,
    commitSchedulingStartTime,
    commitSchedulingEndTime,
    refreshDurationPreview,
    loadAvailability,
    applyBookingHint,
    shiftVisibleMonth,
  }
}

export function buildServiceLinesFromCatalog(
  catalog = [],
  selectedIds = [],
  durationByServiceId = {},
) {
  const map = new Map(catalog.map(row => [row.id, row]))

  return selectedIds
    .map(id => map.get(id))
    .filter(Boolean)
    .map(service => buildServiceLine(
      service,
      durationByServiceId[service.id],
    ))
}

export function resolveTotalDurationMinutes(lines = [], preview = null) {
  const fromLines = sumServiceLineDurations(lines)
  if (fromLines > 0) {
    return fromLines
  }

  return Number(preview?.default_duration_min) || null
}
