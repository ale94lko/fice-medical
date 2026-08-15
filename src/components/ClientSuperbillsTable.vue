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
      :pagination="tablePagination"
      :grid="showGrid"
      :card-layout="mobileCardLayout">
      <template #body-cell-number="scope">
        <q-td
          :props="scope"
          class="admin-data-table__primary-cell">
          <button
            type="button"
            class="admin-data-table__link"
            :data-testid="clientBillingTestIds.rowView(scope.row.id)"
            @click="emit('open', scope.row)">
            {{ scope.row.superbillNumber || '—' }}
          </button>
          <div class="text-caption text-grey-7">
            {{ scope.row.encounterNumber || '—' }}
          </div>
        </q-td>
      </template>

      <template #body-cell-dos="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.dateOfServiceDisplay || '—' }}
        </q-td>
      </template>

      <template #body-cell-service="scope">
        <q-td :props="scope">
          <div class="text-weight-medium">
            {{ serviceCell(scope.row).code
              || serviceCell(scope.row).name
              || '—' }}
            <span
              v-if="serviceCell(scope.row).extraLabel"
              class="text-grey-7">
              {{ serviceCell(scope.row).extraLabel }}
            </span>
          </div>
          <div class="text-caption text-grey-7">
            {{ serviceCell(scope.row).name }}
          </div>
        </q-td>
      </template>

      <template #body-cell-provider="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ providerLabel(scope.row) }}
        </q-td>
      </template>

      <template #body-cell-payer="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ payerLabel(scope.row, t) }}
        </q-td>
      </template>

      <template #body-cell-total="scope">
        <q-td :props="scope" class="text-right">
          {{ scope.row.totalChargeLabel || '—' }}
        </q-td>
      </template>

      <template #body-cell-status="scope">
        <q-td :props="scope">
          <AdminTableStatusCell
            :label="statusLabel(scope.row.status, t)"
            :variant="scope.row.statusVariant"
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
            icon="open_in_new"
            :size="siteBreakpoints.SM"
            :aria-label="t('clientBillingOpen')"
            :data-testid="clientBillingTestIds.rowView(row.id)"
            @click="emit('open', row)">
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('clientBillingOpen') }}
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
  billingResponsibilityValues,
  siteBreakpoints,
  superbillStatuses,
} from 'components/constants.js'
import { compactServices } from 'src/utils/billing-work-queue.js'
import { clientBillingTestIds } from 'src/test-ids/index.js'
import { useAdminTableMobileGrid } from
  'src/composables/useAdminTableMobileGrid.js'

defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['open'])
const { t } = useI18n()
const { showGrid } = useAdminTableMobileGrid()
const tablePagination = { rowsPerPage: 0 }

/** Same compact card hierarchy as Encounters / Insurance (mobile). */
const mobileCardLayout = {
  title: 'number',
  status: 'status',
  subtitle: null,
  contact: null,
  identifier: null,
  badges: ['dos', 'service', 'provider', 'payer', 'total'],
  hideEmpty: true,
}

const columns = computed(() => [
  {
    name: 'number',
    label: t('superbillColumnNumber'),
    align: 'left',
    field: row => row.superbillNumber,
    sortable: false,
  },
  {
    name: 'dos',
    label: t('superbillColumnDos'),
    align: 'left',
    field: row => row.dateOfServiceDisplay,
    sortable: false,
  },
  {
    name: 'service',
    label: t('superbillColumnService'),
    align: 'left',
    field: row => serviceCell(row).code,
    sortable: false,
  },
  {
    name: 'provider',
    label: t('superbillColumnProvider'),
    align: 'left',
    field: row => providerLabel(row),
    sortable: false,
  },
  {
    name: 'payer',
    label: t('superbillColumnPayer'),
    align: 'left',
    field: row => payerLabel(row, t),
    sortable: false,
  },
  {
    name: 'total',
    label: t('superbillColumnTotal'),
    align: 'right',
    field: row => row.totalChargeLabel,
    sortable: false,
  },
  {
    name: 'status',
    label: t('superbillColumnStatus'),
    align: 'left',
    field: row => row.status,
    sortable: false,
  },
  {
    name: 'actions',
    label: t('actions'),
    align: 'right',
    field: () => '',
    sortable: false,
  },
])

function serviceCell(row) {
  const lines = Array.isArray(row?.lines) ? row.lines : []
  const services = lines.map(line => ({
    code: line.billingCode,
    name: line.serviceName,
  }))

  return compactServices(services)
}

function providerLabel(row) {
  return row?.renderingProvider?.name || '—'
}

function payerLabel(row, translate) {
  if (row?.billingResponsibility
    === billingResponsibilityValues.selfPay) {
    return translate('superbillSelfPay')
  }

  return row?.insurance?.payerName
    || row?.payerName
    || '—'
}

function statusLabel(status, translate) {
  if (status === superbillStatuses.ready) {
    return translate('superbillStatusReady')
  }
  if (status === superbillStatuses.reviewed) {
    return translate('superbillStatusReviewed')
  }
  if (status === superbillStatuses.voided) {
    return translate('superbillStatusVoided')
  }

  return translate('superbillStatusNotReady')
}
</script>
