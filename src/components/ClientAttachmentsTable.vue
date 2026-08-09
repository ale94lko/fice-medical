<template>
  <div
    class="admin-data-table__scroll client-attachments-table"
    :data-testid="tid.table">
    <AdminQTable
      class="table admin-data-table admin-data-table--embedded
        admin-data-table--inline-column-settings"
      flat
      binary-state-sort
      row-key="id"
      v-model:pagination="pagination"
      :rows-per-page-options="[10, 20, 50]"
      :rows="rows"
      :columns="columns"
      :loading="loading"
      @request="onRequest">
      <template #body-cell-fileName="scope">
        <q-td
          :props="scope"
          class="admin-data-table__primary-cell">
          <span class="client-attachments-table__name">
            {{ scope.row.originalFilename || scope.row.name || '—' }}
          </span>
        </q-td>
      </template>

      <template #body-cell-fileSize="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ formatStoredFileSize(scope.row.fileSize) }}
        </q-td>
      </template>

      <template #body-cell-category="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ categoryLabel(scope.row.category) }}
        </q-td>
      </template>

      <template #body-cell-source="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          <button
            v-if="canNavigateSource(scope.row)"
            type="button"
            class="client-attachments-table__source-link"
            :data-testid="tid.rowSource(scope.row.id)"
            @click="emit('navigate-source', scope.row)">
            {{ sourceLabel(scope.row.entityType) }}
          </button>
          <span v-else>
            {{ sourceLabel(scope.row.entityType) }}
          </span>
        </q-td>
      </template>

      <template #body-cell-documentDate="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ formatDateOnly(scope.row.documentDate) }}
        </q-td>
      </template>

      <template #body-cell-uploadedAt="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ formatDateTime(scope.row.uploadedAt || scope.row.createdAt) }}
        </q-td>
      </template>

      <template #body-cell-uploadedBy="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ formatStoredFileUploadedBy(scope.row) }}
        </q-td>
      </template>

      <template #row-actions="{ row }">
        <div class="admin-table-row-actions">
          <q-btn
            v-if="canPreview(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="visibility"
            :size="siteBreakpoints.SM"
            :data-testid="tid.rowPreview(row.id)"
            :aria-label="t('clientAttachmentPreview')"
            @click="emit('preview', row)">
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('clientAttachmentPreview') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="download"
            :size="siteBreakpoints.SM"
            :loading="downloadingId === row.id"
            :data-testid="tid.rowDownload(row.id)"
            :aria-label="t('clientAttachmentDownload')"
            @click="emit('download', row)">
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('clientAttachmentDownload') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canDeleteRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="delete"
            :size="siteBreakpoints.SM"
            :data-testid="tid.rowDelete(row.id)"
            :aria-label="t('delete')"
            @click="emit('delete', row)">
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('delete') }}
            </q-tooltip>
          </q-btn>
        </div>
      </template>

      <template #no-data>
        <div
          class="full-width row flex-center text-grey-7
            q-gutter-sm q-pa-lg">
          <q-icon name="inbox" size="md" />
          <span>{{ emptyLabel }}</span>
        </div>
      </template>
    </AdminQTable>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminQTable from 'components/AdminQTable.vue'
import { siteBreakpoints } from 'components/constants.js'
import { clientAttachmentsTestIds as tid } from
  'src/test-ids/index.js'
import {
  clientFileCategoryI18nKey,
  clientFileSourceI18nKey,
  formatStoredFileSize,
  isDocumentsOwnedStoredFile,
  resolveClientFileSourceNavigation,
  storedFileCanPreview,
} from 'src/utils/client-files-i18n.js'
import { formatStoredFileUploadedBy } from
  'src/utils/stored-file-normalize.js'

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  pagination: {
    type: Object,
    required: true,
  },
  canDelete: {
    type: Boolean,
    default: false,
  },
  downloadingId: {
    type: [Number, String],
    default: null,
  },
  emptyLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'update:pagination',
  'request',
  'preview',
  'download',
  'delete',
  'navigate-source',
])

const { t, te } = useI18n()

const pagination = computed({
  get: () => props.pagination,
  set: value => emit('update:pagination', value),
})

const columns = computed(() => [
  {
    name: 'fileName',
    label: t('clientAttachmentColFileName'),
    align: 'left',
    field: row => row.originalFilename || row.name,
    sortable: false,
    headerStyle: 'min-width: 180px',
    style: 'min-width: 180px',
  },
  {
    name: 'fileSize',
    label: t('clientAttachmentColFileSize'),
    align: 'left',
    field: 'fileSize',
    sortable: false,
    headerStyle: 'min-width: 100px',
    style: 'min-width: 100px',
  },
  {
    name: 'category',
    label: t('clientAttachmentColCategory'),
    align: 'left',
    field: 'category',
    sortable: false,
    headerStyle: 'min-width: 130px',
    style: 'min-width: 130px',
  },
  {
    name: 'source',
    label: t('clientAttachmentColSource'),
    align: 'left',
    field: 'entityType',
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'documentDate',
    label: t('clientAttachmentColDocumentDate'),
    align: 'left',
    field: 'documentDate',
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'uploadedAt',
    label: t('clientAttachmentColUploadedAt'),
    align: 'left',
    field: 'uploadedAt',
    sortable: false,
    headerStyle: 'min-width: 150px',
    style: 'min-width: 150px',
  },
  {
    name: 'uploadedBy',
    label: t('clientAttachmentColUploadedBy'),
    align: 'left',
    field: row => formatStoredFileUploadedBy(row),
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'actions',
    label: t('actions'),
    align: 'right',
    field: 'id',
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
])

function categoryLabel(category) {
  const token = String(category ?? '').trim()
  if (!token) {
    return '—'
  }
  const key = clientFileCategoryI18nKey(token)

  return te(key) ? t(key) : token
}

function sourceLabel(entityType) {
  const token = String(entityType ?? '').trim()
  if (!token) {
    return t('clientFileSourceDocuments')
  }
  const key = clientFileSourceI18nKey(token)

  return te(key) ? t(key) : token
}

function formatDateTime(value) {
  const token = String(value ?? '').trim()
  if (!token) {
    return '—'
  }
  const date = new Date(token)
  if (Number.isNaN(date.getTime())) {
    return token
  }

  return date.toLocaleString()
}

function formatDateOnly(value) {
  const token = String(value ?? '').trim()
  if (!token) {
    return '—'
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(token)) {
    return token.slice(0, 10)
  }
  const date = new Date(token)
  if (Number.isNaN(date.getTime())) {
    return token
  }

  return date.toLocaleDateString()
}

function canPreview(row) {
  return storedFileCanPreview(row)
}

function canNavigateSource(row) {
  return Boolean(resolveClientFileSourceNavigation(row?.entityType))
}

function canDeleteRow(row) {
  return props.canDelete && isDocumentsOwnedStoredFile(row)
}

function onRequest(requestProps) {
  emit('request', requestProps)
}
</script>

<style lang="scss" scoped>
.client-attachments-table__name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.client-attachments-table__source-link {
  appearance: none;
  background: none;
  border: 0;
  color: var(--q-primary);
  cursor: pointer;
  font: inherit;
  padding: 0;
  text-align: left;
  text-decoration: underline;
}
</style>
