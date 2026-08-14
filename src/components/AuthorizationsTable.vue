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
      <template #body-cell-service="scope">
        <q-td :props="scope">
          <div class="text-body2">
            {{ serviceName(scope.row) }}
          </div>
          <div
            v-if="serviceCode(scope.row)"
            class="text-caption text-grey-7">
            {{ serviceCode(scope.row) }}
          </div>
        </q-td>
      </template>

      <template #body-cell-insurance="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          <div>{{ insuranceName(scope.row) }}</div>
          <div
            v-if="insuranceMemberId(scope.row)"
            class="text-caption text-grey-7">
            {{ t('authorizationMemberId') }}:
            {{ insuranceMemberId(scope.row) }}
          </div>
        </q-td>
      </template>

      <template #body-cell-status="scope">
        <q-td :props="scope">
          <AdminTableStatusCell
            :label="statusLabel(scope.row)"
            :variant="statusVariant(scope.row)"
          />
        </q-td>
      </template>

      <template #body-cell-authNumber="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.authorizationNumber || '—' }}
        </q-td>
      </template>

      <template #body-cell-approved="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ approvedLabel(scope.row) }}
        </q-td>
      </template>

      <template #body-cell-usedRemaining="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ usedRemainingLabel(scope.row) }}
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
            :aria-label="t('authorizationActionView')"
            @click="emit('view', row)"
          >
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('authorizationActionView') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canEditRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            :icon="adminTableActionIcons.edit"
            :data-testid="tid.rowEdit(row.id)"
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
            v-if="canCancelRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="block"
            :data-testid="tid.rowCancel(row.id)"
            :size="siteBreakpoints.SM"
            :aria-label="t('authorizationActionCancel')"
            @click="emit('cancel', row)"
          >
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('authorizationActionCancel') }}
            </q-tooltip>
          </q-btn>
        </div>
      </template>
    </AdminQTable>
  </div>

  <div
    v-else
    class="admin-data-table__empty full-width column flex-center
      text-grey-7 q-gutter-sm q-pa-lg">
    <q-icon name="inbox" size="md" />
    <span>{{ emptyLabel }}</span>
    <span
      v-if="emptyHint"
      class="text-caption text-center">
      {{ emptyHint }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminQTable from 'components/AdminQTable.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import { siteBreakpoints } from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import {
  authorizationStatusI18nKey,
  authorizationStatusVariant,
  formatQuantityAmount,
  formatUsedRemaining,
  isAuthorizationCancellable,
  isAuthorizationEditable,
} from 'src/utils/authorization-normalize.js'
import { authorizationTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  emptyHint: {
    type: String,
    default: '',
  },
  canEdit: {
    type: Boolean,
    default: true,
  },
  canCancel: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['view', 'edit', 'cancel'])
const { t } = useI18n()
const tablePagination = { rowsPerPage: 0 }

const columns = computed(() => [
  {
    name: 'service',
    label: t('authorizationColService'),
    align: 'left',
    field: row => serviceName(row),
    sortable: false,
    headerStyle: 'min-width: 180px',
    style: 'min-width: 180px',
  },
  {
    name: 'insurance',
    label: t('authorizationColInsurance'),
    align: 'left',
    field: row => insuranceName(row),
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
  },
  {
    name: 'status',
    label: t('authorizationColStatus'),
    align: 'left',
    field: row => statusLabel(row),
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'authNumber',
    label: t('authorizationColNumber'),
    align: 'left',
    field: row => row.authorizationNumber,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'approved',
    label: t('authorizationColApproved'),
    align: 'left',
    field: row => approvedLabel(row),
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'usedRemaining',
    label: t('authorizationColUsedRemaining'),
    align: 'left',
    field: row => usedRemainingLabel(row),
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'startDate',
    label: t('authorizationColStart'),
    align: 'left',
    field: row => row.startDate,
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'endDate',
    label: t('authorizationColEnd'),
    align: 'left',
    field: row => row.endDate,
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
])

function serviceName(row) {
  return row?.service?.name || '—'
}

function serviceCode(row) {
  return row?.service?.cpt_code
    || row?.service?.cptCode
    || row?.service?.hcpcs_code
    || row?.service?.hcpcsCode
    || ''
}

function insuranceName(row) {
  return row?.insurance?.payer_plan_name
    || row?.insurance?.payerPlanName
    || '—'
}

function insuranceMemberId(row) {
  return row?.insurance?.member_id
    || row?.insurance?.memberId
    || ''
}

function statusLabel(row) {
  return t(authorizationStatusI18nKey(
    row?.effectiveStatus || row?.status,
  ))
}

function statusVariant(row) {
  return authorizationStatusVariant(
    row?.effectiveStatus || row?.status,
  )
}

function approvedLabel(row) {
  return formatQuantityAmount(
    row?.approvedQuantity,
    row?.quantityType,
    t,
  )
}

function usedRemainingLabel(row) {
  return formatUsedRemaining(row, t)
}

function canEditRow(row) {
  return props.canEdit && isAuthorizationEditable(row)
}

function canCancelRow(row) {
  return props.canCancel && isAuthorizationCancellable(row)
}
</script>
