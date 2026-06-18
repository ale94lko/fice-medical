<template>
  <div
    class="insurance-card-upload referral-document-upload"
    :class="{ 'insurance-card-upload--readonly': readonly }">
    <div
      class="referral-document-upload__dropzone"
      :class="{
        'referral-document-upload__dropzone--error': Boolean(displayError),
        'referral-document-upload__dropzone--drag': dragActive,
        'referral-document-upload__dropzone--disabled': readonly,
      }"
      :data-testid="testId"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @click="onBrowseClick">
      <q-icon name="cloud_upload" size="36px" color="primary" />
      <button
        type="button"
        class="referral-document-upload__link"
        :disabled="readonly"
        @click.stop="onBrowseClick">
        {{ t('referralUploadDocument') }}
      </button>
      <p class="referral-document-upload__formats text-caption text-grey-7">
        {{ t('referralDocumentsFormats') }}
      </p>
      <p
        v-if="hint"
        class="referral-document-upload__hint text-caption text-grey-7">
        {{ hint }}
      </p>
      <input
        ref="fileInputRef"
        type="file"
        class="insurance-card-upload__input"
        :accept="acceptAttr"
        @change="onFileInput"
      />
    </div>
    <ul v-if="attachments.length" class="lab-attachment-upload__list q-mt-sm">
      <li
        v-for="file in attachments"
        :key="file.id"
        class="lab-attachment-upload__item row items-center">
        <q-icon name="attach_file" size="18px" class="q-mr-sm" />
        <span class="col text-body2">{{ file.name }}</span>
        <q-btn
          v-if="!readonly"
          flat
          round
          dense
          icon="delete"
          color="grey-7"
          :aria-label="t('delete')"
          @click.stop="emit('remove', file.id)"
        />
        <q-btn
          flat
          round
          dense
          icon="download"
          color="grey-7"
          :aria-label="t('referralActionDownload')"
          @click.stop="emit('download', file.id)"
        />
      </li>
    </ul>
    <div v-if="uploading" class="row items-center q-mt-sm text-grey-7">
      <q-spinner size="20px" color="primary" class="q-mr-sm" />
      <span class="text-body2">{{ t('referralDocumentUploading') }}</span>
    </div>
    <div v-if="displayError" class="form-field__error">
      {{ displayError }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  referralDocumentExtensions,
  referralDocumentMimeTypes,
  referralMaxDocumentBytes,
} from 'components/constants.js'

const props = defineProps({
  attachments: {
    type: Array,
    default: () => [],
  },
  hint: {
    type: String,
    default: '',
  },
  error: {
    type: String,
    default: '',
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  uploading: {
    type: Boolean,
    default: false,
  },
  testId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['upload', 'download', 'remove'])

const { t } = useI18n()
const fileInputRef = ref(null)
const dragActive = ref(false)
const localError = ref('')

const acceptAttr = referralDocumentExtensions.join(',')
const displayError = computed(() => props.error || localError.value)

function validateFile(file) {
  if (!file) {
    return t('referralDocumentInvalid')
  }
  if (file.size > referralMaxDocumentBytes) {
    return t('referralDocumentTooLarge')
  }
  const type = String(file.type ?? '').toLowerCase()
  const name = String(file.name ?? '').toLowerCase()
  const extOk = referralDocumentExtensions.some(ext => name.endsWith(ext))
  const mimeOk = !type || referralDocumentMimeTypes.includes(type)
  if (!extOk && !mimeOk) {
    return t('referralDocumentTypeInvalid')
  }

  return ''
}

function emitFile(file) {
  const message = validateFile(file)
  if (message) {
    localError.value = message

    return
  }
  localError.value = ''
  emit('upload', file)
}

function onBrowseClick() {
  if (props.readonly || props.uploading) {
    return
  }
  fileInputRef.value?.click?.()
}

function onFileInput(event) {
  const file = event?.target?.files?.[0]
  if (file) {
    emitFile(file)
  }
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function onDragEnter() {
  if (!props.readonly) {
    dragActive.value = true
  }
}

function onDragOver() {
  if (!props.readonly) {
    dragActive.value = true
  }
}

function onDragLeave() {
  dragActive.value = false
}

function onDrop(event) {
  dragActive.value = false
  if (props.readonly || props.uploading) {
    return
  }
  const file = event?.dataTransfer?.files?.[0]
  if (file) {
    emitFile(file)
  }
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.referral-document-upload__dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 140px;
  padding: 24px;
  border: 2px dashed $border-subtle;
  border-radius: 10px;
  background: #fafafa;
  cursor: pointer;
  text-align: center;

  &--disabled {
    cursor: default;
    opacity: 0.75;
  }

  &--drag {
    border-color: $primary;
    background: #f0fdfa;
  }

  &--error {
    border-color: $negative;
  }
}

.referral-document-upload__link {
  border: 0;
  background: transparent;
  color: $primary;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
}

.referral-document-upload__formats,
.referral-document-upload__hint {
  margin: 0;
}
</style>
