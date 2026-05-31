<template>
  <q-select
    v-bind="forwardedAttrs"
    :model-value="modelValue"
    :clearable="showClearable"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup>
import { computed, useAttrs } from 'vue'
import { hasSelectValue } from 'src/utils/select-field.js'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  modelValue: {
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const attrs = useAttrs()

const wantsClearable = computed(() => Boolean(attrs.clearable))

const forwardedAttrs = computed(() => {
  const rest = { ...attrs }
  delete rest.clearable

  return rest
})

const showClearable = computed(
  () => wantsClearable.value && hasSelectValue(props.modelValue),
)
</script>
