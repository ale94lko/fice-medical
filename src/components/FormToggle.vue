<template>
  <q-toggle
    :model-value="modelValue"
    :label="label"
    :disable="disable"
    color="positive"
    keep-color
    class="app-form-toggle"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: '',
  },
  disable: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])
</script>
