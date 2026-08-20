<template>
  <div class="app-active-encounter-host">
    <div
      v-if="visible"
      ref="shellRef"
      class="app-active-encounter"
      :class="{ 'app-active-encounter--paused': isPaused }">
      <span
        class="app-active-encounter__border-flow"
        aria-hidden="true">
        <svg
          class="app-active-encounter__border-svg"
          :viewBox="svgViewBox"
          :width="svgWidth"
          :height="svgHeight">
          <path
            class="app-active-encounter__border-path"
            pathLength="100"
            :d="pathTop"
          />
          <path
            class="app-active-encounter__border-path"
            pathLength="100"
            :d="pathBottom"
          />
        </svg>
      </span>
      <q-btn
        flat
        dense
        no-caps
        unelevated
        class="app-active-encounter__pill"
        :aria-label="t('activeEncounterToolbarAria')"
        :data-testid="tid.toolbarPill"
        :disable="busy">
        <span
          class="app-active-encounter__pulse"
          aria-hidden="true">
          <span
            v-if="!isPaused"
            class="app-active-encounter__pulse-ring"
          />
          <span class="app-active-encounter__icon-badge">
            <q-icon name="medical_services" size="18px" />
          </span>
        </span>
        <span class="app-active-encounter__label">
          {{ t('activeEncounterToolbarLabel') }}
        </span>
        <span
          v-if="elapsedLabel"
          class="app-active-encounter__elapsed"
          aria-live="polite">
          {{ elapsedLabel }}
        </span>
        <q-icon
          v-if="showActionMenu"
          class="app-active-encounter__chevron"
          name="expand_more"
          size="20px"
          aria-hidden="true"
        />
        <q-menu
          v-if="showActionMenu"
          anchor="bottom middle"
          self="top middle"
          class="app-active-encounter-menu app-light-menu"
          :offset="[0, 8]"
          @before-show="onMenuBeforeShow">
          <div class="app-active-encounter-menu__header">
            <span
              class="app-active-encounter-menu__avatar"
              aria-hidden="true">
              <q-icon name="medical_services" size="22px" />
            </span>
            <div class="app-active-encounter-menu__header-text">
              <button
                type="button"
                v-close-popup
                class="app-active-encounter-menu__client-name"
                :data-testid="tid.toolbarClientName"
                @click="goToWorkspace">
                {{ clientDisplayName }}
              </button>
              <p class="app-active-encounter-menu__meta">
                {{ encounterMetaLabel }}
              </p>
              <p
                v-if="elapsedLabel"
                class="app-active-encounter-menu__elapsed">
                {{ t('activeEncounterToolbarElapsed', {
                  elapsed: elapsedLabel,
                }) }}
              </p>
              <p
                v-if="chiefComplaint"
                class="app-active-encounter-menu__complaint">
                {{ chiefComplaint }}
              </p>
            </div>
          </div>

          <div class="app-active-encounter-menu__actions">
            <div class="app-active-encounter-menu__actions-row">
              <q-btn
                v-if="showCancelButton"
                outline
                no-caps
                no-wrap
                color="negative"
                class="app-btn-outline"
                :disable="busy || actionBusy"
                :label="t('encounterCancel')"
                :data-testid="tid.cancel"
                v-close-popup
                @click="confirmCancelOpen = true"
              />
              <q-btn
                v-if="showWaitButton"
                unelevated
                no-caps
                no-wrap
                color="warning"
                class="app-btn-primary"
                :disable="busy || actionBusy"
                :loading="waitLabsLoading"
                :label="t('encounterWait')"
                :data-testid="tid.wait"
                v-close-popup
                @click="onWaitClick"
              />
              <q-btn
                v-if="showCompleteButton"
                unelevated
                no-caps
                no-wrap
                color="primary"
                class="app-btn-primary"
                :disable="!canCompleteNow || busy || actionBusy
                  || completionLoading"
                :loading="completionLoading"
                :label="t('encounterComplete')"
                :data-testid="tid.complete"
                v-close-popup="canCompleteNow && !busy && !actionBusy"
                @click="onCompleteClick"
              />
              <q-btn
                v-else-if="showResumeButton"
                unelevated
                no-caps
                no-wrap
                color="primary"
                class="app-btn-primary"
                :disable="busy || actionBusy"
                :loading="busy || actionBusy"
                :label="t('encounterResume')"
                :data-testid="tid.resume"
                v-close-popup
                @click="onResume"
              />
            </div>
            <p
              v-if="completeBlockedHint"
              class="app-active-encounter-menu__hint"
              :data-testid="tid.completeHint">
              {{ completeBlockedHint }}
            </p>
          </div>
        </q-menu>
      </q-btn>
    </div>

    <ModalComponent
      v-model="confirmCompleteOpen"
      :title="t('activeEncounterCompleteConfirmTitle')"
      :message="t('activeEncounterCompleteConfirmMessage')"
      :confirm-text="t('activeEncounterComplete')"
      :cancel-text="t('cancel')"
      test-id="active-encounter-complete"
      @confirm="onComplete"
    />
    <EncounterCancelDialog
      v-model="confirmCancelOpen"
      :saving="busy || actionBusy"
      @confirm="onCancel"
    />
    <EncounterWaitForResultsDialog
      v-model="waitOpen"
      :labs="waitLabs"
      :saving="busy || actionBusy"
      @confirm="onWaitConfirm"
    />
    <ActiveEncounterAutoCompleteDialog
      v-model="autoCompleteOpen"
      :countdown-seconds="countdownSeconds"
      :busy="actionBusy || busy"
      @continue="onContinueEncounter"
      @complete="onConfirmAutoComplete"
    />
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
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  clientPermissionNames,
  encounterStatuses,
  encounterTypes,
  quasarNotifyTypes,
} from 'components/constants.js'
import ModalComponent from 'components/ModalComponent.vue'
import ActiveEncounterAutoCompleteDialog from
  'components/ActiveEncounterAutoCompleteDialog.vue'
