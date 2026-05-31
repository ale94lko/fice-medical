<template>
  <div
    class="form-field"
    :class="{ 'q-mt-md': spaced }"
    :data-testid="testId || undefined">
    <FormFieldLabel v-if="displayLabel" :label="displayLabel" />
    <div class="form-field__control">
      <slot />
    </div>
    <div v-if="$slots.hint" class="form-field__hint">
      <q-icon
        name="info_outline"
        size="14px"
        class="form-field__hint-icon"
      />
      <div class="form-field__hint-content">
        <slot name="hint" />
      </div>
    </div>
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
  testId: {
    type: String,
    default: '',
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
