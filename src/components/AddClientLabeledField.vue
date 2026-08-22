<template>
  <FormField
    :label="label"
    :required="required"
    :spaced="spaced"
    :test-id="testId"
    :lock-label="lockLabel"
    :lock-hint="lockHint"
    :lock-test-id="lockTestId">
    <slot />
    <template
      v-if="$slots['label-append']"
      #label-append>
      <slot name="label-append" />
    </template>
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
  testId: {
    type: String,
    default: '',
  },
  lockLabel: {
    type: String,
    default: '',
  },
  lockHint: {
    type: String,
    default: '',
  },
  lockTestId: {
    type: String,
    default: '',
  },
})
</script>
