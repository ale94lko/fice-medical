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
      <template #body-cell-measureName="scope">
        <q-td
          :props="scope"
          class="admin-data-table__primary-cell">
          {{ scope.row.measureName || '—' }}
        </q-td>
      </template>

      <template #body-cell-baseline="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.baseline ?? '—' }}
        </q-td>
      </template>

      <template #body-cell-target="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.target ?? '—' }}
        </q-td>
      </template>

      <template #body-cell-currentValue="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          <button
            v-if="hasCurrentValue(scope.row)"
            type="button"
            class="care-plan-measure-current-link"
            :aria-label="t('carePlanMeasurementHistory')"
            @click="emit('measurement-history', scope.row)">
            {{ formatCurrentValue(scope.row) }}
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('carePlanMeasurementHistoryTooltip') }}
            </q-tooltip>
          </button>
          <span v-else class="text-grey-6">—</span>
        </q-td>
      </template>

      <template #body-cell-direction="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ directionLabel(scope.row.direction) }}
        </q-td>
      </template>

      <template #body-cell-progress="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          <CarePlanProgressCell
            compact
            :progress="scope.row.progress"
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
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="history"
            :size="siteBreakpoints.SM"
            :aria-label="t('carePlanMeasurementHistory')"
            @click="emit('measurement-history', row)">
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('carePlanMeasurementHistoryTooltip') }}
          </q-tooltip>
          </q-btn>
          <q-btn
            v-if="!readonly"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="add_chart"
            :size="siteBreakpoints.SM"
            :aria-label="t('carePlanAddMeasurement')"
            @click="emit('add-measurement', row)">
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('carePlanAddMeasurementTooltip') }}
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
    <span>{{ emptyLabel || t('carePlanMeasuresEmpty') }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminQTable from 'components/AdminQTable.vue'
import CarePlanProgressCell from 'components/CarePlanProgressCell.vue'
import { siteBreakpoints } from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { carePlanI18nKey } from 'src/utils/care-plan-i18n.js'

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
})

const emit = defineEmits([
  'view',
  'edit',
  'delete',
  'add-measurement',
  'measurement-history',
])

const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const rows = computed(() => props.rows ?? [])

const columns = computed(() => [
  {
    name: 'measureName',
    label: t('carePlanMeasureColName'),
    align: 'left',
    field: row => row.measureName,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'baseline',
    label: t('carePlanMeasureColBaseline'),
    align: 'left',
    field: row => row.baseline,
    sortable: false,
    headerStyle: 'min-width: 88px',
    style: 'min-width: 88px',
  },
  {
    name: 'target',
    label: t('carePlanMeasureColTarget'),
    align: 'left',
    field: row => row.target,
    sortable: false,
    headerStyle: 'min-width: 88px',
    style: 'min-width: 88px',
  },
  {
    name: 'currentValue',
    label: t('carePlanMeasureColCurrentValue'),
    align: 'left',
    field: row => row.currentValue,
    sortable: false,
    headerStyle: 'min-width: 100px',
    style: 'min-width: 100px',
  },
  {
    name: 'direction',
    label: t('carePlanMeasureColDirection'),
    align: 'left',
    field: row => row.direction,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'progress',
    label: t('carePlanColProgress'),
    align: 'left',
    field: row => row.progress?.percent,
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
    headerStyle: 'min-width: 168px',
    style: 'min-width: 168px',
  },
])

function directionLabel(direction) {
  const key = carePlanI18nKey('carePlanDirection', direction)
  const translated = t(key)
  if (translated !== key) {
    return translated
  }

  return direction || '—'
}

function hasCurrentValue(row) {
  const value = row?.currentValue

  return value != null && value !== ''
}

function formatCurrentValue(row) {
  if (!hasCurrentValue(row)) {
    return '—'
  }
  const unit = String(row?.unit ?? '').trim()

  return unit ? `${row.currentValue} ${unit}` : String(row.currentValue)
}
</script>

<style lang="scss" scoped>
.care-plan-measure-current-link {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: $primary;
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;

  &:hover {
    opacity: 0.85;
  }
}
</style>
