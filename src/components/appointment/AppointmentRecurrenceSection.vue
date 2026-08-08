<template>
  <div class="appointment-recurrence-section">
    <div class="appointment-recurrence-section__header">
      <FormToggle
        v-model="local.repeatAppointment"
        color="primary"
        :disable="readonly"
        :label="''"
      />
      <div class="appointment-recurrence-section__heading">
        <div class="appointment-recurrence-section__title">
          {{ t('appointmentRepeatLabel') }}
        </div>
        <div class="appointment-recurrence-section__subtitle">
          {{ t('appointmentRepeatSubtitle') }}
        </div>
      </div>
    </div>

    <div
      v-if="local.repeatAppointment"
      class="appointment-recurrence-section__panel q-mt-md">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-3">
          <AddClientLabeledField
            :label="t('appointmentRecurrenceFrequency')">
            <q-select
              v-model="local.recurrence.frequency"
              outlined
              hide-bottom-space
              emit-value
              map-options
              :options="frequencyOptions"
              :readonly="readonly"
              :clearable="false">
              <template #prepend>
                <q-icon name="calendar_month" size="18px" />
              </template>
            </q-select>
            <p class="appointment-recurrence-section__hint">
              {{ t('appointmentRecurrenceFrequencyHint') }}
            </p>
          </AddClientLabeledField>
        </div>

        <div class="col-12 col-md-3">
          <AddClientLabeledField
            :label="t('appointmentRecurrenceInterval')">
            <q-input
              v-model.number="local.recurrence.intervalCount"
              outlined
              hide-bottom-space
              type="number"
              min="1"
              :readonly="readonly">
              <template #append>
                <span class="appointment-recurrence-section__unit">
                  {{ intervalUnitLabel }}
                </span>
              </template>
            </q-input>
            <p class="appointment-recurrence-section__hint">
              {{ intervalHint }}
            </p>
          </AddClientLabeledField>
        </div>

        <div class="col-12 col-md-3">
          <AddClientLabeledField
            :label="t('appointmentRecurrenceEnds')">
            <q-select
              v-model="local.recurrence.endType"
              outlined
              hide-bottom-space
              emit-value
              map-options
              :options="endTypeOptions"
              :readonly="readonly"
              :clearable="false">
              <template #prepend>
                <q-icon name="flag" size="18px" />
              </template>
            </q-select>
            <p class="appointment-recurrence-section__hint">
              {{ t('appointmentRecurrenceEndsHint') }}
            </p>
          </AddClientLabeledField>
        </div>

        <div
          v-if="local.recurrence.endType === endAfterCount"
          class="col-12 col-md-3">
          <AddClientLabeledField
            :label="t('appointmentRecurrenceCount')">
            <q-input
              v-model.number="local.recurrence.endAfterCount"
              outlined
              hide-bottom-space
              type="number"
              min="1"
              :readonly="readonly"
            />
            <p class="appointment-recurrence-section__hint">
              {{ t('appointmentRecurrenceCountHint') }}
            </p>
          </AddClientLabeledField>
        </div>

        <div
          v-if="local.recurrence.endType === endOnDate"
          class="col-12 col-md-3">
          <AddClientLabeledField
            :label="t('appointmentRecurrenceEndDate')">
            <ClientDateField
              v-model="local.recurrence.endOnDate"
              :min-date="minEndDate"
              :readonly="readonly"
              :error="Boolean(endDateError)"
              :error-message="endDateError"
              :close-label="t('close')"
            />
          </AddClientLabeledField>
        </div>
      </div>

      <div
        v-if="local.recurrence.frequency === frequencyWeekly"
        class="q-mt-md">
        <div class="appointment-recurrence-section__days-label">
          {{ t('appointmentRecurrenceDays') }}
        </div>
        <div class="appointment-recurrence-section__days-row q-mt-sm">
          <FormSelect
            :model-value="daysPreset"
            class="appointment-recurrence-section__days-preset"
            outlined
            hide-bottom-space
            emit-value
            map-options
            :clearable="false"
            :disable="readonly"
            :options="daysPresetOptions"
            :placeholder="t('appointmentRecurrenceDaysPresetCustom')"
            @update:model-value="applyDaysPreset"
          />
          <div class="appointment-recurrence-section__days">
            <button
              v-for="day in weekdayOptions"
              :key="day.value"
              type="button"
              class="appointment-recurrence-section__day"
              :class="{
                'appointment-recurrence-section__day--selected':
                  isDaySelected(day.value),
              }"
              :disabled="readonly"
              @click="toggleDay(day.value)">
              <q-icon
                :name="isDaySelected(day.value)
                  ? 'check_box'
                  : 'check_box_outline_blank'"
                size="16px"
              />
              <span>{{ day.label }}</span>
            </button>
          </div>
        </div>
        <div class="appointment-recurrence-section__days-count">
          <q-icon name="event" size="16px" />
          <span>
            {{
              t('appointmentRecurrenceDaysSelected', {
                count: selectedDaysCount,
              })
            }}
          </span>
        </div>
      </div>

      <div class="appointment-recurrence-section__preview q-mt-md">
        <q-icon name="event" size="18px" />
        <div class="appointment-recurrence-section__preview-text">
          <i18n-t
            :keypath="previewKeypath"
            tag="span"
            scope="global">
            <template #preview>
              <strong>{{ t('appointmentRecurrencePreviewLabel') }}</strong>
            </template>
            <template #count>
              <strong>{{ previewCount }}</strong>
            </template>
            <template #days>
              <strong>{{ previewDaysLabel }}</strong>
            </template>
            <template #startDate>
              <strong>{{ previewStartDate }}</strong>
            </template>
          </i18n-t>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  appointmentRecurrenceEndTypeValues,
  appointmentRecurrenceFrequencyValues,
} from 'components/constants.js'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import { apiDateToDisplay } from 'src/utils/app-datetime.js'
import {
  addDaysToDayKey,
  usDateStringToLocalDayKey,
} from 'src/utils/appointment-datetime.js'
import { parseUsDateString } from 'src/utils/client-form.js'

