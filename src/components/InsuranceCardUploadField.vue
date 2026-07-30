<template>
  <div
    class="insurance-card-upload"
    :class="{ 'insurance-card-upload--readonly': readonly }">
    <p class="insurance-card-upload__label text-weight-medium">
      {{ label }}
    </p>

    <div
      v-if="mode === 'camera'"
      class="insurance-card-upload__camera">
      <div class="insurance-card-upload__viewport">
        <video
          ref="videoRef"
          class="insurance-card-upload__video"
          autoplay
          playsinline
          muted
        />
      </div>
      <div class="insurance-card-upload__camera-actions row q-gutter-sm">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :disable="cameraBusy"
          :label="t('cancel')"
          @click="cancelCamera"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :disable="cameraBusy || !streamReady"
          :label="t('insuranceCardCapture')"
          @click="capturePhoto"
        />
      </div>
    </div>

    <div
      v-else-if="hasPreview"
      class="insurance-card-upload__preview-wrap">
      <div class="insurance-card-upload__viewport">
        <img
          v-if="isImagePreview"
          :src="previewSrc"
          alt=""
          class="insurance-card-upload__preview-image"
        />
        <div
          v-else
          class="insurance-card-upload__pdf-preview">
          <q-icon name="picture_as_pdf" size="40px" color="primary" />
          <p class="text-body2 q-mb-none q-mt-sm">
            {{ fileName || t('insuranceCardNoFile') }}
          </p>
        </div>
      </div>
      <p
        v-if="fileName && isImagePreview"
        class="insurance-card-upload__filename text-caption q-mt-sm q-mb-none">
        {{ fileName }}
      </p>
      <div
        v-if="!readonly"
        class="insurance-card-upload__preview-actions row q-gutter-sm q-mt-sm">
        <q-btn
          no-caps
          outline
          dense
          color="primary"
          class="app-btn-outline"
          icon="photo_camera"
          :label="t('insuranceCardTakePhoto')"
          @click="startCamera"
        />
        <q-btn
          no-caps
          outline
          dense
          color="primary"
          class="app-btn-outline"
          icon="upload_file"
          :label="t('insuranceCardUploadFile')"
          @click="onBrowseClick"
        />
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          :label="t('insuranceCardRemove')"
          @click="onRemove"
        />
      </div>
    </div>

    <div
      v-else
      class="insurance-card-upload__dropzone"
      :class="{
        'insurance-card-upload__dropzone--error': Boolean(displayError),
        'insurance-card-upload__dropzone--drag': dragActive,
      }"
      :data-testid="testId"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop">
      <q-icon name="credit_card" size="32px" color="primary" />
      <p class="insurance-card-upload__hint text-body2 q-mb-sm">
        <template v-if="readonly">
          {{ t('insuranceCardNoFile') }}
        </template>
        <template v-else>
          {{ t('insuranceCardUploadHint') }}
        </template>
      </p>
      <p
        v-if="!readonly"
        class="insurance-card-upload__formats text-caption text-grey-7 q-mb-md">
        {{ t('insuranceCardFormats') }}
      </p>
      <div
        v-if="!readonly"
        class="insurance-card-upload__choice-actions row q-gutter-sm
          justify-center">
        <q-btn
          no-caps
          outline
          dense
          color="primary"
          class="app-btn-outline"
          icon="photo_camera"
          :label="t('insuranceCardTakePhoto')"
          @click.stop="startCamera"
        />
        <q-btn
          no-caps
          outline
          dense
          color="primary"
          class="app-btn-outline"
          icon="upload_file"
          :label="t('insuranceCardUploadFile')"
          @click.stop="onBrowseClick"
        />
      </div>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      class="insurance-card-upload__input"
      :accept="acceptAttr"
      @change="onFileInput"
    />

    <div
      v-if="displayError"
      class="form-field__error">
      {{ displayError }}
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  clientInsuranceCardMimeTypes,
  clientInsuranceMaxCardFileBytes,
  quasarNotifyTypes,
} from './constants.js'
import { useStoredFilePreview } from
  'src/composables/useStoredFilePreview.js'

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
const $q = useQuasar()

const fileInputRef = ref(null)
const videoRef = ref(null)
const dragActive = ref(false)
const localError = ref('')
const mode = ref('idle')
const cameraBusy = ref(false)
const streamReady = ref(false)
const stream = ref(null)
const objectPreviewUrl = ref('')

