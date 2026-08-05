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
          v-if="topbarPeerName"
          class="telehealth-room__meta-item">
          {{ topbarPeerName }}
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

    <TelehealthLobby
      v-if="phase === 'lobby'"
      :initial-name="lobbyDisplayName"
      :joining="loading"
      :error="error"
      :show-admit-notice="!isLobbyClinician"
      @join="onLobbyJoin"
      @back="goCalendar"
    />

    <TelehealthWaitingRoomClinician
      v-else-if="phase === 'waiting' && isClinician"
      :local-stream="webrtc.localStream.value"
      :camera-enabled="webrtc.videoEnabled.value"
      :mic-enabled="webrtc.audioEnabled.value"
      :speaker-enabled="webrtc.speakerEnabled.value"
      :waiting-participants="waitingParticipants"
      :client-invite-url="clientMeetInviteUrl"
      v-model:invite-email="inviteEmail"
      v-model:use-custom-invite-email="useCustomInviteEmail"
      :invite-loading="inviteLoading"
      :can-admit="canAdmitTelehealth"
      :can-start="canStartTelehealth"
      :loading="loading"
      :error="error"
      @admit="onAdmit"
      @start="onStart"
      @leave="onLeave"
      @copy-invite="onCopyInvite"
      @resend-invite="onResendInvite"
      @toggle-camera="webrtc.toggleVideo()"
      @toggle-mic="webrtc.toggleAudio()"
      @toggle-speaker="webrtc.toggleSpeaker()"
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
      :remote-media-generation="webrtc.remoteMediaGeneration.value"
      :audio-enabled="webrtc.audioEnabled.value"
      :video-enabled="webrtc.videoEnabled.value"
      :speaker-enabled="webrtc.speakerEnabled.value"
      :is-screen-sharing="webrtc.isScreenSharing.value"
      :is-remote-screen-sharing="webrtc.isRemoteScreenSharing.value"
      :can-screen-share="canScreenShare"
      :can-minimize="true"
      :can-chat="canChatTelehealth"
      :can-admit="canAdmitTelehealth && isClinician"
      :can-delete-chat="canFinishTelehealth"
      :can-upload-files="canUploadTelehealthFiles"
      :can-delete-files="canDeleteTelehealthFiles"
      :show-meet-info="true"
      :show-invite-tools="isClinician"
      :show-meeting-code="isClinician"
      :meeting-code="session?.meetingCode || ''"
      :status-label="sessionStatusLabel"
      :client-invite-url="clientMeetInviteUrl"
      v-model:invite-email="inviteEmail"
      v-model:use-custom-invite-email="useCustomInviteEmail"
      :invite-loading="inviteLoading"
      :appointment="displayAppointment"
      :waiting-participants="waitingParticipants"
      :admit-loading="loading"
      :chat-messages="chatMessages"
      :files="files"
      :self-participant-id="selfParticipantId"
      @toggle-audio="webrtc.toggleAudio()"
      @toggle-video="webrtc.toggleVideo()"
      @toggle-speaker="webrtc.toggleSpeaker()"
      @start-screen-share="onStartScreenShare"
      @stop-screen-share="onStopScreenShare"
      @leave="onLeave"
      @minimize="onMinimize"
      @admit="onAdmit"
      @send-chat="onSendChat"
      @delete-chat="onDeleteChat"
      @upload-file="onUploadFile"
      @download-file="onDownloadFile"
      @delete-file="onDeleteFile"
      @copy-invite="onCopyInvite"
      @resend-invite="onResendInvite"
    />

    <TelehealthEnded
      v-else
      :duration-seconds="endedDurationSeconds"
      :appointment-number="appointment?.appointmentNumber || ''"
      :client-display-name="
        displayAppointment?.clientDisplayName
        || session?.clientDisplayName
        || ''
      "
      :can-complete="canMarkSessionCompleted"
      :completed="isSessionCompleted"
      :complete-loading="loading"
      :show-back-to-app="isClinician"
      @complete="onFinish"
      @back-meet="onBackToMeet"
      @back-calendar="goCalendar"
    />
  </div>
</template>

<script setup>
import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { copyToClipboard, useQuasar } from 'quasar'
import { telehealthRoles } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { useTelehealthPermissions } from
  'src/composables/useTelehealthPermissions.js'
import { useTelehealthSession } from
  'src/composables/useTelehealthSession.js'
import { fetchAppointment } from 'src/utils/appointment-api.js'
import {
  formatUtcDateLong,
  formatUtcTimeRange,
} from 'src/utils/appointment-datetime.js'
import { getTelehealthSession } from 'src/utils/telehealth-api.js'
import {
  isTelehealthTerminalStatus,
  resolveTelehealthClientDisplayName,
  resolveTelehealthDurationSeconds,
  telehealthAppointmentViewFromSession,
  telehealthSessionStatusLabel,
} from 'src/utils/telehealth-normalize.js'
import { triggerBlobDownload } from 'src/utils/lab-api.js'
import TelehealthLobby from
  'src/components/telehealth/TelehealthLobby.vue'
