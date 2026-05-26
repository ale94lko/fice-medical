<template>
  <span class="app-subtenant__icon-badge" aria-hidden="true">
    <q-icon name="corporate_fare" size="18px" />
  </span>
  <span class="app-subtenant__name">{{ name }}</span>
  <q-icon
    v-if="showChevron"
    class="app-subtenant__chevron"
    name="expand_more"
    size="20px"
    aria-hidden="true"
  />
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  showChevron: {
    type: Boolean,
    default: false,
  },
})
</script>
