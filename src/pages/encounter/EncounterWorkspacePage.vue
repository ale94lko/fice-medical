<template>
  <q-page
    class="admin-page encounter-workspace-page"
    :data-testid="tid.page">
    <AppLoadingOverlay scope="content" :showing="loading" />

    <template v-if="workspace?.encounter">
      <div
        v-if="returnSuperbillId"
        class="encounter-workspace-return no-print">
        <q-btn
          no-caps
          flat
          dense
          color="primary"
          icon="arrow_back"
          :data-testid="tid.returnToBilling"
          :label="t('encounterReturnToBilling')"
          @click="goBackToSuperbill"
        />
      </div>
      <EncounterWorkspaceHeader
        :encounter="workspace.encounter"
        :can-complete="completion?.canComplete === true"
        :show-reopen="canReopen"
        :show-cancel="canCancelEncounter"
        :show-wait="canWaitForResults"
        :show-resume="canResumeEncounter"
        :busy="actionBusy"
        @patient-chart="goToPatientChart"
        @cancel="cancelOpen = true"
        @complete="onComplete"
        @reopen="reopenOpen = true"
        @wait="waitOpen = true"
        @resume="onResume"
      />

      <EncounterAllergyBanner
        :items="workspace.allergies"
        @view-allergies="goToModule('allergies')"
      />

      <EncounterWorkspaceTabs
        v-model="activeTab"
        :show-narrative="showNarrativeTab"
      />

      <div class="encounter-workspace-page__body">
        <EncounterWorkspaceOverview
          v-if="activeTab === encounterWorkspaceTabs.overview"
          :completion="completion"
          :billing-readiness="workspace.billingReadiness"
          :superbill="workspace.superbill"
          :show-generate-superbill="showGenerateSuperbill"
          :narrative="workspace.narrative"
          :generated-note="generatedNoteForOverview"
          @requirement-action="onRequirementAction"
          @quick-action="onQuickAction"
          @waive-requirement="onWaiveRequest"
          @view-superbill="onViewSuperbill"
          @generate-superbill="onGenerateSuperbill"
          @review-generated-note="generatedNoteOpen = true"
          @retry-generate="onRetryGenerate"
        />
        <EncounterWorkspaceVisit
          v-else-if="activeTab === encounterWorkspaceTabs.visit"
          :encounter="workspace.encounter"
          :can-edit="canEdit"
          @services-saved="onVisitFieldsSaved"
          @diagnoses-saved="onVisitFieldsSaved"
          @chief-complaint-saved="onVisitFieldsSaved"
        />
        <EncounterWorkspaceClinical
          v-else-if="activeTab === encounterWorkspaceTabs.clinical"
          v-model="clinicalSubTab"
          :vitals="workspace.vitals"
          :screenings="workspace.screenings"
          :medications="workspace.medications"
          :care-plans="workspace.carePlans"
          :labs="workspace.labs"
          :client-id="workspace.encounter.clientId"
          :encounter-id="workspace.encounter.id"
          :can-edit="canEdit"
          :patient-dob="workspace.encounter.clientDateOfBirth"
          :patient-age="workspace.encounter.clientAge"
          :patient-age-unit="workspace.encounter.clientAgeUnit || 'years'"
          :patient-gender="patientGender"
          @changed="onClinicalDataChanged"
        />
        <EncounterWorkspaceNarrative
          v-else-if="activeTab === encounterWorkspaceTabs.narrative"
          :encounter-id="workspace.encounter.id"
          :narrative="workspace.narrative"
          :can-edit="canEditNarrative"
          @saved="onNarrativeSaved"
        />
        <EncounterWorkspaceFollowUp
          v-else
          :sections="workspace.sections"
          :client-id="workspace.encounter.clientId"
          @changed="onClinicalDataChanged"
        />
      </div>
    </template>

    <div
      v-else-if="!loading"
      class="encounter-workspace-page__empty">
      <q-icon name="medical_services" size="48px" color="grey-6" />
      <p>{{ loadError || t('encounterWorkspaceLoadError') }}</p>
      <q-btn
        no-caps
        unelevated
        color="primary"
        class="app-btn-primary"
        :label="t('encounterWorkspaceRetry')"
        @click="loadWorkspace"
      />
    </div>

    <EncounterCancelDialog
      v-model="cancelOpen"
      :saving="actionBusy"
      @confirm="onCancelConfirm"
    />
    <EncounterWaitForResultsDialog
      v-model="waitOpen"
      :labs="workspace?.labs ?? []"
      :saving="actionBusy"
      @confirm="onWaitConfirm"
    />
    <EncounterReopenDialog
      v-model="reopenOpen"
      :saving="actionBusy"
      @confirm="onReopenConfirm"
    />
    <EncounterWaiveRequirementDialog
      v-model="waiveOpen"
      :saving="actionBusy"
      :requirement="waiveTarget"
      @confirm="onWaiveConfirm"
    />
    <EncounterClinicalReviewDialog
      v-model="reviewOpen"
      :saving="actionBusy"
      :mode="reviewMode"
      @confirm="onReviewConfirm"
    />

    <EncounterGeneratedNoteDialog
      v-model="generatedNoteOpen"
      :note="workspace?.generatedClinicalNote"
      :busy="actionBusy"
      :can-sign="canSignGeneratedNote"
      :can-regenerate="canRegenerateGeneratedNote"
      @sign="onSignGeneratedNote"
      @regenerate="onRegenerateGeneratedNote"
    />

    <AiAssistantFab
      :visible="Boolean(workspace?.encounter?.clientId)"
      :client-id="workspace?.encounter?.clientId"
      :encounter-id="workspace?.encounter?.id"
      @open-chart-section="onOpenChartSection"
    />
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  addClientTabKeys,
  clientPermissionNames,
  encounterClinicalSubTabs,
  encounterRequirementPurposes,
  encounterStatuses,
  encounterWorkspaceTabs,
  permissionNames,
  quasarNotifyTypes,
} from 'components/constants.js'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import AiAssistantFab from 'components/ai/AiAssistantFab.vue'
import EncounterAllergyBanner from
  'components/encounter/EncounterAllergyBanner.vue'
