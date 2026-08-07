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
      <template #body-cell-rateType="scope">
        <q-td
          :props="scope"
          class="admin-data-table__primary-cell">
          {{ rateTypeLabel(scope.row.rateType) }}
        </q-td>
      </template>

      <template #body-cell-rate="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ formatRate(scope.row.rate) }}
        </q-td>
      </template>

      <template #body-cell-effectiveFrom="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.effectiveFrom || '—' }}
        </q-td>
      </template>

      <template #body-cell-effectiveTo="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.effectiveTo || '—' }}
        </q-td>
      </template>

      <template #body-cell-isCurrent="scope">
        <q-td :props="scope">
          <AdminTableStatusCell
            v-if="scope.row.isCurrent"
            :label="t('staffCompensationCurrentBadge')"
            variant="active"
          />
          <span v-else class="text-grey-7">—</span>
        </q-td>
      </template>

      <template #row-actions="{ row }">
        <div class="admin-table-row-actions">
          <q-btn
            v-if="canDelete"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="delete"
            :size="siteBreakpoints.SM"
            :aria-label="t('delete')"
            @click="emit('delete', row.id)"
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
            v-else
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
import { siteBreakpoints } from 'components/constants.js'
import { formatStaffCompensationRateDisplay } from
  'src/utils/staff-form.js'

const props = defineProps({
  rates: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  canDelete: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['delete'])

const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const rows = computed(() => props.rates ?? [])

const rateTypeOptions = computed(() => [
  { label: t('staffCompensationHourly'), value: 'hourly' },
  { label: t('staffCompensationSalary'), value: 'salary' },
  { label: t('staffCompensationPerVisit'), value: 'per_visit' },
])

const columns = computed(() => {
  const cols = [
    {
      name: 'rateType',
      label: t('staffCompensationRateType'),
      align: 'left',
      field: row => row.rateType,
      sortable: false,
      headerStyle: 'min-width: 120px',
      style: 'min-width: 120px',
    },
    {
      name: 'rate',
      label: t('staffCompensationRate'),
      align: 'left',
      field: row => row.rate,
      sortable: false,
      headerStyle: 'min-width: 88px',
      style: 'min-width: 88px',
    },
    {
      name: 'effectiveFrom',
      label: t('staffCompensationEffectiveFrom'),
      align: 'left',
      field: row => row.effectiveFrom,
      sortable: false,
      headerStyle: 'min-width: 120px',
      style: 'min-width: 120px',
    },
    {
      name: 'effectiveTo',
      label: t('staffCompensationEffectiveTo'),
      align: 'left',
      field: row => row.effectiveTo,
      sortable: false,
      headerStyle: 'min-width: 120px',
      style: 'min-width: 120px',
    },
    {
      name: 'isCurrent',
      label: t('staffCompensationCurrent'),
      align: 'left',
      field: row => row.isCurrent,
      sortable: false,
      headerStyle: 'min-width: 100px',
      style: 'min-width: 100px',
    },
  ]

  if (props.canDelete) {
    cols.push({
      name: 'actions',
      label: t('actions'),
      align: 'center',
      field: row => row.id,
      sortable: false,
      required: true,
      headerStyle: 'min-width: 72px',
      style: 'min-width: 72px',
    })
  }

  return cols
})

function rateTypeLabel(value) {
  return rateTypeOptions.value.find(opt => opt.value === value)?.label
    ?? value
    ?? '—'
}

function formatRate(value) {
  return formatStaffCompensationRateDisplay(value)
}
</script>
