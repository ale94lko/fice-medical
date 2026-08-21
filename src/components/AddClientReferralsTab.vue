<template>
  <div class="add-client-referrals-tab">
    <div
      v-if="!canViewReferrals"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('referralNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div
        class="referrals-header row"
        :class="isMobile ? 'items-center' : 'items-start'">
        <div class="col">
          <h2 class="referrals-title">
            {{ t('referralsTitle') }}
          </h2>
          <p
            v-if="!isMobile"
            class="referrals-subtitle text-body2">
            {{ t('referralsSubtitle') }}
          </p>
        </div>
        <div class="col-auto">
          <q-btn
            v-if="canAddReferrals"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :disable="saving"
            :data-testid="tid.btn('add')"
            :label="t('referralAdd')"
            @click="openAdd"
          />
        </div>
      </div>

      <AdminTablePanel
        class="referrals-table-panel admin-table-panel--wide q-mt-md"
        :show-column-settings="false">
        <ReferralsTable
          :rows="referralRows"
          :clinician-options="resolvedClinicianOptions"
          :empty-label="t('referralListEmpty')"
          :can-edit="canEditReferrals"
          :can-schedule="canBookAppointment"
          :can-delete="canDeleteReferrals"
          :can-decline="canEditReferrals"
          :can-close="canEditReferrals"
          @view="openView"
          @edit="openEdit"
          @schedule="onSchedule"
          @decline="confirmDecline"
          @close="confirmClose"
          @delete="confirmDelete"
        />
      </AdminTablePanel>
    </template>

    <ReferralDialog
      v-model="dialogOpen"
      :mode="dialogMode"
      :referral="activeReferral"
      :clinician-options="resolvedClinicianOptions"
      :assigned-clinician-id="assignedClinicianId"
      :client-id="clientId"
      :initial-pending-files="dialogPendingFiles"
      :saving="saving"
      :can-upload-documents="canEditReferrals"
      :document-uploading="documentUploading"
      @save="onSave"
      @cancel="dialogOpen = false"
      @upload-document="onUploadDocument"
      @download-document="onDownloadDocument"
      @delete-document="onDeleteDocument"
    />

    <CarePlanReasonDialog
      v-model="reasonDialogOpen"
      :title="reasonTitle"
      :message="reasonMessage"
      :reason-label="reasonLabel"
      :confirm-label="reasonConfirmLabel"
      reason-field="referral-list-reason"
      @confirm="onReasonConfirmed"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import CarePlanReasonDialog from 'components/CarePlanReasonDialog.vue'
import ReferralDialog from 'components/ReferralDialog.vue'
import ReferralsTable from 'components/ReferralsTable.vue'
import { quasarNotifyTypes, referralStatuses } from
  'components/constants.js'
import { useClientReferralPermissions } from
  'src/composables/useClientReferralPermissions.js'
import { useClientAppointmentPermissions } from
  'src/composables/useClientAppointmentPermissions.js'
import { useViewportLayout } from
  'src/composables/useViewportLayout.js'
import {
  apiErrorMessage,
  createClientReferral,
  deleteClientReferral,
  deleteReferralFile,
  downloadReferralFile,
  updateClientReferral,
  uploadReferralFile,
} from 'src/utils/referral-api.js'
import {
  buildFollowUpDraftFromReferral,
  shouldCreateFollowUpFromReferral,
  shouldRemoveFollowUpFromReferral,
} from 'src/utils/referral-follow-up.js'
import {
  isExtraReferralDraft,
  isIntakeReferralDraft,
  isLocalReferralDraft,
  stampExtraReferralDraft,
} from 'src/utils/referral-intake.js'
import {
  mapReferralsListFromApi,
  normalizeReferralDetail,
} from 'src/utils/referral-normalize.js'
import {
  cloneReferral,
  createEmptyReferral,
} from 'src/utils/referral-orders.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { useSiteStore } from 'src/stores/site-store.js'
import { referralTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
  referrals: {
    type: Array,
    default: () => [],
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
  assignedClinicianId: {
    type: [String, Number],
    default: null,
  },
  intakePendingFiles: {
    type: Array,
    default: () => [],
  },
  extraReferralDrafts: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'schedule-appointment',
  'create-follow-up',
  'remove-follow-up',
  'update-intake-draft',
  'upsert-extra-draft',
  'remove-extra-draft',
  'ensure-assigned-clinician',
])

const { t } = useI18n()
const $q = useQuasar()
const { isMobile } = useViewportLayout()
const siteStore = useSiteStore()
const {
  canViewReferrals,
  canAddReferrals,
  canEditReferrals,
  canDeleteReferrals,
} = useClientReferralPermissions()
const { canBookAppointment } = useClientAppointmentPermissions()

const saving = ref(false)
const documentUploading = ref(false)

const dialogOpen = ref(false)
const dialogMode = ref('add')
const activeReferral = ref(null)
const reasonDialogOpen = ref(false)
const pendingActionReferral = ref(null)
const pendingReasonAction = ref(null)

const hasClientId = computed(() => Boolean(String(props.clientId ?? '').trim()))
const clientId = computed(() => String(props.clientId ?? '').trim())

const resolvedClinicianOptions = computed(() => props.clinicianOptions ?? [])

const reasonTitle = computed(() => {
  if (pendingReasonAction.value === 'delete') {
    return t('referralDeleteConfirmTitle')
  }
  if (pendingReasonAction.value === referralStatuses.declined) {
    return t('referralDeclineReasonTitle')
  }

  return t('referralCloseReasonTitle')
})

const reasonMessage = computed(() => {
  if (pendingReasonAction.value === 'delete') {
    return t('referralDeleteReasonMessage')
  }
  if (pendingReasonAction.value === referralStatuses.declined) {
    return t('referralDeclineReasonMessage')
  }

  return t('referralCloseReasonMessage')
})

const reasonLabel = computed(() => {
  if (pendingReasonAction.value === 'delete') {
    return t('referralDeleteReasonLabel')
  }
  if (pendingReasonAction.value === referralStatuses.declined) {
    return t('referralDeclineReasonLabel')
  }

  return t('referralCloseReasonLabel')
})

const reasonConfirmLabel = computed(() => {
  if (pendingReasonAction.value === 'delete') {
    return t('delete')
  }
  if (pendingReasonAction.value === referralStatuses.declined) {
    return t('referralActionDecline')
  }

  return t('referralActionClose')
})

const referralsRaw = computed(() =>
  Array.isArray(props.referrals) ? props.referrals : [],
)

const dialogPendingFiles = computed(() => {
  if (isIntakeReferralDraft(activeReferral.value)) {
    return props.intakePendingFiles
  }
  const extraId = String(activeReferral.value?.id ?? '')
  const extra = (props.extraReferralDrafts ?? []).find(item =>
    String(item?.referral?.id ?? '') === extraId,
  )

  return extra?.pendingFiles ?? []
})

const referralRows = computed(() => {
  const persisted = []
  const drafts = []
  referralsRaw.value.forEach(row => {
    if (isLocalReferralDraft(row)) {
      drafts.push(row)
    } else {
      persisted.push(row)
    }
  })

  return [...drafts, ...mapReferralsListFromApi(persisted)]
})

function findRawReferral(referralId) {
  return referralsRaw.value.find(
    row => String(row?.id) === String(referralId),
  )
}

function referralDetailFromRecord(referralId) {
  const raw = findRawReferral(referralId)
  if (!raw) {
    return null
  }

  return normalizeReferralDetail(raw)
}

async function refreshClientReferrals() {
  if (!hasClientId.value) {
    return
  }
  try {
    await siteStore.fetchClientById(clientId.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, t('referralLoadError'))
    }
  }
}

