<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="clientPageTestIds.profilePhotoCropDialog"
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog client-profile-photo-crop-dialog
        app-dialog-card app-dialog-card--sm">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('clientProfilePhotoCropTitle') }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('clientProfilePhotoCropSubtitle') }}
        </p>

        <div
          v-if="imageReady"
          ref="viewportRef"
          class="client-profile-photo-crop-dialog__viewport"
          :class="{
            'client-profile-photo-crop-dialog__viewport--dragging': dragging,
          }"
          :data-testid="clientPageTestIds.profilePhotoCropViewport"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp">
          <img
            :src="previewUrl"
            alt=""
            class="client-profile-photo-crop-dialog__image"
            :style="imageStyle"
            draggable="false"
          />
          <div class="client-profile-photo-crop-dialog__ring" />
        </div>

        <div
          v-else
          class="client-profile-photo-crop-dialog__viewport
            client-profile-photo-crop-dialog__viewport--loading">
          <q-spinner color="primary" size="32px" />
        </div>

        <div
          v-if="imageReady"
          class="client-profile-photo-crop-dialog__zoom-row
            row items-center q-col-gutter-sm q-mt-md">
          <div class="col-auto">
            <q-btn
              flat
              round
              dense
              icon="remove"
              color="primary"
              :aria-label="t('clientProfilePhotoCropZoomOut')"
              :disable="zoom <= cropMinZoom || busy"
              @click="changeZoom(-0.1)"
            />
          </div>
          <div class="col">
            <q-slider
              v-model="zoom"
              :min="cropMinZoom"
              :max="cropMaxZoom"
              :step="0.01"
              color="primary"
              label
              :label-value="zoomLabel"
              :disable="busy"
              :data-testid="clientPageTestIds.profilePhotoCropZoom"
              @update:model-value="onZoomChange"
            />
          </div>
          <div class="col-auto">
            <q-btn
              flat
              round
              dense
              icon="add"
              color="primary"
              :aria-label="t('clientProfilePhotoCropZoomIn')"
              :disable="zoom >= cropMaxZoom || busy"
              @click="changeZoom(0.1)"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="clientPageTestIds.profilePhotoCropCancel"
          :disable="busy"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :data-testid="clientPageTestIds.profilePhotoCropSave"
          :loading="busy"
          :disable="!imageReady || busy"
          :label="t('clientProfilePhotoCropSave')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import {
  clientProfilePhotoCropMaxZoom,
  clientProfilePhotoCropMinZoom,
  clientProfilePhotoCropViewportSize,
} from 'components/constants.js'
import {
  clampProfilePhotoPanOffset,
  clampProfilePhotoZoom,
  exportCroppedProfilePhoto,
  getProfilePhotoCoverScale,
  loadProfilePhotoImage,
  profilePhotoBlobToFile,
} from 'src/utils/client-profile-photo-crop.js'
import { clientPageTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  imageFile: {
    type: File,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'confirm',
  'cancel',
])

const { t } = useI18n()

const cropMinZoom = clientProfilePhotoCropMinZoom
const cropMaxZoom = clientProfilePhotoCropMaxZoom
const viewportSize = clientProfilePhotoCropViewportSize

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const viewportRef = ref(null)
const previewUrl = ref('')
const loadedImage = ref(null)
const imageReady = ref(false)
const exporting = ref(false)
const zoom = ref(cropMinZoom)
const offsetX = ref(0)
const offsetY = ref(0)
const dragging = ref(false)

let dragState = null
let previewObjectUrl = ''

const busy = computed(() => props.saving || exporting.value)

const coverScale = computed(() => {
  const image = loadedImage.value
  if (!image) {
    return 1
  }

  return getProfilePhotoCoverScale(
    image.naturalWidth,
    image.naturalHeight,
    viewportSize,
  )
})

const displayScale = computed(() => coverScale.value * zoom.value)

