<template>
  <AdminQTable
    v-if="rows.length"
    class="table admin-data-table admin-data-table--embedded
      admin-data-table--inline-column-settings"
    flat
    hide-bottom
    row-key="id"
    :rows="rows"
    :columns="columns"
    :pagination="tablePagination">
    <template #body-cell-noteDateTime="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        {{ scope.row.noteDateTimeDisplay || '—' }}
      </q-td>
    </template>

    <template #body-cell-clinician="scope">
      <q-td :props="scope">
        <AdminTableClinicianAvatars
          v-if="scope.row.clinicianEntries?.length"
          :entries="scope.row.clinicianEntries"
        />
        <span v-else>—</span>
      </q-td>
    </template>

    <template #body-cell-status="scope">
      <q-td :props="scope">
        <AdminTableStatusCell
          :label="statusLabel(scope.row.status)"
          :variant="statusVariant(scope.row.status)"
        />
      </q-td>
    </template>

    <template #body-cell-summary="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell
          clinical-notes-table__summary">
        {{ scope.row.summaryPreview || '—' }}
      </q-td>
    </template>

    <template #row-actions="{ row }">
      <div class="admin-table-row-actions">
        <q-btn
          flat
          round
          dense
          class="app-btn-icon-action"
          :icon="adminTableActionIcons.view"
          :data-testid="tid.rowView(row.id)"
          :size="siteBreakpoints.SM"
          :title="t('clinicalNoteActionView')"
          :aria-label="t('clinicalNoteActionView')"
          @click="emit('view', row)"
        />
        <q-btn
          v-if="canDownloadRow(row)"
          flat
          round
          dense
          class="app-btn-icon-action"
          icon="download"
          :data-testid="tid.rowDownload(row.id)"
          :size="siteBreakpoints.SM"
          :title="t('clinicalNoteActionDownload')"
          :aria-label="t('clinicalNoteActionDownload')"
          @click="emit('download', row)"
        />
        <q-btn
          v-if="canEditRow(row)"
          flat
          round
          dense
          class="app-btn-icon-action"
          :icon="adminTableActionIcons.edit"
          :data-testid="tid.rowEdit(row.id)"
          :size="siteBreakpoints.SM"
          :title="t('edit')"
          :aria-label="t('edit')"
          @click="emit('edit', row)"
        />
        <q-btn
          v-if="canDeleteRow(row)"
          flat
          round
          dense
          class="app-btn-icon-action"
          icon="delete"
          :data-testid="tid.rowDelete(row.id)"
          :size="siteBreakpoints.SM"
          :title="t('delete')"
          :aria-label="t('delete')"
          @click="emit('delete', row)"
        />
      </div>
    </template>
  </AdminQTable>

  <div
    v-else
    class="admin-data-table__empty full-width row flex-center
      text-grey-7 q-gutter-sm q-pa-lg">
    <q-icon name="inbox" size="md" />
    <span>{{ emptyLabel }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminQTable from 'components/AdminQTable.vue'
import AdminTableClinicianAvatars from
  'components/admin-table/AdminTableClinicianAvatars.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import {
  clinicalNoteStatuses,
  siteBreakpoints,
} from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { clinicalNoteTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  canEdit: {
    type: Boolean,
    default: true,
  },
  canDelete: {
    type: Boolean,
    default: true,
  },
  canDownload: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['view', 'edit', 'delete', 'download'])

const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const columns = computed(() => [
  {
    name: 'noteDateTime',
    label: t('clinicalNoteColDateTime'),
    align: 'left',
    field: row => row.noteDateTimeDisplay,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'clinician',
    label: t('clinicalNoteColClinician'),
    align: 'left',
    field: row => row.clinicianEntries,
    sortable: false,
    headerStyle: 'min-width: 100px',
    style: 'min-width: 100px',
  },
  {
    name: 'status',
    label: t('status'),
    align: 'left',
    field: row => row.status,
    sortable: false,
    headerStyle: 'min-width: 100px',
    style: 'min-width: 100px',
  },
  {
    name: 'summary',
    label: t('clinicalNoteColSummary'),
    align: 'left',
    field: row => row.summaryPreview,
    sortable: false,
  },
  {
    name: 'actions',
    label: t('actions'),
    align: 'center',
    field: row => row.id,
    sortable: false,
    required: true,
    headerStyle: 'min-width: 132px',
    style: 'min-width: 132px',
  },
])

function statusLabel(status) {
  if (status === clinicalNoteStatuses.signed) {
    return t('clinicalNoteStatusSigned')
  }
  if (status === clinicalNoteStatuses.draft) {
    return t('clinicalNoteStatusDraft')
  }

  return status || '—'
}

function statusVariant(status) {
  if (status === clinicalNoteStatuses.signed) {
    return 'active'
  }
  if (status === clinicalNoteStatuses.draft) {
    return 'inactive'
  }

  return 'other'
}

function canEditRow(row) {
  return props.canEdit && row.status === clinicalNoteStatuses.draft
}

function canDeleteRow(row) {
  return props.canDelete && row.status === clinicalNoteStatuses.draft
}

function canDownloadRow(row) {
  return props.canDownload && row.status === clinicalNoteStatuses.signed
}
</script>
