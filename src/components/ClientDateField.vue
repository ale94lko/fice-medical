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
    :clearable="showClearable"
    clear-icon="cancel"
    :error="error"
    :error-message="errorMessage"
    :rules="rules"
    :lazy-rules="'ondemand'"
    :mask="dateMask"
    :placeholder="resolvedPlaceholder"
    @update:model-value="onInput"
    @clear="onClear"
    @blur="onBlur">
    <template v-if="!readonly" #append>
      <q-icon name="event" class="cursor-pointer input-icon">
        <q-popup-proxy
          ref="datePopupRef"
          cover
          transition-show="scale"
          transition-hide="scale">
          <q-date
            class="client-date-field__calendar"
            color="primary"
            :model-value="datePickerValue"
            :mask="datePickerMask"
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
import { computed, ref } from 'vue'
import {
  isCompleteUsDateString,
  parseUsDateString,
  sanitizeUsDateInput,
  startOfDay,
} from 'src/utils/client-form.js'
import { useAppDateTime } from 'src/composables/useAppDateTime.js'
import { hasSelectValue } from 'src/utils/base.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  error: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  rules: { type: Array, default: () => [] },
  maxToday: { type: Boolean, default: false },
  minDate: { type: String, default: '' },
  minYear: { type: Number, default: null },
  closeLabel: { type: String, default: 'Close' },
  testId: { type: String, default: '' },
  placeholder: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const { dateMask, datePlaceholder, datePickerMask } = useAppDateTime()
const datePopupRef = ref(null)

const showClearable = computed(
  () => props.clearable
    && !props.readonly
    && hasSelectValue(props.modelValue),
)

const resolvedPlaceholder = computed(() => {
  const custom = String(props.placeholder ?? '').trim()

  return custom || datePlaceholder.value
})

const resolvedMinYear = computed(() => {
  if (props.minYear != null && Number.isFinite(props.minYear)) {
    return props.minYear
  }
  if (props.maxToday) {
    return new Date().getFullYear() - 125
  }

  return 1900
})

const resolvedMinDate = computed(() => {
  const raw = String(props.minDate ?? '').trim()
  if (!raw) {
    return null
  }
  const parsed = parseUsDateString(raw)

  return parsed ? startOfDay(parsed) : null
})

const datePickerValue = computed(() => {
  const d = parseUsDateString(props.modelValue)
  if (!d) {
    return null
  }

  return props.modelValue
})

function parseCalendarOptionDate(dateStr) {
  const raw = String(dateStr ?? '').trim()
  const fromDisplay = parseUsDateString(raw)
  if (fromDisplay) {
    return startOfDay(fromDisplay)
  }
  // Quasar q-date options may use YYYY/MM/DD regardless of input mask.
  const isoSlash = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(raw)
  if (isoSlash) {
    return startOfDay(new Date(
      Number(isoSlash[1]),
      Number(isoSlash[2]) - 1,
      Number(isoSlash[3]),
    ))
  }

  return null
}

function dateOptions(dateStr) {
  const parsed = parseCalendarOptionDate(dateStr)
  if (!parsed) {
    return true
  }
  if (
    props.maxToday
    && parsed.getTime() > startOfDay(new Date()).getTime()
  ) {
    return false
  }
  if (
    resolvedMinDate.value
    && parsed.getTime() < resolvedMinDate.value.getTime()
  ) {
    return false
  }

  return true
}

function sanitizeOptions() {
  return {
    maxToday: props.maxToday,
    minYear: resolvedMinYear.value,
    minDate: props.minDate || null,
  }
}

function onInput(value) {
  const next = sanitizeUsDateInput(value, sanitizeOptions())
  if (next !== props.modelValue) {
    emit('update:modelValue', next)
  }
}

function onClear() {
  if (props.modelValue !== '') {
    emit('update:modelValue', '')
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
  if (isCompleteUsDateString(next) && parseUsDateString(next)) {
    datePopupRef.value?.hide()
  }
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

<!-- Popup is teleported; unscoped class targets the calendar. -->
<style lang="scss">
@import 'src/css/quasar.variables';

.client-date-field__calendar {
  button.q-date__today:not(.bg-primary) {
    box-shadow: inset 0 0 0 2px $primary;
  }
}
</style>
