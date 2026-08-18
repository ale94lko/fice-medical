<template>
  <div
    v-if="profiles.length"
    class="admin-data-table__scroll">
    <AdminQTable
      class="table admin-data-table admin-data-table--embedded
        admin-data-table--inline-column-settings"
      flat
      hide-bottom
      row-key="id"
      :rows="profiles"
      :columns="columns"
      :pagination="tablePagination"
      :grid="showGrid"
      :card-layout="mobileCardLayout">
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
          <q-tooltip
            v-if="inactiveTooltip(scope.row)"
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ inactiveTooltip(scope.row) }}
          </q-tooltip>
        </q-td>
      </template>

      <template
        v-if="showActions"
        #row-actions="{ row }">
        <div class="admin-table-row-actions">
          <q-btn
            flat
            round
            dense
            class="app-btn-icon-action"
            :icon="adminTableActionIcons.view"
            :data-testid="tid.insuranceRowView(row.id)"
            :size="siteBreakpoints.SM"
            :aria-label="t('insuranceActionView')"
            @click="emit('view', row)"
          >
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('insuranceActionView') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canEdit && canModify(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            :icon="adminTableActionIcons.edit"
            :data-testid="tid.insuranceRowEdit(row.id)"
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
            v-if="canEdit && canDeactivate(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="block"
            color="warning"
            :data-testid="tid.insuranceRowDeactivate(row.id)"
            :size="siteBreakpoints.SM"
            :aria-label="t('insuranceActionDeactivate')"
            @click="emit('deactivate', row)"
          >
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('insuranceActionDeactivate') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canEdit && canReactivate(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="check_circle"
            color="positive"
            :data-testid="tid.insuranceRowReactivate(row.id)"
            :size="siteBreakpoints.SM"
            :aria-label="t('insuranceActionReactivate')"
            @click="emit('reactivate', row)"
          >
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('insuranceActionReactivate') }}
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
  siteBreakpoints,
} from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { useAdminTableMobileGrid } from
  'src/composables/useAdminTableMobileGrid.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'
import { apiDateTimeToDisplay } from 'src/utils/app-datetime.js'
import {
  canDeactivateInsuranceProfile,
  canReactivateInsuranceProfile,
  formatInsuranceDeactivationReason,
  insuranceStatusBadgeVariant,
  isInsuranceProfileInactive,
} from 'src/utils/client-insurance.js'

const props = defineProps({
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
  showActions: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['view', 'edit', 'deactivate', 'reactivate'])

const { t } = useI18n()
const { showGrid } = useAdminTableMobileGrid()

const tablePagination = { rowsPerPage: 0 }

/** Same compact card hierarchy as Allergies / Clients (mobile). */
const mobileCardLayout = {
  title: 'payerPlan',
  status: 'priority',
  subtitle: null,
  contact: null,
  identifier: null,
  badges: ['insuranceType', 'memberId', 'status'],
  hideEmpty: true,
}

const columns = computed(() => {
  const cols = [
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
  ]
  if (props.showActions) {
    cols.push({
      name: 'actions',
      label: t('actions'),
      align: 'center',
      field: row => row.id,
      sortable: false,
      required: true,
      headerStyle: 'min-width: 160px',
      style: 'min-width: 160px',
    })
  }

  return cols
})

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
  return insuranceStatusBadgeVariant(status)
}

function statusLabel(status) {
  return status || '—'
}

function canModify(profile) {
  return !isInsuranceProfileInactive(profile)
}

function canDeactivate(profile) {
  return canDeactivateInsuranceProfile(profile)
}

function canReactivate(profile) {
  return canReactivateInsuranceProfile(profile)
}

function inactiveTooltip(profile) {
  if (!isInsuranceProfileInactive(profile)) {
    return ''
  }
  const reason = formatInsuranceDeactivationReason(
    profile.deactivationReason,
  )
  const notes = String(profile.deactivationNotes ?? '').trim()
  const when = profile.deactivatedAt
    ? apiDateTimeToDisplay(profile.deactivatedAt)
    : ''
  const parts = []
  if (reason) {
    parts.push(`${t('insuranceDeactivatedReason')}: ${reason}`)
  }
  if (notes) {
    parts.push(`${t('insuranceDeactivatedNotes')}: ${notes}`)
  }
  if (when) {
    parts.push(`${t('insuranceDeactivatedAt')}: ${when}`)
  }

  return parts.join('\n')
}
</script>
