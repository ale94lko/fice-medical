<template>
  <div class="telehealth-room">
    <header class="telehealth-room__topbar">
      <div class="telehealth-room__brand">
        <span class="telehealth-room__brand-mark">
          <q-icon name="videocam" size="18px" />
        </span>
        <span>{{ t('telehealthBrand') }}</span>
      </div>
      <div
        v-if="showTopbarMeta"
        class="telehealth-room__meta">
        <span
          v-if="topbarClinician"
          class="telehealth-room__meta-item">
          {{ topbarClinician }}
        </span>
        <span
          v-if="topbarDate"
          class="telehealth-room__meta-item">
          {{ topbarDate }}
        </span>
        <span
          v-if="topbarTime"
          class="telehealth-room__meta-item">
          {{ topbarTime }}
        </span>
        <span
          v-if="phase === 'in_call' && sessionElapsedLabel"
          class="telehealth-room__meta-item
            telehealth-room__meta-item--elapsed">
          {{ t('telehealthElapsed', { time: sessionElapsedLabel }) }}
        </span>
      </div>
    </header>

    <div
      v-if="linkError"
      class="telehealth-lobby">
      <div class="telehealth-card">
        <h1>{{ t('telehealthGuestLinkInvalid') }}</h1>
        <p>{{ linkError }}</p>
      </div>
    </div>

    <TelehealthLobby
      v-else-if="phase === 'lobby'"
      :initial-name="displayName"
      :joining="loading"
      :error="error"
      :show-back="false"
      :show-admit-notice="true"
      @join="onLobbyJoin"
    />

    <TelehealthWaitingRoomClient
      v-else-if="phase === 'waiting'"
      :local-stream="webrtc.localStream.value"
      :camera-enabled="webrtc.videoEnabled.value"
      :mic-enabled="webrtc.audioEnabled.value"
      :speaker-enabled="webrtc.speakerEnabled.value"
      :loading="loading"
      :error="error"
      @leave="onLeave"
      @toggle-camera="webrtc.toggleVideo()"
      @toggle-mic="webrtc.toggleAudio()"
      @toggle-speaker="webrtc.toggleSpeaker()"
    />

    <TelehealthInCall
      v-else-if="phase === 'in_call'"
      :local-stream="webrtc.localStream.value"
      :remote-stream="webrtc.remoteStream.value"
      :local-screen-stream="webrtc.screenStream.value"
      :remote-screen-stream="webrtc.remoteScreenStream.value"
      :audio-enabled="webrtc.audioEnabled.value"
      :video-enabled="webrtc.videoEnabled.value"
      :speaker-enabled="webrtc.speakerEnabled.value"
      :is-screen-sharing="webrtc.isScreenSharing.value"
      :is-remote-screen-sharing="webrtc.isRemoteScreenSharing.value"
      :can-screen-share="canScreenShare"
      :can-chat="true"
      :can-upload-files="false"
      :can-delete-files="false"
      :show-meet-info="true"
      :show-invite-tools="false"
      :show-meeting-code="false"
      :use-browser-time-zone="true"
      :status-label="sessionStatusLabel"
      :appointment="guestAppointment"
      :chat-messages="chatMessages"
      :files="[]"
      :self-participant-id="selfParticipantId"
      @toggle-audio="webrtc.toggleAudio()"
      @toggle-video="webrtc.toggleVideo()"
      @toggle-speaker="webrtc.toggleSpeaker()"
      @start-screen-share="onStartScreenShare"
      @stop-screen-share="onStopScreenShare"
      @leave="onLeave"
      @send-chat="onSendChat"
    />

    <TelehealthEnded
      v-else
      :duration-seconds="lastCallDurationSeconds"
      @back-meet="onBackToMeet"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useTelehealthSession } from
  'src/composables/useTelehealthSession.js'
import {
  formatUtcDateLong,
  formatUtcTimeRange,
  resolveBrowserTimeZone,
} from 'src/utils/appointment-datetime.js'
import { publicLobbyTelehealth } from 'src/utils/telehealth-api.js'
import {
  cacheGuestAppointmentSummary,
  readCachedGuestAppointmentSummary,
  telehealthAppointmentViewFromSession,
  telehealthSessionStatusLabel,
} from 'src/utils/telehealth-normalize.js'
import TelehealthLobby from
  'src/components/telehealth/TelehealthLobby.vue'
import TelehealthWaitingRoomClient from
  'src/components/telehealth/TelehealthWaitingRoomClient.vue'
import TelehealthInCall from
  'src/components/telehealth/TelehealthInCall.vue'
import TelehealthEnded from
  'src/components/telehealth/TelehealthEnded.vue'

const { t } = useI18n()
const route = useRoute()
const $q = useQuasar()

const {
  session,
  phase,
  loading,
  error,
  chatMessages,
  selfParticipantId,
  displayName,
  webrtc,
  joinAsGuest,
  markReady,
  leave,
  beginLobbyEntry,
  refreshSession,
  lastCallDurationSeconds,
  elapsedLabel: sessionElapsedLabel,
  sendChat,
  beginScreenShare,
  endScreenShare,
} = useTelehealthSession()

const readyFlags = ref({
  cameraTested: false,
  microphoneTested: false,
  speakerTested: false,
})
const linkError = ref('')
/** Lobby meta from prior join (appointment_summary cache). */
const cachedGuestAppointment = ref(null)