function openAdd() {
  dialogMode.value = 'add'
  activeReferral.value = createEmptyReferral({
    assignedClinicianId: props.assignedClinicianId ?? null,
  })
  dialogOpen.value = true
}

function openView(row) {
  dialogMode.value = 'view'
  activeReferral.value = referralDetailFromRecord(row.id)
    ?? cloneReferral(row)
  dialogOpen.value = true
}

function openEdit(row) {
  dialogMode.value = 'edit'
  activeReferral.value = isLocalReferralDraft(row)
    ? cloneReferral(row)
    : (referralDetailFromRecord(row.id) ?? cloneReferral(row))
  dialogOpen.value = true
}

async function uploadPendingReferralFiles(referralId, files) {
  const list = Array.isArray(files)
    ? files.filter(file => file instanceof File)
    : []
  if (!referralId || !list.length) {
    return
  }
  for (const file of list) {
    await uploadReferralFile(clientId.value, referralId, file)
  }
}

function emitEnsureAssignedClinician(referral) {
  const referralId = referral?.id
  if (referralId == null || referralId === '') {
    return
  }
  emit('ensure-assigned-clinician', {
    referralId,
    clinicianId: referral?.assignedClinicianId ?? null,
  })
}

function emitFollowUpFromLocalReferral(referral, previous) {
  if (referral.followUpRequired) {
    emit('create-follow-up', buildFollowUpDraftFromReferral(referral))
  } else {
    emit(
      'remove-follow-up',
      previous.id ?? referral.id,
    )
  }
}

