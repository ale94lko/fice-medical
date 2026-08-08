<template>
  <div class="add-client-labs-tab">
    <div
      v-if="!canView"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('labsNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div class="labs-header row items-start">
        <div class="col">
          <h2 class="labs-title">
            {{ t('labsTitle') }}
          </h2>
          <p class="labs-subtitle text-body2">
            {{ t('labsSubtitle') }}
          </p>
        </div>
        <div v-if="!readonly" class="col-auto">
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :disable="loading || saving"
            :data-testid="tid.btn('add')"
            :label="t('labAdd')"
            @click="openAdd"
          />
        </div>
      </div>

      <div
        v-if="loading"
        class="fmh-list-card q-pa-xl flex flex-center q-mt-md">
        <AppBrandLoading inline />
      </div>

      <AdminTablePanel
        v-else
        class="labs-table-panel admin-table-panel--wide q-mt-md"
        :show-column-settings="false">
        <LabsTable
          :rows="labs"
          :can-edit="!readonly"
          :can-delete="canDelete"
          :empty-label="t('labListEmpty')"
          @view="openView"
          @download="onRowDownload"
          @collect="row => openTransition(row, 'collect')"
          @results="row => openTransition(row, 'results')"
          @review="row => openTransition(row, 'review')"
          @cancel-lab="onCancelLabFromTable"
        />
      </AdminTablePanel>
    </template>

    <LabOrderDialog
      v-model="dialogOpen"
      :mode="dialogMode"
      :intent="dialogIntent"
      :lab="activeLab"
      :saving="saving"
      :clinician-options="resolvedClinicianOptions"
      @save="onDialogSave"
      @cancel="dialogOpen = false"
      @upload-attachment="onUploadAttachment"
      @download-attachment="onDownloadAttachment"
      @remove-attachment="onRemoveAttachment"
    />

    <LabCancelDialog
      v-model="cancelDialogOpen"
      @confirm="confirmCancelLab"
    />
  </div>
</template>

<script setup>
import { computed, defineModel, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import LabOrderDialog from 'components/LabOrderDialog.vue'
import AppBrandLoading from 'components/AppBrandLoading.vue'
import LabsTable from 'components/LabsTable.vue'
import LabCancelDialog from 'components/LabCancelDialog.vue'
import {
  labStatuses,
  quasarNotifyTypes,
} from 'components/constants.js'
import {
  cancelPatientLab,
  collectPatientLab,
  createPatientLab,
  deleteLabFile,
  downloadLabFile,
  enterLabResults,
  fetchPatientLab,
  reviewPatientLab,
  triggerBlobDownload,
  updatePatientLab,
  uploadLabFile,
} from 'src/utils/lab-api.js'
import {
  cloneLab,
  createEmptyLabOrder,
  nextLocalId,
  sortLabsByOrderedDateDesc,
} from 'src/utils/lab-orders.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { labTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  patientId: {
    type: [String, Number],
    default: null,
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  canView: {
    type: Boolean,
    default: true,
  },
  canDelete: {
    type: Boolean,
    default: false,
  },
})

const labs = defineModel({
  type: Array,
  default: () => [],
})

const { t } = useI18n()
const $q = useQuasar()

const loading = ref(false)
const saving = ref(false)

const dialogOpen = ref(false)
const dialogMode = ref('add')
const dialogIntent = ref(null)
const activeLab = ref(null)

const cancelDialogOpen = ref(false)
const pendingCancelLab = ref(null)

const hasPatientId = computed(() => {
  const id = String(props.patientId ?? '').trim()

  return Boolean(id)
})

const patientId = computed(() => String(props.patientId ?? '').trim())

const resolvedClinicianOptions = computed(() =>
  props.clinicianOptions?.length ? props.clinicianOptions : [],
)

function labRowHasDetail(row) {
  return Array.isArray(row?.components)
}

function labIdLooksServerNumeric(id) {
  const s = String(id ?? '').trim()

  return s !== '' && Number.isFinite(Number(s))
}

function upsertLabInList(lab) {
  const copy = cloneLab(lab)
  const id = String(copy.id ?? '').trim()
  if (!id) {
    return
  }
  const idx = labs.value.findIndex(item => String(item.id) === id)
  if (idx >= 0) {
    const prev = labs.value[idx]
    if (!copy.createdAt && prev?.createdAt) {
      copy.createdAt = prev.createdAt
    }
    const next = [...labs.value]
    next[idx] = copy
    labs.value = sortLabsByOrderedDateDesc(next)
  } else {
    if (!copy.createdAt) {
      copy.createdAt = new Date().toISOString()
    }
    labs.value = sortLabsByOrderedDateDesc([...labs.value, copy])
  }
}

