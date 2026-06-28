<template>
  <div
    v-if="rows.length"
    class="admin-data-table__scroll staff-licenses-table__scroll">
    <AdminQTable
      class="table admin-data-table admin-data-table--embedded
        admin-data-table--inline-column-settings staff-licenses-table"
      flat
      hide-bottom
      row-key="id"
      :rows="rows"
      :columns="columns"
      :pagination="tablePagination">
    <template #body-cell-type="scope">
      <q-td
        :props="scope"
        class="admin-data-table__primary-cell">
        <span class="family-medical-history-table__ellipsis">
          {{ scope.row.type || '—' }}
        </span>
      </q-td>
    </template>

    <template #body-cell-identifier="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        <span class="family-medical-history-table__ellipsis">
          {{ scope.row.identifier || '—' }}
        </span>
      </q-td>
    </template>

    <template #body-cell-expirationDate="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        {{ scope.row.expirationDate || '—' }}
      </q-td>
    </template>

    <template #body-cell-status="scope">
      <q-td :props="scope">
        <AdminTableStatusCell
          :label="statusLabel(scope.row.status)"
          :variant="statusVariant(scope.row.status)"
        />
      </q-td>
    </template>

    <template #body-cell-isPrimary="scope">
      <q-td :props="scope">
        <AdminTableStatusCell
          v-if="scope.row.isPrimary"
          :label="t('staffLicensePrimaryShort')"
          variant="active"
        />
        <span v-else class="text-grey-7">—</span>
      </q-td>
    </template>

    <template #body-cell-attachment="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        <q-icon
          v-if="hasAttachment(scope.row)"
          name="attach_file"
          size="18px"
          color="primary"
          :title="t('staffLicenseAttachmentLabel')"
        />
        <span v-else class="text-grey-7">—</span>
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
import { adminTableActionIcons } from 'src/constants/admin-table.js'

const props = defineProps({
  licenses: {
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

const rows = computed(() => props.licenses ?? [])

const columns = computed(() => [
  {
    name: 'type',
    label: t('staffLicenseTypeLabel'),
    align: 'left',
    field: row => row.type,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'identifier',
    label: t('staffLicenseIdentifierLabel'),
    align: 'left',
    field: row => row.identifier,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'expirationDate',
    label: t('staffLicenseExpirationLabel'),
    align: 'left',
    field: row => row.expirationDate,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'status',
    label: t('staffLicenseStatusLabel'),
    align: 'left',
    field: row => row.status,
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'isPrimary',
    label: t('staffLicensePrimaryLabel'),
    align: 'left',
    field: row => row.isPrimary,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'attachment',
    label: t('staffLicenseAttachmentLabel'),
    align: 'center',
    field: row => row.attachmentFileId,
    sortable: false,
    headerStyle: 'min-width: 88px',
    style: 'min-width: 88px',
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

function statusLabel(status) {
  const value = String(status ?? '').trim()
  if (!value) {
    return '—'
  }
  if (value === 'Active') {
    return t('active')
  }
  if (value === 'Expired') {
    return t('staffLicenseStatusExpired')
  }
  if (value === 'Pending') {
    return t('pending')
  }

  return value
}

function statusVariant(status) {
  const value = String(status ?? '').trim()
  if (value === 'Active') {
    return 'active'
  }
  if (value === 'Expired') {
    return 'cancelled'
  }
  if (value === 'Pending') {
    return 'pending'
  }

  return 'other'
}

function hasAttachment(row) {
  return row?.attachmentFileId != null && row.attachmentFileId !== ''
}
</script>
