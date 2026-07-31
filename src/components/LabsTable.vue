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
      <template #body-cell-testName="scope">
        <q-td
          :props="scope"
          class="admin-data-table__primary-cell">
          {{ scope.row.testName || '—' }}
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

      <template #body-cell-abnormal="scope">
        <q-td :props="scope">
          <span
            class="lab-abnormal-badge"
            :class="scope.row.abnormalResult
              ? 'lab-abnormal-badge--yes'
              : 'lab-abnormal-badge--no'">
            {{ scope.row.abnormalResult ? t('yes') : t('no') }}
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
            :title="t('labActionView')"
            :aria-label="t('labActionView')"
            @click="emit('view', row)"
          />
          <q-btn
            v-if="canEdit"
            flat
            round
            dense
            class="app-btn-icon-action"
            :icon="adminTableActionIcons.edit"
            :data-testid="tid.rowEdit(row.id)"
            :size="siteBreakpoints.SM"
            :title="t('edit')"
            :aria-label="t('edit')"
            @click="emit('edit', row)"
          />
          <q-btn
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="download"
            :data-testid="tid.rowDownload(row.id)"
            :size="siteBreakpoints.SM"
            :title="t('labActionDownload')"
            :aria-label="t('labActionDownload')"
            @click="emit('download', row)"
          />
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
import { siteBreakpoints } from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { labTestIds as tid } from 'src/test-ids/index.js'
import { labI18nKey } from 'src/utils/lab-i18n.js'

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
  canDelete: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['view', 'edit', 'download'])

const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const rows = computed(() => props.rows ?? [])

const columns = computed(() => [
  {
    name: 'testName',
    label: t('labColTestName'),
    align: 'left',
    field: row => row.testName,
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
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
    name: 'abnormal',
    label: t('labColAbnormal'),
    align: 'left',
    field: row => row.abnormalResult,
    sortable: false,
    headerStyle: 'min-width: 96px',
    style: 'min-width: 96px',
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
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.lab-category-badge,
.lab-status-badge,
.lab-abnormal-badge {
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

.lab-status-badge--draft {
  background: #f1f5f9;
  color: $text-muted;
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

.lab-abnormal-badge--yes {
  background: #fee2e2;
  color: #b91c1c;
}

.lab-abnormal-badge--no {
  background: #dcfce7;
  color: #166534;
}
</style>
