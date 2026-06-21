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
    <template #body-cell-planName="scope">
      <q-td
        :props="scope"
        class="admin-data-table__primary-cell">
        <span class="care-plans-table__ellipsis">
          {{ scope.row.name || '—' }}
        </span>
      </q-td>
    </template>

    <template #body-cell-problem="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        <span class="care-plans-table__ellipsis">
          {{ scope.row.problem || '—' }}
        </span>
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

    <template #body-cell-progress="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell
          care-plans-table__progress-cell">
        <CarePlanProgressCell
          compact
          :progress="scope.row.progress"
        />
      </q-td>
    </template>

    <template #body-cell-targetDate="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        {{ scope.row.targetDate || '—' }}
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
          :title="t('carePlanActionView')"
          :aria-label="t('carePlanActionView')"
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
        <q-btn
          v-if="canSignRow(row)"
          flat
          round
          dense
          class="app-btn-icon-action"
          icon="draw"
          :data-testid="tid.rowSign(row.id)"
          :size="siteBreakpoints.SM"
          :title="t('carePlanActionSign')"
          :aria-label="t('carePlanActionSign')"
          @click="emit('sign', row)"
        />
        <q-btn
          v-if="canChangeStatus(row)"
          flat
          round
          dense
          class="app-btn-icon-action"
          icon="check_circle"
          :data-testid="tid.rowComplete(row.id)"
          :size="siteBreakpoints.SM"
          :title="t('carePlanActionMarkCompleted')"
          :aria-label="t('carePlanActionMarkCompleted')"
          @click="emit('status', row, 'COMPLETED')"
        />
        <q-btn
          v-if="canChangeStatus(row)"
          flat
          round
          dense
          class="app-btn-icon-action"
          icon="archive"
          :data-testid="tid.rowArchive(row.id)"
          :size="siteBreakpoints.SM"
          :title="t('carePlanActionArchive')"
          :aria-label="t('carePlanActionArchive')"
          @click="emit('status', row, 'ARCHIVED')"
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
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import CarePlanProgressCell from 'components/CarePlanProgressCell.vue'
import { carePlanStatuses, siteBreakpoints } from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { carePlanI18nKey } from 'src/utils/care-plan-i18n.js'
import { carePlanTestIds as tid } from 'src/test-ids/index.js'

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
  canSign: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['view', 'edit', 'sign', 'status'])

const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const columns = computed(() => [
  {
    name: 'planName',
    label: t('carePlanColName'),
    align: 'left',
    field: row => row.name,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'problem',
    label: t('carePlanColProblem'),
    align: 'left',
    field: row => row.problem,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
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
    name: 'progress',
    label: t('carePlanColProgress'),
    align: 'left',
    field: row => row.progress,
    sortable: false,
    headerStyle: 'min-width: 90px',
    style: 'min-width: 90px',
  },
  {
    name: 'targetDate',
    label: t('carePlanColTargetDate'),
    align: 'left',
    field: row => row.targetDate,
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'actions',
    label: t('actions'),
    align: 'center',
    field: row => row.id,
    sortable: false,
    required: true,
    headerStyle: 'min-width: 180px',
    style: 'min-width: 180px',
  },
])

function statusLabel(status) {
  const key = carePlanI18nKey('carePlanStatus', status)
  const translated = t(key)
  if (translated !== key) {
    return translated
  }

  return status || '—'
}

function statusVariant(status) {
  if (status === carePlanStatuses.active) {
    return 'active'
  }
  if (status === carePlanStatuses.completed) {
    return 'completed'
  }
  if (status === carePlanStatuses.archived) {
    return 'inactive'
  }

  return 'other'
}

function canEditRow(row) {
  return props.canEdit
    && !row.signed
    && row.status !== carePlanStatuses.completed
    && row.status !== carePlanStatuses.archived
}

function canSignRow(row) {
  return props.canSign
    && !row.signed
    && row.status === carePlanStatuses.active
}

function canChangeStatus(row) {
  return props.canEdit && row.status === carePlanStatuses.active
}
</script>
