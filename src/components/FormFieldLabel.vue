<template>
  <label v-if="label" class="form-field__label">
    <slot>{{ label }}</slot>
  </label>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: '',
  },
})
</script>
