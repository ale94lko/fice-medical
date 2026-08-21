<template>
  <q-select
    :model-value="modelValue"
    outlined
    hide-bottom-space
    use-input
    fill-input
    hide-selected
    input-debounce="0"
    :readonly="readonly"
    :disable="disable"
    :options="filteredOptions"
    :placeholder="placeholder"
    :error="error"
    :error-message="errorMessage"
    :data-testid="testId || undefined"
    @filter="onFilter"
    @input-value="onInput"
    @update:model-value="onSelect"
  />
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: '',
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  disable: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  testId: {
    type: String,
    default: '',
  },
  maxlength: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['update:modelValue'])

const filteredOptions = ref([])

watch(
  () => props.options,
  list => {
    filteredOptions.value = Array.isArray(list) ? [...list] : []
  },
  { immediate: true },
)

function cap(value) {
  const text = String(value ?? '')
  if (props.maxlength > 0) {
    return text.slice(0, props.maxlength)
  }

  return text
}

function emitValue(value) {
  if (value == null) {
    return
  }
  const next = cap(value)
  if (next === String(props.modelValue ?? '')) {
    return
  }
  emit('update:modelValue', next)
}

function onFilter(val, update) {
  update(() => {
    const needle = String(val ?? '').trim().toLowerCase()
    const list = Array.isArray(props.options) ? props.options : []
    filteredOptions.value = needle
      ? list.filter(label => String(label)
        .toLowerCase()
        .includes(needle))
      : [...list]
  })
}

function onInput(value) {
  emitValue(value)
}

function onSelect(value) {
  emitValue(value)
}
</script>
