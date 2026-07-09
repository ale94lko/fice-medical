<template>
  <AddClientLabeledField :label="label">
    <q-select
      :model-value="modelValue"
      :data-testid="testId"
      outlined
      hide-bottom-space
      use-input
      use-chips
      multiple
      hide-dropdown-icon
      new-value-mode="add-unique"
      input-debounce="0"
      :readonly="readonly"
      :disable="disable"
      :placeholder="placeholder"
      :hint="hint"
      :error="Boolean(error)"
      :error-message="error"
      @update:model-value="onUpdate"
    />
  </AddClientLabeledField>
</template>

<script setup>
import AddClientLabeledField from 'components/AddClientLabeledField.vue'

defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  hint: {
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
    type: String,
    default: '',
  },
  testId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

function onUpdate(value) {
  const next = Array.isArray(value)
    ? value.map(item => String(item ?? '').trim()).filter(Boolean)
    : []
  emit('update:modelValue', next)
}
</script>
