<template>
  <label v-if="displayLabel" class="form-field__label">
    <slot>{{ displayLabel }}</slot>
  </label>
</template>

<script setup>
import { computed } from 'vue'
import { formatRequiredFieldLabel } from 'src/utils/base.js'

const props = defineProps({
  label: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
})

const displayLabel = computed(() => {
  if (!props.label) {
    return ''
  }

  return props.required
    ? formatRequiredFieldLabel(props.label)
    : props.label
})
</script>
