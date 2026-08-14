<template>
  <div class="add-client-authorizations-tab">
    <div
      v-if="!hasClientId"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('authorizationSaveClientFirst') }}
      </p>
    </div>

    <div
      v-else-if="!canViewAuthorizations"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('authorizationNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div class="referrals-header row items-start">
        <div class="col">
          <h2 class="referrals-title">
            {{ t('authorizationsTitle') }}
          </h2>
          <p class="referrals-subtitle text-body2">
            {{ t('authorizationsSubtitle') }}
          </p>
        </div>
        <div class="col-auto">
          <q-btn
            v-if="canCreateAuthorizations"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :disable="saving"
            :data-testid="tid.btn('add')"
            :label="t('authorizationAdd')"
            @click="openAdd"
          />
        </div>
      </div>

      <AdminTablePanel
        class="referrals-table-panel admin-table-panel--wide q-mt-md"
        :show-column-settings="false">
        <AuthorizationsTable
          :rows="rows"
          :empty-label="t('authorizationListEmpty')"
          :empty-hint="t('authorizationListEmptyHint')"
          :can-edit="canEditAuthorizations"
          :can-cancel="canCancelAuthorizations"
          @view="openView"
          @edit="openEdit"
          @cancel="openCancel"
        />
      </AdminTablePanel>
    </template>

    <AuthorizationDialog
      v-model="dialogOpen"
      :mode="dialogMode"
      :authorization="activeRow"
      :insurance-options="insuranceOptions"
      :service-options="serviceOptions"
      :clinician-options="resolvedClinicianOptions"
      :saving="saving"
      :can-upload-documents="canAttachDocuments"
      :document-uploading="documentUploading"
      @save="onSave"
      @cancel="dialogOpen = false"
      @upload-document="onUploadDocument"
      @download-document="onDownloadDocument"
      @delete-document="onDeleteDocument"
    />

    <SuperbillReasonDialog
      v-model="cancelDialogOpen"
      :title="t('authorizationCancelTitle')"
      :message="cancelMessage"
      :reason-label="t('authorizationCancelReason')"
      :confirm-label="t('authorizationCancelConfirm')"
      :submitting="saving"
      test-id-name="authorization-cancel"
      @confirm="onCancelConfirmed"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AuthorizationDialog from 'components/AuthorizationDialog.vue'
import AuthorizationsTable from 'components/AuthorizationsTable.vue'
import SuperbillReasonDialog from
  'components/billing/SuperbillReasonDialog.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { useClientAuthorizationPermissions } from
  'src/composables/useClientAuthorizationPermissions.js'
import {
  authorizationApiErrorMessage,
  cancelClientAuthorization,
  createClientAuthorization,
  deleteAuthorizationFile,
  downloadAuthorizationFile,
  fetchClientAuthorization,
  listClientAuthorizations,
  updateClientAuthorization,
  uploadAuthorizationFile,
} from 'src/utils/authorization-api.js'
import {
  cloneAuthorization,
  createEmptyAuthorization,
  insuranceOptionLabel,
} from 'src/utils/authorization-normalize.js'
import { listClientInsuranceProfiles } from
  'src/utils/insurance-api.js'
import { listActiveServiceProcedures } from
  'src/utils/service-procedure-api.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { authorizationTestIds as tid } from 'src/test-ids/index.js'

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

const { t } = useI18n()
const $q = useQuasar()
const {
  canViewAuthorizations,
  canCreateAuthorizations,
  canEditAuthorizations,
  canCancelAuthorizations,
  canAttachDocuments,
} = useClientAuthorizationPermissions()

const saving = ref(false)
const documentUploading = ref(false)
const rows = ref([])
const insuranceOptions = ref([])
const serviceOptions = ref([])
const dialogOpen = ref(false)
const dialogMode = ref('add')
const activeRow = ref(null)
const cancelDialogOpen = ref(false)
const pendingCancelRow = ref(null)

const hasClientId = computed(() =>
  Boolean(String(props.clientId ?? '').trim()))
const clientId = computed(() => String(props.clientId ?? '').trim())
const resolvedClinicianOptions = computed(
  () => props.clinicianOptions ?? [],
)
const cancelMessage = computed(() => {
  const row = pendingCancelRow.value
  if (!row) {
    return t('authorizationCancelMessage')
  }
  const number = row.authorizationNumber || '—'
  const service = row.service?.name || '—'

  return t('authorizationCancelDetail', { number, service })
})

watch(clientId, () => {
  loadPage()
})

onMounted(() => {
  loadPage()
})

async function loadPage() {
  if (!hasClientId.value || !canViewAuthorizations.value) {
    rows.value = []

    return
  }
  try {
    const [list, insurance, services] = await Promise.all([
      listClientAuthorizations(clientId.value, {
        limit: 100,
        page: 0,
      }),
      listClientInsuranceProfiles(clientId.value),
      listActiveServiceProcedures(t),
    ])
    rows.value = list
    insuranceOptions.value = (insurance ?? []).map(profile => ({
      value: profile.id,
      label: insuranceOptionLabel(profile),
    }))
    serviceOptions.value = (services?.items ?? []).map(item => ({
      value: item.id,
      label: item.name,
      authorizationRequirement: item.authorizationRequirement,
      defaultDurationMin: item.defaultDurationMin,
      cptCode: item.cptCode,
      hcpcsCode: item.hcpcsCode,
    }))
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, t('authorizationLoadError'))
    }
  }
}

