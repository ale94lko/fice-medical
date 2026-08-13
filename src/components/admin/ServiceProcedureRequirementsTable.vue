<template>
  <div
    v-if="rows.length"
    class="admin-data-table__scroll">
    <AdminQTable
      class="table admin-data-table admin-data-table--embedded
        admin-data-table--inline-column-settings"
      flat
      hide-bottom
      row-key="id"
      :rows="rows"
      :columns="columns"
      :pagination="tablePagination">
      <template #body-cell-type="scope">
        <q-td
          :props="scope"
          class="admin-data-table__primary-cell">
          {{ scope.row.typeLabel || '—' }}
        </q-td>
      </template>

      <template #body-cell-purpose="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.purposeLabel || '—' }}
        </q-td>
      </template>

      <template #body-cell-severity="scope">
        <q-td :props="scope">
          <AdminTableStatusCell
            :label="scope.row.severityLabel"
            :variant="severityVariant(scope.row.severity)"
          />
        </q-td>
      </template>

      <template #body-cell-displayOrder="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.displayOrder ?? '—' }}
        </q-td>
      </template>

      <template #body-cell-required="scope">
        <q-td :props="scope">
          <AdminTableStatusCell
            :label="scope.row.required ? t('yes') : t('no')"
            :variant="scope.row.required ? 'active' : 'inactive'"
          />
        </q-td>
      </template>

      <template #row-actions="{ row }">
        <div class="admin-table-row-actions">
          <q-btn
            v-if="canEdit"
            flat
            round
            dense
            class="app-btn-icon-action"
            :icon="adminTableActionIcons.edit"
            :data-testid="rowEditTestId(row.id)"
            :size="siteBreakpoints.SM"
            :aria-label="t('edit')"
            @click="emit('edit', row)"
          >
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('edit') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canDelete"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="delete"
            :data-testid="rowDeleteTestId(row.id)"
            :size="siteBreakpoints.SM"
            :aria-label="t('delete')"
            @click="emit('delete', row)"
          >
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('delete') }}
            </q-tooltip>
          </q-btn>
          <span
            v-if="!canEdit && !canDelete"
            class="text-grey-6">
            —
          </span>
        </div>
      </template>
    </AdminQTable>
  </div>

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
import {
  encounterRequirementSeverities,
  siteBreakpoints,
} from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { serviceProcedureDialogTestIds } from 'src/test-ids/index.js'

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
    default: false,
  },
  canDelete: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['edit', 'delete'])

const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const rows = computed(() => props.rows ?? [])

const columns = computed(() => {
  const cols = [
    {
      name: 'type',
      label: t('serviceProcedureRequirementType'),
      align: 'left',
      field: row => row.typeLabel,
      sortable: false,
      headerStyle: 'min-width: 140px',
      style: 'min-width: 140px',
    },
    {
      name: 'purpose',
      label: t('serviceProcedureRequirementPurpose'),
      align: 'left',
      field: row => row.purposeLabel,
      sortable: false,
      headerStyle: 'min-width: 140px',
      style: 'min-width: 140px',
    },
    {
      name: 'severity',
      label: t('serviceProcedureRequirementSeverity'),
      align: 'left',
      field: row => row.severityLabel,
      sortable: false,
      headerStyle: 'min-width: 110px',
      style: 'min-width: 110px',
    },
    {
      name: 'displayOrder',
      label: t('serviceProcedureRequirementOrder'),
      align: 'left',
      field: row => row.displayOrder,
      sortable: false,
      headerStyle: 'min-width: 88px',
      style: 'min-width: 88px',
    },
    {
      name: 'required',
      label: t('serviceProcedureRequirementRequired'),
      align: 'left',
      field: row => row.required,
      sortable: false,
      headerStyle: 'min-width: 100px',
      style: 'min-width: 100px',
    },
  ]
  if (props.canEdit || props.canDelete) {
    cols.push({
      name: 'actions',
      label: t('actions'),
      align: 'center',
      field: row => row.id,
      sortable: false,
      required: true,
      headerStyle: 'min-width: 96px',
      style: 'min-width: 96px',
    })
  }

  return cols
})

function severityVariant(value) {
  if (value === encounterRequirementSeverities.blocking) {
    return 'cancelled'
  }
  if (value === encounterRequirementSeverities.warning) {
    return 'pending'
  }

  return 'other'
}

function rowEditTestId(id) {
  return serviceProcedureDialogTestIds.requirementRowEdit(id)
}

function rowDeleteTestId(id) {
  return serviceProcedureDialogTestIds.requirementRowDelete(id)
}
</script>
