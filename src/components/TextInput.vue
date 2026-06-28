<template>
  <FormInput
    v-model="model"
    v-bind="forwardedAttrs"
    :disable="isDisabled"
  />
</template>

<script setup>
import { computed, useAttrs } from 'vue'
import FormInput from './FormInput.vue'

const props = defineProps({
  readonly: {
    type: Boolean,
    default: false,
  },
  disable: {
    type: Boolean,
    default: false,
  },
})

const model = defineModel({ type: String, default: '' })
const attrs = useAttrs()

const isDisabled = computed(() =>
  props.readonly || props.disable || attrs.readonly === true,
)

const forwardedAttrs = computed(() => {
  const next = { ...attrs }
  delete next.readonly
  delete next.disable

  return next
})
</script>
