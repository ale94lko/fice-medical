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
      <template #body-cell-medication="scope">
        <q-td
          :props="scope"
          class="admin-data-table__primary-cell">
          <div class="medication-name">
            {{ scope.row.medicationName || '—' }}
          </div>
          <div
            v-if="scope.row.medicationGenericName"
            class="medication-generic text-grey-7">
            {{ scope.row.medicationGenericName }}
          </div>
        </q-td>
      </template>

      <template #body-cell-dosage="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.dosageDisplay || '—' }}
        </q-td>
      </template>

      <template #body-cell-routeFrequency="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.routeFrequencyDisplay || '—' }}
        </q-td>
      </template>

      <template #body-cell-prescriber="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.prescriberName || '—' }}
        </q-td>
      </template>

      <template #body-cell-pharmacy="scope">
        <q-td :props="scope">
          <template v-if="scope.row.pharmacy?.name">
            <span>{{ scope.row.pharmacy.name }}</span>
            <span
              v-if="scope.row.preferredPharmacy || scope.row.pharmacy.preferred"
              class="medication-preferred-badge q-ml-xs">
              {{ t('medicationPreferredBadge') }}
            </span>
          </template>
          <span v-else>—</span>
        </q-td>
      </template>

      <template #body-cell-status="scope">
        <q-td :props="scope">
          <span
            class="medication-status-badge"
            :class="
              `medication-status-badge--${statusClass(scope.row.status)}`
            ">
            {{ statusLabel(scope.row.status) }}
          </span>
        </q-td>
      </template>

      <template #body-cell-startDate="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.startDate || '—' }}
        </q-td>
      </template>

      <template #body-cell-endDate="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.endDate || '—' }}
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
            :title="t('medicationActionView')"
            :aria-label="t('medicationActionView')"
            @click="emit('view', row)"
          />
          <q-btn
            v-if="canEdit"
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
            v-if="canEdit || canDelete"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="more_vert"
            :data-testid="tid.rowMore(row.id)"
            :size="siteBreakpoints.SM"
            :title="t('medicationActionMore')"
            :aria-label="t('medicationActionMore')"
          >
            <q-menu auto-close>
              <q-list dense style="min-width: 180px">
                <q-item
                  v-if="canEdit"
                  v-close-popup
                  clickable
                  :data-testid="tid.rowStatus(row.id)"
                  @click="emit('change-status', row)">
                  <q-item-section>
                    {{ t('medicationActionChangeStatus') }}
                  </q-item-section>
                </q-item>
                <q-item
                  v-if="canDelete"
                  v-close-popup
                  clickable
                  :data-testid="tid.rowDelete(row.id)"
                  @click="emit('delete', row)">
                  <q-item-section class="text-negative">
                    {{ t('delete') }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
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
    <span>{{ emptyLabel }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminQTable from 'components/AdminQTable.vue'
import {
  medicationStatuses,
  siteBreakpoints,
} from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { medicationTestIds as tid } from 'src/test-ids/index.js'

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

const emit = defineEmits(['view', 'edit', 'change-status', 'delete'])

const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const rows = computed(() => props.rows ?? [])

const columns = computed(() => [
  {
    name: 'medication',
    label: t('medicationColMedication'),
    align: 'left',
    field: row => row.medicationName,
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
  },
  {
    name: 'dosage',
    label: t('medicationColDosage'),
    align: 'left',
    field: row => row.dosageDisplay,
    sortable: false,
    headerStyle: 'min-width: 96px',
    style: 'min-width: 96px',
  },
  {
    name: 'routeFrequency',
    label: t('medicationColRouteFrequency'),
    align: 'left',
    field: row => row.routeFrequencyDisplay,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'prescriber',
    label: t('medicationColPrescriber'),
    align: 'left',
    field: row => row.prescriberName,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'pharmacy',
    label: t('medicationColPharmacy'),
    align: 'left',
    field: row => row.pharmacy?.name,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'status',
    label: t('status'),
    align: 'left',
    field: row => row.status,
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'startDate',
    label: t('medicationColStartDate'),
    align: 'left',
    field: row => row.startDate,
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'endDate',
    label: t('medicationColEndDate'),
    align: 'left',
    field: row => row.endDate,
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
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
])

function statusClass(status) {
  const token = String(status ?? '').toUpperCase()
  if (token === medicationStatuses.active) {
    return 'active'
  }
  if (token === medicationStatuses.completed) {
    return 'completed'
  }
  if (token === medicationStatuses.discontinued) {
    return 'discontinued'
  }

  return 'unknown'
}

function statusLabel(status) {
  const token = String(status ?? '').toUpperCase()
  if (token === medicationStatuses.active) {
    return t('medicationStatusActive')
  }
  if (token === medicationStatuses.completed) {
    return t('medicationStatusCompleted')
  }
  if (token === medicationStatuses.discontinued) {
    return t('medicationStatusDiscontinued')
  }

  return status || '—'
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.medication-name {
  font-weight: 600;
  color: $text-strong;
}

.medication-generic {
  font-size: 0.8125rem;
  line-height: 1.3;
}

.medication-preferred-badge,
.medication-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.2;
}

.medication-preferred-badge {
  background: #dcfce7;
  color: #166534;
}

.medication-status-badge--active {
  background: #dcfce7;
  color: #166534;
}

.medication-status-badge--completed {
  background: #dbeafe;
  color: #1d4ed8;
}

.medication-status-badge--discontinued {
  background: #fee2e2;
  color: #b91c1c;
}

.medication-status-badge--unknown {
  background: #f1f5f9;
  color: $text-muted;
}
</style>
