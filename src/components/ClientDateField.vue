<template>
  <q-input
    outlined
    hide-bottom-space
    :model-value="modelValue"
    :label="label"
    :readonly="readonly"
    :rules="rules"
    :lazy-rules="'ondemand'"
    mask="##/##/####"
    placeholder="mm/dd/yyyy"
    @update:model-value="v => emit('update:modelValue', v)">
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
import { parseUsDateString, startOfDay } from 'src/utils/client-form.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  rules: { type: Array, default: () => [] },
  maxToday: { type: Boolean, default: false },
  closeLabel: { type: String, default: 'Close' },
})

const emit = defineEmits(['update:modelValue'])

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

function onPickerChange(val) {
  emit('update:modelValue', val || '')
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.input-icon {
  color: $primary;
}
</style>
