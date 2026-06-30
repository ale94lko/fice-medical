<template>
  <div
    v-if="visible"
    class="calendar-time-now"
    :style="lineStyle"
    aria-hidden="true"
  />
</template>

<script setup>
defineProps({
  lineStyle: { type: Object, required: true },
  visible: { type: Boolean, default: true },
})
</script>
