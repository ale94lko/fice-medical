<template>
  <q-input
    outlined
    hide-bottom-space
    :data-testid="testId || undefined"
    class="client-date-field"
    :class="{ 'client-date-field--no-label': !label }"
    :model-value="modelValue"
    :label="label || undefined"
    :readonly="readonly"
    :rules="rules"
    :lazy-rules="'ondemand'"
    mask="##/##/####"
    placeholder="mm/dd/yyyy"
    @update:model-value="onInput"
    @blur="onBlur">
    <template v-if="!readonly" #append>
      <q-icon name="event" class="cursor-pointer input-icon">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date
            :model-value="datePickerValue"
            mask="MM/DD/YYYY"
            :options="dateOptions"
            @update:model-value="onPickerChange">
            <div class="row items-center justify-end">
              <q-btn
                v-close-popup
                no-caps
                flat
                color="primary"
                :label="closeLabel"
              />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup>
import { computed } from 'vue'
import {
  isCompleteUsDateString,
  parseUsDateString,
  sanitizeUsDateInput,
  startOfDay,
} from 'src/utils/client-form.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  rules: { type: Array, default: () => [] },
  maxToday: { type: Boolean, default: false },
  minYear: { type: Number, default: null },
  closeLabel: { type: String, default: 'Close' },
  testId: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const resolvedMinYear = computed(() => {
  if (props.minYear != null && Number.isFinite(props.minYear)) {
    return props.minYear
  }
  if (props.maxToday) {
    return new Date().getFullYear() - 125
  }

  return 1900
})

const datePickerValue = computed(() => {
  const d = parseUsDateString(props.modelValue)
  if (!d) {
    return null
  }
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = String(d.getFullYear())

  return `${mm}/${dd}/${yyyy}`
})

function dateOptions(dateStr) {
  if (!props.maxToday) {
    return true
  }
  const parts = String(dateStr).split('/')
  if (parts.length !== 3) {
    return true
  }
  const d = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2]),
  )

  return d.getTime() <= startOfDay(new Date()).getTime()
}

function sanitizeOptions() {
  return {
    maxToday: props.maxToday,
    minYear: resolvedMinYear.value,
  }
}

function onInput(value) {
  const next = sanitizeUsDateInput(value, sanitizeOptions())
  if (next !== props.modelValue) {
    emit('update:modelValue', next)
  }
}

function onBlur() {
  const s = String(props.modelValue ?? '').trim()
  if (!s) {
    return
  }
  if (isCompleteUsDateString(s) && !parseUsDateString(s)) {
    emit('update:modelValue', '')

    return
  }
  const next = sanitizeUsDateInput(s, sanitizeOptions())
  if (next !== s) {
    emit('update:modelValue', next)
  }
}

function onPickerChange(val) {
  const next = sanitizeUsDateInput(val || '', sanitizeOptions())
  emit('update:modelValue', next)
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.input-icon {
  color: $primary;
}

.client-date-field--no-label {
  :deep(.q-field__control-container) {
    align-items: center;
    padding-top: 0;
    padding-bottom: 0;
  }

  :deep(.q-field__native),
  :deep(.q-field__input) {
    padding-top: 0;
    padding-bottom: 0;
    line-height: 1.5;
  }
}
</style>
