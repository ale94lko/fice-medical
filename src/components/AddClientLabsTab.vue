<template>
  <div class="add-client-labs-tab">
    <div v-if="!hasPatientId" class="labs-panel q-pa-lg text-center">
      <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('labSaveClientFirst') }}
      </p>
    </div>

    <template v-else>
      <div class="row items-center justify-between q-mb-md">
        <div>
          <h2 class="labs-panel__title q-mb-xs">{{ t('labsTitle') }}</h2>
          <p class="labs-panel__subtitle text-body2 text-grey-7">
            {{ t('labsSubtitle') }}
          </p>
        </div>
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="add"
          :loading="saving"
          :disable="loading"
          :data-testid="tid.btn('add')"
          :label="t('labAdd')"
          @click="openAdd"
        />
      </div>

      <div class="labs-panel labs-panel--filters q-pa-md q-mb-md">
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-md-3">
            <q-input
              v-model="filters.search"
              outlined
              dense
              hide-bottom-space
              :placeholder="t('labSearchPlaceholder')"
              :data-testid="tid.field('search')">
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-2">
            <AddClientLabeledField :label="t('status')">
              <FormSelect
                v-model="filters.status"
                outlined
                dense
                hide-bottom-space
                emit-value
                map-options
                clearable
                :options="statusFilterOptions"
                :test-id="tid.field('status-filter')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-2">
            <AddClientLabeledField :label="t('labCategory')">
              <FormSelect
                v-model="filters.category"
                outlined
                dense
                hide-bottom-space
                emit-value
                map-options
                clearable
                :options="categoryFilterOptions"
                :test-id="tid.field('category-filter')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-2">
            <ClientDateField
              v-model="filters.dateFrom"
              :label="t('labDateFrom')"
              :test-id="tid.field('date-from')"
            />
          </div>
          <div class="col-12 col-md-2">
            <ClientDateField
              v-model="filters.dateTo"
              :label="t('labDateTo')"
              :test-id="tid.field('date-to')"
            />
          </div>
          <div class="col-12 col-md-1">
            <q-btn
              no-caps
              outline
              color="primary"
              class="app-btn-outline full-width"
              icon="filter_list"
              :label="t('labFilters')"
              :data-testid="tid.btn('filters')"
              @click="page = 1"
            />
          </div>
        </div>
      </div>

      <div v-if="loading" class="labs-panel q-pa-xl flex flex-center">
        <q-spinner color="primary" size="32px" />
      </div>

      <div v-else class="labs-panel q-pa-md">
        <LabsTable
          :rows="paginatedLabs"
          :empty-label="t('labListEmpty')"
          @view="openView"
          @edit="openEdit"
          @download="onRowDownload"
        />

        <div
          v-if="filteredLabs.length"
          class="row items-center justify-between q-mt-md">
          <p class="text-body2 text-grey-7 q-mb-none">
            {{
              t('labPaginationSummary', {
                from: pageFrom,
                to: pageTo,
                total: filteredLabs.length,
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
      :saving="saving"
      @save="onSave"
      @save-draft="onSaveDraft"
      @cancel="dialogOpen = false"
      @upload-attachment="onUploadAttachment"
      @download-attachment="onDownloadAttachment"
      @remove-attachment="onRemoveAttachment"
    />

  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import LabOrderDialog from 'components/LabOrderDialog.vue'
import LabsTable from 'components/LabsTable.vue'
import {
  labCategories,
  labStatuses,
  quasarNotifyTypes,
} from 'components/constants.js'
import {
  createPatientLab,
  deleteLabAttachment,
  downloadLabAttachment,
  fetchPatientLab,
  listPatientLabs,
  savePatientLabDraft,
  triggerBlobDownload,
  updatePatientLab,
  uploadLabAttachment,
} from 'src/utils/lab-api.js'
import {
  cloneLab,
  createEmptyLabOrder,
  filterLabs,
} from 'src/utils/lab-orders.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { labTestIds as tid } from 'src/test-ids/index.js'
import { labI18nKey } from 'src/utils/lab-i18n.js'

const props = defineProps({
  patientId: {
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

const loading = ref(false)
const saving = ref(false)
const labs = ref([])
const page = ref(1)
const pageSize = 10
const filters = ref({
  search: '',
  status: null,
  category: null,
  dateFrom: '',
  dateTo: '',
})

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

const statusFilterOptions = computed(() =>
  Object.values(labStatuses).map(value => ({
    label: t(labI18nKey('labStatus', value)),
    value,
  })),
)

const categoryFilterOptions = computed(() =>
  Object.values(labCategories).map(value => ({
    label: t(labI18nKey('labCategory', value)),
    value,
  })),
)

const filteredLabs = computed(() =>
  filterLabs(labs.value, filters.value),
)

const pageCount = computed(() =>
  Math.max(1, Math.ceil(filteredLabs.value.length / pageSize)),
)

const paginatedLabs = computed(() => {
  const start = (page.value - 1) * pageSize

  return filteredLabs.value.slice(start, start + pageSize)
})

const pageFrom = computed(() => {
  if (!filteredLabs.value.length) {
    return 0
  }

  return (page.value - 1) * pageSize + 1
})

const pageTo = computed(() =>
  Math.min(page.value * pageSize, filteredLabs.value.length),
)

watch(filteredLabs, () => {
  if (page.value > pageCount.value) {
    page.value = 1
  }
})

async function loadLabs() {
  if (!hasPatientId.value) {
    return
  }
  loading.value = true
  try {
    labs.value = await listPatientLabs(patientId.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('labListError'),
        position: 'top',
      })
    }
  } finally {
    loading.value = false
  }
}

function openAdd() {
  dialogMode.value = 'add'
  activeLab.value = createEmptyLabOrder()
  dialogOpen.value = true
}

async function openView(row) {
  await loadLabDetail(row.id, 'view')
}

async function openEdit(row) {
  await loadLabDetail(row.id, 'edit')
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

async function onSave(lab) {
  saving.value = true
  try {
    if (lab.id) {
      await updatePatientLab(patientId.value, lab.id, lab)
    } else {
      const created = await createPatientLab(patientId.value, lab)
      await updatePatientLab(patientId.value, created.labId, lab)
    }
    dialogOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('labSaved'),
      position: 'top',
    })
    await loadLabs()
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

async function onSaveDraft(lab) {
  saving.value = true
  try {
    if (lab.id) {
      await savePatientLabDraft(patientId.value, lab.id, lab)
    } else {
      const created = await createPatientLab(patientId.value, {
        ...lab,
        status: labStatuses.draft,
      })
      await savePatientLabDraft(patientId.value, created.labId, {
        ...lab,
        status: labStatuses.draft,
      })
    }
    dialogOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('labDraftSaved'),
      position: 'top',
    })
    await loadLabs()
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

onMounted(loadLabs)
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
