<template>
  <div
    v-if="isFloatingCallActive"
    class="telehealth-float"
    :class="{ 'telehealth-float--dragging': dragging }"
    :style="floatStyle"
    role="dialog"
    :aria-label="t('telehealthFloatTitle')">
    <div
      class="telehealth-float__video"
      @pointerdown="onDragStart">
      <video
        ref="videoRef"
        autoplay
        playsinline
        :muted="videoMuted"
      />
      <div class="telehealth-float__title">
        {{ t('telehealthFloatTitle') }}
      </div>
    </div>
    <div class="telehealth-float__actions">
      <q-btn
        round
        dense
        unelevated
        size="sm"
        class="telehealth-float__btn"
        :class="{
          'telehealth-float__btn--off': !webrtc.audioEnabled.value,
        }"
        color="primary"
        text-color="white"
        :icon="webrtc.audioEnabled.value ? 'mic' : 'mic_off'"
        :aria-label="t('telehealthToggleMic')"
        @click="webrtc.toggleAudio()">
        <q-tooltip>{{ t('telehealthToggleMic') }}</q-tooltip>
      </q-btn>
      <q-btn
        round
        dense
        unelevated
        size="sm"
        class="telehealth-float__btn"
        :class="{
          'telehealth-float__btn--off': !webrtc.videoEnabled.value,
        }"
        color="primary"
        text-color="white"
        :icon="webrtc.videoEnabled.value ? 'videocam' : 'videocam_off'"
        :aria-label="t('telehealthToggleCam')"
        @click="webrtc.toggleVideo()">
        <q-tooltip>{{ t('telehealthToggleCam') }}</q-tooltip>
      </q-btn>
      <q-btn
        round
        dense
        unelevated
        size="sm"
        color="primary"
        text-color="white"
        class="telehealth-float__btn"
        icon="open_in_full"
        :aria-label="t('telehealthFloatRestore')"
        @click="onRestore">
        <q-tooltip>{{ t('telehealthFloatRestore') }}</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useTelehealthSession } from
  'src/composables/useTelehealthSession.js'

const { t } = useI18n()
const router = useRouter()
const {
  isFloatingCallActive,
  returnRoute,
  webrtc,
} = useTelehealthSession()

const videoRef = ref(null)
const pos = ref({ x: null, y: null })
const dragging = ref(false)
let dragOffset = { x: 0, y: 0 }

const previewStream = computed(() => {
  void webrtc.remoteMediaGeneration.value
  const remote = webrtc.remoteStream.value
  if (remote && typeof remote.getTracks === 'function') {
    const live = remote.getTracks().some(
      track => track && track.readyState !== 'ended',
    )
    if (live) {
      return remote
    }
  }

  return webrtc.localStream.value
})

const videoMuted = computed(() => {
  if (previewStream.value === webrtc.localStream.value) {
    return true
  }

  return !webrtc.speakerEnabled.value
})

const floatStyle = computed(() => {
  if (pos.value.x == null || pos.value.y == null) {
    return undefined
  }

  return {
    left: `${pos.value.x}px`,
    top: `${pos.value.y}px`,
    right: 'auto',
    bottom: 'auto',
  }
})

function bindVideo(el, stream) {
  if (!el) {
    return
  }
  if (el.srcObject !== stream) {
    el.srcObject = stream || null
  }
}

watch(
  [videoRef, previewStream],
  () => bindVideo(videoRef.value, previewStream.value),
  { immediate: true },
)

function onDragStart(event) {
  if (event.button != null && event.button !== 0) {
    return
  }
  const el = event.currentTarget?.closest?.('.telehealth-float')
  if (!el) {
    return
  }
  const rect = el.getBoundingClientRect()
  if (pos.value.x == null) {
    pos.value = { x: rect.left, y: rect.top }
  }
  dragOffset = {
    x: event.clientX - pos.value.x,
    y: event.clientY - pos.value.y,
  }
  dragging.value = true
  el.setPointerCapture?.(event.pointerId)
  window.addEventListener('pointermove', onDragMove)
  window.addEventListener('pointerup', onDragEnd)
}

function onDragMove(event) {
  if (!dragging.value) {
    return
  }
  const width = 280
  const height = 200
  const maxX = Math.max(8, window.innerWidth - width - 8)
  const maxY = Math.max(8, window.innerHeight - height - 8)
  pos.value = {
    x: Math.min(maxX, Math.max(8, event.clientX - dragOffset.x)),
    y: Math.min(maxY, Math.max(8, event.clientY - dragOffset.y)),
  }
}

function onDragEnd() {
  dragging.value = false
  window.removeEventListener('pointermove', onDragMove)
  window.removeEventListener('pointerup', onDragEnd)
}

async function onRestore() {
  // Keep minimized=true until the session page mounts and
  // beginLobbyEntry consumes the floating restore.
  const target = returnRoute.value
  if (target) {
    await router.push(target)
  }
}

onBeforeUnmount(() => {
  onDragEnd()
  bindVideo(videoRef.value, null)
})
</script>

<style lang="scss">
@import 'src/css/telehealth-float.scss';
</style>