import EncounterCancelDialog from
  'components/encounter/EncounterCancelDialog.vue'
import EncounterClinicalReviewDialog from
  'components/encounter/EncounterClinicalReviewDialog.vue'
import EncounterReopenDialog from
  'components/encounter/EncounterReopenDialog.vue'
import EncounterWaiveRequirementDialog from
  'components/encounter/EncounterWaiveRequirementDialog.vue'
import EncounterWaitForResultsDialog from
  'components/encounter/EncounterWaitForResultsDialog.vue'
import EncounterWorkspaceClinical from
  'components/encounter/EncounterWorkspaceClinical.vue'
import EncounterWorkspaceFollowUp from
  'components/encounter/EncounterWorkspaceFollowUp.vue'
import EncounterWorkspaceHeader from
  'components/encounter/EncounterWorkspaceHeader.vue'
import EncounterGeneratedNoteDialog from
  'components/encounter/EncounterGeneratedNoteDialog.vue'
import EncounterWorkspaceNarrative from
  'components/encounter/EncounterWorkspaceNarrative.vue'
import EncounterWorkspaceOverview from
  'components/encounter/EncounterWorkspaceOverview.vue'
import EncounterWorkspaceTabs from
  'components/encounter/EncounterWorkspaceTabs.vue'
import EncounterWorkspaceVisit from
  'components/encounter/EncounterWorkspaceVisit.vue'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  cancelEncounter,
  completeEncounter,
  createEncounterCarePlanReview,
  createEncounterMedicationReview,
  encounterApiErrorMessage,
  fetchEncounterRequirements,
  fetchEncounterWorkspace,
  reopenEncounter,
  resumeEncounter,
  waitEncounterForResults,
  waiveEncounterRequirement,
} from 'src/utils/encounter-api.js'
import { hasAnyPermission, hasPermission } from
  'src/utils/auth-permissions.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { resolveRequirementActionTarget } from
  'src/utils/encounter-requirement-actions.js'
