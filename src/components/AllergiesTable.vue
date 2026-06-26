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
    :pagination="tablePagination"
    :table-row-class-fn="allergyRowClassFn"
    :card-class-fn="allergyRowCardClass">
    <template #body-cell-allergy="scope">
      <q-td
        :props="scope"
        class="admin-data-table__primary-cell">
        <span class="allergies-table__ellipsis">
          {{ scope.row.allergy || '—' }}
        </span>
      </q-td>
    </template>

    <template #body-cell-severity="scope">
      <q-td :props="scope">
        <span
          :class="[
            'allergy-severity-badge',
            severityBadgeClass(scope.row),
          ]">
          <span
            :class="[
              'allergy-severity-dot',
              severityDotClass(scope.row),
            ]"
          />
          {{ severityLabel(scope.row) }}
        </span>
      </q-td>
    </template>

    <template #body-cell-startYear="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        {{ formatStartYear(scope.row.startYear) }}
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
          :data-testid="tid.allergyRowEdit(row.id)"
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
          :data-testid="tid.allergyRowDelete(row.id)"
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
import { addClientTestIds as tid } from 'src/test-ids/index.js'
import {
  clientListAllergySeverityBadgeClass,
  resolveClientListAllergySeverityLabel,
  resolveClientListAllergySeverityModifier,
} from 'src/utils/client-list-allergy-severity.js'

const props = defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
  canEdit: {
    type: Boolean,
    default: true,
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  invalidRowIds: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['edit', 'delete'])

const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const rows = computed(() => props.entries ?? [])

const invalidRowIdSet = computed(
  () => new Set(props.invalidRowIds ?? []),
)

const columns = computed(() => [
  {
    name: 'allergy',
    label: t('allergyName'),
    align: 'left',
    field: row => row.allergy,
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
  },
  {
    name: 'severity',
    label: t('allergySeverity'),
    align: 'left',
    field: row => row.severity,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'startYear',
    label: t('allergyStartYear'),
    align: 'left',
    field: row => row.startYear,
    sortable: false,
    headerStyle: 'min-width: 100px',
    style: 'min-width: 100px',
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

function formatStartYear(year) {
  if (year == null || year === '') {
    return '—'
  }

  return String(year)
}

function severityModifier(row) {
  return resolveClientListAllergySeverityModifier(row?.severity)
}

function severityLabel(row) {
  return resolveClientListAllergySeverityLabel(
    row?.severity,
    severityModifier(row),
  ) || '—'
}

function severityBadgeClass(row) {
  return clientListAllergySeverityBadgeClass(severityModifier(row))
}

function severityDotClass(row) {
  const modifier = severityModifier(row) ?? 'mild'

  return `allergy-severity-dot--${modifier}`
}

function allergyRowClassFn(row) {
  return invalidRowIdSet.value.has(row.id)
    ? 'allergies-table__row--error'
    : ''
}

function allergyRowCardClass(row) {
  return allergyRowClassFn(row)
}
</script>
