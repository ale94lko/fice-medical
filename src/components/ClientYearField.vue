<template>
  <q-input
    outlined
    hide-bottom-space
    :model-value="modelValue"
    :label="label"
    :error="error"
    :error-message="errorMessage"
    mask="####"
    unmasked-value
    maxlength="4"
    inputmode="numeric"
    placeholder="YYYY"
    @update:model-value="v => emit('update:modelValue', v ?? '')">
    <template #append>
      <q-icon name="event" class="cursor-pointer input-icon">
        <q-popup-proxy
          ref="yearPopupRef"
          cover
          transition-show="scale"
          transition-hide="scale"
          @before-show="onBeforeShow">
          <q-card class="client-year-picker">
            <div class="client-year-picker__nav row items-center no-wrap">
              <q-btn
                flat
                round
                dense
                icon="chevron_left"
                :disable="!canShiftPrev"
                @click="shiftRange(-12)"
              />
              <div class="col text-center text-weight-medium">
                {{ rangeLabel }}
              </div>
              <q-btn
                flat
                round
                dense
                icon="chevron_right"
                :disable="!canShiftNext"
                @click="shiftRange(12)"
              />
            </div>
            <div class="client-year-picker__grid">
              <q-btn
                v-for="year in rangeYears"
                :key="year"
                flat
                no-caps
                class="client-year-picker__year-btn"
                :class="{
                  'client-year-picker__year-btn--selected':
                    selectedYear === year,
                }"
                :disable="!isYearSelectable(year)"
                :label="String(year)"
                @click="selectYear(year)"
              />
            </div>
          </q-card>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  minYear: { type: Number, required: true },
  maxYear: { type: Number, required: true },
  error: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const yearPopupRef = ref(null)
const rangeStart = ref(props.maxYear)

const selectedYear = computed(() => {
  const s = String(props.modelValue ?? '').trim()
  if (!/^\d{4}$/.test(s)) {
    return null
  }
  const year = Number(s)
  if (!Number.isFinite(year)) {
    return null
  }

  return year
})

const rangeYears = computed(() => {
  const years = []
  for (let y = rangeStart.value; y < rangeStart.value + 12; y += 1) {
    years.push(y)
  }

  return years
})

const rangeLabel = computed(() => {
  const end = rangeStart.value + 11

  return `${rangeStart.value} - ${end}`
})

const canShiftPrev = computed(() => rangeStart.value > props.minYear)

const canShiftNext = computed(
  () => rangeStart.value + 11 < props.maxYear,
)

function yearRangeStart(anchorYear) {
  return Math.floor(anchorYear / 12) * 12
}

function onBeforeShow() {
  const anchor = selectedYear.value
    ?? props.maxYear
    ?? new Date().getFullYear()
  let start = yearRangeStart(anchor)
  if (start + 11 < props.minYear) {
    start = props.minYear
  }
  if (start > props.maxYear) {
    start = Math.max(props.minYear, props.maxYear - 11)
  }
  rangeStart.value = start
}

function isYearSelectable(year) {
  return year >= props.minYear && year <= props.maxYear
}

function shiftRange(delta) {
  const next = rangeStart.value + delta
  if (next + 11 < props.minYear || next > props.maxYear) {
    return
  }
  rangeStart.value = next
}

function selectYear(year) {
  if (!isYearSelectable(year)) {
    return
  }
  emit('update:modelValue', String(year))
  yearPopupRef.value?.hide()
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.input-icon {
  color: $primary;
}

.client-year-picker {
  min-width: 290px;
  padding: 8px 8px 12px;
}

.client-year-picker__nav {
  padding: 4px 0 8px;
  color: $text-strong;
}

.client-year-picker__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.client-year-picker__year-btn {
  min-height: 40px;
  border-radius: 8px;
  font-weight: 500;

  &--selected {
    background: rgba($primary, 0.14) !important;
    color: $primary;
    font-weight: 700;
  }
}
</style>
