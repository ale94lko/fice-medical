<template>
  <header
    class="encounter-workspace-header"
    :data-testid="tid.header">
    <!-- Desktop / tablet: original layout (unchanged) -->
    <div
      v-if="!isMobile"
      class="encounter-workspace-header__main">
      <div
        class="encounter-workspace-header__identity
          client-overview-header__profile-head">
        <div class="client-overview-header__avatar-wrap">
          <div class="client-overview-header__avatar-block">
            <div
              class="client-overview-header__avatar
                encounter-workspace-header__avatar">
              <StoredFileAvatar
                :file-id="photoFileId"
                previewable
                spinner-size="32px"
                :preview-label="t('photoPreviewAria')"
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
            <span
              class="client-overview-header__client-number-text">
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
        <span v-if="waitingSinceLabel">
          {{ t('encounterWaitingSince', { time: waitingSinceLabel }) }}
        </span>
        <span v-if="readySinceLabel">
          {{ t('encounterReadySince', { time: readySinceLabel }) }}
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
          <span>{{ encounterCodeLabel }}</span>
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
            v-if="showWait"
            no-caps
            unelevated
            color="warning"
            class="app-btn-primary"
            :disable="busy"
            :label="t('encounterWait')"
            :data-testid="tid.wait"
            @click="emit('wait')"
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
            v-else-if="showResume"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :disable="busy"
            :loading="busy"
            :label="t('encounterResume')"
            :data-testid="tid.resume"
            @click="emit('resume')"
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
    </div>

    <!-- Mobile-only layout -->
    <div
      v-else
      class="encounter-workspace-header__main
        encounter-workspace-header__main--mobile">
      <div class="encounter-workspace-header__mobile-top">
        <div class="client-overview-header__avatar-block">
          <div
            class="client-overview-header__avatar
              encounter-workspace-header__avatar">
            <StoredFileAvatar
              :file-id="photoFileId"
              previewable
              spinner-size="32px"
              :preview-label="t('photoPreviewAria')"
            />
          </div>
          <span
            v-if="clientStatusLabel"
            class="client-overview-header__status-badge">
            {{ clientStatusLabel }}
          </span>
        </div>

        <div
          class="encounter-workspace-header__client-number-mid">
          <span
            v-if="clientNumber"
            class="client-overview-header__client-number-badge
              encounter-workspace-header__client-number-badge">
            <span
              class="client-overview-header__client-number-text">
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
          <strong
            v-else
            class="encounter-workspace-header__meta-value">
            —
          </strong>
          <span
            class="encounter-workspace-header__status-badge
              encounter-workspace-header__status-badge--inline"
            :class="`encounter-workspace-header__status-badge--${
              statusTone
            }`">
            <span class="encounter-workspace-header__status-dot" />
            {{ statusLabel }}
          </span>
        </div>

        <div class="encounter-workspace-header__avatar-menu">
          <q-btn
            flat
            dense
            round
            icon="more_vert"
            :aria-label="t('moreActions')"
            :disable="busy"
            :data-testid="tid.actionsMenu">
            <q-menu
              anchor="bottom right"
              self="top right"
              :offset="[0, 8]"
              class="app-light-menu
                encounter-workspace-header__actions-menu"
              :data-testid="tid.actionsMenuPanel">
              <q-list>
                <q-item
                  v-for="action in mobilePageActions"
                  :key="action.key"
                  v-close-popup
                  clickable
                  :disable="Boolean(action.disable)"
                  :data-testid="action.testId"
                  @click="action.onClick?.()">
                  <q-item-section
                    v-if="action.icon"
                    avatar>
                    <q-icon
                      :name="action.icon"
                      :color="action.color || 'primary'"
                      size="20px"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label
                      :class="actionLabelClass(action)">
                      {{ action.label }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>

      <div class="encounter-workspace-header__mobile-meta">
        <div
          v-if="hasDobAge"
          class="encounter-workspace-header__meta-cell">
          <span class="encounter-workspace-header__label">
            {{ t('clientOverviewDobAge') }}
          </span>
          <div class="client-overview-alt-header__dob-value-row">
            <strong
              v-if="dobDisplay"
              class="encounter-workspace-header__meta-value">
              {{ dobDisplay }}
            </strong>
            <span
              v-if="ageLabel"
              class="client-overview-alt-header__age-badge">
              {{ ageLabel }}
            </span>
          </div>
        </div>

        <div class="encounter-workspace-header__meta-cell">
          <span class="encounter-workspace-header__label">
            {{ mobileStartedLabel }}
          </span>
          <strong class="encounter-workspace-header__meta-value">
            {{ mobileStartedValue || '—' }}
          </strong>
        </div>
      </div>

      <div class="encounter-workspace-header__provider">
        <div class="encounter-workspace-header__meta-cell">
          <span class="encounter-workspace-header__label">
            {{ t('encounterRenderingClinician') }}
          </span>
          <strong class="encounter-workspace-header__meta-value">
            {{ renderingClinicianLabel }}
          </strong>
        </div>
        <div class="encounter-workspace-header__meta-cell">
          <span class="encounter-workspace-header__label">
            {{ t('encounterLocation') }}
          </span>
          <strong class="encounter-workspace-header__meta-value">
            {{ locationLabel }}
          </strong>
        </div>
      </div>

      <div class="encounter-workspace-header__status-block">
        <div class="encounter-workspace-header__status-meta">
          <span class="encounter-workspace-header__encounter-code">
            {{ encounterCodeLabel }}
          </span>
          <span v-if="dateLabel">{{ dateLabel }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="showWaitBanner"
      class="encounter-workspace-header__wait"
      :data-testid="tid.waitBanner">
      <div class="encounter-workspace-header__wait-copy">
        <strong>
          {{ waitBannerTitle }}
        </strong>
        <ul class="encounter-workspace-header__wait-list">
          <li
            v-for="item in waitItems"
            :key="item.key">
            {{ item.done ? '✓' : '○' }}
            {{ item.name }}
          </li>
        </ul>
      </div>
      <div
        v-if="activityTimeLabel"
        class="encounter-workspace-header__wait-time">
        {{ activityTimeLabel }}
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
import { useSyncAppPageTitle } from
  'src/composables/useAppPageTitle.js'
import { useViewportLayout } from
  'src/composables/useViewportLayout.js'

const props = defineProps({
  encounter: {
    type: Object,
    default: null,
  },
  canComplete: {
    type: Boolean,
    default: false,
  },
  showComplete: {
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
  showWait: {
    type: Boolean,
    default: false,
  },
  showResume: {
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
  'wait',
  'resume',
])

const { t } = useI18n()
const $q = useQuasar()
const authStore = useAuthStore()
const { isMobile } = useViewportLayout()
const { linkedStaffProfile, activeSubtenant } = storeToRefs(authStore)

const displayName = computed(() =>
  String(props.encounter?.clientDisplayName ?? '').trim() || '—',
)

useSyncAppPageTitle(displayName)

const mobilePageActions = computed(() => {
  if (!isMobile.value) {
    return []
  }

  return buildMobilePageActions({
    busy: props.busy,
    canComplete: props.canComplete,
    showCancel: props.showCancel,
    showWait: props.showWait,
    showComplete: props.showComplete,
    showResume: props.showResume,
    showReopen: props.showReopen,
    t,
    emit,
  })
})

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

const dobDisplay = computed(() => {
  const fromField = formatDob(props.encounter?.clientDateOfBirth)
  if (fromField) {
    return fromField
  }
  const raw = String(props.encounter?.clientDobDisplay ?? '').trim()
  if (!raw) {
    return ''
  }
  const match = raw.match(/^(\d{1,2}\/\d{1,2}\/\d{4})/)

  return match ? match[1] : raw.replace(/\s*\([^)]*\)\s*$/, '').trim()
})

const ageLabel = computed(() => {
  const age = props.encounter?.clientAge
  if (age == null || age === '') {
    const raw = String(props.encounter?.clientDobDisplay ?? '').trim()
    const match = raw.match(/\(([^)]+)\)\s*$/)
    if (match) {
      return String(match[1]).trim()
    }

    return ''
  }
  const unit = String(props.encounter?.clientAgeUnit ?? 'years')
    .trim()
    .toLowerCase()
  if (
    !unit
    || unit === 'years'
    || unit === 'year'
    || unit === 'yrs'
    || unit === 'yr'
  ) {
    return t('clientOverviewAgeYears', { count: Number(age) || age })
  }

  return `${age} ${unit}`
})

const hasDobAge = computed(() =>
  Boolean(dobDisplay.value || ageLabel.value),
)

/** Desktop/tablet: original combined DOB + age string. */
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

const waitingSinceLabel = computed(() =>
  formatTime(props.encounter?.wait?.waitingSince),
)

const readySinceLabel = computed(() =>
  formatTime(props.encounter?.wait?.readyToResumeSince),
)

const mobileStartedLabel = computed(() => {
  if (waitingSinceLabel.value) {
    return t('encounterWaitingSinceLabel')
  }
  if (readySinceLabel.value) {
    return t('encounterReadySinceLabel')
  }

  return t('encounterStartedAtLabel')
})

const mobileStartedValue = computed(() => {
  if (waitingSinceLabel.value) {
    return waitingSinceLabel.value
  }
  if (readySinceLabel.value) {
    return readySinceLabel.value
  }

  return startedLabel.value
})

const waitItems = computed(() => {
  const wait = props.encounter?.wait
  if (!wait) {
    return []
  }
  const pending = (wait.pendingDependencies ?? []).map(dep => ({
    key: `p-${dep.id ?? dep.diagnosticOrderId}`,
    name: dep.testName || t('encounterWaitUnnamedLab'),
    done: false,
  }))
  const resolved = (wait.resolvedDependencies ?? []).map(dep => ({
    key: `r-${dep.id ?? dep.diagnosticOrderId}`,
    name: dep.testName || t('encounterWaitUnnamedLab'),
    done: true,
  }))

  return [...resolved, ...pending]
})

const showWaitBanner = computed(() =>
  props.encounter?.status === encounterStatuses.waitingForResults
    || props.encounter?.status === encounterStatuses.readyToResume,
)

const waitBannerTitle = computed(() => {
  if (props.encounter?.status === encounterStatuses.readyToResume) {
    return t('encounterResultsAvailable')
  }

  return t('encounterWaitingFor')
})

const activityTimeLabel = computed(() => {
  const wait = props.encounter?.wait
  if (!wait) {
    return ''
  }
  const active = wait.activeClinicalMinutes
  const waiting = wait.waitingMinutes
  if (active == null && waiting == null) {
    return ''
  }

  return t('encounterActivityTime', {
    active: active ?? 0,
    waiting: waiting ?? 0,
  })
})

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
  if (status === encounterStatuses.waitingForResults) {
    return t('encounterStatusWaitingForResults')
  }
  if (status === encounterStatuses.readyToResume) {
    return t('encounterStatusReadyToResume')
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
  if (status === encounterStatuses.waitingForResults) {
    return 'waiting'
  }
  if (status === encounterStatuses.readyToResume) {
    return 'ready'
  }
  if (status === encounterStatuses.completed) {
    return 'completed'
  }

  return 'neutral'
})

function actionLabelClass(action) {
  if (action?.color === 'negative') {
    return 'text-negative'
  }
  if (action?.color === 'primary') {
    return 'text-primary'
  }

  return undefined
}

function buildMobilePageActions({
  busy,
  canComplete,
  showCancel,
  showWait,
  showComplete,
  showResume,
  showReopen,
  t: translate,
  emit: emitAction,
}) {
  const items = [
    {
      key: 'patient-chart',
      label: translate('encounterPatientChart'),
      icon: 'folder_open',
      color: 'primary',
      testId: tid.patientChart,
      onClick: () => emitAction('patient-chart'),
    },
  ]

  if (showCancel) {
    items.push({
      key: 'cancel',
      label: translate('encounterCancel'),
      color: 'negative',
      disable: busy,
      testId: tid.cancel,
      onClick: () => emitAction('cancel'),
    })
  }
  if (showWait) {
    items.push({
      key: 'wait',
      label: translate('encounterWait'),
      color: 'warning',
      disable: busy,
      testId: tid.wait,
      onClick: () => emitAction('wait'),
    })
  }
  if (showComplete) {
    items.push({
      key: 'complete',
      label: translate('encounterComplete'),
      color: 'primary',
      disable: !canComplete || busy,
      testId: tid.complete,
      onClick: () => emitAction('complete'),
    })
  } else if (showResume) {
    items.push({
      key: 'resume',
      label: translate('encounterResume'),
      color: 'primary',
      disable: busy,
      testId: tid.resume,
      onClick: () => emitAction('resume'),
    })
  } else if (showReopen) {
    items.push({
      key: 'reopen',
      label: translate('encounterReopen'),
      icon: 'replay',
      color: 'primary',
      disable: busy,
      testId: tid.reopen,
      onClick: () => emitAction('reopen'),
    })
  }

  return items
}

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
