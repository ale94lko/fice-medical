<template>
  <div
    class="form-field"
    :class="{ 'q-mt-md': spaced }"
    :data-testid="testId || undefined">
    <div
      v-if="$slots['label-append'] || lockLabel"
      class="form-field__head">
      <FormFieldLabel v-if="displayLabel" :label="displayLabel" />
      <span
        v-if="lockLabel"
        class="form-field__admin-lock"
        :data-testid="lockTestId || undefined">
        <q-icon name="lock" size="12px" />
        {{ lockLabel }}
        <q-tooltip v-if="lockHint">
          {{ lockHint }}
        </q-tooltip>
      </span>
      <slot name="label-append" />
    </div>
    <FormFieldLabel
      v-else-if="displayLabel"
      :label="displayLabel"
    />
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
import FormFieldLabel from './FormFieldLabel.vue'
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

const displayLabel = computed(() => {
  if (!props.label) {
    return ''
  }
  return props.required
    ? formatRequiredFieldLabel(props.label)
    : props.label
})
</script>
