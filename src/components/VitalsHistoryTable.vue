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
    <template #body-cell-recordedDateTime="scope">
      <q-td
        :props="scope"
        class="admin-data-table__primary-cell">
        <span class="vitals-history-table__ellipsis">
          {{ formatRecordedDateTimeDisplay(scope.row) }}
        </span>
      </q-td>
    </template>

    <template #body-cell-bloodPressure="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        {{ formatBloodPressure(scope.row) }}
      </q-td>
    </template>

    <template #body-cell-heartRate="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        {{ displayValue(scope.row.heartRate) }}
      </q-td>
    </template>

    <template #body-cell-temperature="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        {{ displayValue(scope.row.temperature) }}
      </q-td>
    </template>

    <template #body-cell-oxygenSaturation="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        {{ displayValue(scope.row.oxygenSaturation) }}
      </q-td>
    </template>

    <template #body-cell-bmi="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        {{ formatBmiDisplay(scope.row.bmi) }}
      </q-td>
    </template>

    <template #body-cell-recordedBy="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        <span class="vitals-history-table__ellipsis">
          {{ clinicianLabel(scope.row.recordedBy) }}
        </span>
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
          :data-testid="tid.vitalsRowEdit(row.id)"
          :size="siteBreakpoints.SM"
          :title="t('edit')"
          :aria-label="t('edit')"
          @click="emit('edit', row)"
        />
        <q-btn
          v-if="canEdit"
          flat
          round
          dense
          class="app-btn-icon-action"
          icon="delete"
          :data-testid="tid.vitalsRowDelete(row.id)"
          :size="siteBreakpoints.SM"
          :title="t('delete')"
          :aria-label="t('delete')"
          @click="emit('delete', row)"
        />
        <span
          v-if="!canEdit"
          class="text-grey-6">
          —
        </span>
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
import { siteBreakpoints } from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import {
  formatBmiDisplay,
  formatRecordedDateTimeDisplay,
} from 'src/utils/client-vitals.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
  canEdit: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['edit', 'delete'])

const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const rows = computed(() => props.entries ?? [])

const columns = computed(() => [
  {
    name: 'recordedDateTime',
    label: t('vitalsColDateTime'),
    align: 'left',
    field: row => row.recordedDate,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'bloodPressure',
    label: t('vitalsColBloodPressure'),
    align: 'left',
    field: row => row.systolic,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'heartRate',
    label: t('vitalsColHeartRate'),
    align: 'left',
    field: row => row.heartRate,
    sortable: false,
    headerStyle: 'min-width: 100px',
    style: 'min-width: 100px',
  },
  {
    name: 'temperature',
    label: t('vitalsColTemperature'),
    align: 'left',
    field: row => row.temperature,
    sortable: false,
    headerStyle: 'min-width: 100px',
    style: 'min-width: 100px',
  },
  {
    name: 'oxygenSaturation',
    label: t('vitalsColSpO2'),
    align: 'left',
    field: row => row.oxygenSaturation,
    sortable: false,
    headerStyle: 'min-width: 80px',
    style: 'min-width: 80px',
  },
  {
    name: 'bmi',
    label: t('vitalsColBmi'),
    align: 'left',
    field: row => row.bmi,
    sortable: false,
    headerStyle: 'min-width: 72px',
    style: 'min-width: 72px',
  },
  {
    name: 'recordedBy',
    label: t('vitalsColRecordedBy'),
    align: 'left',
    field: row => row.recordedBy,
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
    headerStyle: 'min-width: 96px',
    style: 'min-width: 96px',
  },
])

function displayValue(value) {
  if (value == null || value === '') {
    return '—'
  }

  return String(value)
}

function formatBloodPressure(row) {
  if (row?.systolic == null || row?.diastolic == null) {
    return '—'
  }

  return `${row.systolic} / ${row.diastolic}`
}

function clinicianLabel(value) {
  const match = props.clinicianOptions.find(
    opt => String(opt.value) === String(value),
  )

  return match?.label ?? value ?? '—'
}
</script>
