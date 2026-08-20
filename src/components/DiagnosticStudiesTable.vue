<template>
  <div
    v-if="rows.length"
    class="admin-data-table__scroll diagnostic-studies-table">
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
      <template #body-cell-studyName="scope">
        <q-td
          :props="scope"
          class="admin-data-table__primary-cell">
          {{ scope.row.studyName || '—' }}
        </q-td>
      </template>

      <template #body-cell-studyType="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          <span
            v-if="scope.row.studyType"
            class="ds-type-badge"
            :class="`ds-type-badge--${typeToken(scope.row.studyType)}`">
            {{ typeLabel(scope.row.studyType) }}
          </span>
          <span v-else>—</span>
        </q-td>
      </template>

      <template #body-cell-status="scope">
        <q-td :props="scope">
          <span
            class="ds-status-badge"
            :class="`ds-status-badge--${statusToken(
              scope.row.status,
            )}`">
            {{ statusLabel(scope.row.status) }}
          </span>
        </q-td>
      </template>

      <template #body-cell-resultStatus="scope">
        <q-td :props="scope">
          <span
            class="ds-result-status-badge"
            :class="`ds-result-status-badge--${statusToken(
              scope.row.resultStatus,
            )}`">
            {{ resultStatusLabel(scope.row.resultStatus) }}
          </span>
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
            :aria-label="t('dsActionView')"
            @click="emit('view', row)"
          >
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('dsActionView') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canEdit && canCompleteRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="task_alt"
            :size="siteBreakpoints.SM"
            :aria-label="t('dsActionComplete')"
            :data-testid="tid.rowComplete(row.id)"
            @click="emit('complete', row)"
          >
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('dsActionComplete') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canEdit && canResultRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="assignment"
            :size="siteBreakpoints.SM"
            :aria-label="t('dsActionAddResult')"
            :data-testid="tid.rowResult(row.id)"
            @click="emit('result', row)"
          >
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('dsActionAddResult') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canReview && canReviewRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="fact_check"
            :size="siteBreakpoints.SM"
            :aria-label="t('dsActionReview')"
            :data-testid="tid.rowReview(row.id)"
            @click="emit('review', row)"
          >
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('dsActionReview') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="hasDocument(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="download"
            :size="siteBreakpoints.SM"
            :aria-label="t('dsActionDownload')"
            :data-testid="tid.rowDownload(row.id)"
            @click="emit('download', row)"
          >
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('dsActionDownload') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canEdit && canCancelRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="cancel"
            :size="siteBreakpoints.SM"
            :aria-label="t('dsActionCancel')"
            :data-testid="tid.rowCancel(row.id)"
            @click="emit('cancel-study', row)"
          >
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('dsActionCancel') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canDelete"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="delete"
            :size="siteBreakpoints.SM"
            :aria-label="t('dsActionDelete')"
            :data-testid="tid.rowDelete(row.id)"
            @click="emit('delete-study', row)"
          >
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('dsActionDelete') }}
            </q-tooltip>
          </q-btn>
        </div>
      </template>
    </AdminQTable>
  </div>

  <div
    v-else
    class="admin-data-table__empty full-width column
      flex-center text-grey-7 q-gutter-sm q-pa-lg">
    <q-icon name="inbox" size="md" />
    <span class="text-body1">{{ emptyLabel }}</span>
    <span
      v-if="emptyHint"
      class="text-body2 text-grey-7">
      {{ emptyHint }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminQTable from 'components/AdminQTable.vue'
import { siteBreakpoints } from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { useAdminTableMobileGrid } from
  'src/composables/useAdminTableMobileGrid.js'
import { diagnosticStudyTestIds as tid } from
  'src/test-ids/index.js'
import { diagnosticStudyI18nKey } from
  'src/utils/diagnostic-study-i18n.js'
import {
  canAddDiagnosticStudyResult,
  canCancelDiagnosticStudy,
  canMarkDiagnosticStudyCompleted,
  canReviewDiagnosticStudy,
  hasSourceDocument,
  sortDiagnosticStudiesDesc,
} from 'src/utils/diagnostic-study-orders.js'

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
  canReview: {
    type: Boolean,
    default: false,
  },
  canDelete: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'view',
  'complete',
  'result',
  'review',
  'download',
  'cancel-study',
  'delete-study',
])

const { t } = useI18n()
const { showGrid } = useAdminTableMobileGrid()
const tablePagination = { rowsPerPage: 0 }

const rows = computed(() =>
  sortDiagnosticStudiesDesc(props.rows ?? []),
)

const mobileCardLayout = {
  title: 'studyName',
  status: 'status',
  subtitle: null,
  contact: null,
  identifier: null,
  badges: [
    'studyType',
    'orderedDate',
    'studyDate',
    'resultStatus',
  ],
  hideEmpty: true,
}

function typeToken(value) {
  return String(value ?? '').toLowerCase()
}

function statusToken(value) {
  return String(value ?? '').toLowerCase()
}

function typeLabel(value) {
  const key = diagnosticStudyI18nKey('dsType', value)
  return t(key) === key ? value : t(key)
}

function statusLabel(value) {
  const key = diagnosticStudyI18nKey('dsStatus', value)
  return t(key) === key ? value : t(key)
}

function resultStatusLabel(value) {
  const key = diagnosticStudyI18nKey('dsResultStatus', value)
  return t(key) === key ? value : t(key)
}

function canCompleteRow(row) {
  return canMarkDiagnosticStudyCompleted(row)
}

function canResultRow(row) {
  return canAddDiagnosticStudyResult(row)
}

function canReviewRow(row) {
  return canReviewDiagnosticStudy(row)
}

function canCancelRow(row) {
  return canCancelDiagnosticStudy(row)
}

function hasDocument(row) {
  return hasSourceDocument(row)
}

const columns = computed(() => [
  {
    name: 'studyName',
    label: t('dsColStudy'),
    align: 'left',
    field: row => row.studyName,
    sortable: false,
    headerStyle: 'min-width: 180px',
    style: 'min-width: 180px',
  },
  {
    name: 'studyType',
    label: t('dsColType'),
    align: 'left',
    field: row => row.studyType,
    sortable: false,
  },
  {
    name: 'orderedDate',
    label: t('dsColOrderedDate'),
    align: 'left',
    field: row => row.orderedDate || '—',
    sortable: false,
  },
  {
    name: 'studyDate',
    label: t('dsColStudyDate'),
    align: 'left',
    field: row => row.studyDate || '—',
    sortable: false,
  },
  {
    name: 'status',
    label: t('dsColStatus'),
    align: 'left',
    field: row => row.status,
    sortable: false,
  },
  {
    name: 'resultStatus',
    label: t('dsColResultStatus'),
    align: 'left',
    field: row => row.resultStatus,
    sortable: false,
  },
  {
    name: 'actions',
    label: t('actions'),
    align: 'right',
    field: 'actions',
    sortable: false,
  },
])
</script>

<style lang="scss" scoped>
.ds-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
}

.ds-type-badge--ultrasound {
  background: #ede9fe;
  color: #5b21b6;
}

.ds-type-badge--mammography {
  background: #fce7f3;
  color: #9d174d;
}

.ds-type-badge--x_ray {
  background: #dbeafe;
  color: #1d4ed8;
}

.ds-type-badge--ct {
  background: #ccfbf1;
  color: #0f766e;
}

.ds-type-badge--mri {
  background: #e0e7ff;
  color: #3730a3;
}

.ds-type-badge--other {
  background: #f1f5f9;
  color: #475569;
}

.ds-status-badge,
.ds-result-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
}

.ds-status-badge--ordered {
  background: #e0f2fe;
  color: #0369a1;
}

.ds-status-badge--completed {
  background: #dcfce7;
  color: #166534;
}

.ds-status-badge--cancelled {
  background: #fee2e2;
  color: #b91c1c;
}

.ds-result-status-badge--pending {
  background: #f3f4f6;
  color: #6b7280;
}

.ds-result-status-badge--available {
  background: #fef3c7;
  color: #b45309;
}

.ds-result-status-badge--reviewed {
  background: #dbeafe;
  color: #1d4ed8;
}
</style>
