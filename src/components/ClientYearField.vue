<template>
  <q-input
    outlined
    hide-bottom-space
    :data-testid="testId || undefined"
    class="client-year-field"
    :class="{ 'client-year-field--no-label': !label }"
    :model-value="modelValue"
    :label="label || undefined"
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
          <q-date
            ref="dateRef"
            v-model="pickerModel"
            class="client-year-field__picker"
            color="primary"
            mask="YYYY"
            default-view="Years"
            emit-immediately
            :title="pickerTitle"
            :subtitle="pickerSubtitle"
            :default-year-month="defaultYearMonth"
            :navigation-min-year-month="navMin"
            :navigation-max-year-month="navMax"
            :options="yearOptions"
            @update:model-value="onPickerChange"
            @navigation="onNavigation">
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
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  minYear: { type: Number, required: true },
  maxYear: { type: Number, required: true },
  error: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  closeLabel: { type: String, default: 'Close' },
  testId: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const yearPopupRef = ref(null)
const dateRef = ref(null)
const pickerModel = ref(null)
const anchorYear = ref(new Date().getFullYear())

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

const navMin = computed(() => `${props.minYear}/01`)

const navMax = computed(() => `${props.maxYear}/12`)

const defaultYearMonth = computed(() => `${anchorYear.value}/01`)

const pickerTitle = computed(() => t('clientYearPickerTitle'))

const pickerSubtitle = computed(() => {
  if (selectedYear.value != null) {
    return String(selectedYear.value)
  }

  return t('clientYearPickerSubtitleEmpty')
})

function onBeforeShow() {
  anchorYear.value = selectedYear.value
    ?? props.maxYear
    ?? new Date().getFullYear()
  pickerModel.value = selectedYear.value != null
    ? String(selectedYear.value)
    : null
  nextTick(() => {
    dateRef.value?.setView('Years')
  })
}

function yearOptions(dateStr) {
  const parts = String(dateStr).split('/')
  if (parts.length < 1) {
    return true
  }
  const year = Number(parts[0])
  if (!Number.isFinite(year)) {
    return true
  }

  return year >= props.minYear && year <= props.maxYear
}

function onPickerChange(val) {
  const yearStr = String(val ?? '').trim()
  if (!/^\d{4}$/.test(yearStr)) {
    return
  }
  const year = Number(yearStr)
  if (year < props.minYear || year > props.maxYear) {
    return
  }
  emit('update:modelValue', yearStr)
  yearPopupRef.value?.hide()
}

function onNavigation(ctx) {
  if (ctx?.view !== 'Years') {
    nextTick(() => {
      dateRef.value?.setView('Years')
    })
  }
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.input-icon {
  color: $primary;
}

.client-year-field--no-label {
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

.client-year-field__picker {
  .q-date__calendar,
  .q-date__months {
    display: none !important;
  }

  .q-date__header {
    pointer-events: none;
  }

  .q-date__navigation {
    pointer-events: auto;
  }
}
</style>
