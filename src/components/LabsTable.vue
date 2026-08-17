<template>
  <div
    v-if="rows.length"
    class="admin-data-table__scroll labs-table">
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
      :card-layout="mobileCardLayout"
      :table-row-class-fn="labRowClassFn">
      <template #body-cell-testName="scope">
        <q-td
          :props="scope"
          class="admin-data-table__primary-cell">
          <div class="labs-table__name-row row items-center no-wrap">
            <span
              v-if="priorityAlertToken(scope.row)"
              class="labs-priority-badge"
              :class="`labs-priority-badge--${
                priorityAlertToken(scope.row)
              }`">
              {{ priorityLabel(scope.row.priority) }}
            </span>
            <span class="labs-table__name">
              {{ scope.row.testName || '—' }}
            </span>
          </div>
        </q-td>
      </template>

      <template #body-cell-category="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          <span
            v-if="scope.row.category"
            class="lab-category-badge"
            :class="`lab-category-badge--${String(scope.row.category)
              .toLowerCase()}`">
            {{ categoryLabel(scope.row.category) }}
          </span>
          <span v-else>—</span>
        </q-td>
      </template>

      <template #body-cell-orderedDate="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.orderedDate || '—' }}
        </q-td>
      </template>

      <template #body-cell-collectedDate="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.collectedDate || '—' }}
        </q-td>
      </template>

      <template #body-cell-resultDate="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.resultDate || '—' }}
        </q-td>
      </template>

      <template #body-cell-status="scope">
        <q-td :props="scope">
          <span
            class="lab-status-badge"
            :class="`lab-status-badge--${String(scope.row.status ?? '')
              .toLowerCase()}`">
            {{ statusLabel(scope.row.status) }}
          </span>
        </q-td>
      </template>

      <template #body-cell-resultStatus="scope">
        <q-td :props="scope">
          <span
            class="lab-result-status-badge"
            :class="`lab-result-status-badge--${
              resultStatus(scope.row)
            }`">
            <q-icon
              :name="resultStatusIcon(scope.row)"
              size="14px"
              class="q-mr-xs"
            />
            {{ resultStatusLabel(scope.row) }}
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
            :aria-label="t('labActionView')"
            @click="emit('view', row)"
          >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('labActionView') }}
          </q-tooltip>
        </q-btn>
          <q-btn
            v-if="canEdit && canCollectRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="science"
            :size="siteBreakpoints.SM"
            :aria-label="t('labActionCollect')"
            :data-testid="tid.rowCollect(row.id)"
            @click="emit('collect', row)"
          >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('labActionCollect') }}
          </q-tooltip>
        </q-btn>
          <q-btn
            v-if="canEdit && canResultsRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="assignment_turned_in"
            :size="siteBreakpoints.SM"
            :aria-label="t('labActionEnterResults')"
            :data-testid="tid.rowResults(row.id)"
            @click="emit('results', row)"
          >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('labActionEnterResults') }}
          </q-tooltip>
        </q-btn>
          <q-btn
            v-if="canReview && canReviewRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="rate_review"
            :size="siteBreakpoints.SM"
            :aria-label="t('labActionReview')"
            :data-testid="tid.rowReview(row.id)"
            @click="emit('review', row)"
          >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('labActionReview') }}
          </q-tooltip>
        </q-btn>
          <q-btn
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="download"
            :disable="!rowHasAttachments(row)"
            :data-testid="tid.rowDownload(row.id)"
            :size="siteBreakpoints.SM"
            :aria-label="t('labActionDownload')"
            @click="emit('download', row)"
          >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{
              rowHasAttachments(row)
                ? t('labActionDownload')
                : t('labNoAttachment')
            }}
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
            :aria-label="t('labCancelLab')"
            :data-testid="tid.rowCancel(row.id)"
            @click="emit('cancel-lab', row)"
          >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('labCancelLab') }}
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
import {
  labPriorities,
  siteBreakpoints,
} from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { useAdminTableMobileGrid } from
  'src/composables/useAdminTableMobileGrid.js'
import { labTestIds as tid } from 'src/test-ids/index.js'
import { labI18nKey } from 'src/utils/lab-i18n.js'
import {
  canAdvanceLabToCollect,
  canAdvanceLabToResults,
  canAdvanceLabToReview,
  canCancelLab,
  hasLabAttachments,
  labResultStatusValues,
  resolveLabResultStatus,
  sortLabsByOrderedDateDesc,
} from 'src/utils/lab-orders.js'

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
    default: true,
  },
  canReview: {
    type: Boolean,
    default: false,
  },
  canDelete: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits([
  'view',
  'download',
  'collect',
  'results',
  'review',
  'cancel-lab',
])

const { t } = useI18n()
const { showGrid } = useAdminTableMobileGrid()

const tablePagination = { rowsPerPage: 0 }

const rows = computed(() => sortLabsByOrderedDateDesc(props.rows ?? []))

/** Same compact card hierarchy as Vitals / Insurance (mobile). */
const mobileCardLayout = {
  title: 'testName',
  status: 'status',
  subtitle: null,
  contact: null,
  identifier: null,
  badges: [
    'category',
    'orderedDate',
    'collectedDate',
    'resultDate',
    'resultStatus',
  ],
  hideEmpty: true,
}

function canCollectRow(row) {
  return canAdvanceLabToCollect(row?.status)
}

function canResultsRow(row) {
  return canAdvanceLabToResults(row?.status)
}

function canReviewRow(row) {
  return canAdvanceLabToReview(row?.status)
}

function canCancelRow(row) {
  return canCancelLab(row?.status)
}

function rowHasAttachments(row) {
  return hasLabAttachments(row)
}

const columns = computed(() => [
  {
    name: 'testName',
    label: t('labColTestName'),
    align: 'left',
    field: row => row.testName,
    sortable: false,
    headerStyle: 'min-width: 180px',
    style: 'min-width: 180px',
  },
  {
    name: 'category',
    label: t('labColCategory'),
    align: 'left',
    field: row => row.category,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'orderedDate',
    label: t('labColOrderedDate'),
    align: 'left',
    field: row => row.orderedDate,
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'collectedDate',
    label: t('labColCollectedDate'),
    align: 'left',
    field: row => row.collectedDate,
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'resultDate',
    label: t('labColResultDate'),
    align: 'left',
    field: row => row.resultDate,
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
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
    name: 'resultStatus',
    label: t('labColResultStatus'),
    align: 'left',
    field: row => resolveLabResultStatus(row),
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
    headerStyle: 'min-width: 132px',
    style: 'min-width: 132px',
  },
])

function statusLabel(status) {
  const key = labI18nKey('labStatus', status)
  const translated = t(key)
  if (translated !== key) {
    return translated
  }

  return status || '—'
}

function categoryLabel(category) {
  const key = labI18nKey('labCategory', category)
  const translated = t(key)
  if (translated !== key) {
    return translated
  }

  return category || '—'
}

function priorityToken(priority) {
  return String(priority ?? '').trim().toUpperCase()
}

function priorityAlertToken(row) {
  const token = priorityToken(row?.priority)
  if (token === labPriorities.stat) {
    return 'stat'
  }
  if (token === labPriorities.urgent) {
    return 'urgent'
  }

  return ''
}

function priorityLabel(priority) {
  const key = labI18nKey('labPriority', priority)
  const translated = t(key)
  if (translated !== key) {
    return translated
  }

  return priority || ''
}

function labRowClassFn(row) {
  const alert = priorityAlertToken(row)
  if (!alert) {
    return ''
  }

  return `labs-table__row labs-table__row--${alert}`
}

function resultStatus(row) {
  return resolveLabResultStatus(row)
}

function resultStatusLabel(row) {
  const status = resultStatus(row)
  const suffix = status.charAt(0).toUpperCase() + status.slice(1)
  const key = `labResultStatus${suffix}`
  const translated = t(key)

  return translated !== key ? translated : status
}

function resultStatusIcon(row) {
  const status = resultStatus(row)
  if (status === labResultStatusValues.normal) {
    return 'check_circle'
  }
  if (status === labResultStatusValues.abnormal) {
    return 'error'
  }

  return 'schedule'
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.labs-table {
  :deep(.labs-table__row--stat > td:first-child) {
    box-shadow: inset 4px 0 0 #dc2626;
  }

  :deep(.labs-table__row--urgent > td:first-child) {
    box-shadow: inset 4px 0 0 #ea580c;
  }
}

.labs-table__name-row {
  gap: 8px;
  min-width: 0;
}

.labs-table__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.labs-priority-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.2;
  text-transform: uppercase;
}

.labs-priority-badge--stat {
  background: #fee2e2;
  color: #b91c1c;
}

.labs-priority-badge--urgent {
  background: #ffedd5;
  color: #c2410c;
}

.lab-category-badge,
.lab-status-badge,
.lab-result-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
}

.lab-category-badge--blood_test {
  background: #ede9fe;
  color: #5b21b6;
}

.lab-category-badge--urine_test {
  background: #dbeafe;
  color: #1d4ed8;
}

.lab-category-badge--imaging {
  background: #ffedd5;
  color: #c2410c;
}

.lab-category-badge--microbiology {
  background: #ccfbf1;
  color: #0f766e;
}

.lab-category-badge--pathology {
  background: #fce7f3;
  color: #9d174d;
}

.lab-category-badge--genetic {
  background: #e0e7ff;
  color: #3730a3;
}

.lab-category-badge--other {
  background: #f1f5f9;
  color: #475569;
}

.lab-status-badge--ordered {
  background: #e0f2fe;
  color: #0369a1;
}

.lab-status-badge--collected {
  background: #fef3c7;
  color: #b45309;
}

.lab-status-badge--resulted {
  background: #dcfce7;
  color: #166534;
}

.lab-status-badge--reviewed {
  background: #dbeafe;
  color: #1d4ed8;
}

.lab-status-badge--cancelled {
  background: #fee2e2;
  color: #b91c1c;
}

.lab-result-status-badge--pending {
  background: #f3f4f6;
  color: #6b7280;
}

.lab-result-status-badge--normal {
  background: #dcfce7;
  color: #166534;
}

.lab-result-status-badge--abnormal {
  background: #fee2e2;
  color: #b91c1c;
}
</style>
