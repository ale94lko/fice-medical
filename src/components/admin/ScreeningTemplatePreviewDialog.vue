<template>
  <q-dialog
    v-model="open"
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog screening-template-preview-dialog app-dialog-card"
      :data-testid="screeningTemplateDialogTestIds.previewDialog">
      <AppDialogHeader :close-label="t('close')" @close="open = false">
        {{ t('screeningTemplatePreviewTitle') }}
      </AppDialogHeader>

      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md
          screening-template-preview-dialog__body">
        <ScreeningTemplatePreview v-if="template" :template="template" />
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('close')"
          @click="open = false"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import ScreeningTemplatePreview from
  'components/admin/ScreeningTemplatePreview.vue'
import { screeningTemplateDialogTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  template: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
</script>

<style lang="scss" scoped>
.screening-template-preview-dialog {
  &__body {
    max-height: min(78vh, 760px);
    overflow-y: auto;
  }
}
</style>
