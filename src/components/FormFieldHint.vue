<template>
  <p class="form-field__hint" :class="hintClass">
    <q-icon
      name="info_outline"
      size="14px"
      class="form-field__hint-icon"
    />
    <span class="form-field__hint-content">
      <slot />
    </span>
  </p>
</template>

<script setup>
defineProps({
  hintClass: {
    type: String,
    default: '',
  },
})
</script>