function openAdd() {
  dialogMode.value = 'add'
  dialogIntent.value = null
  activeLab.value = createEmptyLabOrder()
  dialogOpen.value = true
}

async function openView(row) {
  dialogIntent.value = null
  if (labIdLooksServerNumeric(row.id) && !labRowHasDetail(row)) {
    await loadLabDetail(row.id, 'view')

    return
  }
  activeLab.value = cloneLab(row)
  dialogMode.value = 'view'
  dialogOpen.value = true
}

async function openTransition(row, intent) {
  if (!hasPatientId.value) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('labSaveClientFirst'),
      position: 'top',
    })

    return
  }
  dialogIntent.value = intent
  if (labIdLooksServerNumeric(row.id) && !labRowHasDetail(row)) {
    await loadLabDetail(row.id, 'edit')

    return
  }
  activeLab.value = cloneLab(row)
  dialogMode.value = 'edit'
  dialogOpen.value = true
}

async function loadLabDetail(labId, mode) {
  loading.value = true
  try {
    activeLab.value = await fetchPatientLab(patientId.value, labId)
    dialogMode.value = mode
    dialogOpen.value = true
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('labLoadError'),
        position: 'top',
      })
    }
  } finally {
    loading.value = false
  }
}

function successMessageForAction(action) {
  if (action === 'order') {
    return t('labOrderedSuccess')
  }
  if (action === 'collect') {
    return t('labCollectedSuccess')
  }
  if (action === 'results') {
    return t('labResultedSuccess')
  }
  if (action === 'review') {
    return t('labReviewedSuccess')
  }
  if (action === 'cancel') {
    return t('labCancelledSuccess')
  }

  return t('labSaved')
}

function pendingFilesFromMeta(meta = {}) {
  return Array.isArray(meta?.pendingFiles)
    ? meta.pendingFiles.filter(file => file instanceof File)
    : []
}

async function uploadPendingLabFiles(labId, pendingFiles) {
  if (!pendingFiles.length || !labId) {
    return null
  }
  for (const file of pendingFiles) {
    await uploadLabFile(patientId.value, labId, file)
  }

  return fetchPatientLab(patientId.value, labId)
}

async function createOrderedLab(copy, pendingFiles) {
  const created = await createPatientLab(patientId.value, copy)
  const newId = created.labId ?? copy.id
  let saved = created.lab
    || await fetchPatientLab(patientId.value, newId)
  if (!saved?.id && newId) {
    saved = {
      ...copy,
      id: String(newId),
      status: created.status || labStatuses.ordered,
    }
  }
  const withFiles = await uploadPendingLabFiles(newId, pendingFiles)

  return withFiles || saved
}

async function persistLabAction(action, copy, meta = {}) {
  if (action === 'patch') {
    return updatePatientLab(patientId.value, copy.id, copy)
  }
  if (action === 'collect') {
    return collectPatientLab(patientId.value, copy.id, copy)
  }
  if (action === 'results') {
    return enterLabResults(patientId.value, copy.id, copy)
  }
  if (action === 'review') {
    return reviewPatientLab(patientId.value, copy.id, copy)
  }
  if (action === 'cancel') {
    const reason = String(meta?.cancelReason ?? '').trim()
    const saved = await cancelPatientLab(
      patientId.value,
      copy.id,
      reason,
    )

    return saved || {
      ...copy,
      status: labStatuses.cancelled,
      cancellationReason: reason,
    }
  }

  return null
}

async function onDialogSave(lab, meta = {}) {
  const action = String(meta?.action ?? 'patch').trim()
  const pendingFiles = pendingFilesFromMeta(meta)
  const copy = cloneLab(lab)

  if (!hasPatientId.value) {
    if (action === 'order') {
      copy.id = copy.id || nextLocalId('lab')
      copy.status = labStatuses.ordered
      upsertLabInList(copy)
      dialogOpen.value = false
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: successMessageForAction(action),
        position: 'top',
      })

      return
    }
    if (action === 'cancel') {
      upsertLabInList({
        ...copy,
        status: labStatuses.cancelled,
        cancellationReason: String(meta?.cancelReason ?? '').trim(),
      })
      dialogOpen.value = false
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('labCancelledSuccess'),
        position: 'top',
      })

      return
    }
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('labSaveClientFirst'),
      position: 'top',
    })

    return
  }

  saving.value = true
  try {
    const saved = action === 'order'
      ? await createOrderedLab(copy, pendingFiles)
      : await persistLabAction(action, copy, meta)

    if (saved) {
      upsertLabInList(saved)
    }
    dialogOpen.value = false
    dialogIntent.value = null
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: successMessageForAction(action),
      position: 'top',
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('labSaveError'),
        position: 'top',
      })
    }
  } finally {
    saving.value = false
  }
}

