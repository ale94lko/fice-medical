<template>
  <div
    class="form-field"
    :class="{ 'q-mt-md': spaced }">
    <FormFieldLabel v-if="displayLabel" :label="displayLabel" />
    <div class="form-field__control">
      <slot />
    </div>
    <slot name="hint" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import FormFieldLabel from 'components/FormFieldLabel.vue'
import { formatRequiredFieldLabel } from 'src/utils/form-field.js'

const props = defineProps({
  label: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  spaced: {
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
