<template>
  <AdminQTable
    v-if="profiles.length"
    class="table admin-data-table admin-data-table--embedded
      admin-data-table--inline-column-settings"
    flat
    hide-bottom
    row-key="id"
    :rows="profiles"
    :columns="columns"
    :pagination="tablePagination">
    <template #body-cell-priority="scope">
      <q-td :props="scope">
        <AdminTableStatusCell
          :label="scope.row.priority"
          :variant="priorityVariant(scope.row.priority)"
        />
      </q-td>
    </template>

    <template #body-cell-payerPlan="scope">
      <q-td
        :props="scope"
        class="admin-data-table__primary-cell">
        <div class="insurance-payer-cell">
          <span class="insurance-payer-name">
            {{ scope.row.payerName || '—' }}
          </span>
          <span
            v-if="scope.row.planName"
            class="insurance-plan-name">
            {{ scope.row.planName }}
          </span>
        </div>
      </q-td>
    </template>

    <template #body-cell-insuranceType="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        {{ scope.row.insuranceType || '—' }}
      </q-td>
    </template>

    <template #body-cell-memberId="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        {{ scope.row.memberId || '—' }}
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
          :data-testid="tid.insuranceRowView(row.id)"
          :size="siteBreakpoints.SM"
          :title="t('insuranceActionView')"
          :aria-label="t('insuranceActionView')"
          @click="emit('view', row)"
        />
        <q-btn
          v-if="canEdit"
          flat
          round
          dense
          class="app-btn-icon-action"
          :icon="adminTableActionIcons.edit"
          :data-testid="tid.insuranceRowEdit(row.id)"
          :size="siteBreakpoints.SM"
          :title="t('edit')"
          :aria-label="t('edit')"
          @click="emit('edit', row)"
        />
        <q-btn
          v-if="canEdit && canDeactivate(row)"
          flat
          round
          dense
          class="app-btn-icon-action"
          icon="toggle_off"
          :data-testid="tid.insuranceRowDeactivate(row.id)"
          :size="siteBreakpoints.SM"
          :title="t('insuranceActionDeactivate')"
          :aria-label="t('insuranceActionDeactivate')"
          @click="emit('deactivate', row)"
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
import {
  clientInsurancePriorityValues,
  clientInsuranceStatusValues,
  siteBreakpoints,
} from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'

defineProps({
  profiles: {
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

const emit = defineEmits(['view', 'edit', 'deactivate'])

const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const columns = computed(() => [
  {
    name: 'priority',
    label: t('insuranceColPriority'),
    align: 'left',
    field: row => row.priority,
    sortable: false,
    headerStyle: 'min-width: 100px',
    style: 'min-width: 100px',
  },
  {
    name: 'payerPlan',
    label: t('insuranceColPayerPlan'),
    align: 'left',
    field: row => row.payerName,
    sortable: false,
    headerStyle: 'min-width: 200px',
    style: 'min-width: 200px',
  },
  {
    name: 'insuranceType',
    label: t('insuranceColType'),
    align: 'left',
    field: row => row.insuranceType,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'memberId',
    label: t('insuranceColMemberId'),
    align: 'left',
    field: row => row.memberId,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'status',
    label: t('insuranceColStatus'),
    align: 'left',
    field: row => row.status,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
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

function priorityVariant(priority) {
  if (priority === clientInsurancePriorityValues.primary) {
    return 'active'
  }
  if (priority === clientInsurancePriorityValues.secondary) {
    return 'completed'
  }
  if (priority === clientInsurancePriorityValues.tertiary) {
    return 'other'
  }

  return 'other'
}

function statusVariant(status) {
  if (status === clientInsuranceStatusValues.active) {
    return 'active'
  }
  if (status === clientInsuranceStatusValues.pendingVerification) {
    return 'pending'
  }
  if (status === clientInsuranceStatusValues.expired) {
    return 'cancelled'
  }

  return 'inactive'
}

function statusLabel(status) {
  if (status === clientInsuranceStatusValues.pendingVerification) {
    return t('insuranceStatusPendingShort')
  }

  return status || '—'
}

function canDeactivate(profile) {
  const s = profile?.status

  return (
    s === clientInsuranceStatusValues.active
    || s === clientInsuranceStatusValues.pendingVerification
  )
}
</script>
