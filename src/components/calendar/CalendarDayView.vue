<template>
  <div class="calendar-day-view">
    <div class="calendar-day-view__header">
      <button
        type="button"
        class="calendar-day-view__day-button"
        @click="emit('select-day', focusDayKey)">
        <span class="calendar-day-view__weekday">{{ weekdayLabel }}</span>
        <span
          class="calendar-day-view__day-number"
          :class="{
            'calendar-day-view__day-number--today': focusDayKey === todayKey,
          }">
          {{ dayNumber }}
        </span>
      </button>
    </div>

    <div
      ref="bodyRef"
      class="calendar-day-view__body row no-wrap">
      <div class="calendar-day-view__hours">
        <div
          v-for="hour in hourLabels"
          :key="hour.hour"
          class="calendar-day-view__hour-label">
          {{ hour.label }}
        </div>
      </div>

      <div class="col calendar-day-view__grid-wrap">
        <div
          class="calendar-day-view__grid"
          :class="{
            'calendar-day-view__grid--bookable': canBookAppointment,
          }"
          @click="onGridClick">
          <div
            v-for="hour in hourLabels"
            :key="hour.hour"
            class="calendar-day-view__hour-line"
          />
          <CalendarNowLine
            :line-style="nowLineStyle"
            :visible="focusDayKey === todayKey"
          />
          <CalendarEventBlock
            v-for="event in dayEvents"
            :key="event.id"
            :event="event"
            :time-zone="timeZone"
            :overlap-layout="overlapLayouts.get(event.id)"
            @select="emit('select-event', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, toRef } from 'vue'
import CalendarEventBlock from 'components/calendar/CalendarEventBlock.vue'
import CalendarNowLine from 'components/calendar/CalendarNowLine.vue'
import {
  calendarHourEnd,
  calendarHourStart,
} from 'src/constants/calendar.js'
import { buildHourLabels } from 'src/utils/calendar-grid.js'
import { todayLocalDayKey } from 'src/utils/appointment-datetime.js'
import { layoutOverlappingDayEvents } from
  'src/utils/calendar-event-layout.js'
import {
  useCalendarNowIndicator,
  useCalendarScrollToNow,
} from 'src/utils/calendar-now-indicator.js'

import {
  gridOffsetYFromClick,
  isValidGridBookingTarget,
  localMinutesFromGridOffsetY,
} from 'src/utils/calendar-grid-click.js'

const props = defineProps({
  focusDayKey: { type: String, default: '' },
  timeZone: { type: String, default: '' },
  eventsByDay: { type: Object, default: () => ({}) },
  scrollToNowKey: { type: Number, default: 0 },
  canBookAppointment: { type: Boolean, default: false },
})

const emit = defineEmits(['select-day', 'select-event', 'book-time'])

const bodyRef = ref(null)
const hourLabels = buildHourLabels(calendarHourStart, calendarHourEnd)
const todayKey = computed(() => todayLocalDayKey(props.timeZone))
const { nowLineStyle, nowScrollTopPx } = useCalendarNowIndicator(
  () => props.timeZone,
)

useCalendarScrollToNow(
  bodyRef,
  nowScrollTopPx,
  {
    enabled: () => props.focusDayKey === todayKey.value,
    scrollToNowKey: toRef(props, 'scrollToNowKey'),
  },
)
const dayEvents = computed(() =>
  props.eventsByDay?.[props.focusDayKey] ?? [],
)
const overlapLayouts = computed(() =>
  layoutOverlappingDayEvents(dayEvents.value, props.timeZone),
)
const dayNumber = computed(() =>
  Number(String(props.focusDayKey).split('-')[2] || 0),
)
const weekdayLabel = computed(() => {
  const dayKey = props.focusDayKey
  const date = new Date(
    Number(dayKey.slice(0, 4)),
    Number(dayKey.slice(5, 7)) - 1,
    Number(dayKey.slice(8, 10)),
  )

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
})

function onGridClick(event) {
  if (!props.canBookAppointment) {
    return
  }

  const offsetY = gridOffsetYFromClick(event)
  if (offsetY == null) {
    return
  }

  const minutesLocal = localMinutesFromGridOffsetY(offsetY)
  if (!isValidGridBookingTarget(
    props.focusDayKey,
    minutesLocal,
    props.timeZone,
  )) {
    return
  }

  emit('book-time', {
    dayKey: props.focusDayKey,
    minutesLocal,
  })
}
</script>
