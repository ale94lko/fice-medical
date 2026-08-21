<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="modalTestIds.dialog(tid.previewDialog)"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card
      client-attachment-preview-dialog">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onClose">
        {{ title }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div
          v-if="loading"
          class="row flex-center q-py-xl">
          <AppBrandLoading inline />
        </div>
        <div
          v-else-if="error"
          class="text-body2 text-negative q-py-md">
          {{ error }}
        </div>
        <img
          v-else-if="isImage && blobUrl"
          :src="blobUrl"
          class="client-attachment-preview-dialog__image"
          :alt="title"
        />
        <iframe
          v-else-if="isPdf && blobUrl"
          :src="blobUrl"
          class="client-attachment-preview-dialog__frame"
          title="preview"
        />
        <p
          v-else
          class="text-body2 text-grey-7 q-mb-none">
          {{ t('clientAttachmentPreviewUnsupported') }}
        </p>
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="modalTestIds.cancel(tid.previewDialog)"
          :label="t('close')"
          @click="onClose"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppBrandLoading from 'components/AppBrandLoading.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import { clientAttachmentsTestIds as tid, modalTestIds } from
  'src/test-ids/index.js'
import {
  fetchStoredFileBlob,
  revokeStoredFileImageSrc,
} from 'src/utils/stored-file-api.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  file: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const loading = ref(false)
const error = ref('')
const blobUrl = ref('')

const title = computed(() =>
  props.file?.originalFilename
  || props.file?.name
  || t('clientAttachmentPreview'),
)

const contentType = computed(() =>
  String(props.file?.contentType ?? '').trim().toLowerCase(),
)

const isImage = computed(() => contentType.value.startsWith('image/'))
const isPdf = computed(() => contentType.value === 'application/pdf')

function clearBlob() {
  const externalUrl = props.file?.previewUrl || props.file?.url
  if (blobUrl.value && blobUrl.value !== externalUrl) {
    revokeStoredFileImageSrc(blobUrl.value)
  }
  blobUrl.value = ''
}

async function loadPreview() {
  clearBlob()
  error.value = ''
  const externalUrl = props.file?.previewUrl || props.file?.url
  if (externalUrl) {
    blobUrl.value = externalUrl

    return
  }
  if (!props.file?.id) {
    return
  }
  loading.value = true
  try {
    const blob = await fetchStoredFileBlob(props.file.id, true)
    blobUrl.value = URL.createObjectURL(blob)
  } catch (err) {
    if (!isAuthSessionEndUIError(err)) {
      error.value = t('clientAttachmentPreviewError')
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => [open.value, props.file?.id],
  ([isOpen]) => {
    if (isOpen) {
      void loadPreview()

      return
    }
    clearBlob()
    error.value = ''
  },
)

function onClose() {
  open.value = false
}
</script>

<style lang="scss" scoped>
.client-attachment-preview-dialog {
  min-width: min(720px, 96vw);
}

.client-attachment-preview-dialog__image {
  display: block;
  max-width: 100%;
  max-height: 70vh;
  margin: 0 auto;
}

.client-attachment-preview-dialog__frame {
  width: 100%;
  height: 70vh;
  border: 0;
}
</style>