import {
  hasEncounterChiefComplaint,
  withChiefComplaintRequirement,
} from 'src/utils/encounter-completion-chief-complaint.js'
import {
  markEncounterTimerResumed,
} from 'src/utils/encounter-session-watch.js'
import {
  canReopenEncounter,
  isEncounterCompleted,
  parseCompletionRequirementsError,
} from 'src/utils/encounter-workspace-normalize.js'
import {
  generateEncounterSuperbill,
  superbillApiErrorMessage,
} from 'src/utils/superbill-api.js'
import {
  regenerateClinicalNote,
  retryGenerateClinicalNote,
} from 'src/utils/encounter-narrative-api.js'
import { signClinicalNote } from 'src/utils/clinical-note-api.js'
import { useClientClinicalNotePermissions } from
  'src/composables/useClientClinicalNotePermissions.js'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const $q = useQuasar()
const authStore = useAuthStore()

const loading = ref(false)
const actionBusy = ref(false)
const workspace = ref(null)
const loadError = ref('')
const activeTab = ref(encounterWorkspaceTabs.overview)
const clinicalSubTab = ref(encounterClinicalSubTabs.vitals)
const cancelOpen = ref(false)
const waitOpen = ref(false)
const reopenOpen = ref(false)
const waiveOpen = ref(false)
const waiveTarget = ref(null)
const reviewOpen = ref(false)
const reviewMode = ref('medication')
const reviewCarePlanId = ref(null)
const generatedNoteOpen = ref(false)
const { canSignClinicalNotes } = useClientClinicalNotePermissions()

const encounterId = computed(() =>
  String(route.params.id ?? '').trim(),
)

const canEdit = computed(() =>
  workspace.value?.encounter?.status === encounterStatuses.inProgress,
)

const encounterStatus = computed(() =>
  workspace.value?.encounter?.status,
)

const showGenerateSuperbill = computed(() =>
  isEncounterCompleted(workspace.value?.encounter)
  && !workspace.value?.superbill?.id,
)

const canCancelEncounter = computed(() =>
  encounterStatus.value === encounterStatuses.inProgress
    || encounterStatus.value === encounterStatuses.waitingForResults
    || encounterStatus.value === encounterStatuses.readyToResume,
)

const canWaitForResults = computed(() =>
  encounterStatus.value === encounterStatuses.inProgress
    && hasAnyPermission(authStore.permissions, [
      clientPermissionNames.waitEncounter,
      clientPermissionNames.manageEncounter,
    ]),
)

const canResumeEncounter = computed(() =>
  encounterStatus.value === encounterStatuses.readyToResume
    && hasAnyPermission(authStore.permissions, [
      clientPermissionNames.resumeEncounter,
      clientPermissionNames.manageEncounter,
    ]),
)

const canReopen = computed(() =>
  canReopenEncounter(workspace.value),
)

const showNarrativeTab = computed(() =>
  workspace.value?.narrative?.showTab !== false
  && Boolean(workspace.value?.narrative?.fields?.length),
)

const canEditNarrative = computed(() => {
  const status = encounterStatus.value
  const open = status === encounterStatuses.inProgress
    || status === encounterStatuses.waitingForResults
    || status === encounterStatuses.readyToResume

  return open
    && (hasPermission(
      authStore.permissions,
      permissionNames.encounterNarrativeEdit,
    )
      || hasPermission(
        authStore.permissions,
        clientPermissionNames.manageEncounter,
      ))
})

const canSignGeneratedNote = computed(() =>
  canSignClinicalNotes.value
  && isEncounterCompleted(workspace.value?.encounter),
)

const canRegenerateGeneratedNote = computed(() =>
  hasPermission(
    authStore.permissions,
    permissionNames.clinicalNoteRegenerate,
  )
  && isEncounterCompleted(workspace.value?.encounter)
  && String(workspace.value?.generatedClinicalNote?.status ?? '')
    .toUpperCase() !== 'SIGNED',
)

const generatedNoteForOverview = computed(() => {
  const note = workspace.value?.generatedClinicalNote
  if (note?.id) {
    return note
  }
  if (isEncounterCompleted(workspace.value?.encounter)
    && workspace.value?.encounter?.clinicalNoteTemplateId) {
    return {
      ...(note || {}),
      generationFailed: true,
    }
  }

  return note
})

