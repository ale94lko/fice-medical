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
      <template #body-cell-started="scope">
        <q-td
          :props="scope"
          class="admin-data-table__primary-cell">
          <span
            v-if="startedDate(scope.row) || startedTime(scope.row)"
            class="client-encounters-table__started">
            <span
              v-if="startedDate(scope.row)"
              class="client-encounters-table__date">
              {{ startedDate(scope.row) }}
            </span>
            <template v-if="startedDate(scope.row) && startedTime(scope.row)">
              <span class="text-grey-7"> · </span>
            </template>
            <span
              v-if="startedTime(scope.row)"
              class="client-encounters-table__time text-grey-7">
              {{ startedTime(scope.row) }}
            </span>
          </span>
          <span v-else>—</span>
        </q-td>
      </template>

      <template #body-cell-type="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ typeLabel(scope.row.encounterType) }}
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

      <template #body-cell-clinician="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.clinicianDisplayName || '—' }}
        </q-td>
      </template>

      <template #body-cell-complaint="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          <span class="client-encounters-table__ellipsis">
            {{ complaintLabel(scope.row) }}
            <q-tooltip
              v-if="complaintTooltip(scope.row)"
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ complaintTooltip(scope.row) }}
            </q-tooltip>
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
            icon="open_in_new"
            :size="siteBreakpoints.SM"
            :aria-label="t('encounterOpenWorkspace')"
            :data-testid="tid.field(`open-${row.id}`)"
            @click="emit('open', row)">
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('encounterOpenWorkspace') }}
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
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import {
  encounterStatuses,
  encounterTypes,
  siteBreakpoints,
} from 'components/constants.js'
import {
  formatUtcDateLong,
  formatUtcTime,
} from 'src/utils/appointment-datetime.js'
import { encounterTestIds as tid } from 'src/test-ids/index.js'

const COMPLAINT_MAX = 60

defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['open'])
const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const columns = computed(() => [
  {
    name: 'started',
    label: t('encounterColumnStarted'),
    align: 'left',
    field: row => row.startedAtUtc,
    sortable: false,
  },
  {
    name: 'type',
    label: t('encounterColumnType'),
    align: 'left',
    field: row => row.encounterType,
    sortable: false,
  },
  {
    name: 'status',
    label: t('encounterColumnStatus'),
    align: 'left',
    field: row => row.status,
    sortable: false,
  },
  {
    name: 'clinician',
    label: t('encounterColumnClinician'),
    align: 'left',
    field: row => row.clinicianDisplayName,
    sortable: false,
  },
  {
    name: 'complaint',
    label: t('encounterColumnComplaint'),
    align: 'left',
    field: row => row.chiefComplaint,
    sortable: false,
  },
  {
    name: 'actions',
    label: t('actions'),
    align: 'right',
    field: () => '',
    sortable: false,
  },
])

function formatDate(iso) {
  return formatUtcDateLong(iso)
}

function formatTime(iso) {
  return formatUtcTime(iso)
}

function startedDate(row) {
  return formatDate(row?.startedAtUtc) || ''
}

function startedTime(row) {
  return formatTime(row?.startedAtUtc) || ''
}

function typeLabel(type) {
  switch (String(type ?? '').toUpperCase()) {
    case encounterTypes.phone:
      return t('encounterTypePhone')
    case encounterTypes.telehealth:
      return t('encounterTypeTelehealth')
    case encounterTypes.scheduled:
      return t('encounterTypeScheduled')
    case encounterTypes.walkIn:
    default:
      return t('encounterTypeWalkIn')
  }
}

function statusLabel(status) {
  const token = String(status ?? '').toUpperCase()
  if (token === encounterStatuses.inProgress) {
    return t('encounterStatusInProgress')
  }
  if (token === encounterStatuses.waitingForResults) {
    return t('encounterStatusWaitingForResults')
  }
  if (token === encounterStatuses.readyToResume) {
    return t('encounterStatusReadyToResume')
  }
  if (token === encounterStatuses.completed) {
    return t('encounterStatusCompleted')
  }
  if (token === encounterStatuses.cancelled) {
    return t('encounterStatusCancelled')
  }

  return token || '—'
}

function statusVariant(status) {
  const token = String(status ?? '').toUpperCase()
  if (token === encounterStatuses.inProgress) {
    return 'active'
  }
  if (token === encounterStatuses.waitingForResults) {
    return 'other'
  }
  if (token === encounterStatuses.readyToResume) {
    return 'active'
  }
  if (token === encounterStatuses.completed) {
    return 'completed'
  }
  if (token === encounterStatuses.cancelled) {
    return 'inactive'
  }

  return 'other'
}

function fullComplaint(row) {
  return String(row?.chiefComplaint || row?.notes || '').trim()
}

function complaintLabel(row) {
  const text = fullComplaint(row)
  if (!text) {
    return '—'
  }
  if (text.length <= COMPLAINT_MAX) {
    return text
  }

  return `${text.slice(0, COMPLAINT_MAX)}...`
}

function complaintTooltip(row) {
  const text = fullComplaint(row)

  return text.length > COMPLAINT_MAX ? text : ''
}
</script>

<style lang="scss" scoped>
.client-encounters-table__started {
  line-height: 1.3;
  white-space: nowrap;
}

.client-encounters-table__date {
  font-weight: 600;
}

.client-encounters-table__time {
  font-weight: 400;
}

.client-encounters-table__ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
</style>
