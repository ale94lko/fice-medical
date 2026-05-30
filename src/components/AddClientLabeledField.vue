<template>
  <FormField
    :label="label"
    :required="required"
    :spaced="spaced">
    <slot />
    <template v-if="$slots.hint" #hint>
      <slot name="hint" />
    </template>
  </FormField>
</template>

<script setup>
import FormField from 'components/FormField.vue'

defineProps({
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
</script>