import EncounterCancelDialog from
  'components/encounter/EncounterCancelDialog.vue'
import EncounterWaitForResultsDialog from
  'components/encounter/EncounterWaitForResultsDialog.vue'
import { hasAnyPermission, hasPermission } from
  'src/utils/auth-permissions.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { useSiteStore } from 'src/stores/site-store.js'
import { encounterTestIds as tid } from 'src/test-ids/index.js'
import { useEncounterPermissions } from
  'src/composables/useEncounterPermissions.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { formatPersonDisplayNameFromRecord } from
  'src/utils/person-display-name.js'
import { clientChartKey } from 'components/helpers.js'
import { useActiveEncounterWatchdog } from
  'src/composables/useActiveEncounterWatchdog.js'
import { useToolbarOpenEncounterSync } from
  'src/composables/useToolbarOpenEncounterSync.js'
import {
  cancelEncounter,
  completeEncounter,
  encounterApiErrorMessage,
  fetchEncounterRequirements,
  fetchEncounterWorkspace,
  isEncounterConflictError,
  isEncounterInvalidError,
  resumeEncounter,
  toolbarActiveEncounter,
  waitEncounterForResults,
} from 'src/utils/encounter-api.js'
import {
  isEncounterOpen,
  isEncounterReadyToResume,
  isEncounterWaiting,
} from 'src/utils/encounter-normalize.js'
import {
  hasEncounterChiefComplaint,
  withChiefComplaintRequirement,
} from 'src/utils/encounter-completion-chief-complaint.js'
import { formatMissingNarrativeRequirements } from
  'src/utils/encounter-requirements-normalize.js'
import { parseCompletionRequirementsError } from
  'src/utils/encounter-workspace-normalize.js'

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const siteStore = useSiteStore()
useToolbarOpenEncounterSync()

const {
  elapsedLabel,
  autoCompleteOpen,
  countdownSeconds,
  actionBusy,
  onContinueEncounter,
  onConfirmAutoComplete,
} = useActiveEncounterWatchdog()

const busy = ref(false)
const confirmCompleteOpen = ref(false)
const confirmCancelOpen = ref(false)
const waitOpen = ref(false)
const waitLabs = ref([])
const waitLabsLoading = ref(false)
const loadingClientName = ref(false)
const completionSnapshot = ref(null)
const completionLoading = ref(false)
const completionFetchFailed = ref(false)
const shellRef = ref(null)
const svgWidth = ref(120)
const svgHeight = ref(38)
const pathTop = ref('')
const pathBottom = ref('')

