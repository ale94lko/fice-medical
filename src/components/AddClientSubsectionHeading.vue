<template>
  <div class="add-client-form__subsection-heading">
    <q-icon :name="icon" size="18px" aria-hidden="true" />
    <span>{{ title }}</span>
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
