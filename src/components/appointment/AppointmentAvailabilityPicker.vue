<template>
  <div class="appointment-availability-picker">
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-5">
        <div class="appointment-availability-picker__calendar">
          <div class="row items-center justify-between q-mb-sm">
            <q-btn
              flat
              round
              dense
              icon="chevron_left"
              :disable="readonly"
              @click="emit('prev-month')"
            />
            <span class="text-subtitle2">{{ monthLabel }}</span>
            <q-btn
              flat
              round
              dense
              icon="chevron_right"
              :disable="readonly"
              @click="emit('next-month')"
            />
          </div>
          <div class="appointment-availability-picker__weekdays row">
            <span
              v-for="day in weekdayLabels"
              :key="day"
              class="col appointment-availability-picker__weekday">
              {{ day }}
            </span>
          </div>
          <div class="appointment-availability-picker__grid">
            <button
              v-for="cell in calendarCells"
              :key="cell.key"
              type="button"
              class="appointment-availability-picker__day"
              :class="{
                'appointment-availability-picker__day--empty': cell.empty,
                'appointment-availability-picker__day--available':
                  cell.available,
                'appointment-availability-picker__day--selected':
                  cell.dayKey === selectedDayKey,
              }"
              :disabled="cell.empty || !cell.available || readonly"
              @click="emit('select-day', cell.dayKey)">
              <span>{{ cell.label }}</span>
              <span
                v-if="cell.available && !cell.empty"
                class="appointment-availability-picker__dot"
              />
            </button>
          </div>
        </div>

        <div
          v-if="showSchedulingFields"
          class="appointment-availability-picker__schedule-fields q-mt-md">
          <AddClientLabeledField
            :label="t('appointmentSchedulingStartTime')"
            class="q-mb-sm">
            <AppointmentTimeSpinnerField
              :model-value="schedulingFields.startTime"
              :readonly="readonly"
              @change="onStartTimeSpinnerChange"
            />
          </AddClientLabeledField>
          <AddClientLabeledField :label="t('appointmentSchedulingEndTime')">
            <AppointmentTimeSpinnerField
              :model-value="schedulingFields.endTime"
              :readonly="readonly"
              @change="onEndTimeSpinnerChange"
            />
          </AddClientLabeledField>
          <p
            v-if="schedulingErrorLabel"
            class="form-field__error q-mt-sm q-mb-none">
            {{ schedulingErrorLabel }}
          </p>
        </div>
      </div>

      <div class="col-12 col-md-7">
        <div
          v-if="loading"
          class="flex flex-center q-pa-lg">
          <q-spinner color="primary" size="28px" />
        </div>
        <div
          v-else-if="!selectedDayKey || !selectedDayWindows.length"
          class="q-pa-md">
          <p class="text-body2 text-grey-7 q-mb-none">
            {{ emptyLabel }}
          </p>
        </div>
        <template v-else-if="isRangesMode">
          <AppointmentAvailabilityDayGrid
            :day-key="selectedDayKey"
            :ranges="selectedDayWindows"
            :blocks="selectedDayBlocks"
            :selected-window="selectedWindow"
            :duration-minutes="durationMinutes"
            :time-zone="timeZone"
            :readonly="readonly"
            @select-time="emit('select-grid-time', $event)"
          />
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
        </template>
        <div
          v-else
          class="appointment-availability-picker__times q-gutter-y-sm">
          <q-btn
            v-for="window in selectedDayWindows"
            :key="windowKey(window)"
            no-caps
            unelevated
            class="appointment-availability-picker__time-btn full-width"
            :class="{
              'appointment-availability-picker__time-btn--selected':
                windowKey(window) === selectedWindowKey,
            }"
            :disable="readonly"
            @click="emit('select-window', window)">
            {{ formatWindowLabel(window) }}
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
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AppointmentTimeSpinnerField from
  'components/appointment/AppointmentTimeSpinnerField.vue'
import AppointmentAvailabilityDayGrid from
  'components/appointment/AppointmentAvailabilityDayGrid.vue'
import {
  appointmentAvailabilityPickerModes,
} from 'components/constants.js'
import {
  formatUtcTimeRange,
} from 'src/utils/appointment-datetime.js'

const props = defineProps({
  monthLabel: { type: String, default: '' },
  calendarDays: { type: Array, default: () => [] },
  selectedDayKey: { type: String, default: '' },
  selectedDayWindows: { type: Array, default: () => [] },
  selectedDayBlocks: { type: Array, default: () => [] },
  selectedWindow: { type: Object, default: null },
  selectedWindowKey: { type: String, default: '' },
  pickerMode: {
    type: String,
    default: appointmentAvailabilityPickerModes.ranges,
  },
  loading: { type: Boolean, default: false },
  dayHasAvailability: { type: Function, required: true },
  timeZone: { type: String, default: '' },
  durationMinutes: { type: Number, default: null },
  schedulingFields: {
    type: Object,
    default: () => ({
      startTime: '',
      endTime: '',
    }),
  },
  schedulingFieldError: { type: String, default: '' },
  emptyLabel: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
})

const emit = defineEmits([
  'select-day',
  'select-window',
  'select-grid-time',
  'refresh',
  'prev-month',
  'next-month',
  'update-scheduling-start-time',
  'update-scheduling-end-time',
  'commit-scheduling-start-time',
  'commit-scheduling-end-time',
])

const { t } = useI18n()
const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const isRangesMode = computed(() =>
  props.pickerMode === appointmentAvailabilityPickerModes.ranges,
)

const showSchedulingFields = computed(() =>
  isRangesMode.value
  && Boolean(props.selectedDayKey)
  && !props.loading,
)

const schedulingErrorLabel = computed(() => {
  if (!props.schedulingFieldError) {
    return ''
  }

  return t('appointmentBookingConflict')
})

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

function windowKey(window) {
  return `${window.startAtUtc}|${window.clinicianId ?? ''}`
}

function formatWindowLabel(window) {
  const range = formatUtcTimeRange(
    window.startAtUtc,
    window.endAtUtc,
    props.timeZone,
  )
  const mins = window.durationMin ?? props.durationMinutes
  if (!mins) {
    return range
  }

  return `${range} (${t('appointmentDurationMinutes', { count: mins })})`
}

function onStartTimeSpinnerChange(value) {
  emit('update-scheduling-start-time', value)
  emit('commit-scheduling-start-time')
}

function onEndTimeSpinnerChange(value) {
  emit('update-scheduling-end-time', value)
  emit('commit-scheduling-end-time')
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.appointment-availability-picker {
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

    &--available {
      color: $text-strong;
      cursor: pointer;
    }

    &--selected {
      background: $primary;
      color: #fff;
    }

    &--empty {
      visibility: hidden;
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

  &__schedule-fields {
    border-top: 1px solid $border-subtle;
    padding-top: 12px;
  }
}
</style>
