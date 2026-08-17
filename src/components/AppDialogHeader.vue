<template>
  <q-toolbar class="app-dialog-toolbar">
    <q-toolbar-title class="app-dialog-toolbar__title">
      <div class="app-dialog-toolbar__title-row row items-center no-wrap">
        <div class="app-dialog-toolbar__title-text">
          <slot />
        </div>
        <q-btn
          v-if="info"
          flat
          round
          dense
          icon="help_outline"
          class="app-dialog-toolbar__info q-ml-xs"
          :data-testid="resolvedInfoTestId"
          :aria-label="info">
          <q-tooltip
            class="app-dialog-info-tooltip"
            anchor="bottom middle"
            self="top middle"
            :offset="[0, 8]">
            {{ info }}
          </q-tooltip>
        </q-btn>
      </div>
    </q-toolbar-title>
    <q-space />
    <slot name="before-close" />
    <q-btn
      v-close-popup
      flat
      round
      dense
      icon="close"
      class="app-dialog-toolbar__close"
      :data-testid="resolvedCloseTestId"
      :aria-label="closeLabel"
      @click="emit('close')"
    />
  </q-toolbar>
</template>

<script setup>
import { computed } from 'vue'
import { toTestId } from 'src/utils/base.js'

const props = defineProps({
  closeLabel: {
    type: String,
    default: 'Close',
  },
  info: {
    type: String,
    default: '',
  },
  testId: {
    type: String,
    default: 'dialog',
  },
  closeTestId: {
    type: String,
    default: '',
  },
  infoTestId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])

const resolvedCloseTestId = computed(() =>
  props.closeTestId || toTestId(props.testId, 'btn-close'),
)
const resolvedInfoTestId = computed(() =>
  props.infoTestId || toTestId(props.testId, 'btn-info'),
)
</script>
