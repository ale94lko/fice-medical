<template>
  <div
    class="add-client-attachments-tab"
    :data-testid="tid.root">
    <div
      v-if="!canView"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('clientAttachmentsNoPermission') }}
      </p>
    </div>

    <template v-else-if="!hasClientId">
      <div class="fmh-list-card q-pa-lg text-center">
        <q-icon
          name="info"
          size="md"
          color="grey-7"
          class="q-mb-sm"
        />
        <p class="text-body1 text-grey-8 q-mb-none">
          {{ t('labSaveClientFirst') }}
        </p>
      </div>
    </template>

    <template v-else>
      <div class="attachments-header row items-end q-col-gutter-md">
        <div class="col">
          <h2 class="attachments-title">
            {{ t('clientAttachmentsTitle') }}
          </h2>
          <p class="attachments-subtitle text-body2">
            {{ t('clientAttachmentsSubtitle') }}
          </p>
        </div>
        <div class="col-auto">
          <div class="row q-gutter-sm items-center">
            <q-btn
              v-if="canUpload"
              no-caps
              unelevated
              color="primary"
              class="app-btn-primary"
              icon="upload_file"
              :disable="loading || uploading"
              :data-testid="tid.btnAdd"
              :label="t('clientAttachmentUpload')"
              @click="uploadOpen = true"
            />
          </div>
        </div>
        <div class="col-auto">
          <FormField :label="t('clientAttachmentColCategory')">
            <FormSelect
              v-model="filterCategory"
              class="attachments-filter-select"
              outlined
              dense
              clearable
              emit-value
              map-options
              :options="categoryFilterOptions"
              :test-id="tid.filterCategory"
              @update:model-value="onFilterChange"
            />
          </FormField>
        </div>
        <div class="col-auto">
          <FormField :label="t('clientAttachmentColSource')">
            <FormSelect
              v-model="filterEntityType"
              class="attachments-filter-select"
              outlined
              dense
              clearable
              emit-value
              map-options
              :options="entityTypeFilterOptions"
              :test-id="tid.filterEntityType"
              @update:model-value="onFilterChange"
            />
          </FormField>
        </div>
      </div>

      <AdminTablePanel
        class="attachments-table-panel admin-table-panel--wide q-mt-md"
        :show-column-settings="false">
        <ClientAttachmentsTable
          v-model:pagination="tablePagination"
          :rows="rows"
          :loading="loading"
          :can-delete="canDelete"
          :downloading-id="downloadingId"
          :empty-label="t('clientAttachmentsEmpty')"
          @request="onTableRequest"
          @preview="onPreview"
          @download="onDownload"
          @delete="onDeleteRequest"
          @navigate-source="onNavigateSource"
        />
      </AdminTablePanel>
    </template>

    <ClientAttachmentUploadDialog
      v-model="uploadOpen"
      :saving="uploading"
      @submit="onUploadSubmit"
    />

    <ClientAttachmentPreviewDialog
      v-model="previewOpen"
      :file="previewFile"
    />

    <ModalComponent
      v-model="deleteConfirmOpen"
      :test-id="tid.deleteConfirm"
      :title="t('clientAttachmentDeleteTitle')"
      :message="t('clientAttachmentDeleteMessage')"
      :confirm-text="t('delete')"
      :cancel-text="t('cancel')"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import ClientAttachmentsTable from 'components/ClientAttachmentsTable.vue'
import ClientAttachmentUploadDialog from
  'components/ClientAttachmentUploadDialog.vue'
import ClientAttachmentPreviewDialog from
  'components/ClientAttachmentPreviewDialog.vue'
import FormField from 'components/FormField.vue'
import FormSelect from 'components/FormSelect.vue'
import ModalComponent from 'components/ModalComponent.vue'
import {
  quasarNotifyTypes,
  storedFileEntityTypes,
} from 'components/constants.js'
import { clientAttachmentsTestIds as tid } from 'src/test-ids/index.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  CLIENT_ATTACHMENT_FILTER_CATEGORIES,
  CLIENT_ATTACHMENT_FILTER_ENTITY_TYPES,
  clientFileCategoryI18nKey,
  clientFileSourceI18nKey,
  resolveClientFileSourceNavigation,
} from 'src/utils/client-files-i18n.js'
import {
  deleteStoredFile,
  downloadStoredFile,
  listClientFiles,
  triggerBlobDownload,
  uploadStoredFile,
} from 'src/utils/stored-file-api.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
  canView: {
    type: Boolean,
    default: true,
  },
  canUpload: {
    type: Boolean,
    default: false,
  },
  canDelete: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['navigate-source'])

const { t, te } = useI18n()
const $q = useQuasar()

