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
          <div class="appointment-availability-picker__scheduling-top q-mb-sm">
            <div
              v-if="durationValueLabel"
              class="appointment-availability-picker__duration">
              <div
                class="appointment-availability-picker__duration-icon"
                aria-hidden="true">
                <q-icon name="schedule" size="20px" />
              </div>
              <span class="appointment-availability-picker__duration-label">
                {{ t('appointmentDuration') }}
              </span>
              <span class="appointment-availability-picker__duration-value">
                {{ durationValueLabel }}
              </span>
            </div>
            <div class="appointment-availability-picker__time-column">
              <div class="appointment-availability-picker__time-field">
                <span
                  class="form-field__label
                    appointment-availability-picker__time-label">
                  {{ t('appointmentSchedulingStartTime') }}
                </span>
                <AppointmentTimeSpinnerField
                  :model-value="schedulingFields.startTime"
                  :minute-step="1"
                  fluid
                  :readonly="readonly"
                  @change="onStartTimeSpinnerChange"
                />
              </div>
              <div class="appointment-availability-picker__time-field">
                <span
                  class="form-field__label
                    appointment-availability-picker__time-label">
                  {{ t('appointmentSchedulingEndTime') }}
                </span>
                <AppointmentTimeSpinnerField
                  :model-value="schedulingFields.endTime"
                  :minute-step="1"
                  fluid
                  :readonly="readonly"
                  @change="onEndTimeSpinnerChange"
                />
              </div>
            </div>
          </div>
          <div
            v-if="showOverlappingSection"
            class="appointment-availability-picker__overlapping-block q-mb-sm">
            <FormToggle
              v-if="showOverlappingToggle"
              :model-value="allowOverScheduleBlocks"
              :label="t('appointmentOverlapping')"
              :disable="readonly"
              @update:model-value="
                emit('update:allow-over-schedule-blocks', $event)
              "
            />
            <p
              v-if="scheduleBlockOverlapWarning"
              class="appointment-availability-picker__overlap-warning
                text-body2 text-warning q-mb-none q-mt-none">
              {{ scheduleBlockOverlapWarning }}
            </p>
          </div>
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
          v-else-if="!selectedDayKey || !showDaySchedulePanel"
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
import FormToggle from 'components/FormToggle.vue'
import AppointmentTimeSpinnerField from
  'components/appointment/AppointmentTimeSpinnerField.vue'
import AppointmentAvailabilityDayGrid from
  'components/appointment/AppointmentAvailabilityDayGrid.vue'
import {
  appointmentAvailabilityBlockTypes,
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
  schedulingNeedsOverlapping: { type: Boolean, default: false },
  allowOverScheduleBlocks: { type: Boolean, default: false },
  scheduleBlockOverlapTypes: { type: Array, default: () => [] },
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
  'update:allow-over-schedule-blocks',
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

const showOverlappingToggle = computed(() =>
  isRangesMode.value && Boolean(props.durationMinutes),
)

const showDaySchedulePanel = computed(() => {
  if (!props.selectedDayKey) {
    return false
  }
  if (!isRangesMode.value) {
    return props.selectedDayWindows.length > 0
  }

  return props.selectedDayWindows.length > 0
    || props.selectedDayBlocks.length > 0
    || props.allowOverScheduleBlocks
})

const schedulingErrorLabel = computed(() => {
  if (props.schedulingFieldError !== 'appointmentConflict') {
    return ''
  }

  return t('appointmentBookingAppointmentConflict')
})

const scheduleBlockOverlapWarning = computed(() => {
  if (!props.allowOverScheduleBlocks && props.schedulingNeedsOverlapping) {
    return t('appointmentEnableOverlappingHint')
  }

  if (
    !props.allowOverScheduleBlocks
    || !props.scheduleBlockOverlapTypes.length
  ) {
    return ''
  }

  const types = props.scheduleBlockOverlapTypes
  const hasBreak = types.includes(appointmentAvailabilityBlockTypes.break)
  const hasOutside = types.includes(appointmentAvailabilityBlockTypes.outside)
  if (hasBreak && hasOutside) {
    return t('appointmentScheduleBlockOverlapWarningBoth')
  }
  if (hasBreak) {
    return t('appointmentScheduleBlockOverlapWarningBreak')
  }
  if (hasOutside) {
    return t('appointmentScheduleBlockOverlapWarningOutside')
  }

  return ''
})

const showOverlappingSection = computed(() =>
  showOverlappingToggle.value || Boolean(scheduleBlockOverlapWarning.value),
)

const durationValueLabel = computed(() => {
  const minutes = Number(props.durationMinutes)
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return ''
  }

  return t('appointmentDurationMinutes', { count: minutes })
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
    width: 100%;
    border-top: 1px solid $border-subtle;
    padding-top: 12px;
  }

  &__scheduling-top {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    width: 100%;
  }

  &__duration {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 0 0 auto;
    min-width: 4.5rem;
    text-align: center;
    padding-top: 2px;
  }

  &__duration-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba($primary, 0.12);
    color: $primary;
    margin-bottom: 4px;
  }

  &__duration-label {
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.3;
    color: $text-muted;
  }

  &__duration-value {
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.2;
    color: $primary;
    margin-top: 2px;
  }

  &__time-column {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1 1 0;
    width: 100%;
    min-width: 0;
    padding-top: 2px;
  }

  &__time-field {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }

  &__time-label {
    margin-bottom: 0;
    flex: 0 0 3.25rem;
    line-height: 1.2;
  }

  &__overlapping-block {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
    border: 1px solid $border-subtle;
    border-radius: 8px;
    background: #fff;
    padding: 8px 12px;
  }
}
</style>
