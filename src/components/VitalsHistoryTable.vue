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
        <VitalsHistoryStatusValue
          :value="formatBloodPressure(scope.row)"
          :modifier="statusFor(scope.row, 'bloodPressure').modifier"
          :label="statusFor(scope.row, 'bloodPressure').label"
        />
      </q-td>
    </template>

    <template #body-cell-heartRate="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        <VitalsHistoryStatusValue
          :value="displayValue(scope.row.heartRate)"
          :modifier="statusFor(scope.row, 'heartRate').modifier"
          :label="statusFor(scope.row, 'heartRate').label"
        />
      </q-td>
    </template>

    <template #body-cell-temperature="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        <VitalsHistoryStatusValue
          :value="displayValue(scope.row.temperature)"
          :modifier="statusFor(scope.row, 'temperature').modifier"
          :label="statusFor(scope.row, 'temperature').label"
        />
      </q-td>
    </template>

    <template #body-cell-oxygenSaturation="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        <VitalsHistoryStatusValue
          :value="displayValue(scope.row.oxygenSaturation)"
          :modifier="statusFor(scope.row, 'oxygenSaturation').modifier"
          :label="statusFor(scope.row, 'oxygenSaturation').label"
        />
      </q-td>
    </template>

    <template #body-cell-bmi="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        <VitalsHistoryStatusValue
          :value="formatBmiDisplay(scope.row.bmi)"
          :modifier="statusFor(scope.row, 'bmi').modifier"
          :label="statusFor(scope.row, 'bmi').label"
        />
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
          v-if="canEdit && !row.apiId"
          flat
          round
          dense
          class="app-btn-icon-action"
          icon="delete"
          :data-testid="tid.vitalsRowDelete(row.id)"
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
          v-if="!canEdit"
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
import VitalsHistoryStatusValue from
  'components/VitalsHistoryStatusValue.vue'
import { siteBreakpoints } from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { useAdminTableMobileGrid } from
  'src/composables/useAdminTableMobileGrid.js'
import { resolveBmiClassification } from 'src/utils/bmi-us.js'
import {
  formatBmiDisplay,
  formatRecordedDateTimeDisplay,
  resolveBloodPressureLevel,
  resolveHeartRateLevel,
  resolveOxygenSaturationLevel,
  resolvePatientAgeContextForVitals,
  resolveTemperatureLevel,
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
  patientDob: {
    type: String,
    default: '',
  },
  patientAge: {
    type: [String, Number],
    default: '',
  },
  patientAgeUnit: {
    type: String,
    default: '',
  },
  patientGender: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['edit', 'delete'])

const { t } = useI18n()
const { showGrid } = useAdminTableMobileGrid()

const tablePagination = { rowsPerPage: 0 }

const rows = computed(() => props.entries ?? [])

/** Same compact card hierarchy as Insurance / Allergies (mobile). */
const mobileCardLayout = {
  title: 'recordedDateTime',
  status: 'bloodPressure',
  subtitle: null,
  contact: null,
  identifier: null,
  badges: [
    'heartRate',
    'temperature',
    'oxygenSaturation',
    'bmi',
    'recordedBy',
  ],
  hideEmpty: true,
}

const columns = computed(() => [
  {
    name: 'recordedDateTime',
    label: t('vitalsColDateTime'),
    align: 'left',
    field: row => formatRecordedDateTimeDisplay(row),
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

function ageContextForRow(row) {
  return resolvePatientAgeContextForVitals({
    dobUs: props.patientDob,
    age: props.patientAge,
    ageUnit: props.patientAgeUnit,
    asOfDateUs: row?.recordedDate,
  })
}

function toStatus(level) {
  if (!level?.labelKey) {
    return { modifier: '', label: '' }
  }

  return {
    modifier: level.modifier || '',
    label: t(level.labelKey),
  }
}

function statusFor(row, field) {
  const ageContext = ageContextForRow(row)
  if (field === 'bloodPressure') {
    return toStatus(
      resolveBloodPressureLevel(row?.systolic, row?.diastolic),
    )
  }
  if (field === 'heartRate') {
    return toStatus(resolveHeartRateLevel(row?.heartRate, ageContext))
  }
  if (field === 'temperature') {
    return toStatus(resolveTemperatureLevel(row?.temperature))
  }
  if (field === 'oxygenSaturation') {
    return toStatus(
      resolveOxygenSaturationLevel(row?.oxygenSaturation),
    )
  }
  if (field === 'bmi') {
    return toStatus(
      resolveBmiClassification({
        bmi: row?.bmi,
        ageContext,
        sex: props.patientGender,
      }),
    )
  }

  return { modifier: '', label: '' }
}

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
