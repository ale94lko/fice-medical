<template>
  <q-input outlined v-model="model" :type="props.type" :label="props.label" />
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  type: {
    type: String,
    default: 'text',
  },
  label: {
    type: String,
    default: 'text',
  },
})

const model = ref('')
</script>

<style scoped>
  .q-input {
    min-width: 120px;
    margin-bottom: 10px;
  }
</style>