const loading = ref(false)
const uploading = ref(false)
const rows = ref([])
const filterCategory = ref(null)
const filterEntityType = ref(null)
const downloadingId = ref(null)
const uploadOpen = ref(false)
const previewOpen = ref(false)
const previewFile = ref(null)
const deleteConfirmOpen = ref(false)
const pendingDelete = ref(null)

const tablePagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
  sortBy: null,
  descending: false,
})

const hasClientId = computed(() => {
  const id = Number(props.clientId)

  return Number.isFinite(id) && id > 0
})

const categoryFilterOptions = computed(() =>
  CLIENT_ATTACHMENT_FILTER_CATEGORIES.map(value => {
    const key = clientFileCategoryI18nKey(value)

    return {
      label: te(key) ? t(key) : value,
      value,
    }
  }),
)

const entityTypeFilterOptions = computed(() =>
  CLIENT_ATTACHMENT_FILTER_ENTITY_TYPES.map(value => {
    const key = clientFileSourceI18nKey(value)

    return {
      label: te(key) ? t(key) : value,
      value,
    }
  }),
)

function paginationTotal(pagination) {
  const total = Number(pagination?.total)
  if (Number.isFinite(total) && total >= 0) {
    return total
  }
  const pages = Number(pagination?.pages ?? pagination?.totalPages)
  const limit = Number(pagination?.limit ?? tablePagination.value.rowsPerPage)
  if (Number.isFinite(pages) && Number.isFinite(limit) && pages > 0) {
    return pages * limit
  }

  return rows.value.length
}

async function loadFiles(opts = {}) {
  if (!props.canView || !hasClientId.value) {
    rows.value = []

    return
  }

  const page = opts.page ?? tablePagination.value.page
  const rowsPerPage = opts.rowsPerPage ?? tablePagination.value.rowsPerPage
  loading.value = true
  try {
    const result = await listClientFiles(props.clientId, {
      category: filterCategory.value || undefined,
      entityType: filterEntityType.value || undefined,
      page: Math.max(0, page - 1),
      limit: rowsPerPage,
    })
    rows.value = result.items ?? []
    tablePagination.value = {
      ...tablePagination.value,
      page,
      rowsPerPage,
      rowsNumber: paginationTotal(result.pagination),
    }
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('clientAttachmentsLoadError'),
      })
    }
    rows.value = []
  } finally {
    loading.value = false
  }
}

function reload() {
  return loadFiles({ page: tablePagination.value.page })
}

function onFilterChange() {
  void loadFiles({ page: 1 })
}

function onTableRequest(requestProps) {
  const next = requestProps?.pagination ?? {}
  void loadFiles({
    page: next.page ?? 1,
    rowsPerPage: next.rowsPerPage ?? tablePagination.value.rowsPerPage,
  })
}

function onPreview(file) {
  previewFile.value = file
  previewOpen.value = true
}

async function onDownload(file) {
  if (!file?.id) {
    return
  }
  downloadingId.value = file.id
  try {
    const { blob, fileName } = await downloadStoredFile(file.id)
    triggerBlobDownload(
      blob,
      fileName || file.originalFilename || file.name,
    )
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('clientAttachmentDownloadError'),
      })
    }
  } finally {
    downloadingId.value = null
  }
}

function onDeleteRequest(file) {
  pendingDelete.value = file
  deleteConfirmOpen.value = true
}

async function confirmDelete() {
  const file = pendingDelete.value
  deleteConfirmOpen.value = false
  pendingDelete.value = null
  if (!file?.id) {
    return
  }
  try {
    await deleteStoredFile(file.id)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('clientAttachmentDeleteSuccess'),
    })
    await reload()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('clientAttachmentDeleteError'),
      })
    }
  }
}

async function onUploadSubmit(payload) {
  if (!hasClientId.value || !payload?.file || !payload?.category) {
    return
  }
  uploading.value = true
  try {
    await uploadStoredFile(payload.file, payload.category, {
      clientId: props.clientId,
      entityType: storedFileEntityTypes.client,
      entityId: Number(props.clientId),
    })
    uploadOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('clientAttachmentUploadSuccess'),
    })
    await loadFiles({ page: 1 })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('clientAttachmentUploadError'),
      })
    }
  } finally {
    uploading.value = false
  }
}

function onNavigateSource(file) {
  const target = resolveClientFileSourceNavigation(file?.entityType)
  if (!target) {
    return
  }
  emit('navigate-source', target)
}

watch(
  () => [props.clientId, props.canView],
  () => {
    void loadFiles({ page: 1 })
  },
)

onMounted(() => {
  void loadFiles({ page: 1 })
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.attachments-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: $text-strong;
}

.attachments-subtitle {
  margin: 4px 0 0;
  color: $text-muted;
}

.attachments-filter-select {
  width: 240px;
  max-width: 240px;
}

.attachments-filter-select :deep(.q-field) {
  width: 240px;
  max-width: 240px;
}
</style>
