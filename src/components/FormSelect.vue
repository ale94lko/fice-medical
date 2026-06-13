<template>
  <q-select
    v-bind="forwardedAttrs"
    :model-value="modelValue"
    :data-testid="resolvedTestId"
    :clearable="showClearable"
    @update:model-value="onUpdate"
  />
</template>

<script setup>
import { computed, useAttrs } from 'vue'
import { hasSelectValue, isEmpty } from 'src/utils/base.js'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  modelValue: {
    default: null,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  testId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const attrs = useAttrs()

const forwardedAttrs = computed(() => {
  const rest = { ...attrs }
  delete rest['data-testid']
  delete rest.testId

  return rest
})

const resolvedTestId = computed(
  () => props.testId || attrs['data-testid'] || attrs.testId || undefined,
)

const showClearable = computed(
  () => props.clearable && hasSelectValue(props.modelValue),
)

function onUpdate(value) {
  if (isEmpty(value)) {
    emit('update:modelValue', null)

    return
  }
  emit('update:modelValue', value)
}
</script>
