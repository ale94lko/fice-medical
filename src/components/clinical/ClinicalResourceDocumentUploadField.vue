<template>
  <div
    class="clinical-resource-document-upload"
    :class="{ 'clinical-resource-document-upload--readonly': readonly }">
    <p class="clinical-resource-document-upload__label text-weight-medium">
      {{ label }}
    </p>
    <div
      class="clinical-resource-document-upload__dropzone"
      :class="{
        'clinical-resource-document-upload__dropzone--error': Boolean(error),
        'clinical-resource-document-upload__dropzone--drag': dragActive,
      }"
      :data-testid="testId"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @click="onBrowseClick">
      <q-icon name="cloud_upload" size="32px" color="primary" />
      <p class="clinical-resource-document-upload__hint text-body2 q-mb-none">
        <template v-if="readonly">
          {{ fileName || t('clinicalResourceDocumentNoFile') }}
        </template>
        <template v-else>
          {{ t('clinicalResourceDocumentUploadHint') }}
        </template>
      </p>
      <p
        v-if="!readonly"
        class="clinical-resource-document-upload__formats
          text-caption text-grey-7">
        {{ t('clinicalResourceDocumentFormats') }}
      </p>
      <p
        v-if="fileName"
        class="clinical-resource-document-upload__filename text-caption">
        {{ fileName }}
      </p>
      <q-btn
        v-if="fileName && !readonly"
        flat
        dense
        no-caps
        color="primary"
        class="q-mt-sm"
        :label="t('clinicalResourceDocumentRemove')"
        @click.stop="onRemove"
      />
      <input
        ref="fileInputRef"
        type="file"
        class="clinical-resource-document-upload__input"
        :accept="acceptAttr"
        @change="onFileInput"
      />
    </div>
    <div v-if="error" class="form-field__error">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { clinicalResourceDocumentExtensions } from 'components/constants.js'

const props = defineProps({
  modelValue: {
    type: File,
    default: null,
  },
  existingFileName: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  readonly: {
    type: Boolean,
    default: false,
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

const acceptAttr = clinicalResourceDocumentExtensions.join(',')
const fileName = computed(() =>
  props.modelValue?.name || props.existingFileName || '',
)

function onBrowseClick() {
  if (props.readonly) {
    return
  }
  fileInputRef.value?.click?.()
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
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    emit('update:modelValue', file)
  }
}

function onFileInput(event) {
  const file = event.target?.files?.[0]
  if (file) {
    emit('update:modelValue', file)
  }
  if (event.target) {
    event.target.value = ''
  }
}

function onRemove() {
  emit('update:modelValue', null)
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.clinical-resource-document-upload {
  &__label {
    margin-bottom: 8px;
    color: $text-strong;
  }

  &__dropzone {
    border: 1px dashed $border-subtle;
    border-radius: $radius-md;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    background: $surface;

    &--error {
      border-color: $negative;
    }

    &--drag {
      border-color: $primary;
      background: rgba($primary, 0.04);
    }
  }

  &__input {
    display: none;
  }

  &__filename {
    margin-top: 8px;
    color: $text-strong;
  }

  &--readonly &__dropzone {
    cursor: default;
  }
}
</style>
