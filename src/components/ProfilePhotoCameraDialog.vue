<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog profile-photo-camera-dialog
        app-dialog-card app-dialog-card--sm">
      <AppDialogHeader :close-label="t('close')" @close="onCancel">
        {{ t('profilePhotoCameraTitle') }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('profilePhotoCameraSubtitle') }}
        </p>

        <FormSelect
          v-if="showCameraPicker"
          :model-value="selectedCameraId"
          class="profile-photo-camera-dialog__camera-select q-mb-md"
          outlined
          hide-bottom-space
          emit-value
          map-options
          :clearable="false"
          :disable="busy"
          :options="cameraOptions"
          :label="t('profilePhotoCameraSelectLabel')"
          :test-id="clientPageTestIds.profilePhotoCameraSelect"
          @update:model-value="onCameraDeviceChange"
        />

        <div class="profile-photo-camera-dialog__viewport">
          <img
            v-if="previewUrl"
            :src="previewUrl"
            alt=""
            class="profile-photo-camera-dialog__preview"
          />
          <video
            v-else
            ref="videoRef"
            class="profile-photo-camera-dialog__video"
            autoplay
            playsinline
            muted
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :disable="busy"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          v-if="previewUrl"
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :disable="busy"
          :label="t('profilePhotoCameraRetake')"
          @click="onRetake"
        />
        <q-btn
          v-if="previewUrl"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :disable="busy"
          :label="t('profilePhotoCameraUsePhoto')"
          @click="onUsePhoto"
        />
        <q-btn
          v-else
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :disable="busy || !streamReady"
          :label="t('profilePhotoCameraCapture')"
          @click="onCapture"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormSelect from 'components/FormSelect.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { clientPageTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const { t } = useI18n()
const $q = useQuasar()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const videoRef = ref(null)
const stream = ref(null)
const busy = ref(false)
const streamReady = ref(false)
const previewUrl = ref('')
const cameraDevices = ref([])
const selectedCameraId = ref('')

let previewObjectUrl = ''

const showCameraPicker = computed(() =>
  cameraDevices.value.length > 1 && !previewUrl.value,
)

const cameraOptions = computed(() =>
  cameraDevices.value.map((device, index) => ({
    label: device.label?.trim()
      || t('profilePhotoCameraDeviceDefault', { number: index + 1 }),
    value: device.deviceId,
  })),
)

function revokePreviewUrl() {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl)
    previewObjectUrl = ''
  }
  previewUrl.value = ''
}

function buildVideoConstraints(deviceId = '') {
  const id = String(deviceId ?? '').trim()
  if (id) {
    return { video: { deviceId: { exact: id } }, audio: false }
  }

  return { video: { facingMode: 'user' }, audio: false }
}

async function refreshCameraDevices() {
  if (!navigator?.mediaDevices?.enumerateDevices) {
    cameraDevices.value = []
    return
  }

  const devices = await navigator.mediaDevices.enumerateDevices()
  cameraDevices.value = devices.filter(device => device.kind === 'videoinput')
}

function syncSelectedCameraFromStream(mediaStream) {
  const activeId = mediaStream?.getVideoTracks?.()?.[0]?.getSettings?.()
    ?.deviceId
  if (
    activeId
    && cameraDevices.value.some(device => device.deviceId === activeId)
  ) {
    selectedCameraId.value = activeId
    return
  }
  if (cameraDevices.value.length && !selectedCameraId.value) {
    selectedCameraId.value = cameraDevices.value[0].deviceId
  }
}

async function attachStreamToVideo(mediaStream) {
  await nextTick()
  const video = videoRef.value
  if (!video) {
    return false
  }
  video.srcObject = mediaStream
  await video.play?.()
  streamReady.value = true

  return true
}

async function startCamera(deviceId = '') {
  streamReady.value = false
  if (!navigator?.mediaDevices?.getUserMedia) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('profilePhotoCameraUnavailable'),
      position: 'top',
    })

    return
  }

  busy.value = true
  stopCamera()
  try {
    const preferredId = String(deviceId || selectedCameraId.value).trim()
    const mediaStream = await navigator.mediaDevices.getUserMedia(
      buildVideoConstraints(preferredId),
    )
    stream.value = mediaStream
    await refreshCameraDevices()
    syncSelectedCameraFromStream(mediaStream)
    await attachStreamToVideo(mediaStream)
  } catch (error) {
    if (deviceId || selectedCameraId.value) {
      try {
        selectedCameraId.value = ''
        const fallbackStream = await navigator.mediaDevices.getUserMedia(
          buildVideoConstraints(''),
        )
        stream.value = fallbackStream
        await refreshCameraDevices()
        syncSelectedCameraFromStream(fallbackStream)
        await attachStreamToVideo(fallbackStream)
        return
      } catch {
        // fall through to notify below
      }
    }
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: String(
        error?.message ?? t('profilePhotoCameraPermissionError'),
      ),
      position: 'top',
    })
  } finally {
    busy.value = false
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

function onCancel() {
  if (busy.value) {
    return
  }
  emit('cancel')
  open.value = false
}

function onRetake() {
  revokePreviewUrl()
  void startCamera(selectedCameraId.value)
}

async function onCameraDeviceChange(deviceId) {
  const nextId = String(deviceId ?? '').trim()
  if (!nextId || nextId === selectedCameraId.value || busy.value) {
    return
  }
  selectedCameraId.value = nextId
  await startCamera(nextId)
}

async function onCapture() {
  const video = videoRef.value
  if (!video) {
    return
  }
  const width = video.videoWidth || 720
  const height = video.videoHeight || 720
  if (!width || !height) {
    return
  }

  busy.value = true
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
    revokePreviewUrl()
    previewObjectUrl = URL.createObjectURL(blob)
    previewUrl.value = previewObjectUrl
  } finally {
    busy.value = false
  }
}

async function onUsePhoto() {
  if (!previewObjectUrl || busy.value) {
    return
  }

  busy.value = true
  try {
    const response = await fetch(previewObjectUrl)
    const blob = await response.blob()
    const file = new File([blob], `profile-photo-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    })
    emit('confirm', file)
    open.value = false
  } finally {
    busy.value = false
  }
}

function resetCameraState() {
  revokePreviewUrl()
  stopCamera()
  cameraDevices.value = []
  selectedCameraId.value = ''
}

watch(open, isOpen => {
  if (isOpen) {
    resetCameraState()
    void startCamera()
    return
  }

  resetCameraState()
})

onBeforeUnmount(() => {
  resetCameraState()
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.profile-photo-camera-dialog {
  &__camera-select {
    width: 100%;
  }

  &__viewport {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: $radius-md;
    overflow: hidden;
    background: $surface;
    border: 1px solid $border-subtle;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__video,
  &__preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}
</style>
