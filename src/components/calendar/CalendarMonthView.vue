<template>
  <div class="calendar-month-view">
    <div class="calendar-month-view__weekdays row">
      <div
        v-for="day in weekdayLabels"
        :key="day"
        class="col calendar-month-view__weekday">
        {{ day }}
      </div>
    </div>

    <div class="calendar-month-view__grid">
      <div
        v-for="cell in cells"
        :key="cell.key"
        class="calendar-month-view__cell"
        :class="{
          'calendar-month-view__cell--outside': !cell.inMonth,
          'calendar-month-view__cell--today': cell.dayKey === todayKey,
          'calendar-month-view__cell--selected': cell.dayKey === focusDayKey,
        }"
        @click="emit('select-day', cell.dayKey)">
        <div class="calendar-month-view__cell-header">
          <button
            type="button"
            class="calendar-month-view__day-number"
            :class="{
              'calendar-month-view__day-number--today':
                cell.dayKey === todayKey,
            }">
            {{ cell.label }}
          </button>
        </div>
        <div class="calendar-month-view__events">
          <button
            v-for="event in eventsForDay(cell.dayKey).slice(0, 3)"
            :key="event.id"
            type="button"
            class="calendar-month-view__event"
            :class="event.statusClass"
            :style="event.colorStyle"
            @click.stop="emit('select-event', event)">
            <span class="calendar-month-view__event-time">
              {{ event.startTimeLabel }}
            </span>
            <span class="calendar-month-view__event-title">
              {{ event.typeLabel }}
            </span>
          </button>
          <button
            v-if="eventsForDay(cell.dayKey).length > 3"
            type="button"
            class="calendar-month-view__more"
            @click.stop="emit('select-day', cell.dayKey)">
            {{ t('calendarMoreEvents', {
              count: eventsForDay(cell.dayKey).length - 3,
            }) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  buildMonthGridCells,
  calendarWeekdayLabels,
} from 'src/utils/calendar-grid.js'
import {
  monthKeyFromDayKey,
  todayLocalDayKey,
} from 'src/utils/appointment-datetime.js'

const props = defineProps({
  focusDayKey: { type: String, default: '' },
  timeZone: { type: String, default: '' },
  eventsByDay: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['select-day', 'select-event'])

const { t } = useI18n()
const weekdayLabels = calendarWeekdayLabels
const todayKey = computed(() => todayLocalDayKey(props.timeZone))
const cells = computed(() =>
  buildMonthGridCells(monthKeyFromDayKey(props.focusDayKey)),
)

function eventsForDay(dayKey) {
  return props.eventsByDay?.[dayKey] ?? []
}
</script>
