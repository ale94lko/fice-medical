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
      <template #body-cell-componentName="scope">
        <q-td
          :props="scope"
          class="admin-data-table__primary-cell">
          {{ scope.row.componentName || '—' }}
        </q-td>
      </template>

      <template #body-cell-value="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.value ?? '—' }}
        </q-td>
      </template>

      <template #body-cell-unit="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.unit || '—' }}
        </q-td>
      </template>

      <template #body-cell-referenceRange="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{
            formatReferenceRange(
              scope.row.referenceRangeLow,
              scope.row.referenceRangeHigh,
              scope.row.unit,
            )
          }}
        </q-td>
      </template>

      <template #body-cell-flag="scope">
        <q-td :props="scope">
          <span
            v-if="scope.row.flag"
            class="lab-components-table__flag"
            :class="`lab-components-table__flag--${String(scope.row.flag ?? '')
              .toLowerCase()}`">
            {{ flagLabel(scope.row.flag) }}
          </span>
          <span v-else class="text-grey-6">—</span>
        </q-td>
      </template>

      <template #row-actions="{ row }">
        <div class="admin-table-row-actions">
          <q-btn
            v-if="canView"
            flat
            round
            dense
            class="app-btn-icon-action"
            :icon="adminTableActionIcons.view"
            :size="siteBreakpoints.SM"
            :aria-label="t('labActionView')"
            :data-testid="tid.componentRowView(row.id)"
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
            v-if="canEdit"
            flat
            round
            dense
            class="app-btn-icon-action"
            :icon="adminTableActionIcons.edit"
            :size="siteBreakpoints.SM"
            :aria-label="t('edit')"
            :data-testid="tid.componentRowEdit(row.id)"
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
            v-if="canDelete"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="delete"
            :size="siteBreakpoints.SM"
            :aria-label="t('delete')"
            :data-testid="tid.componentRowDelete(row.id)"
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
    <span>{{ emptyLabel }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminQTable from 'components/AdminQTable.vue'
import { siteBreakpoints } from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { formatReferenceRange } from 'src/utils/lab-orders.js'
import { labI18nKey } from 'src/utils/lab-i18n.js'
import { labTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  canView: {
    type: Boolean,
    default: true,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
  canDelete: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['view', 'edit', 'delete'])

const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const rows = computed(() => props.rows ?? [])

const columns = computed(() => {
  const cols = [
    {
      name: 'componentName',
      label: t('labColComponent'),
      align: 'left',
      field: row => row.componentName,
      sortable: false,
      headerStyle: 'min-width: 140px',
      style: 'min-width: 140px',
    },
    {
      name: 'value',
      label: t('labComponentValue'),
      align: 'left',
      field: row => row.value,
      sortable: false,
      headerStyle: 'min-width: 80px',
      style: 'min-width: 80px',
    },
    {
      name: 'unit',
      label: t('labComponentUnit'),
      align: 'left',
      field: row => row.unit,
      sortable: false,
      headerStyle: 'min-width: 72px',
      style: 'min-width: 72px',
    },
    {
      name: 'referenceRange',
      label: t('labColReferenceRange'),
      align: 'left',
      field: row => row.referenceRangeLow,
      sortable: false,
      headerStyle: 'min-width: 120px',
      style: 'min-width: 120px',
    },
    {
      name: 'flag',
      label: t('labComponentFlag'),
      align: 'left',
      field: row => row.flag,
      sortable: false,
      headerStyle: 'min-width: 100px',
      style: 'min-width: 100px',
    },
  ]
  if (props.canView || props.canEdit || props.canDelete) {
    cols.push({
      name: 'actions',
      label: t('actions'),
      align: 'center',
      field: row => row.id,
      sortable: false,
      required: true,
      headerStyle: 'min-width: 132px',
      style: 'min-width: 132px',
    })
  }

  return cols
})

function flagLabel(flag) {
  const key = labI18nKey('labFlag', flag)
  const translated = t(key)

  return translated !== key ? translated : flag
}
</script>

<style lang="scss" scoped>
.lab-components-table__flag {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;

  &--normal {
    background: #dcfce7;
    color: #166534;
  }

  &--high,
  &--critical_high,
  &--abnormal {
    background: #fee2e2;
    color: #b91c1c;
  }

  &--low,
  &--critical_low {
    background: #fef3c7;
    color: #b45309;
  }
}
</style>
