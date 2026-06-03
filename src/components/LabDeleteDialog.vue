<template>
  <q-dialog v-model="open" persistent>
    <q-card class="app-dialog-card app-dialog-card--sm">
      <q-card-section>
        <div class="text-h6">{{ t('labDeleteTitle') }}</div>
        <p class="text-body2 text-grey-7 q-mb-none">
          {{ t('labDeleteMessage') }}
        </p>
      </q-card-section>
      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          :label="t('cancel')"
          @click="open = false"
        />
        <q-btn
          no-caps
          unelevated
          color="negative"
          :label="t('delete')"
          :data-testid="tid.modalConfirm('lab-delete')"
          @click="onConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { modalTestIds as tid } from 'src/test-ids/index.js'

const open = defineModel({ type: Boolean, default: false })

const emit = defineEmits(['confirm'])

const { t } = useI18n()

function onConfirm() {
  emit('confirm')
  open.value = false
}
</script>
