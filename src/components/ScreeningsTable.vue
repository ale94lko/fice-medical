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
    <template #body-cell-templateName="scope">
      <q-td
        :props="scope"
        class="admin-data-table__primary-cell">
        <span class="screenings-table__ellipsis">
          {{ scope.row.templateName || '—' }}
        </span>
      </q-td>
    </template>

    <template #body-cell-screeningDate="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        {{ scope.row.screeningDate || '—' }}
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
          :title="t('screeningActionView')"
          :aria-label="t('screeningActionView')"
          @click="emit('view', row)"
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
  screeningStatuses,
  siteBreakpoints,
} from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { screeningTestIds as tid } from 'src/test-ids/index.js'

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
})

const emit = defineEmits(['view', 'edit'])

const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const columns = computed(() => [
  {
    name: 'templateName',
    label: t('screeningTemplateColumn'),
    align: 'left',
    field: row => row.templateName,
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
  },
  {
    name: 'screeningDate',
    label: t('screeningDateColumn'),
    align: 'left',
    field: row => row.screeningDate,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'clinician',
    label: t('assignedClinician'),
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
    name: 'actions',
    label: t('actions'),
    align: 'center',
    field: row => row.id,
    sortable: false,
    required: true,
    headerStyle: 'min-width: 96px',
    style: 'min-width: 96px',
  },
])

function statusLabel(status) {
  if (status === screeningStatuses.completed) {
    return t('screeningStatusCompleted')
  }
  if (status === screeningStatuses.cancelled) {
    return t('screeningStatusCancelled')
  }
  if (status === screeningStatuses.draft) {
    return t('screeningStatusInProgress')
  }

  return t('screeningStatusDraft')
}

function statusVariant(status) {
  if (status === screeningStatuses.completed) {
    return 'active'
  }
  if (status === screeningStatuses.cancelled) {
    return 'other'
  }

  return 'inactive'
}

function canEditRow(row) {
  return props.canEdit && row.status === screeningStatuses.draft
}
</script>