const completion = computed(() =>
  withChiefComplaintRequirement(
    workspace.value?.completion,
    workspace.value?.encounter,
    {
      label: t('encounterNotesSection'),
      description: '',
      actionLabel: t('encounterChiefComplaintRequirementAction'),
      addServiceAction: t('encounterAddService'),
    },
  ),
)

const patientGender = computed(() => {
  const encounter = workspace.value?.encounter

  return String(
    encounter?.clientGender
    ?? encounter?.gender
    ?? '',
  ).trim()
})

const moduleRouteMap = {
  vitals: { tab: addClientTabKeys.clinical, subTab: 'vitals' },
  assessments: { tab: addClientTabKeys.clinical, subTab: 'screenings' },
  medications: { tab: addClientTabKeys.clinical, subTab: 'medications' },
  'care-plans': {
    tab: addClientTabKeys.careCoordination,
    subTab: 'care-plans',
  },
  labs: { tab: addClientTabKeys.clinical, subTab: 'labs' },
  'clinical-notes': {
    tab: addClientTabKeys.clinical,
    subTab: 'clinical-notes',
  },
  allergies: { tab: addClientTabKeys.allergies },
  appointments: { tab: addClientTabKeys.appointments },
  'follow-ups': {
    tab: addClientTabKeys.careCoordination,
    subTab: 'follow-ups',
  },
  referrals: {
    tab: addClientTabKeys.careCoordination,
    subTab: 'referrals',
  },
  documents: { tab: addClientTabKeys.documents },
  'follow-up': {
    tab: addClientTabKeys.careCoordination,
    subTab: 'follow-ups',
  },
}

async function loadWorkspace() {
  const id = encounterId.value
  if (!id) {
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    workspace.value = await fetchEncounterWorkspace(id)
  } catch (error) {
    workspace.value = null
    if (!isAuthSessionEndUIError(error)) {
      loadError.value = encounterApiErrorMessage(
        error,
        t('encounterWorkspaceLoadError'),
      )
    }
  } finally {
    loading.value = false
  }
}

function goToPatientChart() {
  const clientId = workspace.value?.encounter?.clientId
  if (clientId == null) {
    return
  }
  router.push({
    name: 'ClientOverview',
    params: { id: String(clientId) },
  })
}

function goToModule(key) {
  const clientId = workspace.value?.encounter?.clientId
  const encounter = workspace.value?.encounter?.id
  if (clientId == null) {
    return
  }
  const mapped = moduleRouteMap[key] || { tab: addClientTabKeys.basic }
  router.push({
    name: 'EditClient',
    params: { id: String(clientId) },
    query: {
      ...(mapped.tab ? { tab: mapped.tab } : {}),
      ...(mapped.subTab ? { subTab: mapped.subTab } : {}),
      ...(encounter != null ? { encounterId: String(encounter) } : {}),
    },
  })
}

function onOpenChartSection(section) {
  if (!section?.tab) {
    return
  }
  const clientId = workspace.value?.encounter?.clientId
  const encounter = workspace.value?.encounter?.id
  if (clientId == null) {
    return
  }
  router.push({
    name: 'EditClient',
    params: { id: String(clientId) },
    query: {
      tab: section.tab,
      ...(section.subTab ? { subTab: section.subTab } : {}),
      ...(encounter != null ? { encounterId: String(encounter) } : {}),
    },
  })
}

function onQuickAction(key) {
  if (key === 'follow-up') {
    activeTab.value = encounterWorkspaceTabs.followUp

    return
  }
  if (key === 'vitals') {
    activeTab.value = encounterWorkspaceTabs.clinical
    clinicalSubTab.value = encounterClinicalSubTabs.vitals

    return
  }
  if (key === 'medications') {
    activeTab.value = encounterWorkspaceTabs.clinical
    clinicalSubTab.value = encounterClinicalSubTabs.medications

    return
  }
  if (key === 'care-plans') {
    activeTab.value = encounterWorkspaceTabs.clinical
    clinicalSubTab.value = encounterClinicalSubTabs.carePlans

    return
  }
  goToModule(key)
}