let resizeObserver = null

const svgViewBox = computed(() =>
  `0 0 ${svgWidth.value} ${svgHeight.value}`,
)

function round(value) {
  return Math.round(value * 100) / 100
}

function updateBorderPaths() {
  const el = shellRef.value
  if (!el) {
    return
  }
  const width = el.offsetWidth
  const height = el.offsetHeight
  if (width < 8 || height < 8) {
    return
  }

  const inset = 1.25
  const radius = Math.max((height / 2) - inset, 1)
  const midY = height / 2
  const startX = width - inset
  const leftX = inset
  const topY = inset
  const bottomY = height - inset
  const rightStraightX = width - inset - radius
  const leftStraightX = inset + radius

  svgWidth.value = width
  svgHeight.value = height

  // Right midpoint → top/bottom arcs → straight edges → left midpoint (icon).
  pathTop.value = [
    `M ${round(startX)} ${round(midY)}`,
    `A ${round(radius)} ${round(radius)} 0 0 0`
      + ` ${round(rightStraightX)} ${round(topY)}`,
    `L ${round(leftStraightX)} ${round(topY)}`,
    `A ${round(radius)} ${round(radius)} 0 0 0`
      + ` ${round(leftX)} ${round(midY)}`,
  ].join(' ')

  pathBottom.value = [
    `M ${round(startX)} ${round(midY)}`,
    `A ${round(radius)} ${round(radius)} 0 0 1`
      + ` ${round(rightStraightX)} ${round(bottomY)}`,
    `L ${round(leftStraightX)} ${round(bottomY)}`,
    `A ${round(radius)} ${round(radius)} 0 0 1`
      + ` ${round(leftX)} ${round(midY)}`,
  ].join(' ')
}

function bindShellObserver() {
  unbindShellObserver()
  const el = shellRef.value
  if (!el || typeof ResizeObserver === 'undefined') {
    updateBorderPaths()

    return
  }
  resizeObserver = new ResizeObserver(() => {
    updateBorderPaths()
  })
  resizeObserver.observe(el)
  updateBorderPaths()
}

function unbindShellObserver() {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
}

const {
  canManageEncounter,
  canCompleteEncounter,
  canCancelEncounter,
} = useEncounterPermissions()

const canView = computed(() =>
  canManageEncounter.value
  || canCompleteEncounter.value
  || canCancelEncounter.value
  || hasPermission(
    authStore.permissions,
    clientPermissionNames.viewEncounter,
  ),
)

const canViewClient = computed(() =>
  hasPermission(
    authStore.permissions,
    clientPermissionNames.viewClient,
  ),
)

const activeEntry = computed(() => toolbarActiveEncounter.value)

const activeEncounter = computed(() => activeEntry.value?.encounter ?? null)

const encounterStatus = computed(() =>
  String(activeEncounter.value?.status ?? '').toUpperCase(),
)

const isPaused = computed(() => {
  const encounter = activeEncounter.value

  return isEncounterWaiting(encounter)
    || isEncounterReadyToResume(encounter)
})

const showCompleteButton = computed(() =>
  canCompleteEncounter.value
  && encounterStatus.value === encounterStatuses.inProgress,
)

const showCancelButton = computed(() =>
  canCancelEncounter.value
  && (
    encounterStatus.value === encounterStatuses.inProgress
    || encounterStatus.value === encounterStatuses.waitingForResults
    || encounterStatus.value === encounterStatuses.readyToResume
  ),
)

const showWaitButton = computed(() =>
  encounterStatus.value === encounterStatuses.inProgress
  && hasAnyPermission(authStore.permissions, [
    clientPermissionNames.waitEncounter,
    clientPermissionNames.manageEncounter,
  ]),
)

const showResumeButton = computed(() =>
  isEncounterReadyToResume(activeEncounter.value)
  && hasAnyPermission(authStore.permissions, [
    clientPermissionNames.resumeEncounter,
    clientPermissionNames.manageEncounter,
  ]),
)