function saveLocalReferralDraft(referral, pendingFiles) {
  const previous = cloneReferral(
    activeReferral.value ?? createEmptyReferral(),
  )
  if (isIntakeReferralDraft(referral)) {
    emit('update-intake-draft', {
      referral: cloneReferral(referral),
      pendingFiles: [...pendingFiles],
    })
    emitFollowUpFromLocalReferral(referral, previous)
    emitEnsureAssignedClinician(referral)
  } else {
    const stamped = stampExtraReferralDraft(referral)
    emit('upsert-extra-draft', {
      referral: stamped,
      pendingFiles: [...pendingFiles],
    })
    emitFollowUpFromLocalReferral(stamped, previous)
    emitEnsureAssignedClinician(stamped)
  }
  dialogOpen.value = false
  activeReferral.value = null
  $q.notify({
    type: quasarNotifyTypes.positive,
    message: t('referralIntakeDraftUpdated'),
    position: 'top',
  })
}

async function onSave(payload) {
  const referral = payload?.referral ?? payload
  const pendingFiles = payload?.pendingFiles ?? []
  if (!referral) {
    return
  }
  if (isLocalReferralDraft(referral) || !hasClientId.value) {
    saveLocalReferralDraft(referral, pendingFiles)

    return
  }
  const previous = cloneReferral(activeReferral.value ?? createEmptyReferral())
  saving.value = true
  try {
    const saved = referral.id
      ? await updateClientReferral(clientId.value, referral)
      : await createClientReferral(clientId.value, referral)
    await uploadPendingReferralFiles(saved.id, pendingFiles)
    await refreshClientReferrals()
    dialogOpen.value = false
    activeReferral.value = null
    emitEnsureAssignedClinician({
      id: saved?.id ?? referral.id,
      assignedClinicianId:
        saved?.assignedClinicianId ?? referral.assignedClinicianId,
    })
    if (shouldCreateFollowUpFromReferral(saved, previous)) {
      emit('create-follow-up', buildFollowUpDraftFromReferral(saved))
    } else if (shouldRemoveFollowUpFromReferral(saved, previous)) {
      emit('remove-follow-up', saved.id)
    }
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('referralSaveSuccess'),
      position: 'top',
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, t('referralSaveError'))
    }
  } finally {
    saving.value = false
  }
}

function onSchedule(row) {
  emit('schedule-appointment', row)
}

function removeExtraDraft(row) {
  emit('remove-extra-draft', row?.id)
  emit('remove-follow-up', row?.id)
  $q.notify({
    type: quasarNotifyTypes.positive,
    message: t('referralDraftRemoved'),
    position: 'top',
  })
}

