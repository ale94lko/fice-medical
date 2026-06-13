<template>
  <div
    class="section-heading"
    role="heading"
    aria-level="2">
    <span class="section-icon" aria-hidden="true">
      <q-icon :name="icon" size="20px" />
    </span>
    <span class="section-title-text">{{ title }}</span>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
})
</script>