const showActionMenu = computed(() =>
  showCompleteButton.value
  || showCancelButton.value
  || showWaitButton.value
  || showResumeButton.value,
)

const completion = computed(() =>
  withChiefComplaintRequirement(
    completionSnapshot.value,
    activeEncounter.value,
    {
      label: t('encounterNotesSection'),
      description: '',
      actionLabel: t('encounterChiefComplaintRequirementAction'),
      addServiceAction: t('encounterAddService'),
    },
  ),
)

const canCompleteNow = computed(() =>
  showCompleteButton.value
  && !completionLoading.value
  && !completionFetchFailed.value
  && completionSnapshot.value != null
  && completion.value?.canComplete === true,
)

const completeBlockedHint = computed(() => {
  if (!showCompleteButton.value || canCompleteNow.value) {
    return ''
  }
  if (completionLoading.value) {
    return ''
  }
  if (!hasEncounterChiefComplaint(activeEncounter.value)) {
    return t('encounterChiefComplaintRequiredToComplete')
  }

  return t('encounterCompleteRequirementsMissing')
})

const visible = computed(() =>
  canView.value
  && isEncounterOpen(toolbarActiveEncounter.value?.encounter),
)

watch(visible, (isVisible) => {
  if (!isVisible) {
    unbindShellObserver()

    return
  }
  nextTick().then(() => {
    bindShellObserver()
  })
}, { immediate: true })

watch(() => activeEncounter.value?.id, () => {
  completionSnapshot.value = null
  completionFetchFailed.value = false
  waitLabs.value = []
})

onBeforeUnmount(() => {
  unbindShellObserver()
})

const chiefComplaint = computed(() =>
  String(activeEncounter.value?.chiefComplaint ?? '').trim(),
)

function nameFromClientRecord(raw) {
  if (!raw || typeof raw !== 'object') {
    return ''
  }

  return formatPersonDisplayNameFromRecord(
    raw,
    {
      prefixSelectOptions: siteStore.prefixCatalogSelectOptions ?? [],
      suffixSelectOptions: siteStore.suffixCatalogSelectOptions ?? [],
    },
    raw.name,
  )
}

const clientDisplayName = computed(() => {
  const fromEncounter = String(
    activeEncounter.value?.clientDisplayName ?? '',
  ).trim()
  if (fromEncounter) {
    return fromEncounter
  }
  const chartKey = clientChartKey(activeEncounter.value)
  const clientId = String(
    activeEntry.value?.clientId
    ?? activeEncounter.value?.clientId
    ?? '',
  ).trim()
  if (!chartKey && !clientId) {
    return t('activeEncounterToolbarClientFallback')
  }
  const fromStore = nameFromClientRecord(
    siteStore.clientListSourceById[chartKey]
    || siteStore.clientListSourceById[clientId],
  )
  if (fromStore) {
    return fromStore
  }
  if (loadingClientName.value) {
    return t('activeEncounterToolbarClientLoading')
  }

  return t('activeEncounterToolbarClientFallback')
})

function encounterTypeLabel(type) {
  switch (String(type ?? '').toUpperCase()) {
    case encounterTypes.phone:
      return t('encounterTypePhone')
    case encounterTypes.telehealth:
      return t('encounterTypeTelehealth')
    case encounterTypes.scheduled:
      return t('encounterTypeScheduled')
    case encounterTypes.walkIn:
    default:
      return t('encounterTypeWalkIn')
  }
}

const encounterMetaLabel = computed(() => {
  const type = encounterTypeLabel(activeEncounter.value?.encounterType)
  if (isEncounterReadyToResume(activeEncounter.value)) {
    return t('activeEncounterToolbarMetaReady', { type })
  }
  if (isEncounterWaiting(activeEncounter.value) || isPaused.value) {
    return t('activeEncounterToolbarMetaPaused', { type })
  }

  return t('activeEncounterToolbarMeta', { type })
})