const acceptAttr = 'image/png,image/jpeg,.png,.jpg,.jpeg,.pdf'

const storedFileId = computed(() => {
  const id = Number(props.modelValue?.fileId)
  if (!Number.isFinite(id) || id <= 0) {
    return null
  }

  return id
})

const {
  previewSrc: storedPreviewSrc,
  loading: storedPreviewLoading,
} = useStoredFilePreview(storedFileId)

const fileName = computed(() => {
  if (props.modelValue?.errorKey) {
    return ''
  }
  if (props.modelValue?.name) {
    return props.modelValue.name
  }
  if (storedFileId.value) {
    return t('insuranceCardExistingFile')
  }

  return ''
})

const previewSrc = computed(() => {
  if (objectPreviewUrl.value) {
    return objectPreviewUrl.value
  }

  return storedPreviewSrc.value || ''
})

const hasPreview = computed(() =>
  Boolean(
    previewSrc.value
    || storedFileId.value
    || storedPreviewLoading.value
    || props.modelValue?.file,
  ),
)

const isImagePreview = computed(() => {
  if (props.modelValue?.file || props.modelValue?.type) {
    const type = String(props.modelValue.type ?? '')
    if (type) {
      return type.startsWith('image/')
    }
  }
  const url = String(previewSrc.value || '').toLowerCase()
  if (!url) {
    return Boolean(storedFileId.value)
  }
  if (url.startsWith('blob:')) {
    return true
  }
  if (url.includes('.pdf')) {
    return false
  }

  return true
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

function revokeObjectPreview() {
  if (objectPreviewUrl.value) {
    URL.revokeObjectURL(objectPreviewUrl.value)
    objectPreviewUrl.value = ''
  }
}

function syncObjectPreviewFromModel() {
  revokeObjectPreview()
  const file = props.modelValue?.file
  if (file instanceof Blob) {
    objectPreviewUrl.value = URL.createObjectURL(file)
  }
}

function stopCamera() {
  streamReady.value = false
  const mediaStream = stream.value
  if (mediaStream) {
    mediaStream.getTracks?.().forEach(track => track.stop())
  }
  stream.value = null
  const video = videoRef.value
  if (video) {
    video.srcObject = null
  }
}

function cancelCamera() {
  stopCamera()
  mode.value = 'idle'
}

async function startCamera() {
  if (props.readonly) {
    return
  }
  localError.value = ''
  if (!navigator?.mediaDevices?.getUserMedia) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('insuranceCardCameraUnavailable'),
      position: 'top',
    })

    return
  }

  cameraBusy.value = true
  mode.value = 'camera'
  stopCamera()
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
    stream.value = mediaStream
    await nextTick()
    const video = videoRef.value
    if (!video) {
      return
    }
    video.srcObject = mediaStream
    await video.play?.()
    streamReady.value = true
  } catch (error) {
    mode.value = 'idle'
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: String(
        error?.message ?? t('insuranceCardCameraPermissionError'),
      ),
      position: 'top',
    })
  } finally {
    cameraBusy.value = false
  }
}

async function capturePhoto() {
  const video = videoRef.value
  if (!video || cameraBusy.value) {
    return
  }
  const width = video.videoWidth || 1280
  const height = video.videoHeight || 720
  if (!width || !height) {
    return
  }

  cameraBusy.value = true
  try {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }
    ctx.drawImage(video, 0, 0, width, height)
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    })
    if (!blob) {
      return
    }
    stopCamera()
    mode.value = 'idle'
    assignFile(new File(
      [blob],
      `insurance-card-${Date.now()}.jpg`,
      { type: 'image/jpeg' },
    ))
  } finally {
    cameraBusy.value = false
  }
}

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
  stopCamera()
  mode.value = 'idle'
  localError.value = ''
  emit('update:modelValue', null)
}

watch(
  () => props.modelValue,
  () => {
    syncObjectPreviewFromModel()
  },
  { immediate: true, deep: true },
)

watch(
  () => props.readonly,
  value => {
    if (value && mode.value === 'camera') {
      cancelCamera()
    }
  },
)

onBeforeUnmount(() => {
  stopCamera()
  revokeObjectPreview()
})
</script>
