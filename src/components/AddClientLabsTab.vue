<template>
  <div class="add-client-labs-tab">
    <template v-if="!canView">
      <div class="labs-panel q-pa-lg text-center">
        <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
        <p class="text-body1 text-grey-8 q-mb-none">
          {{ t('labsNoPermission') }}
        </p>
      </div>
    </template>

    <template v-else>
      <div class="row items-center justify-between q-mb-md">
        <div>
          <h2 class="labs-panel__title q-mb-xs">{{ t('labsTitle') }}</h2>
          <p class="labs-panel__subtitle text-body2 text-grey-7">
            {{ t('labsSubtitle') }}
          </p>
        </div>
        <q-btn
          v-if="!readonly"
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

      <div v-if="loading" class="labs-panel q-pa-xl flex flex-center">
        <AppBrandLoading inline />
      </div>

      <div v-else class="labs-panel q-pa-md">
        <LabsTable
          :rows="paginatedLabs"
          :can-edit="!readonly"
          :can-delete="canDelete"
          :empty-label="t('labListEmpty')"
          @view="openView"
          @edit="openEdit"
          @download="onRowDownload"
        />

        <div
          v-if="labs.length"
          class="row items-center justify-between q-mt-md">
          <p class="text-body2 text-grey-7 q-mb-none">
            {{
              t('labPaginationSummary', {
                from: pageFrom,
                to: pageTo,
                total: labs.length,
              })
            }}
          </p>
          <q-pagination
            v-model="page"
            :max="pageCount"
            max-pages="6"
            direction-links
            boundary-links
            color="primary"
            size="sm"
          />
        </div>
      </div>
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
import { computed, defineModel, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import LabOrderDialog from 'components/LabOrderDialog.vue'
import AppBrandLoading from 'components/AppBrandLoading.vue'
import LabsTable from 'components/LabsTable.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import {
  deleteLabAttachment,
  downloadLabAttachment,
  fetchPatientLab,
  triggerBlobDownload,
  uploadLabAttachment,
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
const page = ref(1)
const pageSize = 10

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

const pageCount = computed(() =>
  Math.max(1, Math.ceil(labs.value.length / pageSize)),
)

const paginatedLabs = computed(() => {
  const start = (page.value - 1) * pageSize

  return labs.value.slice(start, start + pageSize)
})

const pageFrom = computed(() => {
  if (!labs.value.length) {
    return 0
  }

  return (page.value - 1) * pageSize + 1
})

const pageTo = computed(() =>
  Math.min(page.value * pageSize, labs.value.length),
)

watch(pageCount, maxPage => {
  if (page.value > maxPage) {
    page.value = 1
  }
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
    const attachment = detail.attachments?.[0]
    if (!attachment?.id) {
      $q.notify({
        type: quasarNotifyTypes.warning,
        message: t('labNoAttachment'),
        position: 'top',
      })

      return
    }
    const { blob, fileName } = await downloadLabAttachment(
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
    const attachments = await uploadLabAttachment(
      patientId.value,
      activeLab.value.id,
      file,
    )
    activeLab.value = {
      ...activeLab.value,
      attachments,
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
    const { blob, fileName } = await downloadLabAttachment(
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

async function onRemoveAttachment(attachmentId) {
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
    await deleteLabAttachment(
      patientId.value,
      activeLab.value.id,
      attachmentId,
    )
    activeLab.value = cloneLab({
      ...activeLab.value,
      attachments: activeLab.value.attachments.filter(
        item => item.id !== attachmentId,
      ),
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

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.labs-panel {
  background: $surface;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
}

.labs-panel__title {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
  color: $text-strong;
}

.labs-panel__subtitle {
  margin: 0;
}
</style>
