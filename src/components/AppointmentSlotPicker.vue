<template>
  <div class="appointment-slot-picker">
    <p class="text-body2 text-grey-7 q-mb-sm">
      {{ t('appointmentTimesTimezoneHint', { tz: timeZoneLabel }) }}
    </p>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <div class="appointment-slot-picker__calendar">
          <div class="row items-center justify-between q-mb-sm">
            <q-btn
              flat
              round
              dense
              icon="chevron_left"
              :disable="readonly || !canGoPrevMonth"
              @click="prevMonth"
            />
            <span class="text-subtitle2">{{ monthLabel }}</span>
            <q-btn
              flat
              round
              dense
              icon="chevron_right"
              :disable="readonly || !canGoNextMonth"
              @click="nextMonth"
            />
          </div>
          <div class="appointment-slot-picker__weekdays row">
            <span
              v-for="day in weekdayLabels"
              :key="day"
              class="col appointment-slot-picker__weekday">
              {{ day }}
            </span>
          </div>
          <div class="appointment-slot-picker__grid">
            <button
              v-for="cell in calendarCells"
              :key="cell.key"
              type="button"
              class="appointment-slot-picker__day"
              :class="{
                'appointment-slot-picker__day--empty': cell.empty,
                'appointment-slot-picker__day--available': cell.available,
                'appointment-slot-picker__day--selected':
                  cell.dayKey === selectedDayKey,
              }"
              :disabled="cell.empty || !cell.available || readonly"
              @click="emit('select-day', cell.dayKey)">
              <span>{{ cell.label }}</span>
              <span
                v-if="cell.available && !cell.empty"
                class="appointment-slot-picker__dot"
              />
            </button>
          </div>
          <div class="appointment-slot-picker__legend row q-gutter-md q-mt-sm">
            <span class="row items-center">
              <span class="appointment-slot-picker__dot q-mr-xs" />
              {{ t('appointmentLegendAvailable') }}
            </span>
            <span class="row items-center">
              <span
                class="appointment-slot-picker__day
                  appointment-slot-picker__day--selected
                  appointment-slot-picker__legend-selected q-mr-xs" />
              {{ t('appointmentLegendSelected') }}
            </span>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-6">
        <div
          v-if="slotsLoading"
          class="flex flex-center q-pa-lg">
          <q-spinner color="primary" size="28px" />
        </div>
        <div v-else-if="!selectedDaySlots.length" class="q-pa-md">
          <p class="text-body2 text-grey-7 q-mb-none">
            {{ emptyLabel }}
          </p>
        </div>
        <div v-else class="appointment-slot-picker__times q-gutter-y-sm">
          <q-btn
            v-for="slot in selectedDaySlots"
            :key="slot.slotId"
            no-caps
            unelevated
            class="appointment-slot-picker__time-btn full-width"
            :class="{
              'appointment-slot-picker__time-btn--selected':
                slot.slotId === selectedSlotId,
            }"
            :disable="readonly"
            @click="emit('select-slot', slot.slotId)">
            {{ formatSlotLabel(slot) }}
          </q-btn>
          <q-btn
            flat
            no-caps
            color="primary"
            class="q-mt-sm"
            icon="sync"
            :label="t('appointmentRefreshTimes')"
            :disable="readonly"
            @click="emit('refresh')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  formatUtcTimeRange,
  formatTimeZoneLabel,
} from 'src/utils/appointment-datetime.js'

const props = defineProps({
  monthLabel: { type: String, default: '' },
  visibleMonthKey: { type: String, default: '' },
  calendarDays: { type: Array, default: () => [] },
  selectedDayKey: { type: String, default: '' },
  selectedDaySlots: { type: Array, default: () => [] },
  selectedSlotId: { type: [Number, null], default: null },
  slotsLoading: { type: Boolean, default: false },
  dayHasAvailability: { type: Function, required: true },
  timeZone: { type: String, default: '' },
  emptyLabel: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  canGoPrevMonth: { type: Boolean, default: true },
  canGoNextMonth: { type: Boolean, default: true },
})

const emit = defineEmits([
  'select-day',
  'select-slot',
  'refresh',
  'prev-month',
  'next-month',
])

const { t } = useI18n()

const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const timeZoneLabel = computed(() =>
  formatTimeZoneLabel(props.timeZone),
)

const calendarCells = computed(() => {
  const days = props.calendarDays ?? []
  if (!days.length) {
    return []
  }
  const first = days[0]
  const firstDate = new Date(first.replace(/-/g, '/'))
  const offset = firstDate.getDay()
  const cells = []
  for (let i = 0; i < offset; i += 1) {
    cells.push({ key: `empty-${i}`, empty: true, label: '' })
  }
  days.forEach(dayKey => {
    const dayNum = Number(dayKey.split('-')[2])
    cells.push({
      key: dayKey,
      empty: false,
      dayKey,
      label: dayNum,
      available: !props.readonly && props.dayHasAvailability(dayKey),
    })
  })

  return cells
})

function formatSlotLabel(slot) {
  return formatUtcTimeRange(slot.startAtUtc, slot.endAtUtc, props.timeZone)
}

function prevMonth() {
  emit('prev-month')
}

function nextMonth() {
  emit('next-month')
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.appointment-slot-picker {
  &__weekdays {
    margin-bottom: 4px;
  }

  &__weekday {
    text-align: center;
    font-size: 0.75rem;
    color: $grey-7;
    font-weight: 600;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  &__day {
    position: relative;
    border: none;
    background: transparent;
    border-radius: 999px;
    min-height: 36px;
    font-size: 0.875rem;
    color: $grey-6;
    cursor: default;

    &--empty {
      visibility: hidden;
    }

    &--available {
      color: $text-strong;
      cursor: pointer;
    }

    &--selected {
      background: $primary;
      color: #fff;
    }

    &:disabled:not(&--empty) {
      opacity: 0.45;
    }
  }

  &__dot {
    display: block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: $primary;
    margin: 2px auto 0;
  }

  &__day--selected &__dot {
    background: #fff;
  }

  &__legend-selected {
    width: 16px;
    height: 16px;
    min-height: 16px;
    display: inline-block;
  }

  &__time-btn {
    border: 1px solid $border-subtle;
    background: #fff;
    color: $text-strong;

    &--selected {
      background: $primary;
      color: #fff;
      border-color: $primary;
    }
  }
}
</style>