let clinicalRefreshTimer = null

async function refreshWorkspaceClinical() {
  const id = encounterId.value
  if (!id) {
    return
  }
  try {
    const loaded = await fetchEncounterWorkspace(id)
    if (!workspace.value) {
      workspace.value = loaded

      return
    }
    workspace.value = {
      ...workspace.value,
      ...loaded,
      encounter: loaded.encounter ?? workspace.value.encounter,
    }
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      // Keep current snapshot if refresh fails.
    }
  }
}

function onClinicalDataChanged() {
  if (clinicalRefreshTimer) {
    clearTimeout(clinicalRefreshTimer)
  }
  clinicalRefreshTimer = setTimeout(() => {
    clinicalRefreshTimer = null
    void refreshWorkspaceClinical()
  }, 600)
}

async function refreshCompletion() {
  const id = workspace.value?.encounter?.id
  if (id == null) {
    return
  }
  try {
    const completion = await fetchEncounterRequirements(
      id,
      encounterRequirementPurposes.encounterCompletion,
    )
    workspace.value = {
      ...workspace.value,
      completion,
    }
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      // Keep current snapshot if refresh fails.
    }
  }
}

function onRequirementAction(item) {
  const target = resolveRequirementActionTarget(item)
  if (target.reviewGeneratedNote) {
    generatedNoteOpen.value = true

    return
  }
  if (target.workspaceTab) {
    activeTab.value = target.workspaceTab
  }
  if (target.clinicalSubTab) {
    clinicalSubTab.value = target.clinicalSubTab
  }
  if (target.review === 'medication') {
    reviewMode.value = 'medication'
    reviewCarePlanId.value = null
    reviewOpen.value = true

    return
  }
  if (target.review === 'care-plan') {
    reviewMode.value = 'care-plan'
    reviewCarePlanId.value = target.carePlanId
    reviewOpen.value = true

    return
  }
  // Stay in workspace when the target maps to an embedded tab.
  if (target.workspaceTab) {
    return
  }
  if (target.moduleKey) {
    goToModule(target.moduleKey)
  }
}

function onWaiveRequest(item) {
  waiveTarget.value = item
  waiveOpen.value = true
}

async function onWaiveConfirm({ reason }) {
  const encounter = workspace.value?.encounter
  const requirementId = waiveTarget.value?.id
  if (encounter?.id == null || requirementId == null) {
    return
  }
  actionBusy.value = true
  try {
    const completion = await waiveEncounterRequirement(
      encounter.id,
      requirementId,
      { reason },
    )
    workspace.value = {
      ...workspace.value,
      completion,
    }
    waiveOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('encounterRequirementWaiveSuccess'),
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: encounterApiErrorMessage(
          error,
          t('encounterRequirementWaiveError'),
        ),
      })
    }
  } finally {
    actionBusy.value = false
  }
}

async function onReviewConfirm({ notes }) {
  const encounter = workspace.value?.encounter
  if (encounter?.id == null) {
    return
  }
  actionBusy.value = true
  try {
    if (reviewMode.value === 'care-plan') {
      await createEncounterCarePlanReview(encounter.id, {
        carePlanId: reviewCarePlanId.value,
        notes,
      })
    } else {
      await createEncounterMedicationReview(encounter.id, {
        noChangesRequired: true,
        notes,
      })
    }
    reviewOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('encounterReviewSuccess'),
    })
    await refreshCompletion()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: encounterApiErrorMessage(
          error,
          t('encounterReviewError'),
        ),
      })
    }
  } finally {
    actionBusy.value = false
  }
}