const imageStyle = computed(() => {
  const image = loadedImage.value
  if (!image) {
    return {}
  }

  const width = image.naturalWidth * displayScale.value
  const height = image.naturalHeight * displayScale.value

  return {
    width: `${width}px`,
    height: `${height}px`,
    transform: `translate(calc(-50% + ${offsetX.value}px), `
      + `calc(-50% + ${offsetY.value}px))`,
  }
})

const zoomLabel = computed(() => `${Math.round(zoom.value * 100)}%`)

function revokePreviewUrl() {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl)
    previewObjectUrl = ''
  }
}

function resetCropState() {
  zoom.value = cropMinZoom
  offsetX.value = 0
  offsetY.value = 0
  dragState = null
  dragging.value = false
}

function clampOffsets() {
  const image = loadedImage.value
  if (!image) {
    return
  }

  const clamped = clampProfilePhotoPanOffset(
    offsetX.value,
    offsetY.value,
    image.naturalWidth,
    image.naturalHeight,
    displayScale.value,
    viewportSize,
  )

  offsetX.value = clamped.offsetX
  offsetY.value = clamped.offsetY
}

async function loadImageFile(file) {
  imageReady.value = false
  loadedImage.value = null
  revokePreviewUrl()
  resetCropState()

  if (!file) {
    return
  }

  previewObjectUrl = URL.createObjectURL(file)
  previewUrl.value = previewObjectUrl

  try {
    const image = await loadProfilePhotoImage(file)
    loadedImage.value = image
    imageReady.value = true
    clampOffsets()
  } catch {
    onCancel()
  }
}

function onZoomChange() {
  zoom.value = clampProfilePhotoZoom(zoom.value)
  clampOffsets()
}

function changeZoom(delta) {
  zoom.value = clampProfilePhotoZoom(zoom.value + delta)
  clampOffsets()
}

function onPointerDown(event) {
  if (!imageReady.value || busy.value) {
    return
  }

  viewportRef.value?.setPointerCapture?.(event.pointerId)
  dragging.value = true
  dragState = {
    startX: event.clientX,
    startY: event.clientY,
    originX: offsetX.value,
    originY: offsetY.value,
  }
}

function onPointerMove(event) {
  if (!dragState || busy.value) {
    return
  }

  const deltaX = event.clientX - dragState.startX
  const deltaY = event.clientY - dragState.startY
  const image = loadedImage.value
  if (!image) {
    return
  }

  const clamped = clampProfilePhotoPanOffset(
    dragState.originX + deltaX,
    dragState.originY + deltaY,
    image.naturalWidth,
    image.naturalHeight,
    displayScale.value,
    viewportSize,
  )

  offsetX.value = clamped.offsetX
  offsetY.value = clamped.offsetY
}

function onPointerUp(event) {
  if (!dragState) {
    return
  }

  viewportRef.value?.releasePointerCapture?.(event.pointerId)
  dragState = null
  dragging.value = false
}

function onCancel() {
  if (busy.value) {
    return
  }

  open.value = false
  emit('cancel')
}

async function onSave() {
  const image = loadedImage.value
  if (!image || !props.imageFile || busy.value) {
    return
  }

  exporting.value = true
  try {
    const blob = await exportCroppedProfilePhoto({
      image,
      zoom: zoom.value,
      offsetX: offsetX.value,
      offsetY: offsetY.value,
      viewportSize,
    })
    const file = profilePhotoBlobToFile(blob, props.imageFile.name)

    emit('confirm', file)
  } finally {
    exporting.value = false
  }
}

watch(
  () => props.imageFile,
  file => {
    if (open.value) {
      loadImageFile(file)
    }
  },
)

watch(open, isOpen => {
  if (isOpen) {
    loadImageFile(props.imageFile)
    return
  }

  imageReady.value = false
  loadedImage.value = null
  revokePreviewUrl()
  previewUrl.value = ''
  resetCropState()
})

onBeforeUnmount(() => {
  revokePreviewUrl()
})
</script>
