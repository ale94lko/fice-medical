<template>
  <div class="calendar-mini-month">
    <div class="row items-center justify-between q-mb-sm">
      <q-btn
        flat
        round
        dense
        icon="chevron_left"
        :data-testid="calendarTestIds.miniMonthPrev"
        @click="emit('prev-month')"
      />
      <span class="text-subtitle2">{{ monthLabel }}</span>
      <q-btn
        flat
        round
        dense
        icon="chevron_right"
        :data-testid="calendarTestIds.miniMonthNext"
        @click="emit('next-month')"
      />
    </div>

    <div class="calendar-mini-month__weekdays row">
      <span
        v-for="day in weekdayLabels"
        :key="day"
        class="col calendar-mini-month__weekday">
        {{ day }}
      </span>
    </div>

    <div class="calendar-mini-month__grid">
      <button
        v-for="cell in cells"
        :key="cell.key"
        type="button"
        class="calendar-mini-month__day"
        :class="{
          'calendar-mini-month__day--outside': !cell.inMonth,
          'calendar-mini-month__day--today': cell.dayKey === todayKey,
          'calendar-mini-month__day--selected': cell.dayKey === selectedDayKey,
          'calendar-mini-month__day--has-events':
            hasEvents(cell.dayKey),
        }"
        @click="emit('select-day', cell.dayKey)">
        {{ cell.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  buildMonthGridCells,
  calendarWeekdayLabels,
} from 'src/utils/calendar-grid.js'
import {
  formatMonthYear,
  todayLocalDayKey,
} from 'src/utils/appointment-datetime.js'
import { calendarTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  monthKey: { type: String, default: '' },
  selectedDayKey: { type: String, default: '' },
  timeZone: { type: String, default: '' },
  eventDayKeys: { type: Array, default: () => [] },
})

const emit = defineEmits(['select-day', 'prev-month', 'next-month'])

const weekdayLabels = calendarWeekdayLabels
const todayKey = computed(() => todayLocalDayKey(props.timeZone))
const monthLabel = computed(() =>
  formatMonthYear(props.monthKey, props.timeZone),
)
const cells = computed(() => buildMonthGridCells(props.monthKey))
const eventDaySet = computed(() => new Set(props.eventDayKeys ?? []))

function hasEvents(dayKey) {
  return eventDaySet.value.has(dayKey)
}
</script>