async function onVisitFieldsSaved(updated) {
  if (updated && workspace.value?.encounter) {
    const previous = workspace.value.encounter
    workspace.value = {
      ...workspace.value,
      encounter: {
        ...previous,
        ...updated,
        clientDisplayName: updated.clientDisplayName
          || previous.clientDisplayName,
        clientNumber: updated.clientNumber || previous.clientNumber,
        clientDobDisplay: updated.clientDobDisplay
          || previous.clientDobDisplay,
        clientDateOfBirth: updated.clientDateOfBirth
          || previous.clientDateOfBirth,
        clientAge: updated.clientAge ?? previous.clientAge,
        clientAgeUnit: updated.clientAgeUnit
          || previous.clientAgeUnit
          || 'years',
        clientStatus: updated.clientStatus || previous.clientStatus,
        clientPhotoFileId: updated.clientPhotoFileId
          ?? previous.clientPhotoFileId,
      },
    }
  }
  await refreshCompletion()
}

async function onWaitConfirm(payload) {
  const id = workspace.value?.encounter?.id
  if (id == null) {
    return
  }
  actionBusy.value = true
  try {
    await waitEncounterForResults(id, payload)
    waitOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('encounterWaitSuccess'),
    })
    await loadWorkspace()
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
    actionBusy.value = false
  }
}

async function onResume() {
  const before = workspace.value?.encounter
  const id = before?.id
  if (id == null) {
    return
  }
  actionBusy.value = true
  try {
    const resumed = await resumeEncounter(id)
    markEncounterTimerResumed(before, resumed)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('encounterResumeSuccess'),
    })
    await loadWorkspace()
  } catch (error) {
    if (isAuthSessionEndUIError(error)) {
      return
    }
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: encounterApiErrorMessage(
        error,
        t('encounterResumeError'),
      ),
    })
  } finally {
    actionBusy.value = false
  }
}

async function onComplete() {
  const id = workspace.value?.encounter?.id
  if (id == null) {
    return
  }
  if (!hasEncounterChiefComplaint(workspace.value?.encounter)) {
    activeTab.value = encounterWorkspaceTabs.visit
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('encounterChiefComplaintRequiredToComplete'),
      position: 'top',
    })

    return
  }
  actionBusy.value = true
  try {
    await completeEncounter(
      id,
      workspace.value.encounter.clientId,
    )
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('encounterCompleteSuccess'),
    })
    await loadWorkspace()
    await ensureGeneratedNote(id)
  } catch (error) {
    if (isAuthSessionEndUIError(error)) {
      return
    }
    const missing = parseCompletionRequirementsError(error)
    if (missing) {
      workspace.value = {
        ...workspace.value,
        completion: {
          ...workspace.value.completion,
          canComplete: false,
          missingRequirements: missing.missingRequirements,
          requirements: missing.requirements.length
            ? missing.requirements
            : workspace.value.completion?.requirements,
          optionalActions: missing.optionalActions?.length
            ? missing.optionalActions
            : workspace.value.completion?.optionalActions,
        },
      }
      $q.notify({
        type: quasarNotifyTypes.warning,
        message: t('encounterCompleteRequirementsMissing'),
      })
      const narrativeMissing = (
        missing.missingRequirements || []
      ).some(row => String(row.type).toUpperCase() === 'NARRATIVE')
      if (narrativeMissing) {
        activeTab.value = encounterWorkspaceTabs.narrative
      }

      return
    }
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: encounterApiErrorMessage(
        error,
        t('encounterCompleteError'),
      ),
    })
  } finally {
    actionBusy.value = false
  }
}

async function onCancelConfirm(payload) {
  const id = workspace.value?.encounter?.id
  if (id == null) {
    return
  }
  actionBusy.value = true
  try {
    await cancelEncounter(
      id,
      workspace.value.encounter.clientId,
      payload,
    )
    cancelOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('encounterCancelSuccess'),
    })
    goToPatientChart()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: encounterApiErrorMessage(
          error,
          t('encounterCancelError'),
        ),
      })
    }
  } finally {
    actionBusy.value = false
  }
}

async function onReopenConfirm(payload) {
  const before = workspace.value?.encounter
  const id = before?.id
  if (id == null) {
    return
  }
  actionBusy.value = true
  try {
    const reopened = await reopenEncounter(id, payload)
    markEncounterTimerResumed(before, reopened)
    reopenOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('encounterReopenSuccess'),
    })
    await loadWorkspace()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: encounterApiErrorMessage(
          error,
          t('encounterReopenError'),
        ),
      })
    }
  } finally {
    actionBusy.value = false
  }
}

