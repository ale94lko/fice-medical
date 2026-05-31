<template>
  <div
    class="insurance-card-upload"
    :class="{ 'insurance-card-upload--readonly': readonly }">
    <p class="insurance-card-upload__label text-weight-medium">
      {{ label }}
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
        <template v-if="readonly">
          {{ fileName || t('insuranceCardNoFile') }}
        </template>
        <template v-else>
          {{ t('insuranceCardUploadHint') }}
        </template>
      </p>
      <p
        v-if="!readonly"
        class="insurance-card-upload__formats text-caption text-grey-7">
        {{ t('insuranceCardFormats') }}
      </p>
      <p
        v-if="fileName && !readonly"
        class="insurance-card-upload__filename text-caption">
        {{ fileName }}
      </p>
      <q-btn
        v-if="fileName && !readonly"
        flat
        dense
        no-caps
        color="primary"
        class="q-mt-sm"
        :label="t('insuranceCardRemove')"
        @click.stop="onRemove"
      />
      <input
        ref="fileInputRef"
        type="file"
        class="insurance-card-upload__input"
        :accept="acceptAttr"
        @change="onFileInput"
      />
    </div>
    <div
      v-if="displayError"
      class="form-field__error">
      {{ displayError }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  clientInsuranceCardMimeTypes,
  clientInsuranceMaxCardFileBytes,
} from 'components/constants.js'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null,
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

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const fileInputRef = ref(null)
const dragActive = ref(false)
const localError = ref('')

const acceptAttr = '.png,.jpg,.jpeg,.pdf'

const fileName = computed(() => {
  if (props.modelValue?.errorKey) {
    return ''
  }

  return props.modelValue?.name ?? ''
})

const displayError = computed(() => {
  if (props.error) {
    return props.error
  }
  if (localError.value) {
    return localError.value
  }
  if (props.modelValue?.errorKey) {
    return t(props.modelValue.errorKey)
  }

  return ''
})

function onBrowseClick() {
  if (props.readonly) {
    return
  }
  fileInputRef.value?.click()
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
    assignFile(file)
  }
}

function onFileInput(event) {
  const file = event.target?.files?.[0]
  if (file) {
    assignFile(file)
  }
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function assignFile(file) {
  localError.value = ''
  if (!clientInsuranceCardMimeTypes.includes(file.type)) {
    localError.value = t('insuranceCardFileType')

    return
  }
  if (file.size > clientInsuranceMaxCardFileBytes) {
    localError.value = t('insuranceCardFileSize')

    return
  }
  emit('update:modelValue', {
    name: file.name,
    size: file.size,
    type: file.type,
    file,
  })
}

function onRemove() {
  emit('update:modelValue', null)
}
</script>
