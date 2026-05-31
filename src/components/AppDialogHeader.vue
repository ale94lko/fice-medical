<template>
  <q-toolbar class="app-dialog-toolbar">
    <q-toolbar-title>
      <slot />
    </q-toolbar-title>
    <q-space />
    <q-btn
      v-close-popup
      flat
      round
      dense
      icon="close"
      class="app-dialog-toolbar__close"
      :aria-label="closeLabel"
      @click="emit('close')"
    />
  </q-toolbar>
</template>

<script setup>
defineProps({
  closeLabel: {
    type: String,
    default: 'Close',
  },
})

const emit = defineEmits(['close'])
</script>
