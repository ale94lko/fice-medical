<template>
  <header
    class="encounter-workspace-header"
    :data-testid="tid.header">
    <div
      class="encounter-workspace-header__identity
        client-overview-header__profile-head">
      <div class="client-overview-header__avatar-wrap">
        <div class="client-overview-header__avatar-block">
          <div
            class="client-overview-header__avatar
              encounter-workspace-header__avatar"
            role="img"
            :aria-label="t('clientOverviewProfilePhotoPlaceholder')">
            <StoredFileAvatar
              :file-id="photoFileId"
              spinner-size="32px"
            />
          </div>
          <span
            v-if="clientStatusLabel"
            class="client-overview-header__status-badge">
            {{ clientStatusLabel }}
          </span>
        </div>
      </div>

      <div class="client-overview-header__profile-body">
        <h2 class="client-overview-header__name
          encounter-workspace-header__name">
          {{ displayName }}
        </h2>
        <p
          v-if="dobAgeValue"
          class="encounter-workspace-header__dob-age">
          {{ dobAgeValue }}
        </p>
        <span
          v-if="clientNumber"
          class="client-overview-header__client-number-badge">
          <span class="client-overview-header__client-number-text">
            {{ clientNumber }}
          </span>
          <q-btn
            flat
            dense
            round
            size="xs"
            icon="content_copy"
            class="client-overview-header__copy-btn"
            :aria-label="t('clientOverviewCopyClientNumber')"
            @click="copyClientNumber"
          />
        </span>
      </div>
    </div>

    <div class="encounter-workspace-header__visit">
      <strong>{{ serviceLabel }}</strong>
      <span v-if="serviceCodes">{{ serviceCodes }}</span>
      <span v-if="startedLabel">
        {{ t('encounterStartedAt', { time: startedLabel }) }}
      </span>
    </div>

    <div class="encounter-workspace-header__provider">
      <div>
        <span class="encounter-workspace-header__label">
          {{ t('encounterRenderingClinician') }}
        </span>
        <strong>{{ renderingClinicianLabel }}</strong>
      </div>
      <div>
        <span class="encounter-workspace-header__label">
          {{ t('encounterLocation') }}
        </span>
        <strong>{{ locationLabel }}</strong>
      </div>
    </div>

    <div class="encounter-workspace-header__status-block">
      <div class="encounter-workspace-header__status-meta">
        <span>
          {{ encounterCodeLabel }}
        </span>
        <span v-if="dateLabel">{{ dateLabel }}</span>
      </div>
      <span
        class="encounter-workspace-header__status-badge"
        :class="`encounter-workspace-header__status-badge--${
          statusTone
        }`">
        <span class="encounter-workspace-header__status-dot" />
        {{ statusLabel }}
      </span>
    </div>

    <div class="encounter-workspace-header__actions">
      <q-btn
        no-caps
        outline
        color="primary"
        class="app-btn-outline"
        icon="folder_open"
        :label="t('encounterPatientChart')"
        :data-testid="tid.patientChart"
        @click="emit('patient-chart')"
      />
      <div class="encounter-workspace-header__actions-row">
        <q-btn
          v-if="showCancel"
          no-caps
          outline
          color="negative"
          class="app-btn-outline"
          :disable="busy"
          :label="t('encounterCancel')"
          :data-testid="tid.cancel"
          @click="emit('cancel')"
        />
        <q-btn
          v-if="showComplete"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :disable="!canComplete || busy"
          :loading="busy"
          :label="t('encounterComplete')"
          :data-testid="tid.complete"
          @click="emit('complete')"
        />
        <q-btn
          v-else-if="showReopen"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :disable="busy"
          :loading="busy"
          :label="t('encounterReopen')"
          :data-testid="tid.reopen"
          @click="emit('reopen')"
        />
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { copyToClipboard, useQuasar } from 'quasar'
import StoredFileAvatar from 'components/StoredFileAvatar.vue'
import {
  encounterStatuses,
  quasarNotifyTypes,
} from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'

const props = defineProps({
  encounter: {
    type: Object,
    default: null,
  },
  canComplete: {
    type: Boolean,
    default: false,
  },
  showReopen: {
    type: Boolean,
    default: false,
  },
  showCancel: {
    type: Boolean,
    default: false,
  },
  busy: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'patient-chart',
  'cancel',
  'complete',
  'reopen',
])

const { t } = useI18n()
const $q = useQuasar()
const authStore = useAuthStore()
const { linkedStaffProfile, activeSubtenant } = storeToRefs(authStore)

const showComplete = computed(() =>
  props.encounter?.status === encounterStatuses.inProgress,
)

const displayName = computed(() =>
  String(props.encounter?.clientDisplayName ?? '').trim() || '—',
)

const photoFileId = computed(() =>
  props.encounter?.clientPhotoFileId ?? null,
)

const clientNumber = computed(() =>
  String(props.encounter?.clientNumber ?? '').trim(),
)

const clientStatusLabel = computed(() => {
  const status = String(props.encounter?.clientStatus ?? 'active')
    .trim()
    .toLowerCase()
  if (status === 'inactive') {
    return t('inactive')
  }

  return t('active')
})

const dobAgeValue = computed(() => {
  const display = String(props.encounter?.clientDobDisplay ?? '').trim()
  if (display) {
    return display
  }
  const dob = formatDob(props.encounter?.clientDateOfBirth)
  const age = props.encounter?.clientAge
  if (!dob && age == null) {
    return ''
  }
  if (dob && age != null) {
    return t('encounterHeaderDobAgeValue', { dob, age })
  }
  if (dob) {
    return dob
  }

  return t('encounterHeaderAge', { age })
})

function copyClientNumber() {
  if (!clientNumber.value) {
    return
  }
  copyToClipboard(clientNumber.value)
    .then(() => {
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('clientOverviewCopiedClientNumber'),
        position: 'top',
      })
    })
    .catch(() => {})
}

const primaryService = computed(() =>
  props.encounter?.serviceProcedures?.[0] ?? null,
)

const serviceLabel = computed(() => {
  const service = primaryService.value
  if (!service?.name) {
    return t('encounterServiceFallback')
  }
  if (service.durationMinutes) {
    return `${service.name} — ${service.durationMinutes} min`
  }

  return service.name
})

const serviceCodes = computed(() => {
  const service = primaryService.value
  if (!service) {
    return ''
  }
  const code = service.cptCode || service.hcpcsCode
  if (!code) {
    return ''
  }

  return service.units != null
    ? `${code} · ${service.units} Unit`
    : code
})

const startedLabel = computed(() =>
  formatTime(props.encounter?.startedAtUtc),
)

const dateLabel = computed(() =>
  formatDate(props.encounter?.startedAtUtc),
)

function staffDisplayName(staff) {
  if (!staff || typeof staff !== 'object') {
    return ''
  }

  return String(
    staff.name
    ?? staff.displayName
    ?? [
      staff.firstName,
      staff.lastName,
    ].filter(Boolean).join(' ')
    ?? '',
  ).trim()
}

const renderingClinicianLabel = computed(() => {
  const fromEncounter = String(
    props.encounter?.clinicianName
    ?? props.encounter?.clinicianDisplayName
    ?? '',
  ).trim()
  if (fromEncounter) {
    return fromEncounter
  }
  const clinicianId = props.encounter?.clinicianId
  const staff = linkedStaffProfile.value
  if (
    clinicianId != null
    && staff?.id != null
    && Number(clinicianId) === Number(staff.id)
  ) {
    return staffDisplayName(staff) || '—'
  }

  return '—'
})

const locationLabel = computed(() => {
  const location = String(
    props.encounter?.locationName
    ?? props.encounter?.clinicName
    ?? activeSubtenant.value?.name
    ?? '',
  ).trim() || '—'
  const mode = props.encounter?.encounterMode
  if (!mode && props.encounter?.telemedicine == null) {
    return location
  }
  const modeLabel = mode === 'TELEHEALTH' || props.encounter?.telemedicine
    ? t('encounterModeTelehealth')
    : t('encounterModeInPerson')

  return `${location} / ${modeLabel}`
})

const encounterCodeLabel = computed(() => {
  const code = String(
    props.encounter?.encounterNumber
    ?? props.encounter?.displayCode
    ?? '',
  ).trim()

  return code || '—'
})

const statusLabel = computed(() => {
  const status = props.encounter?.status
  if (status === encounterStatuses.inProgress) {
    return t('encounterStatusInProgress')
  }
  if (status === encounterStatuses.completed) {
    return t('encounterStatusCompleted')
  }
  if (status === encounterStatuses.cancelled) {
    return t('encounterStatusCancelled')
  }

  return status || '—'
})

const statusTone = computed(() => {
  const status = props.encounter?.status
  if (status === encounterStatuses.inProgress) {
    return 'progress'
  }
  if (status === encounterStatuses.completed) {
    return 'completed'
  }

  return 'neutral'
})

function formatDob(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
    return raw
  }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return raw
  }

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()

  return `${month}/${day}/${year}`
}

function formatTime(value) {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDate(value) {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>
