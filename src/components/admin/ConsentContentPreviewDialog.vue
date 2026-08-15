<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="modalTestIds.dialog('consent-content-preview')"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onClose">
        {{ title || t('consentContentPreviewTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div
          class="consent-content-preview"
          v-html="safeHtml"
        />
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('close')"
          @click="onClose"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import { modalTestIds } from 'src/test-ids/index.js'
import { sanitizeHtml } from 'src/utils/sanitize-html.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  contentHtml: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const safeHtml = computed(() => sanitizeHtml(props.contentHtml))

function onClose() {
  open.value = false
}
</script>

<style lang="scss" scoped>
.consent-content-preview {
  max-height: 60vh;
  overflow: auto;
  line-height: 1.5;
}
</style>