function notifyError(error, fallback) {
  $q.notify({
    type: quasarNotifyTypes.negative,
    message: authorizationApiErrorMessage(error, fallback),
    position: 'top',
  })
}

function notifyWarnings(saved) {
  if (saved?.overlapWarning) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('authorizationOverlapWarning'),
      position: 'top',
    })
  }
  if (saved?.coverageWarning) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('authorizationCoverageWarning'),
      position: 'top',
    })
  }
}

function openAdd() {
  dialogMode.value = 'add'
  activeRow.value = createEmptyAuthorization()
  dialogOpen.value = true
}

async function openDetail(row, mode) {
  dialogMode.value = mode
  try {
    activeRow.value = await fetchClientAuthorization(
      clientId.value,
      row.id,
    )
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, t('authorizationLoadError'))
    }
    activeRow.value = cloneAuthorization(row)
  }
  dialogOpen.value = true
}

function openView(row) {
  openDetail(row, 'view')
}

function openEdit(row) {
  openDetail(row, 'edit')
}

function openCancel(row) {
  pendingCancelRow.value = row
  cancelDialogOpen.value = true
}

async function onSave({ form, pendingFiles }) {
  saving.value = true
  try {
    const saved = form.id
      ? await updateClientAuthorization(clientId.value, form)
      : await createClientAuthorization(clientId.value, form)
    if (!form.id && Array.isArray(pendingFiles) && pendingFiles.length) {
      await Promise.all(pendingFiles.map(file =>
        uploadAuthorizationFile(clientId.value, saved.id, file)))
    }
    await loadPage()
    activeRow.value = await fetchClientAuthorization(
      clientId.value,
      saved.id,
    )
    dialogMode.value = 'edit'
    notifyWarnings(saved)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: form.id
        ? t('authorizationUpdated')
        : t('authorizationCreated'),
      position: 'top',
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, t('authorizationSaveError'))
    }
  } finally {
    saving.value = false
  }
}

async function onCancelConfirmed(reason) {
  const row = pendingCancelRow.value
  if (!row?.id) {
    return
  }
  saving.value = true
  try {
    await cancelClientAuthorization(clientId.value, row.id, reason)
    await loadPage()
    cancelDialogOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('authorizationCancelled'),
      position: 'top',
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, t('authorizationCancelError'))
    }
  } finally {
    saving.value = false
    pendingCancelRow.value = null
  }
}

async function onUploadDocument(file) {
  const authorizationId = activeRow.value?.id
  if (!authorizationId || !file) {
    return
  }
  documentUploading.value = true
  try {
    await uploadAuthorizationFile(
      clientId.value,
      authorizationId,
      file,
    )
    activeRow.value = await fetchClientAuthorization(
      clientId.value,
      authorizationId,
    )
    await loadPage()
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('authorizationDocumentUploadSuccess'),
      position: 'top',
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, t('authorizationDocumentUploadError'))
    }
  } finally {
    documentUploading.value = false
  }
}

async function onDownloadDocument(fileId) {
  const authorizationId = activeRow.value?.id
  if (!authorizationId || !fileId) {
    return
  }
  try {
    const response = await downloadAuthorizationFile(
      clientId.value,
      authorizationId,
      fileId,
    )
    const doc = (activeRow.value.files ?? []).find(
      item => String(item.id) === String(fileId),
    )
    const fileName = doc?.name || 'authorization-document'
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
      notifyError(error, t('authorizationDocumentDownloadError'))
    }
  }
}

async function onDeleteDocument(fileId) {
  const authorizationId = activeRow.value?.id
  if (!authorizationId || !fileId) {
    return
  }
  try {
    await deleteAuthorizationFile(
      clientId.value,
      authorizationId,
      fileId,
    )
    activeRow.value = await fetchClientAuthorization(
      clientId.value,
      authorizationId,
    )
    await loadPage()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, t('authorizationDocumentDeleteError'))
    }
  }
}
</script>
