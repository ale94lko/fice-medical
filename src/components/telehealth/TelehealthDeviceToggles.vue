<template>
  <div class="telehealth-lobby__chips">
    <q-chip
      clickable
      :disable="disable"
      :color="cameraEnabled ? 'positive' : 'grey-8'"
      text-color="white"
      :icon="cameraEnabled ? 'videocam' : 'videocam_off'"
      :aria-label="t('telehealthToggleCam')"
      @click="$emit('toggle-camera')">
      {{ t('telehealthCameraTest') }}
    </q-chip>
    <q-chip
      clickable
      :disable="disable"
      :color="micEnabled ? 'positive' : 'grey-8'"
      text-color="white"
      :icon="micEnabled ? 'mic' : 'mic_off'"
      :aria-label="t('telehealthToggleMic')"
      @click="$emit('toggle-mic')">
      {{ t('telehealthMicTest') }}
    </q-chip>
    <q-chip
      clickable
      :disable="disable"
      :color="speakerEnabled ? 'positive' : 'grey-8'"
      text-color="white"
      :icon="speakerEnabled ? 'volume_up' : 'volume_off'"
      :aria-label="t('telehealthToggleSpeaker')"
      @click="$emit('toggle-speaker')">
      {{ t('telehealthSpeakerTest') }}
    </q-chip>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  cameraEnabled: { type: Boolean, default: true },
  micEnabled: { type: Boolean, default: true },
  speakerEnabled: { type: Boolean, default: true },
  disable: { type: Boolean, default: false },
})

defineEmits(['toggle-camera', 'toggle-mic', 'toggle-speaker'])

const { t } = useI18n()
</script>
