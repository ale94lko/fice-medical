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
      <template #body-cell-title="scope">
        <q-td
          :props="scope"
          class="admin-data-table__primary-cell">
          {{ scope.row.title || '—' }}
        </q-td>
      </template>

      <template #body-cell-frequency="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.frequency || '—' }}
        </q-td>
      </template>

      <template #body-cell-clinician="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ clinicianLabel(scope.row) }}
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
            :size="siteBreakpoints.SM"
            :aria-label="t('view')"
            @click="emit('view', row)"
          >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('view') }}
          </q-tooltip>
        </q-btn>
          <q-btn
            v-if="!readonly"
            flat
            round
            dense
            class="app-btn-icon-action"
            :icon="adminTableActionIcons.edit"
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
            v-if="!readonly"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="delete"
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
        </div>
      </template>
    </AdminQTable>
  </div>

  <div
    v-else
    class="admin-data-table__empty full-width row flex-center
      text-grey-7 q-gutter-sm q-pa-lg">
    <q-icon name="inbox" size="md" />
    <span>{{ emptyLabel || t('carePlanInterventionsEmpty') }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminQTable from 'components/AdminQTable.vue'
import { siteBreakpoints } from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { resolveClinicianOptionLabel } from 'src/utils/care-plan-orders.js'

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['view', 'edit', 'delete'])

const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const rows = computed(() => props.rows ?? [])

const columns = computed(() => [
  {
    name: 'title',
    label: t('carePlanInterventionColTitle'),
    align: 'left',
    field: row => row.title,
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
  },
  {
    name: 'frequency',
    label: t('carePlanInterventionColFrequency'),
    align: 'left',
    field: row => row.frequency,
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'clinician',
    label: t('carePlanInterventionColClinician'),
    align: 'left',
    field: row => clinicianLabel(row),
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
  },
  {
    name: 'actions',
    label: t('actions'),
    align: 'center',
    field: row => row.id,
    sortable: false,
    required: true,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
])

function clinicianLabel(row) {
  const stored = String(
    row?.responsibleClinicianName
    ?? row?.responsible_clinician_name
    ?? '',
  ).trim()
  if (stored) {
    return stored
  }

  return resolveClinicianOptionLabel(
    props.clinicianOptions,
    row?.responsibleClinicianId ?? row?.responsible_clinician_id,
  ) || '—'
}
</script>