function confirmDelete(row) {
  if (isIntakeReferralDraft(row)) {
    return
  }
  if (isExtraReferralDraft(row) || !hasClientId.value) {
    removeExtraDraft(row)

    return
  }
  pendingActionReferral.value = row
  pendingReasonAction.value = 'delete'
  reasonDialogOpen.value = true
}

function confirmDecline(row) {
  if (isLocalReferralDraft(row) || !hasClientId.value) {
    return
  }
  pendingActionReferral.value = row
  pendingReasonAction.value = referralStatuses.declined
  reasonDialogOpen.value = true
}

function confirmClose(row) {
  if (isLocalReferralDraft(row) || !hasClientId.value) {
    return
  }
  pendingActionReferral.value = row
  pendingReasonAction.value = referralStatuses.closed
  reasonDialogOpen.value = true
}

async function onReasonConfirmed(reason) {
  reasonDialogOpen.value = false
  const row = pendingActionReferral.value
  const action = pendingReasonAction.value
  pendingActionReferral.value = null
  pendingReasonAction.value = null
  if (!row?.id || !action) {
    return
  }
  if (action === 'delete') {
    await deleteReferral(row, reason)

    return
  }
  await patchReferralStatus(row, action, reason)
}

async function patchReferralStatus(row, status, reason) {
  const current = referralDetailFromRecord(row.id) ?? cloneReferral(row)
  saving.value = true
  try {
    await updateClientReferral(clientId.value, {
      ...current,
      status,
      statusReason: String(reason ?? '').trim(),
    })
    await refreshClientReferrals()
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: status === referralStatuses.declined
        ? t('referralDeclineSuccess')
        : t('referralCloseSuccess'),
      position: 'top',
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(
        error,
        status === referralStatuses.declined
          ? t('referralDeclineError')
          : t('referralCloseError'),
      )
    }
  } finally {
    saving.value = false
  }
}

async function deleteReferral(row, reason) {
  if (!row?.id) {
    return
  }
  saving.value = true
  try {
    await deleteClientReferral(
      clientId.value,
      row.id,
      String(reason ?? '').trim(),
    )
    await refreshClientReferrals()
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('referralDeleteSuccess'),
      position: 'top',
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, t('referralDeleteError'))
    }
  } finally {
    saving.value = false
  }
}

async function onUploadDocument(file) {
  const referralId = activeReferral.value?.id
  if (!referralId || !file) {
    return
  }
  documentUploading.value = true
  try {
    await uploadReferralFile(clientId.value, referralId, file)
    await refreshClientReferrals()
    activeReferral.value = referralDetailFromRecord(referralId)
      ?? activeReferral.value
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('referralDocumentUploadSuccess'),
      position: 'top',
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, t('referralDocumentUploadError'))
    }
  } finally {
    documentUploading.value = false
  }
}

async function onDownloadDocument(fileId) {
  const referralId = activeReferral.value?.id
  if (!referralId || !fileId) {
    return
  }
  try {
    const response = await downloadReferralFile(
      clientId.value,
      referralId,
      fileId,
    )
    const doc = (
      activeReferral.value.files
      ?? activeReferral.value.documents
      ?? []
    ).find(item => String(item.id) === String(fileId))
    const fileName = doc?.originalFilename
      ?? doc?.fileName
      ?? doc?.name
      ?? 'referral-document'
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, t('referralDocumentDownloadError'))
    }
  }
}

async function onDeleteDocument(fileId) {
  const referralId = activeReferral.value?.id
  if (!referralId || !fileId) {
    return
  }
  documentUploading.value = true
  try {
    await deleteReferralFile(clientId.value, referralId, fileId)
    await refreshClientReferrals()
    activeReferral.value = referralDetailFromRecord(referralId)
      ?? activeReferral.value
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('referralDocumentDeleteSuccess'),
      position: 'top',
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, t('referralDocumentDeleteError'))
    }
  } finally {
    documentUploading.value = false
  }
}

function notifyError(error, fallback) {
  $q.notify({
    type: quasarNotifyTypes.negative,
    message: apiErrorMessage(error, fallback),
    position: 'top',
  })
}
</script>