function onCancelLabFromTable(row) {
  pendingCancelLab.value = cloneLab(row)
  cancelDialogOpen.value = true
}

async function confirmCancelLab(reason) {
  const row = pendingCancelLab.value
  pendingCancelLab.value = null
  cancelDialogOpen.value = false
  const cancelReason = String(reason ?? '').trim()
  if (!row?.id || !cancelReason) {
    return
  }
  if (!hasPatientId.value) {
    upsertLabInList({
      ...row,
      status: labStatuses.cancelled,
      cancellationReason: cancelReason,
    })
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('labCancelledSuccess'),
      position: 'top',
    })

    return
  }
  saving.value = true
  try {
    const saved = await cancelPatientLab(
      patientId.value,
      row.id,
      cancelReason,
    )
    upsertLabInList(saved || {
      ...row,
      status: labStatuses.cancelled,
      cancellationReason: cancelReason,
    })
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('labCancelledSuccess'),
      position: 'top',
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('labSaveError'),
        position: 'top',
      })
    }
  } finally {
    saving.value = false
  }
}

async function onRowDownload(row) {
  if (!hasPatientId.value) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('labSaveClientFirst'),
      position: 'top',
    })

    return
  }

  try {
    const detail = await fetchPatientLab(patientId.value, row.id)
    const attachment = detail.files?.[0] ?? detail.attachments?.[0]
    if (!attachment?.id) {
      $q.notify({
        type: quasarNotifyTypes.warning,
        message: t('labNoAttachment'),
        position: 'top',
      })

      return
    }
    const { blob, fileName } = await downloadLabFile(
      patientId.value,
      row.id,
      attachment.id,
    )
    triggerBlobDownload(blob, fileName)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('labDownloadError'),
        position: 'top',
      })
    }
  }
}

async function onUploadAttachment(file) {
  if (!hasPatientId.value) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('labSaveClientFirst'),
      position: 'top',
    })

    return
  }

  if (!activeLab.value?.id || !labIdLooksServerNumeric(activeLab.value.id)) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('labSaveBeforeAttachment'),
      position: 'top',
    })

    return
  }
  try {
    const uploaded = await uploadLabFile(
      patientId.value,
      activeLab.value.id,
      file,
    )
    const currentFiles = activeLab.value.files
      ?? activeLab.value.attachments
      ?? []
    const nextFiles = [...currentFiles, uploaded]
    activeLab.value = {
      ...activeLab.value,
      files: nextFiles,
      attachments: nextFiles,
      hasAttachments: true,
    }
    upsertLabInList(activeLab.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('labUploadError'),
        position: 'top',
      })
    }
  }
}

async function onDownloadAttachment(attachmentId) {
  if (!hasPatientId.value) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('labSaveClientFirst'),
      position: 'top',
    })

    return
  }

  if (!activeLab.value?.id) {
    return
  }
  try {
    const { blob, fileName } = await downloadLabFile(
      patientId.value,
      activeLab.value.id,
      attachmentId,
    )
    triggerBlobDownload(blob, fileName)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('labDownloadError'),
        position: 'top',
      })
    }
  }
}

async function onRemoveAttachment(fileId) {
  if (!hasPatientId.value) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('labSaveClientFirst'),
      position: 'top',
    })

    return
  }

  if (!activeLab.value?.id) {
    return
  }
  try {
    await deleteLabFile(
      patientId.value,
      activeLab.value.id,
      fileId,
    )
    const currentFiles = activeLab.value.files
      ?? activeLab.value.attachments
      ?? []
    const nextFiles = currentFiles.filter(
      item => String(item.id) !== String(fileId),
    )
    activeLab.value = cloneLab({
      ...activeLab.value,
      files: nextFiles,
      attachments: nextFiles,
      hasAttachments: nextFiles.length > 0,
    })
    upsertLabInList(activeLab.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('labDeleteAttachmentError'),
        position: 'top',
      })
    }
  }
}

</script>
