<template>
  <span
    class="vitals-history-status"
    :class="statusClass"
    :tabindex="showStatus ? 0 : undefined"
    :aria-label="showStatus ? tooltipText : undefined">
    <span class="vitals-history-status__value">{{ display }}</span>
    <q-tooltip
      v-if="showStatus"
      anchor="top middle"
      self="bottom middle">
      {{ tooltipText }}
    </q-tooltip>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: [String, Number],
    default: '',
  },
  modifier: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
})

const display = computed(() => {
  if (props.value == null || props.value === '') {
    return '—'
  }

  return String(props.value)
})

const showStatus = computed(() =>
  Boolean(
    props.modifier
    && props.modifier !== 'empty'
    && props.label
    && display.value !== '—',
  ),
)

const statusClass = computed(() => {
  if (!showStatus.value) {
    return 'vitals-history-status--plain'
  }

  return `vitals-history-status--${props.modifier}`
})

const tooltipText = computed(() => props.label || '')
</script>
