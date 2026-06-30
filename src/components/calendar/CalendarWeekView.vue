<template>
  <div class="calendar-week-view">
    <div class="calendar-week-view__header row">
      <div class="calendar-week-view__gutter" />
      <div
        v-for="dayKey in weekDayKeys"
        :key="dayKey"
        class="col calendar-week-view__day-header"
        :class="{
          'calendar-week-view__day-header--today': dayKey === todayKey,
        }">
        <button
          type="button"
          class="calendar-week-view__day-button"
          @click="emit('select-day', dayKey)">
          <span class="calendar-week-view__weekday">
            {{ weekdayLabel(dayKey) }}
          </span>
          <span
            class="calendar-week-view__day-number"
            :class="{
              'calendar-week-view__day-number--today': dayKey === todayKey,
            }">
            {{ dayNumber(dayKey) }}
          </span>
        </button>
      </div>
    </div>

    <div
      ref="bodyRef"
      class="calendar-week-view__body row no-wrap">
      <div class="calendar-week-view__gutter calendar-week-view__hours">
        <div
          v-for="hour in hourLabels"
          :key="hour.hour"
          class="calendar-week-view__hour-label">
          {{ hour.label }}
        </div>
      </div>

      <div
        v-for="dayKey in weekDayKeys"
        :key="`col-${dayKey}`"
        class="col calendar-week-view__day-column">
        <div
          class="calendar-week-view__day-grid"
          :class="{
            'calendar-week-view__day-grid--bookable': canBookAppointment,
          }"
          @click="onGridClick($event, dayKey)">
          <div
            v-for="hour in hourLabels"
            :key="`${dayKey}-${hour.hour}`"
            class="calendar-week-view__hour-line"
          />
          <CalendarNowLine
            v-if="dayKey === todayKey"
            :line-style="nowLineStyle"
          />
          <CalendarEventBlock
            v-for="event in eventsForDay(dayKey)"
            :key="event.id"
            :event="event"
            :time-zone="timeZone"
            :overlap-layout="overlapLayoutFor(dayKey, event.id)"
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
  weekDayKeys: { type: Array, default: () => [] },
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

useCalendarScrollToNow(bodyRef, nowScrollTopPx, {
  scrollToNowKey: toRef(props, 'scrollToNowKey'),
})

const layoutsByDay = computed(() => {
  const map = {}

  for (const dayKey of props.weekDayKeys) {
    map[dayKey] = layoutOverlappingDayEvents(
      props.eventsByDay?.[dayKey] ?? [],
      props.timeZone,
    )
  }

  return map
})

function eventsForDay(dayKey) {
  return props.eventsByDay?.[dayKey] ?? []
}

function overlapLayoutFor(dayKey, eventId) {
  return layoutsByDay.value[dayKey]?.get(eventId) ?? null
}

function dayNumber(dayKey) {
  return Number(String(dayKey).split('-')[2] || 0)
}

function weekdayLabel(dayKey) {
  const date = new Date(
    Number(dayKey.slice(0, 4)),
    Number(dayKey.slice(5, 7)) - 1,
    Number(dayKey.slice(8, 10)),
  )

  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

function onGridClick(event, dayKey) {
  if (!props.canBookAppointment) {
    return
  }

  const offsetY = gridOffsetYFromClick(event)
  if (offsetY == null) {
    return
  }

  const minutesLocal = localMinutesFromGridOffsetY(offsetY)
  if (!isValidGridBookingTarget(dayKey, minutesLocal, props.timeZone)) {
    return
  }

  emit('book-time', { dayKey, minutesLocal })
}
</script>