import TelehealthWaitingRoomClinician from
  'src/components/telehealth/TelehealthWaitingRoomClinician.vue'
import TelehealthWaitingRoomClient from
  'src/components/telehealth/TelehealthWaitingRoomClient.vue'
import TelehealthInCall from
  'src/components/telehealth/TelehealthInCall.vue'
import TelehealthEnded from
  'src/components/telehealth/TelehealthEnded.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

const {
  canAdmitTelehealth,
  canStartTelehealth,
  canFinishTelehealth,
  canChatTelehealth,
  canUploadTelehealthFiles,
  canDeleteTelehealthFiles,
  canCreateTelehealth,
} = useTelehealthPermissions()

const {
  session,
  phase,
  loading,
  error,
  chatMessages,
  files,
  waitingParticipants,
  isClinician,
  selfParticipantId,
  displayName,
  webrtc,
  join,
  markReady,
  admit,
  start,
  finish,
  leave,
  minimizeToRoute,
  beginLobbyEntry,
  refreshSession,
  lastCallDurationSeconds,
  elapsedLabel: sessionElapsedLabel,
  sendChat,
  removeChatMessage,
  uploadFile,
  removeFile,
  downloadFile,
  beginScreenShare,
  endScreenShare,
  resendClientInvite,
  hydrateSession,
} = useTelehealthSession()

const readyFlags = ref({
  cameraTested: false,
  microphoneTested: false,
  speakerTested: false,
})
const inviteEmail = ref('')
const useCustomInviteEmail = ref(false)
const inviteLoading = ref(false)
const appointment = ref(null)

const sessionId = computed(() => route.params.sessionId)

const preferredRole = computed(() => {
  const queryRole = String(route.query.role ?? '').toUpperCase()
  if (queryRole === 'PATIENT') {
    return telehealthRoles.client
  }
  if (
    queryRole === telehealthRoles.clinician
    || queryRole === telehealthRoles.client
    || queryRole === telehealthRoles.guest
  ) {
    return queryRole
  }
  if (canCreateTelehealth.value) {
    return telehealthRoles.clinician
  }

  return telehealthRoles.client
})

/** Lobby may render before join sets session role. */
const isLobbyClinician = computed(() =>
  preferredRole.value === telehealthRoles.clinician
  || isClinician.value,
)

const displayAppointment = computed(() =>
  telehealthAppointmentViewFromSession(
    session.value,
    appointment.value,
  ),
)

/** Clinician sees client; client/staff-as-client sees clinician. */
const topbarPeerName = computed(() => {
  if (isLobbyClinician.value) {
    return (
      resolveTelehealthClientDisplayName(session.value)
      || String(
        displayAppointment.value?.clientDisplayName ?? '',
      ).trim()
    )
  }

  return String(
    displayAppointment.value?.clinicianDisplayName
    ?? session.value?.clinicianDisplayName
    ?? '',
  ).trim()
})
const topbarDate = computed(() =>
  formatUtcDateLong(displayAppointment.value?.startAtUtc) || '',
)
const topbarTime = computed(() =>
  formatUtcTimeRange(
    displayAppointment.value?.startAtUtc,
    displayAppointment.value?.endAtUtc,
  ) || '',
)
const showTopbarMeta = computed(() =>
  Boolean(
    topbarPeerName.value
    || topbarDate.value
    || topbarTime.value
    || (phase.value === 'in_call' && sessionElapsedLabel.value),
  ),
)

const clientMeetInviteUrl = computed(() =>
  String(
    session.value?.clientInviteUrl
    || appointment.value?.telehealthInviteUrl
    || '',
  ).trim(),
)

const endedDurationSeconds = computed(() => {
  const captured = Number(lastCallDurationSeconds.value)
  if (Number.isFinite(captured) && captured > 0) {
    return captured
  }

  return resolveTelehealthDurationSeconds(session.value)
})

const defaultDisplayName = computed(() => {
  const staff = authStore.linkedStaffProfile
  if (staff?.name) {
    return String(staff.name).trim()
  }
  const user = authStore.userInfo || {}
  const first = String(user.firstName ?? user.first_name ?? '').trim()
  const last = String(user.lastName ?? user.last_name ?? '').trim()
  const full = [first, last].filter(Boolean).join(' ')

  return full || String(user.email ?? user.username ?? '').trim()
})

const lobbyDisplayName = computed(() =>
  String(displayName.value ?? '').trim() || defaultDisplayName.value,
)

const sessionStatusLabel = computed(() =>
  telehealthSessionStatusLabel(session.value?.status, t),
)

const isSessionCompleted = computed(() =>
  String(session.value?.status ?? '').toUpperCase() === 'COMPLETED',
)

