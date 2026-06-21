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
            :disable="loading"
            :data-testid="tid.btn('add')"
            :label="t('referralAdd')"
            @click="openAdd"
          />
        </div>
      </div>

      <AdminTablePanel
        class="referrals-table-panel admin-table-panel--wide q-mt-md"
        :show-column-settings="false">
        <AppLoadingOverlay
          scope="content"
          :showing="loading"
        />
        <ReferralsTable
          :rows="referrals"
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
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
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
  deleteReferralDocument,
  downloadReferralDocument,
  fetchClientReferral,
  listClientReferrals,
  updateClientReferral,
  uploadReferralDocument,
} from 'src/utils/referral-api.js'
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
import { referralTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
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
const {
  canViewReferrals,
  canAddReferrals,
  canEditReferrals,
  canDeleteReferrals,
} = useClientReferralPermissions()

const loading = ref(false)
const saving = ref(false)
const documentUploading = ref(false)
const referrals = ref([])

const dialogOpen = ref(false)
const dialogMode = ref('add')
const activeReferral = ref(null)
const deleteDialogOpen = ref(false)
const pendingActionReferral = ref(null)

const hasClientId = computed(() => Boolean(String(props.clientId ?? '').trim()))
const clientId = computed(() => String(props.clientId ?? '').trim())

const resolvedClinicianOptions = computed(() => props.clinicianOptions ?? [])

watch(clientId, () => {
  void loadReferrals()
})

onMounted(async() => {
  await loadReferrals()
})

async function loadReferrals() {
  if (!hasClientId.value || !canViewReferrals.value) {
    referrals.value = []

    return
  }
  loading.value = true
  try {
    referrals.value = await listClientReferrals(clientId.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, t('referralLoadError'))
    }
  } finally {
    loading.value = false
  }
}

function openAdd() {
  dialogMode.value = 'add'
  activeReferral.value = createEmptyReferral()
  dialogOpen.value = true
}

async function openView(row) {
  dialogMode.value = 'view'
  activeReferral.value = await loadReferralDetail(row)
  dialogOpen.value = true
}

async function openEdit(row) {
  dialogMode.value = 'edit'
  activeReferral.value = await loadReferralDetail(row)
  dialogOpen.value = true
}

async function loadReferralDetail(row) {
  try {
    return await fetchClientReferral(clientId.value, row.id)
  } catch (error) {
    notifyError(error, t('referralLoadError'))

    return cloneReferral(row)
  }
}

async function onSave(referral) {
  const previous = cloneReferral(activeReferral.value ?? createEmptyReferral())
  saving.value = true
  try {
    const saved = referral.id
      ? await updateClientReferral(clientId.value, referral)
      : await createClientReferral(clientId.value, referral)
    upsertReferral(saved)
    activeReferral.value = saved
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

function upsertReferral(saved) {
  const index = referrals.value.findIndex(row => row.id === saved.id)
  if (index >= 0) {
    referrals.value[index] = saved
  } else {
    referrals.value.unshift(saved)
  }
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
    referrals.value = referrals.value.filter(item => item.id !== row.id)
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
    const doc = await uploadReferralDocument(clientId.value, referralId, file)
    const current = activeReferral.value.documents ?? []
    activeReferral.value = {
      ...activeReferral.value,
      documents: [...current, doc],
    }
    upsertReferral(activeReferral.value)
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

async function onDownloadDocument(documentId) {
  const referralId = activeReferral.value?.id
  if (!referralId || !documentId) {
    return
  }
  try {
    const response = await downloadReferralDocument(
      clientId.value,
      referralId,
      documentId,
    )
    const doc = (activeReferral.value.documents ?? [])
      .find(item => item.id === documentId)
    const fileName = doc?.fileName || 'referral-document'
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

async function onDeleteDocument(documentId) {
  const referralId = activeReferral.value?.id
  if (!referralId || !documentId) {
    return
  }
  documentUploading.value = true
  try {
    await deleteReferralDocument(clientId.value, referralId, documentId)
    activeReferral.value = {
      ...activeReferral.value,
      documents: (activeReferral.value.documents ?? [])
        .filter(doc => doc.id !== documentId),
    }
    upsertReferral(activeReferral.value)
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