async function loadClientDisplayName() {
  const chartKey = clientChartKey(activeEncounter.value)
  if (!chartKey || !canViewClient.value) {
    return
  }
  if (nameFromClientRecord(siteStore.clientListSourceById[chartKey])) {
    return
  }
  if (String(activeEncounter.value?.clientDisplayName ?? '').trim()) {
    return
  }
  loadingClientName.value = true
  try {
    await siteStore.fetchClientById(chartKey)
  } catch (error) {
    if (isAuthSessionEndUIError(error)) {
      return
    }
  } finally {
    loadingClientName.value = false
  }
}

async function loadCompletionSnapshot() {
  const id = activeEncounter.value?.id
  if (id == null || !showCompleteButton.value) {
    return
  }
  completionLoading.value = true
  completionFetchFailed.value = false
  try {
    completionSnapshot.value = await fetchEncounterRequirements(id)
  } catch (error) {
    completionSnapshot.value = null
    completionFetchFailed.value = true
    if (isAuthSessionEndUIError(error)) {
      return
    }
  } finally {
    completionLoading.value = false
  }
}

async function onMenuBeforeShow() {
  await Promise.all([
    loadClientDisplayName(),
    loadCompletionSnapshot(),
  ])
}

function goToWorkspace() {
  const encounterId = activeEncounter.value?.id
  if (encounterId == null) {
    return
  }
  router.push({
    name: 'EncounterWorkspace',
    params: { id: String(encounterId) },
  })
}

function notifyError(error) {
  let message = encounterApiErrorMessage(
    error,
    t('activeEncounterActionError'),
  )
  if (isEncounterConflictError(error)) {
    message = t('activeEncounterConflict')
  } else if (isEncounterInvalidError(error)) {
    message = t('activeEncounterInvalid')
  }
  $q.notify({
    type: quasarNotifyTypes.negative,
    message,
  })
}

function notifySuccess(message) {
  $q.notify({
    type: quasarNotifyTypes.positive,
    message,
  })
}

function onCompleteClick() {
  if (!canCompleteNow.value || busy.value || actionBusy.value) {
    return
  }
  confirmCompleteOpen.value = true
}

function applyMissingCompletionRequirements(missing) {
  completionSnapshot.value = {
    ...(completionSnapshot.value || {}),
    canComplete: false,
    missingRequirements: missing.missingRequirements,
    requirements: missing.requirements.length
      ? missing.requirements
      : completionSnapshot.value?.requirements,
    optionalActions: missing.optionalActions?.length
      ? missing.optionalActions
      : completionSnapshot.value?.optionalActions,
  }
}

function notifyMissingCompletionRequirements(missing) {
  const missingRows = missing.missingRequirements || []
  const narrativeMessage = formatMissingNarrativeRequirements(
    t,
    missingRows,
  )
  const onlyNarrativeMissing = missingRows.length > 0
    && missingRows.every(row =>
      String(row.type).toUpperCase() === 'NARRATIVE')
  $q.notify({
    type: quasarNotifyTypes.warning,
    message: onlyNarrativeMissing && narrativeMessage
      ? narrativeMessage
      : t('encounterCompleteRequirementsMissing'),
  })
}

async function onComplete() {
  const entry = toolbarActiveEncounter.value
  if (!entry?.encounter?.id || !canCompleteEncounter.value) {
    return
  }
  if (!canCompleteNow.value) {
    confirmCompleteOpen.value = false

    return
  }
  if (!hasEncounterChiefComplaint(entry.encounter)) {
    confirmCompleteOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('encounterChiefComplaintRequiredToComplete'),
      position: 'top',
    })

    return
  }
  busy.value = true
  try {
    await completeEncounter(entry.encounter.id, entry.clientId)
    confirmCompleteOpen.value = false
    notifySuccess(t('activeEncounterCompleteSuccess'))
  } catch (error) {
    if (isAuthSessionEndUIError(error)) {
      return
    }
    const missing = parseCompletionRequirementsError(error)
    if (missing) {
      confirmCompleteOpen.value = false
      applyMissingCompletionRequirements(missing)
      notifyMissingCompletionRequirements(missing)

      return
    }
    notifyError(error)
  } finally {
    busy.value = false
  }
}

async function onWaitClick() {
  const id = activeEncounter.value?.id
  if (id == null || !showWaitButton.value) {
    return
  }
  waitLabsLoading.value = true
  busy.value = true
  try {
    const workspace = await fetchEncounterWorkspace(id)
    waitLabs.value = workspace?.labs ?? []
    waitOpen.value = true
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error)
    }
  } finally {
    waitLabsLoading.value = false
    busy.value = false
  }
}

