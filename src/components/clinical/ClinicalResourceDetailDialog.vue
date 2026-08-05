<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog clinical-resource-detail-dialog app-dialog-card"
      :data-testid="clinicalResourceTestIds.detailDialog">
      <AppDialogHeader :close-label="t('close')" @close="onClose">
        {{ resource?.title || t('clinicalResourceDetailTitle') }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ resource?.category || '—' }}
        </p>

        <div
          v-if="resource?.keywords?.length"
          class="row q-gutter-xs q-mb-md">
          <q-chip
            v-for="keyword in resource.keywords"
            :key="keyword"
            dense
            color="grey-2"
            text-color="grey-8">
            {{ keyword }}
          </q-chip>
        </div>

        <div
          class="clinical-resource-detail-dialog__content text-body1"
          v-html="formattedContent"
        />
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('close')"
          @click="onClose"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="downloading"
          :disable="previewing"
          :label="t('clinicalResourceDownloadDocument')"
          @click="onDownload"
        />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :loading="previewing"
          :disable="downloading"
          :label="t('clinicalResourcePreviewDocument')"
          @click="onPreview"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import {
  downloadClinicalResourceDocumentFile,
  previewClinicalResourceDocument,
} from 'src/utils/clinical-resource-document-actions.js'
import { clinicalResourceTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  resource: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const $q = useQuasar()
const downloading = ref(false)
const previewing = ref(false)

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const formattedContent = computed(() => {
  const raw = String(props.resource?.content ?? '').trim()
  if (!raw) {
    return `<p>${t('clinicalResourceNoContent')}</p>`
  }
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')

  return `<p>${escaped}</p>`
})

function onClose() {
  open.value = false
}

async function onDownload() {
  if (!props.resource?.id || downloading.value || previewing.value) {
    return
  }
  downloading.value = true
  try {
    await downloadClinicalResourceDocumentFile(props.resource.id, {
      t,
      $q,
      fileName: props.resource?.documentFileName || '',
    })
  } finally {
    downloading.value = false
  }
}

async function onPreview() {
  if (!props.resource?.id || downloading.value || previewing.value) {
    return
  }
  previewing.value = true
  try {
    await previewClinicalResourceDocument(props.resource.id, { t, $q })
  } finally {
    previewing.value = false
  }
}
</script>

<style lang="scss" scoped>
.clinical-resource-detail-dialog {
  &__content {
    white-space: normal;
    line-height: 1.5;
  }
}
</style>
