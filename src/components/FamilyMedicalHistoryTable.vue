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
    <template #body-cell-familyRelationship="scope">
      <q-td
        :props="scope"
        class="admin-data-table__primary-cell">
        <span class="family-medical-history-table__ellipsis">
          {{ scope.row.familyRelationship || '—' }}
        </span>
      </q-td>
    </template>

    <template #body-cell-medicalConditions="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell
          family-medical-history-table__conditions">
        <span class="family-medical-history-table__ellipsis">
          {{ scope.row.medicalConditions || '—' }}
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
          :data-testid="tid.fmhRowEdit(row.id)"
          :size="siteBreakpoints.SM"
          :title="t('edit')"
          :aria-label="t('edit')"
          @click="emit('edit', row)"
        />
        <q-btn
          v-if="canDelete"
          flat
          round
          dense
          class="app-btn-icon-action"
          icon="delete"
          :data-testid="tid.fmhRowDelete(row.id)"
          :size="siteBreakpoints.SM"
          :title="t('delete')"
          :aria-label="t('delete')"
          @click="emit('delete', row)"
        />
        <span
          v-if="!canEdit && !canDelete"
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

const props = defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: '',
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

const emit = defineEmits(['edit', 'delete'])

const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const rows = computed(() => props.entries ?? [])

const columns = computed(() => [
  {
    name: 'familyRelationship',
    label: t('fmhColRelationship'),
    align: 'left',
    field: row => row.familyRelationship,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'medicalConditions',
    label: t('fmhColConditions'),
    align: 'left',
    field: row => row.medicalConditions,
    sortable: false,
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
</script>
