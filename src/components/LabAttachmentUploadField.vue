<template>
  <div
    class="lab-attachment-upload"
    :class="{
      'lab-attachment-upload--readonly': readonly,
      'lab-attachment-upload--error': Boolean(displayError),
    }">
    <p
      v-if="label"
      class="lab-attachment-upload__label text-weight-medium">
      {{ label }}
    </p>
    <div
      class="lab-attachment-upload__dropzone"
      :class="{
        'lab-attachment-upload__dropzone--error': Boolean(displayError),
        'lab-attachment-upload__dropzone--drag': dragActive,
      }"
      :data-testid="testId"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @click="onBrowseClick">
      <q-icon
        name="cloud_upload"
        size="22px"
        :color="displayError ? 'negative' : 'primary'"
        class="lab-attachment-upload__icon"
      />
      <div class="lab-attachment-upload__copy">
        <p class="lab-attachment-upload__hint text-body2 q-mb-none">
          {{
            readonly
              ? t('labAttachmentsReadonlyHint')
              : t('labAttachmentsHint')
          }}
        </p>
        <p
          v-if="!readonly"
          class="lab-attachment-upload__formats text-caption
            text-grey-7 q-mb-none">
          {{ t('labAttachmentsFormats') }}
        </p>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        class="lab-attachment-upload__input"
        :accept="acceptAttr"
        multiple
        @change="onFileInput"
      />
    </div>
    <ul v-if="attachments.length" class="lab-attachment-upload__list">
      <li
        v-for="file in attachments"
        :key="file.id"
        class="lab-attachment-upload__item row items-center no-wrap">
        <q-icon
          name="attach_file"
          size="18px"
          class="lab-attachment-upload__file-icon"
        />
        <span class="lab-attachment-upload__name col text-body2">
          {{ file.name }}
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ file.name }}
          </q-tooltip>
        </span>
        <q-btn
          v-if="!readonly"
          flat
          round
          dense
          icon="delete"
          color="grey-7"
          :aria-label="t('delete')"
          :data-testid="labTid.attachmentRemove"
          @click.stop="emit('remove', file.id)"
        />
        <q-btn
          v-else
          flat
          round
          dense
          icon="download"
          color="grey-7"
          :aria-label="t('labActionDownload')"
          :data-testid="labTid.attachmentDownload"
          @click.stop="emit('download', file.id)"
        />
      </li>
    </ul>
    <div
      v-if="displayError"
      class="form-field__error lab-attachment-upload__error"
      role="alert">
      {{ displayError }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  labAttachmentExtensions,
  labAttachmentMimeTypes,
  labMaxAttachmentBytes,
} from 'components/constants.js'
import { labTestIds as labTid } from 'src/test-ids/index.js'

const props = defineProps({
  attachments: {
    type: Array,
    default: () => [],
  },
  label: {
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
  testId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['upload', 'remove', 'download'])

const { t } = useI18n()

const fileInputRef = ref(null)
const dragActive = ref(false)
const localError = ref('')

const acceptAttr = computed(() => [
  ...labAttachmentExtensions.map(ext => `.${ext}`),
  ...labAttachmentMimeTypes,
].join(','))

const displayError = computed(() => props.error || localError.value)

function fileExtension(fileName) {
  const name = String(fileName ?? '').trim().toLowerCase()
  const dot = name.lastIndexOf('.')
  if (dot < 0 || dot === name.length - 1) {
    return ''
  }

  return name.slice(dot + 1)
}

function isAllowedLabAttachment(file) {
  const type = String(file?.type ?? '').trim().toLowerCase()
  const ext = fileExtension(file?.name)
  const extOk = Boolean(ext)
    && labAttachmentExtensions.includes(ext)
  const mimeOk = Boolean(type)
    && labAttachmentMimeTypes.includes(type)

  return extOk || mimeOk
}

function validateFile(file) {
  if (!file) {
    return t('labAttachmentTypeError')
  }
  if (!isAllowedLabAttachment(file)) {
    return t('labAttachmentTypeError')
  }
  if (file.size > labMaxAttachmentBytes) {
    return t('labAttachmentSizeError')
  }

  return ''
}

function processFiles(fileList) {
  let lastError = ''
  for (const file of fileList) {
    const message = validateFile(file)
    if (message) {
      lastError = message
      continue
    }
    emit('upload', file)
  }
  localError.value = lastError
}

function onBrowseClick() {
  if (props.readonly) {
    return
  }
  fileInputRef.value?.click()
}

function onFileInput(event) {
  processFiles(Array.from(event.target.files ?? []))
  event.target.value = ''
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
  if (props.readonly) {
    return
  }
  processFiles(Array.from(event.dataTransfer?.files ?? []))
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.lab-attachment-upload__label {
  margin: 0 0 8px;
  color: $text-strong;
}

.lab-attachment-upload__dropzone {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px dashed $border-subtle;
  border-radius: $radius-md;
  background: $surface;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    border-color: $primary;
    background: rgba($primary, 0.03);
  }

  &--drag {
    border-color: $primary;
    background: rgba($primary, 0.06);
  }

  &--error {
    border: 1px solid $negative;
    background: rgba($negative, 0.06);

    &:hover {
      border-color: $negative;
      background: rgba($negative, 0.08);
    }
  }
}

.lab-attachment-upload--readonly .lab-attachment-upload__dropzone {
  cursor: default;

  &:hover {
    border-color: $border-subtle;
    background: $surface;
  }
}

.lab-attachment-upload--readonly
  .lab-attachment-upload__dropzone--error:hover {
  border-color: $negative;
  background: rgba($negative, 0.06);
}

.lab-attachment-upload__icon {
  flex-shrink: 0;
}

.lab-attachment-upload__copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.lab-attachment-upload__hint {
  color: $text-strong;
  line-height: 1.35;
}

.lab-attachment-upload__formats {
  line-height: 1.3;
}

.lab-attachment-upload__input {
  display: none;
}

.lab-attachment-upload__list {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.lab-attachment-upload__item {
  gap: 4px;
  min-width: 0;
  padding: 4px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &:last-child {
    border-bottom: none;
  }
}

.lab-attachment-upload__file-icon {
  flex-shrink: 0;
  color: $text-muted;
}

.lab-attachment-upload__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lab-attachment-upload__error {
  margin-top: 6px;
}
</style>
