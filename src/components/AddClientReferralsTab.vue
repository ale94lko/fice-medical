<template>
  <div class="add-client-referrals-tab">
    <div
      v-if="!hasClientId"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('referralSaveClientFirst') }}
      </p>
    </div>

    <div
      v-else-if="!canViewReferrals"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('referralNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div class="referrals-header row items-start">
        <div class="col">
          <h2 class="referrals-title">
            {{ t('referralsTitle') }}
          </h2>
          <p class="referrals-subtitle text-body2">
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
          :can-schedule="canAddReferrals"
          :can-delete="canDeleteReferrals"
          @view="openView"
          @edit="openEdit"
          @schedule="onSchedule"
          @delete="confirmDelete"
        />
      </AdminTablePanel>
    </template>

    <ReferralDialog
      v-model="dialogOpen"
      :mode="dialogMode"
      :referral="activeReferral"
      :clinician-options="resolvedClinicianOptions"
      :saving="saving"
      :can-upload-documents="canEditReferrals"
      :document-uploading="documentUploading"
      @save="onSave"
      @cancel="dialogOpen = false"
      @upload-document="onUploadDocument"
      @download-document="onDownloadDocument"
      @delete-document="onDeleteDocument"
    />

    <ModalComponent
      v-model="deleteDialogOpen"
      :title="t('referralDeleteConfirmTitle')"
      :message="t('referralDeleteConfirmMessage')"
      :confirm-text="t('delete')"
      :cancel-text="t('cancel')"
      test-id="referral-delete"
      @confirm="onDeleteConfirmed"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import ModalComponent from 'components/ModalComponent.vue'
import ReferralDialog from 'components/ReferralDialog.vue'
import ReferralsTable from 'components/ReferralsTable.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { useClientReferralPermissions } from
  'src/composables/useClientReferralPermissions.js'
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
  mapReferralsListFromApi,
  normalizeReferralDetail,
} from 'src/utils/referral-normalize.js'
import {
  cloneReferral,
  createEmptyReferral,
} from 'src/utils/referral-orders.js'
import {
  buildFollowUpDraftFromReferral,
  shouldCreateFollowUpFromReferral,
  shouldRemoveFollowUpFromReferral,
} from 'src/utils/referral-follow-up.js'
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
})

const emit = defineEmits([
  'schedule-appointment',
  'create-follow-up',
  'remove-follow-up',
])

const { t } = useI18n()
const $q = useQuasar()
const siteStore = useSiteStore()
const {
  canViewReferrals,
  canAddReferrals,
  canEditReferrals,
  canDeleteReferrals,
} = useClientReferralPermissions()

const saving = ref(false)
const documentUploading = ref(false)

const dialogOpen = ref(false)
const dialogMode = ref('add')
const activeReferral = ref(null)
const deleteDialogOpen = ref(false)
const pendingActionReferral = ref(null)

const hasClientId = computed(() => Boolean(String(props.clientId ?? '').trim()))
const clientId = computed(() => String(props.clientId ?? '').trim())

const resolvedClinicianOptions = computed(() => props.clinicianOptions ?? [])

const referralsRaw = computed(() =>
  Array.isArray(props.referrals) ? props.referrals : [],
)

const referralRows = computed(() =>
  mapReferralsListFromApi(referralsRaw.value),
)

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
  activeReferral.value = createEmptyReferral()
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
  activeReferral.value = referralDetailFromRecord(row.id)
    ?? cloneReferral(row)
  dialogOpen.value = true
}

async function onSave(referral) {
  const previous = cloneReferral(activeReferral.value ?? createEmptyReferral())
  saving.value = true
  try {
    const saved = referral.id
      ? await updateClientReferral(clientId.value, referral)
      : await createClientReferral(clientId.value, referral)
    await refreshClientReferrals()
    activeReferral.value = referralDetailFromRecord(saved.id) ?? saved
    dialogMode.value = 'edit'
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

function confirmDelete(row) {
  pendingActionReferral.value = row
  deleteDialogOpen.value = true
}

async function onDeleteConfirmed() {
  deleteDialogOpen.value = false
  const row = pendingActionReferral.value
  if (!row?.id) {
    return
  }
  saving.value = true
  try {
    await deleteClientReferral(clientId.value, row.id)
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
    pendingActionReferral.value = null
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
