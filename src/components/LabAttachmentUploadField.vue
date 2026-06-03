<template>
  <div
    class="insurance-card-upload lab-attachment-upload"
    :class="{ 'insurance-card-upload--readonly': readonly }">
    <p class="insurance-card-upload__label text-weight-medium">
      {{ label || t('labAttachmentsTitle') }}
    </p>
    <div
      class="insurance-card-upload__dropzone"
      :class="{
        'insurance-card-upload__dropzone--error': Boolean(displayError),
        'insurance-card-upload__dropzone--drag': dragActive,
      }"
      :data-testid="testId"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @click="onBrowseClick">
      <q-icon name="cloud_upload" size="32px" color="primary" />
      <p class="insurance-card-upload__hint text-body2 q-mb-none">
        {{
          readonly
            ? t('labAttachmentsReadonlyHint')
            : t('labAttachmentsHint')
        }}
      </p>
      <p
        v-if="!readonly"
        class="insurance-card-upload__formats text-caption text-grey-7">
        {{ t('labAttachmentsFormats') }}
      </p>
      <input
        ref="fileInputRef"
        type="file"
        class="insurance-card-upload__input"
        :accept="acceptAttr"
        multiple
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
          v-else
          flat
          round
          dense
          icon="download"
          color="grey-7"
          :aria-label="t('labActionDownload')"
          @click.stop="emit('download', file.id)"
        />
      </li>
    </ul>
    <div v-if="displayError" class="form-field__error">
      {{ displayError }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  labAttachmentMimeTypes,
  labMaxAttachmentBytes,
} from 'components/constants.js'

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

const acceptAttr = computed(() => labAttachmentMimeTypes.join(','))

const displayError = computed(() => props.error || localError.value)

function validateFile(file) {
  if (!labAttachmentMimeTypes.includes(file.type)) {
    localError.value = t('labAttachmentTypeError')

    return false
  }
  if (file.size > labMaxAttachmentBytes) {
    localError.value = t('labAttachmentSizeError')

    return false
  }
  localError.value = ''

  return true
}

function processFiles(fileList) {
  for (const file of fileList) {
    if (validateFile(file)) {
      emit('upload', file)
    }
  }
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
.lab-attachment-upload__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.lab-attachment-upload__item {
  padding: 6px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
