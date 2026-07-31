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
            :disable="loading"
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
          @edit="openEdit"
          @download="onRowDownload"
        />
      </AdminTablePanel>
    </template>

    <LabOrderDialog
      v-model="dialogOpen"
      :mode="dialogMode"
      :lab="activeLab"
      :clinician-options="resolvedClinicianOptions"
      @save="onSave"
      @cancel="dialogOpen = false"
      @upload-attachment="onUploadAttachment"
      @download-attachment="onDownloadAttachment"
      @remove-attachment="onRemoveAttachment"
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
import { quasarNotifyTypes } from 'components/constants.js'
import {
  deleteLabFile,
  downloadLabFile,
  fetchPatientLab,
  triggerBlobDownload,
  uploadLabFile,
} from 'src/utils/lab-api.js'
import {
  cloneLab,
  createEmptyLabOrder,
  nextLocalId,
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

const dialogOpen = ref(false)
const dialogMode = ref('add')
const activeLab = ref(null)
const hasPatientId = computed(() => {
  const id = String(props.patientId ?? '').trim()

  return Boolean(id)
})

const patientId = computed(() => String(props.patientId ?? '').trim())

const resolvedClinicianOptions = computed(() => {
  if (props.clinicianOptions?.length) {
    return props.clinicianOptions
  }

  return [{ label: 'Dr. John Smith', value: 'clin-1' }]
})

function labRowHasDetail(row) {
  return Array.isArray(row?.components)
}

function openAdd() {
  dialogMode.value = 'add'
  activeLab.value = createEmptyLabOrder()
  dialogOpen.value = true
}

function labIdLooksServerNumeric(id) {
  const s = String(id ?? '').trim()

  return s !== '' && Number.isFinite(Number(s))
}

async function openView(row) {
  if (labIdLooksServerNumeric(row.id) && !labRowHasDetail(row)) {
    await loadLabDetail(row.id, 'view')

    return
  }
  activeLab.value = cloneLab(row)
  dialogMode.value = 'view'
  dialogOpen.value = true
}

async function openEdit(row) {
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

function onSave(lab) {
  const copy = cloneLab(lab)
  const id = String(copy.id ?? '').trim()
  if (!id) {
    copy.id = nextLocalId('lab')
    labs.value = [...labs.value, copy]
  } else {
    const idx = labs.value.findIndex(item => String(item.id) === id)
    if (idx >= 0) {
      const next = [...labs.value]
      next[idx] = copy
      labs.value = next
    } else {
      labs.value = [...labs.value, copy]
    }
  }
  dialogOpen.value = false
  $q.notify({
    type: quasarNotifyTypes.positive,
    message: t('labSaved'),
    position: 'top',
  })
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

  if (!activeLab.value?.id) {
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
    }
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
    })
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