async function onWaitConfirm(payload) {
  const entry = toolbarActiveEncounter.value
  if (!entry?.encounter?.id || !showWaitButton.value) {
    return
  }
  busy.value = true
  try {
    await waitEncounterForResults(entry.encounter.id, payload)
    waitOpen.value = false
    notifySuccess(t('encounterWaitSuccess'))
  } catch (error) {
    if (isAuthSessionEndUIError(error)) {
      return
    }
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: encounterApiErrorMessage(
        error,
        t('encounterWaitError'),
      ),
    })
  } finally {
    busy.value = false
  }
}

async function onResume() {
  const entry = toolbarActiveEncounter.value
  if (!entry?.encounter?.id || !showResumeButton.value) {
    return
  }
  busy.value = true
  try {
    await resumeEncounter(entry.encounter.id)
    notifySuccess(t('encounterResumeSuccess'))
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error)
    }
  } finally {
    busy.value = false
  }
}

async function onCancel(payload = {}) {
  const entry = toolbarActiveEncounter.value
  if (!entry?.encounter?.id || !canCancelEncounter.value) {
    return
  }
  busy.value = true
  try {
    await cancelEncounter(
      entry.encounter.id,
      entry.clientId,
      payload,
    )
    confirmCancelOpen.value = false
    notifySuccess(t('activeEncounterCancelSuccess'))
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error)
    }
  } finally {
    busy.value = false
  }
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables.scss';

.app-active-encounter-host {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
}

.app-active-encounter {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  margin-right: 8px;
}

.app-active-encounter__pill {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 4px 10px 4px 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
  color: $shell-text;
  overflow: visible;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.32);
  }
}

.app-active-encounter__border-flow {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  pointer-events: none;
  z-index: 2;
  overflow: visible;
}

.app-active-encounter__border-svg {
  position: absolute;
  inset: 0;
  overflow: visible;
}

.app-active-encounter__border-path {
  fill: none;
  stroke: rgba(134, 239, 172, 0.98);
  stroke-width: 2.25;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 20 100;
  stroke-dashoffset: 0;
  opacity: 0;
  filter: drop-shadow(0 0 3px rgba(134, 239, 172, 0.9));
  animation: app-active-encounter-border-flow 2.2s linear infinite;
}

.app-active-encounter__pulse {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  margin-right: 6px;
}

.app-active-encounter__icon-badge {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(22, 163, 74, 0.95);
  color: #ffffff;
}

.app-active-encounter__pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(134, 239, 172, 0.95);
  animation: app-active-encounter-pulse 2.2s ease-out infinite;
  pointer-events: none;
}

.app-active-encounter__label,
.app-active-encounter__elapsed,
.app-active-encounter__chevron {
  position: relative;
  z-index: 1;
}

.app-active-encounter__label {
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.app-active-encounter__elapsed {
  margin-left: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  opacity: 0.92;
  white-space: nowrap;
}

.app-active-encounter__chevron {
  opacity: 0.9;
}

.app-active-encounter--paused {
  .app-active-encounter__border-flow {
    display: none;
  }

  .app-active-encounter__pulse-ring {
    animation: none;
    opacity: 0;
  }
}

/* pathLength=100: tip reaches left midpoint at -80 */
@keyframes app-active-encounter-border-flow {
  0%,
  6% {
    stroke-dashoffset: 0;
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  58% {
    stroke-dashoffset: -80;
    opacity: 1;
  }

  64% {
    stroke-dashoffset: -80;
    opacity: 0;
  }

  100% {
    stroke-dashoffset: -80;
    opacity: 0;
  }
}

@keyframes app-active-encounter-pulse {
  0%,
  56% {
    transform: scale(0.9);
    opacity: 0;
  }

  62% {
    transform: scale(1);
    opacity: 0.95;
  }

  86% {
    transform: scale(1.65);
    opacity: 0;
  }

  100% {
    transform: scale(1.65);
    opacity: 0;
  }
}
</style>