const inviteParams = computed(() => {
  const query = route.query || {}
  const tenantKey = String(
    query.tenant ?? query.tenant_key ?? query.tenantKey ?? '',
  ).trim()
  const subtenantKey = String(
    query.subtenant
    ?? query.subtenant_key
    ?? query.subtenantKey
    ?? '',
  ).trim()
  const meetingCode = String(
    query.code ?? query.meeting_code ?? query.meetingCode ?? '',
  ).trim()
  const meetingToken = String(
    query.token ?? query.meeting_token ?? query.meetingToken ?? '',
  ).trim()

  return {
    tenantKey,
    subtenantKey,
    meetingCode,
    meetingToken,
  }
})

const guestAppointment = computed(() =>
  telehealthAppointmentViewFromSession(session.value)
  || cachedGuestAppointment.value,
)

/** Guest magic-link: show wall-clock in the device/browser zone. */
const guestDisplayTimeZone = resolveBrowserTimeZone()

const topbarClinician = computed(() =>
  String(guestAppointment.value?.clinicianDisplayName ?? '').trim(),
)
const topbarDate = computed(() =>
  formatUtcDateLong(
    guestAppointment.value?.startAtUtc,
    guestDisplayTimeZone,
  ) || '',
)
const topbarTime = computed(() =>
  formatUtcTimeRange(
    guestAppointment.value?.startAtUtc,
    guestAppointment.value?.endAtUtc,
    guestDisplayTimeZone,
  ) || '',
)
const showTopbarMeta = computed(() =>
  Boolean(
    topbarClinician.value
    || topbarDate.value
    || topbarTime.value
    || (phase.value === 'in_call' && sessionElapsedLabel.value),
  ),
)

const sessionStatusLabel = computed(() =>
  telehealthSessionStatusLabel(session.value?.status, t),
)

const canScreenShare = computed(() => {
  if (
    typeof navigator !== 'undefined'
    && !navigator.mediaDevices?.getDisplayMedia
  ) {
    return false
  }

  // Guests may share when the session allows client screen share.
  return session.value?.allowClientScreenShare !== false
})

async function onLobbyJoin(payload) {
  readyFlags.value = {
    cameraTested: Boolean(payload.cameraTested),
    microphoneTested: Boolean(payload.microphoneTested),
    speakerTested: Boolean(payload.speakerTested),
  }
  try {
    await joinAsGuest({
      ...inviteParams.value,
      name: payload.displayName,
      previewStream: payload.previewStream || null,
      mediaPrefs: {
        audioEnabled: payload.microphoneEnabled !== false,
        videoEnabled: payload.cameraEnabled !== false,
        speakerEnabled: payload.speakerEnabled !== false,
      },
    })
    // Ready is sent with Join session (no separate waiting-room button).
    await markReady(readyFlags.value)
  } catch (err) {
    const status = Number(err?.response?.status)
    // Expired / rotated invite after API deploy or resend-invite.
    if (status === 401 || status === 403 || status === 404) {
      linkError.value = t('telehealthInviteInvalid')
    }
    // 429 and other errors stay on the lobby via session.error.
  }
}

async function onLeave() {
  await leave()
}

async function onSendChat(body) {
  try {
    await sendChat(body)
  } catch (err) {
    $q.notify({ type: 'negative', message: String(err?.message || err) })
  }
}

async function onStartScreenShare() {
  try {
    await beginScreenShare()
  } catch (err) {
    $q.notify({ type: 'negative', message: String(err?.message || err) })
  }
}

async function onStopScreenShare() {
  try {
    await endScreenShare()
  } catch (err) {
    $q.notify({ type: 'negative', message: String(err?.message || err) })
  }
}

async function onBackToMeet() {
  await beginLobbyEntry(session.value?.id)
}

function applyGuestAppointmentCache(meetingToken, payload) {
  const view = telehealthAppointmentViewFromSession({
    clinicianDisplayName: payload?.clinicianDisplayName,
    appointmentSummary: payload?.appointmentSummary,
  })
  if (!view) {
    return
  }
  cachedGuestAppointment.value = view
  cacheGuestAppointmentSummary(meetingToken, {
    clinicianDisplayName: payload?.clinicianDisplayName,
    appointmentSummary: payload?.appointmentSummary,
  })
}

async function loadGuestLobbySummary(invite) {
  const {
    tenantKey,
    subtenantKey,
    meetingCode,
    meetingToken,
  } = invite
  const cached = readCachedGuestAppointmentSummary(meetingToken)
  if (cached) {
    applyGuestAppointmentCache(meetingToken, cached)
  }
  try {
    const lobby = await publicLobbyTelehealth({
      tenantKey,
      subtenantKey,
      meetingCode,
      meetingToken,
    })
    applyGuestAppointmentCache(meetingToken, lobby)
  } catch (err) {
    const status = Number(err?.response?.status)
    if (status === 401 || status === 403 || status === 404) {
      linkError.value = t('telehealthInviteInvalid')
    }
    // Soft fail: keep cache / empty topbar for other errors.
  }
}

onMounted(async() => {
  const { restored } = await beginLobbyEntry(session.value?.id)
  if (restored) {
    try {
      await refreshSession()
    } catch {
      // Keep in-call UI with current local state
    }

    return
  }
  const invite = inviteParams.value
  const {
    tenantKey,
    subtenantKey,
    meetingCode,
    meetingToken,
  } = invite
  if (!tenantKey || !subtenantKey || !meetingCode || !meetingToken) {
    linkError.value = t('telehealthGuestLinkMissingParams')

    return
  }
  await loadGuestLobbySummary(invite)
})
</script>

<style lang="scss">
@import 'src/css/telehealth-room.scss';
</style>