const canMarkSessionCompleted = computed(() =>
  canFinishTelehealth.value
  && !isTelehealthTerminalStatus(session.value?.status),
)

const canScreenShare = computed(() => {
  if (
    typeof navigator !== 'undefined'
    && !navigator.mediaDevices?.getDisplayMedia
  ) {
    return false
  }
  if (
    isClinician.value
    || canCreateTelehealth.value
    || canStartTelehealth.value
  ) {
    return true
  }

  return Boolean(session.value?.allowClientScreenShare)
})

async function onLobbyJoin(payload) {
  readyFlags.value = {
    cameraTested: Boolean(payload.cameraTested),
    microphoneTested: Boolean(payload.microphoneTested),
    speakerTested: Boolean(payload.speakerTested),
  }
  try {
    await join({
      sessionId: sessionId.value,
      joinRole: preferredRole.value,
      name: payload.displayName,
      previewStream: payload.previewStream || null,
      mediaPrefs: {
        audioEnabled: payload.microphoneEnabled !== false,
        videoEnabled: payload.cameraEnabled !== false,
        speakerEnabled: payload.speakerEnabled !== false,
      },
    })
    // Client ready is sent with Join session (no separate button).
    if (preferredRole.value === telehealthRoles.client) {
      await markReady(readyFlags.value)
    }
  } catch {
    // join/markReady already set session.error for the lobby.
  }
}

async function onAdmit(participantId) {
  await admit(participantId)
}

async function onStart() {
  await start()
}

async function onFinish() {
  await finish()
}

async function onLeave() {
  await leave()
}

async function onMinimize() {
  const ok = minimizeToRoute({
    name: 'TelehealthSession',
    params: { sessionId: String(sessionId.value) },
    query: { ...route.query },
  })
  if (ok) {
    await router.push({ name: 'Calendar' })
  }
}

async function onCopyInvite() {
  const url = clientMeetInviteUrl.value
  if (!url) {
    return
  }
  try {
    await copyToClipboard(url)
    $q.notify({
      type: 'positive',
      message: t('telehealthInviteCopied'),
    })
  } catch {
    $q.notify({
      type: 'negative',
      message: t('telehealthInviteCopyFailed'),
    })
  }
}

async function onResendInvite() {
  const customEmail = String(inviteEmail.value ?? '').trim()
  if (useCustomInviteEmail.value && !customEmail) {
    $q.notify({
      type: 'negative',
      message: t('telehealthResendInviteEmailRequired'),
    })

    return
  }
  inviteLoading.value = true
  try {
    await resendClientInvite(
      useCustomInviteEmail.value ? customEmail : '',
    )
    $q.notify({
      type: 'positive',
      message: t('telehealthInviteResent'),
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: String(err?.message || err),
    })
  } finally {
    inviteLoading.value = false
  }
}

async function onSendChat(body) {
  try {
    await sendChat(body)
  } catch (err) {
    $q.notify({ type: 'negative', message: String(err?.message || err) })
  }
}

async function onDeleteChat(messageId) {
  try {
    await removeChatMessage(messageId)
  } catch (err) {
    $q.notify({ type: 'negative', message: String(err?.message || err) })
  }
}

async function onUploadFile(file) {
  try {
    await uploadFile(file)
  } catch (err) {
    $q.notify({ type: 'negative', message: String(err?.message || err) })
  }
}

async function onDeleteFile(fileId) {
  try {
    await removeFile(fileId)
  } catch (err) {
    $q.notify({ type: 'negative', message: String(err?.message || err) })
  }
}

async function onDownloadFile(file) {
  try {
    const blob = await downloadFile(file.id)
    const name = file?.file?.originalName || `telehealth-file-${file.id}`
    triggerBlobDownload(blob, name)
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

function goCalendar() {
  router.push({ name: 'Calendar' })
}

async function onBackToMeet() {
  await beginLobbyEntry(sessionId.value)
  try {
    const existing = await getTelehealthSession(sessionId.value)
    if (existing) {
      hydrateSession(existing, { syncPhase: false })
    }
  } catch {
    // Lobby still allows join
  }
}

watch(
  () => session.value?.appointmentId,
  async appointmentId => {
    if (!appointmentId) {
      appointment.value = null

      return
    }
    try {
      appointment.value = await fetchAppointment(appointmentId)
    } catch {
      appointment.value = null
    }
  },
  { immediate: true },
)

onMounted(async() => {
  const { restored } = await beginLobbyEntry(sessionId.value)
  if (restored) {
    try {
      await refreshSession()
    } catch {
      // Keep in-call UI with current local state
    }

    return
  }
  try {
    const existing = await getTelehealthSession(sessionId.value)
    if (existing) {
      hydrateSession(existing, { syncPhase: false })
    }
  } catch {
    // Lobby still allows join
  }
})
</script>

<style lang="scss">
@import 'src/css/telehealth-room.scss';
</style>
