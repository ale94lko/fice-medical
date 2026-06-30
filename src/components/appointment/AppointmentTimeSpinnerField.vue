<template>
  <div
    class="appointment-time-spinner row no-wrap items-stretch"
    :class="{ 'appointment-time-spinner--readonly': readonly }">
    <div class="appointment-time-spinner__segment col">
      <q-btn
        flat
        dense
        round
        size="xs"
        icon="keyboard_arrow_up"
        class="appointment-time-spinner__step"
        :disable="readonly"
        :aria-label="t('appointmentTimeSpinnerIncreaseHour')"
        @click="stepHour(1)"
      />
      <span class="appointment-time-spinner__value">
        {{ hourLabel }}
      </span>
      <q-btn
        flat
        dense
        round
        size="xs"
        icon="keyboard_arrow_down"
        class="appointment-time-spinner__step"
        :disable="readonly"
        :aria-label="t('appointmentTimeSpinnerDecreaseHour')"
        @click="stepHour(-1)"
      />
    </div>

    <div class="appointment-time-spinner__segment col">
      <q-btn
        flat
        dense
        round
        size="xs"
        icon="keyboard_arrow_up"
        class="appointment-time-spinner__step"
        :disable="readonly"
        :aria-label="t('appointmentTimeSpinnerIncreaseMinute')"
        @click="stepMinute(1)"
      />
      <span class="appointment-time-spinner__value">
        {{ minuteLabel }}
      </span>
      <q-btn
        flat
        dense
        round
        size="xs"
        icon="keyboard_arrow_down"
        class="appointment-time-spinner__step"
        :disable="readonly"
        :aria-label="t('appointmentTimeSpinnerDecreaseMinute')"
        @click="stepMinute(-1)"
      />
    </div>

    <div class="appointment-time-spinner__segment col">
      <q-btn
        flat
        dense
        round
        size="xs"
        icon="keyboard_arrow_up"
        class="appointment-time-spinner__step"
        :disable="readonly"
        :aria-label="t('appointmentTimeSpinnerIncreasePeriod')"
        @click="stepPeriod(1)"
      />
      <span class="appointment-time-spinner__value">
        {{ periodLabel }}
      </span>
      <q-btn
        flat
        dense
        round
        size="xs"
        icon="keyboard_arrow_down"
        class="appointment-time-spinner__step"
        :disable="readonly"
        :aria-label="t('appointmentTimeSpinnerDecreasePeriod')"
        @click="stepPeriod(-1)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { calendarSlotMinutes } from 'src/constants/calendar.js'
import { parseTime12h } from 'src/utils/client-vitals.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  minuteStep: {
    type: Number,
    default: calendarSlotMinutes,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const { t } = useI18n()

const PERIODS = ['AM', 'PM']

const parsedTime = computed(() => parseTime12h(props.modelValue))

const hourLabel = computed(() => {
  if (!parsedTime.value) {
    return '--'
  }

  const hour = parsedTime.value.hours % 12

  return String(hour === 0 ? 12 : hour).padStart(2, '0')
})

const minuteLabel = computed(() => {
  if (!parsedTime.value) {
    return '--'
  }

  return String(parsedTime.value.minutes).padStart(2, '0')
})

const periodLabel = computed(() => {
  if (!parsedTime.value) {
    return 'AM'
  }

  return parsedTime.value.hours >= 12 ? 'PM' : 'AM'
})

function formatTime(hours24, minutes) {
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const displayHour = hours24 % 12 === 0 ? 12 : hours24 % 12

  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`
}

function emitTime(hours24, minutes) {
  const next = formatTime(hours24, minutes)
  emit('update:modelValue', next)
  emit('change', next)
}

function resolveBaseTime() {
  if (parsedTime.value) {
    return { ...parsedTime.value }
  }

  return { hours: 9, minutes: 0 }
}

function stepHour(delta) {
  const base = resolveBaseTime()
  const nextHours = (base.hours + delta + 24) % 24
  emitTime(nextHours, base.minutes)
}

function stepMinute(delta) {
  const base = resolveBaseTime()
  const step = Number(props.minuteStep) || calendarSlotMinutes
  const total = base.hours * 60 + base.minutes + delta * step
  const normalized = ((total % (24 * 60)) + (24 * 60)) % (24 * 60)
  const nextHours = Math.floor(normalized / 60)
  const nextMinutes = normalized % 60
  emitTime(nextHours, nextMinutes)
}

function applyPeriod(period, base) {
  const hour12 = base.hours % 12 === 0 ? 12 : base.hours % 12
  let nextHours = 0
  if (period === 'PM') {
    nextHours = hour12 === 12 ? 12 : hour12 + 12
  } else {
    nextHours = hour12 === 12 ? 0 : hour12
  }

  emitTime(nextHours, base.minutes)
}

function stepPeriod(delta) {
  const base = resolveBaseTime()
  const current = base.hours >= 12 ? 'PM' : 'AM'
  const index = PERIODS.indexOf(current)
  const next = PERIODS[(index + delta + PERIODS.length) % PERIODS.length]
  applyPeriod(next, base)
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.appointment-time-spinner {
  gap: 6px;

  &__segment {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 56px;
    border: 1px solid $border-subtle;
    border-radius: 8px;
    background: #fff;
    padding: 0;
  }

  &__value {
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.1;
    color: $text-strong;
    padding: 0;
    min-width: 2rem;
    text-align: center;
  }

  &__step {
    color: $grey-7;
    min-height: 18px;
    width: 100%;
  }

  &--readonly {
    opacity: 0.72;
  }
}
</style>
