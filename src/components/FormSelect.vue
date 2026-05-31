<template>
  <q-select
    v-bind="forwardedAttrs"
    :model-value="modelValue"
    :clearable="showClearable"
    @update:model-value="onUpdate"
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
  /** When true, shows clear icon only while a value is selected. */
  clearable: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const attrs = useAttrs()

const forwardedAttrs = computed(() => ({ ...attrs }))

const showClearable = computed(
  () => props.clearable && hasSelectValue(props.modelValue),
)

function onUpdate(value) {
  if (value === '' || value === undefined) {
    emit('update:modelValue', null)

    return
  }
  emit('update:modelValue', value)
}
</script>
