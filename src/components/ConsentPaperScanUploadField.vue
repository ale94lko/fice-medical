<template>
  <div
    class="consent-paper-scan-upload"
    :class="{
      'consent-paper-scan-upload--error': Boolean(displayError),
    }">
    <div
      class="consent-paper-scan-upload__dropzone"
      :class="{
        'consent-paper-scan-upload__dropzone--error':
          Boolean(displayError),
        'consent-paper-scan-upload__dropzone--drag': dragActive,
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
        class="consent-paper-scan-upload__icon"
      />
      <div class="consent-paper-scan-upload__copy">
        <p class="consent-paper-scan-upload__hint text-body2 q-mb-none">
          {{ t('clientConsentPaperDropHint') }}
        </p>
        <p
          class="consent-paper-scan-upload__formats text-caption
            text-grey-7 q-mb-none">
          {{ t('clientConsentPaperFormats') }}
        </p>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        class="consent-paper-scan-upload__input"
        :accept="acceptAttr"
        @change="onFileInput"
      />
    </div>
    <ul
      v-if="modelValue"
      class="consent-paper-scan-upload__list">
      <li class="consent-paper-scan-upload__item row items-center
        no-wrap">
        <q-icon
          name="attach_file"
          size="18px"
          class="consent-paper-scan-upload__file-icon"
        />
        <span class="consent-paper-scan-upload__name col text-body2">
          {{ modelValue.name }}
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ modelValue.name }}
          </q-tooltip>
        </span>
        <q-btn
          flat
          round
          dense
          icon="delete"
          color="grey-7"
          :data-testid="clientConsentsTestIds.paperScanRemove"
          :aria-label="t('delete')"
          @click.stop="onRemove"
        />
      </li>
    </ul>
    <div
      v-if="displayError"
      class="form-field__error consent-paper-scan-upload__error"
      role="alert">
      {{ displayError }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  consentPaperScanExtensions,
  consentPaperScanMimeTypes,
  storedFileMaxBytes,
} from 'components/constants.js'
import { clientConsentsTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: File,
    default: null,
  },
  error: {
    type: String,
    default: '',
  },
  testId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const fileInputRef = ref(null)
const dragActive = ref(false)
const localError = ref('')

const acceptAttr = computed(() => [
  ...consentPaperScanExtensions.map(ext => `.${ext}`),
  ...consentPaperScanMimeTypes,
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

function isAllowedFile(file) {
  const type = String(file?.type ?? '').trim().toLowerCase()
  const ext = fileExtension(file?.name)
  const extOk = Boolean(ext)
    && consentPaperScanExtensions.includes(ext)
  const mimeOk = Boolean(type)
    && consentPaperScanMimeTypes.includes(type)

  return extOk || mimeOk
}

function validateFile(file) {
  if (!file) {
    return t('clientConsentPaperTypeError')
  }
  if (!isAllowedFile(file)) {
    return t('clientConsentPaperTypeError')
  }
  if (file.size > storedFileMaxBytes) {
    return t('clientConsentPaperSizeError')
  }

  return ''
}

function applyFile(file) {
  const message = validateFile(file)
  localError.value = message
  if (message) {
    return
  }
  emit('update:modelValue', file)
}

function onBrowseClick() {
  fileInputRef.value?.click()
}

function onFileInput(event) {
  const file = Array.from(event.target.files ?? [])[0] ?? null
  if (file) {
    applyFile(file)
  }
  event.target.value = ''
}

function onDragEnter() {
  dragActive.value = true
}

function onDragOver() {
  dragActive.value = true
}

function onDragLeave() {
  dragActive.value = false
}

function onDrop(event) {
  dragActive.value = false
  const file = Array.from(event.dataTransfer?.files ?? [])[0] ?? null
  if (file) {
    applyFile(file)
  }
}

function onRemove() {
  localError.value = ''
  emit('update:modelValue', null)
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.consent-paper-scan-upload__dropzone {
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

.consent-paper-scan-upload__icon {
  flex-shrink: 0;
}

.consent-paper-scan-upload__copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.consent-paper-scan-upload__hint {
  color: $text-strong;
  line-height: 1.35;
}

.consent-paper-scan-upload__formats {
  line-height: 1.3;
}

.consent-paper-scan-upload__input {
  display: none;
}

.consent-paper-scan-upload__list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
}

.consent-paper-scan-upload__item {
  gap: 6px;
  min-width: 0;
  padding: 4px 0;
}

.consent-paper-scan-upload__file-icon {
  flex-shrink: 0;
  color: $text-muted;
}

.consent-paper-scan-upload__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.consent-paper-scan-upload__error {
  margin-top: 6px;
}
</style>