const DAYS_PRESET_NONE = 'none'
const DAYS_PRESET_ALL = 'all'
const DAYS_PRESET_WEEKDAYS = 'weekdays'
const DAYS_PRESET_WEEKEND = 'weekend'

const DAYS_PRESET_VALUES = {
  [DAYS_PRESET_NONE]: [],
  [DAYS_PRESET_ALL]: [1, 2, 3, 4, 5, 6, 7],
  [DAYS_PRESET_WEEKDAYS]: [1, 2, 3, 4, 5],
  [DAYS_PRESET_WEEKEND]: [6, 7],
}

const props = defineProps({
  modelValue: { type: Object, required: true },
  readonly: { type: Boolean, default: false },
  startDateLabel: { type: String, default: '' },
  startDayKey: { type: String, default: '' },
  endDateError: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const frequencyDaily = appointmentRecurrenceFrequencyValues.daily
const frequencyWeekly = appointmentRecurrenceFrequencyValues.weekly
const frequencyMonthly = appointmentRecurrenceFrequencyValues.monthly
const endAfterCount = appointmentRecurrenceEndTypeValues.afterCount
const endOnDate = appointmentRecurrenceEndTypeValues.onDate

const local = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const minEndDate = computed(() => {
  const dayKey = String(props.startDayKey ?? '').trim()
  if (!dayKey) {
    return ''
  }
  const nextDayKey = addDaysToDayKey(dayKey, 1)

  return nextDayKey ? apiDateToDisplay(nextDayKey) : ''
})

watch(
  () => [props.startDayKey, local.value.recurrence?.endOnDate],
  () => {
    clearInvalidEndDate()
  },
)

const frequencyOptions = computed(() => [
  {
    label: t('appointmentRecurrenceDaily'),
    value: frequencyDaily,
  },
  {
    label: t('appointmentRecurrenceWeekly'),
    value: frequencyWeekly,
  },
  {
    label: t('appointmentRecurrenceMonthly'),
    value: frequencyMonthly,
  },
])

const endTypeOptions = computed(() => [
  {
    label: t('appointmentRecurrenceAfterCount'),
    value: endAfterCount,
  },
  {
    label: t('appointmentRecurrenceOnDate'),
    value: endOnDate,
  },
])

const weekdayOptions = computed(() => [
  { label: t('weekdayMon'), value: 1 },
  { label: t('weekdayTue'), value: 2 },
  { label: t('weekdayWed'), value: 3 },
  { label: t('weekdayThu'), value: 4 },
  { label: t('weekdayFri'), value: 5 },
  { label: t('weekdaySat'), value: 6 },
  { label: t('weekdaySun'), value: 7 },
])

const intervalUnitLabel = computed(() => {
  const frequency = local.value.recurrence.frequency
  if (frequency === frequencyDaily) {
    return t('appointmentRecurrenceUnitDays')
  }
  if (frequency === frequencyMonthly) {
    return t('appointmentRecurrenceUnitMonths')
  }

  return t('appointmentRecurrenceUnitWeeks')
})

const intervalHint = computed(() => {
  const frequency = local.value.recurrence.frequency
  if (frequency === frequencyDaily) {
    return t('appointmentRecurrenceIntervalHintDaily')
  }
  if (frequency === frequencyMonthly) {
    return t('appointmentRecurrenceIntervalHintMonthly')
  }

  return t('appointmentRecurrenceIntervalHintWeekly')
})

const selectedDaysCount = computed(
  () => (local.value.recurrence.daysOfWeek ?? []).length,
)

const daysPresetOptions = computed(() => [
  {
    label: t('appointmentRecurrenceDaysPresetNone'),
    value: DAYS_PRESET_NONE,
  },
  {
    label: t('appointmentRecurrenceDaysPresetAll'),
    value: DAYS_PRESET_ALL,
  },
  {
    label: t('appointmentRecurrenceDaysPresetWeekdays'),
    value: DAYS_PRESET_WEEKDAYS,
  },
  {
    label: t('appointmentRecurrenceDaysPresetWeekend'),
    value: DAYS_PRESET_WEEKEND,
  },
])

const daysPreset = computed(() => {
  const current = normalizeDays(local.value.recurrence.daysOfWeek)
  const match = Object.entries(DAYS_PRESET_VALUES).find(([, days]) =>
    sameDays(current, days),
  )

  return match?.[0] ?? null
})

const previewCount = computed(() => {
  if (local.value.recurrence.endType === endAfterCount) {
    return Number(local.value.recurrence.endAfterCount) || 0
  }

  return '—'
})

const previewStartDate = computed(() => {
  const label = String(props.startDateLabel ?? '').trim()
  if (label && label !== '—') {
    return label
  }

  return t('appointmentRecurrencePreviewSelectedDate')
})

const previewKeypath = computed(() => {
  const frequency = local.value.recurrence.frequency
  if (frequency === frequencyDaily) {
    return 'appointmentRecurrencePreviewDaily'
  }
  if (frequency === frequencyMonthly) {
    return 'appointmentRecurrencePreviewMonthly'
  }

  return 'appointmentRecurrencePreviewWeekly'
})

const previewDaysLabel = computed(() => {
  const selected = new Set(local.value.recurrence.daysOfWeek ?? [])
  const labels = weekdayOptions.value
    .filter(day => selected.has(day.value))
    .map(day => day.label)

  return formatListWithAnd(labels)
})

function formatListWithAnd(labels) {
  if (!labels.length) {
    return t('appointmentRecurrencePreviewNoDays')
  }
  if (labels.length === 1) {
    return labels[0]
  }
  if (labels.length === 2) {
    return t('appointmentRecurrencePreviewDayPair', {
      first: labels[0],
      second: labels[1],
    })
  }

  return t('appointmentRecurrencePreviewDayList', {
    list: labels.slice(0, -1).join(', '),
    last: labels[labels.length - 1],
  })
}

function normalizeDays(days) {
  return [...(days ?? [])]
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
}

function sameDays(left, right) {
  const a = normalizeDays(left)
  const b = normalizeDays(right)
  if (a.length !== b.length) {
    return false
  }

  return a.every((value, index) => value === b[index])
}

function isDaySelected(value) {
  return (local.value.recurrence.daysOfWeek ?? []).includes(value)
}

function toggleDay(value) {
  if (props.readonly) {
    return
  }
  const current = [...(local.value.recurrence.daysOfWeek ?? [])]
  const index = current.indexOf(value)
  if (index >= 0) {
    current.splice(index, 1)
  } else {
    current.push(value)
    current.sort((a, b) => a - b)
  }
  local.value.recurrence.daysOfWeek = current
}

function applyDaysPreset(preset) {
  if (props.readonly) {
    return
  }
  const days = DAYS_PRESET_VALUES[preset]
  if (!days) {
    return
  }
  local.value.recurrence.daysOfWeek = [...days]
}

function isEndDateAfterStart(endDateUs, startDayKey) {
  const endDayKey = usDateStringToLocalDayKey(endDateUs)
  const start = String(startDayKey ?? '').trim()
  if (!endDayKey || !start) {
    return false
  }

  return endDayKey > start
}

function clearInvalidEndDate() {
  if (props.readonly) {
    return
  }
  const endDate = String(local.value.recurrence?.endOnDate ?? '').trim()
  if (!endDate) {
    return
  }
  if (!parseUsDateString(endDate)) {
    return
  }
  const start = String(props.startDayKey ?? '').trim()
  if (!start) {
    return
  }
  if (!isEndDateAfterStart(endDate, start)) {
    local.value.recurrence.endOnDate = ''
  }
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.appointment-recurrence-section__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.appointment-recurrence-section__title {
  color: $text-strong;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.35;
}

.appointment-recurrence-section__subtitle {
  color: $text-muted;
  font-size: 0.875rem;
  line-height: 1.4;
  margin-top: 2px;
}

.appointment-recurrence-section__panel {
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface;
  padding: 16px;
}

.appointment-recurrence-section__hint {
  margin: 6px 0 0;
  color: $text-muted;
  font-size: 0.6875rem;
  line-height: 1.3;
}

.appointment-recurrence-section__unit {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba($primary, 0.08);
  color: $primary;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
}

.appointment-recurrence-section__days-label {
  color: $text-strong;
  font-size: 0.875rem;
  font-weight: 600;
}

.appointment-recurrence-section__days-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.appointment-recurrence-section__days-preset {
  flex: 0 0 auto;
  width: min(160px, 100%);
}

.appointment-recurrence-section__days {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.appointment-recurrence-section__day {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface;
  color: $text-strong;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &:disabled {
    cursor: default;
    opacity: 0.7;
  }

  &--selected {
    border-color: $primary;
    background: $primary;
    color: $white;
  }
}

.appointment-recurrence-section__days-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  color: $text-muted;
  font-size: 0.8125rem;
}

.appointment-recurrence-section__preview {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: $radius-md;
  background: rgba($primary, 0.08);
  color: $text-strong;
  font-size: 0.875rem;
  line-height: 1.45;
}

.appointment-recurrence-section__preview-text {
  flex: 1 1 auto;
  min-width: 0;
}
</style>
