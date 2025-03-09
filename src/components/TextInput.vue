<template>
  <q-input outlined v-model="model" :type="props.type" :label="props.label">
    <template v-slot:prepend v-if="iconLeft">
      <q-icon :name="iconLeft" />
    </template>
  </q-input>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'text',
  },
  label: {
    type: String,
    default: 'text',
  },
  iconLeft: {
    type: String,
    default: '',
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