async function ensureGeneratedNote(id) {
  if (workspace.value?.generatedClinicalNote?.id) {
    return
  }
  if (!workspace.value?.encounter?.clinicalNoteTemplateId) {
    return
  }
  try {
    const note = await retryGenerateClinicalNote(id)
    if (note?.id && workspace.value) {
      workspace.value = {
        ...workspace.value,
        generatedClinicalNote: note,
      }
    }
  } catch {
    // Generation can be retried from Overview.
  }
}

function onNarrativeSaved(saved) {
  if (!workspace.value) {
    return
  }
  workspace.value = {
    ...workspace.value,
    narrative: saved,
  }
  void refreshCompletion()
}

async function onSignGeneratedNote(signatureData) {
  const note = workspace.value?.generatedClinicalNote
  const clientId = workspace.value?.encounter?.clientId
  if (note?.id == null || clientId == null) {
    return
  }
  actionBusy.value = true
  try {
    await signClinicalNote(clientId, note.id, signatureData)
    generatedNoteOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('encounterGeneratedNoteSignSuccess'),
    })
    await loadWorkspace()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: encounterApiErrorMessage(
          error,
          t('clinicalNoteSignError'),
        ),
      })
    }
  } finally {
    actionBusy.value = false
  }
}

async function onRegenerateGeneratedNote() {
  const id = workspace.value?.encounter?.id
  if (id == null) {
    return
  }
  actionBusy.value = true
  try {
    const note = await regenerateClinicalNote(id)
    workspace.value = {
      ...workspace.value,
      generatedClinicalNote: note,
    }
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('encounterGeneratedNoteRegenerateSuccess'),
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: encounterApiErrorMessage(
          error,
          t('clinicalNoteSaveError'),
        ),
      })
    }
  } finally {
    actionBusy.value = false
  }
}

async function onRetryGenerate() {
  const id = workspace.value?.encounter?.id
  if (id == null) {
    return
  }
  actionBusy.value = true
  try {
    const note = await retryGenerateClinicalNote(id)
    workspace.value = {
      ...workspace.value,
      generatedClinicalNote: note,
    }
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('encounterGeneratedNoteGenerateSuccess'),
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: encounterApiErrorMessage(
          error,
          t('clinicalNoteSaveError'),
        ),
      })
    }
  } finally {
    actionBusy.value = false
  }
}

watch(encounterId, () => {
  void loadWorkspace()
}, { immediate: true })

watch(() => route.query.tab, tab => {
  const value = Array.isArray(tab) ? tab[0] : tab
  const allowed = Object.values(encounterWorkspaceTabs)
  if (allowed.includes(value)) {
    activeTab.value = value
  }
}, { immediate: true })

watch(showNarrativeTab, visible => {
  if (!visible && activeTab.value === encounterWorkspaceTabs.narrative) {
    activeTab.value = encounterWorkspaceTabs.overview
  }
})

function onViewSuperbill() {
  const id = workspace.value?.superbill?.id
  if (id == null) {
    return
  }
  void router.push({
    name: 'SuperbillDetail',
    params: { id: String(id) },
  })
}

const returnSuperbillId = computed(() =>
  String(route.query.returnSuperbillId ?? '').trim(),
)

function goBackToSuperbill() {
  if (!returnSuperbillId.value) {
    return
  }
  void router.push({
    name: 'SuperbillDetail',
    params: { id: returnSuperbillId.value },
  })
}

async function onGenerateSuperbill() {
  const id = encounterId.value
  if (!id) {
    return
  }
  actionBusy.value = true
  try {
    const generated = await generateEncounterSuperbill(id)
    await loadWorkspace()
    if (!generated?.id) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('superbillGenerateEmpty'),
      })
      return
    }
    void router.push({
      name: 'SuperbillDetail',
      params: { id: String(generated.id) },
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: superbillApiErrorMessage(
          error,
          t('superbillActionError'),
        ),
      })
    }
  } finally {
    actionBusy.value = false
  }
}
</script>
