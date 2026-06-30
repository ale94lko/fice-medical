<template>
  <div
    v-if="rows.length"
    class="admin-data-table__scroll">
    <AdminQTable
      class="table admin-data-table admin-data-table--embedded
        admin-data-table--inline-column-settings"
      flat
      hide-bottom
      row-key="appointmentId"
      :rows="rows"
      :columns="columns"
      :pagination="tablePagination">
    <template #body-cell-dateTime="scope">
      <q-td
        :props="scope"
        class="admin-data-table__primary-cell">
        <div class="appointments-table__datetime">
          <span class="appointments-table__datetime-date">
            {{ formatDate(scope.row.startAtUtc) }}
          </span>
          <span class="appointments-table__datetime-time">
            {{ formatTimeRange(
              scope.row.startAtUtc,
              scope.row.endAtUtc,
            ) }}
          </span>
        </div>
      </q-td>
    </template>

    <template #body-cell-appointmentNumber="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        {{ scope.row.appointmentNumber || '—' }}
      </q-td>
    </template>

    <template #body-cell-appointmentType="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        <span class="appointments-table__ellipsis">
          {{ scope.row.servicesLabel || scope.row.appointmentTypeName || '—' }}
        </span>
      </q-td>
    </template>

    <template #body-cell-clinician="scope">
      <q-td :props="scope">
        <AdminTableClinicianAvatars
          v-if="clinicianEntries(scope.row).length"
          :entries="clinicianEntries(scope.row)"
        />
        <span v-else>—</span>
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

    <template #body-cell-placeOfService="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        {{ scope.row.placeOfServiceName || '—' }}
      </q-td>
    </template>

    <template #row-actions="{ row }">
      <div class="admin-table-row-actions">
        <q-btn
          v-for="action in actionButtons(row)"
          :key="action.key"
          flat
          round
          dense
          class="app-btn-icon-action"
          :icon="action.icon"
          :data-testid="action.testId"
          :size="siteBreakpoints.SM"
          :title="t(action.labelKey)"
          :aria-label="t(action.labelKey)"
          @click="emit(action.event, row)"
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
import AdminTableClinicianAvatars from
  'components/admin-table/AdminTableClinicianAvatars.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import { appointmentStatuses, siteBreakpoints } from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import {
  appointmentCanCancel,
  appointmentCanCheckIn,
  appointmentCanComplete,
  appointmentCanEdit,
  appointmentCanNoShow,
  appointmentCanReschedule,
} from 'src/utils/appointment-actions.js'
import {
  formatUtcDateLong,
  formatUtcTimeRange,
} from 'src/utils/appointment-datetime.js'
import { clinicianInitialsFromPersonName } from
  'src/utils/clinician-display.js'
import { appointmentTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  permissions: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits([
  'view',
  'edit',
  'cancel',
  'reschedule',
  'check-in',
  'complete',
  'no-show',
])

const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const columns = computed(() => [
  {
    name: 'dateTime',
    label: t('appointmentColDateTime'),
    align: 'left',
    field: row => row.startAtUtc,
    sortable: false,
    headerStyle: 'min-width: 130px',
    style: 'min-width: 130px',
  },
  {
    name: 'appointmentNumber',
    label: t('appointmentColNumber'),
    align: 'left',
    field: row => row.appointmentNumber,
    sortable: false,
    headerStyle: 'min-width: 100px',
    style: 'min-width: 100px',
  },
  {
    name: 'appointmentType',
    label: t('appointmentColServices'),
    align: 'left',
    field: row => row.servicesLabel || row.appointmentTypeName,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'clinician',
    label: t('appointmentColClinician'),
    align: 'left',
    field: row => row.clinicianDisplayName,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
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
    name: 'placeOfService',
    label: t('appointmentColPlaceOfService'),
    align: 'left',
    field: row => row.placeOfServiceName,
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'actions',
    label: t('actions'),
    align: 'center',
    field: row => row.appointmentId,
    sortable: false,
    required: true,
    headerStyle: 'min-width: 200px; width: 200px',
    style: 'min-width: 200px; width: 200px',
  },
])

function formatDate(iso) {
  return formatUtcDateLong(iso)
}

function formatTimeRange(start, end) {
  return formatUtcTimeRange(start, end)
}

function statusLabel(status) {
  const key = `appointmentStatus${String(status ?? '')
    .split('_')
    .map(part => part.charAt(0) + part.slice(1).toLowerCase())
    .join('')}`

  return t(key)
}

function statusVariant(status) {
  const token = String(status ?? '').toUpperCase()
  if (token === appointmentStatuses.pending) {
    return 'pending'
  }
  if (token === appointmentStatuses.confirmed) {
    return 'active'
  }
  if (token === appointmentStatuses.checkedIn) {
    return 'completed'
  }
  if (token === appointmentStatuses.completed) {
    return 'completed'
  }
  if (token === appointmentStatuses.cancelled) {
    return 'cancelled'
  }
  if (token === appointmentStatuses.noShow) {
    return 'inactive'
  }
  if (token === appointmentStatuses.rescheduled) {
    return 'other'
  }

  return 'other'
}

function clinicianEntries(row) {
  const name = String(row?.clinicianDisplayName ?? '').trim()
  if (!name) {
    return []
  }

  const parts = name.split(' - ')

  return [{
    id: row.clinicianId ?? null,
    name,
    personName: parts[0]?.trim() || name,
    specialty: parts.length > 1
      ? parts.slice(1).join(' - ').trim()
      : '',
    initials: clinicianInitialsFromPersonName(name),
  }]
}

function actionsFor(row) {
  const status = row.status
  const p = props.permissions ?? {}

  return {
    view: p.canView !== false,
    edit: p.canBook && appointmentCanEdit(status),
    cancel: p.canCancel && appointmentCanCancel(status),
    reschedule: p.canReschedule && appointmentCanReschedule(status),
    checkIn: p.canManage && appointmentCanCheckIn(status),
    complete: p.canManage && appointmentCanComplete(status),
    noShow: p.canManage && appointmentCanNoShow(status),
  }
}

function actionButtons(row) {
  const available = actionsFor(row)
  const id = row.appointmentId
  const catalog = [
    {
      key: 'view',
      icon: adminTableActionIcons.view,
      labelKey: 'appointmentActionView',
      event: 'view',
      testId: tid.rowView(id),
    },
    {
      key: 'edit',
      icon: adminTableActionIcons.edit,
      labelKey: 'edit',
      event: 'edit',
      testId: tid.rowEdit(id),
    },
    {
      key: 'reschedule',
      icon: 'event',
      labelKey: 'appointmentActionReschedule',
      event: 'reschedule',
      testId: tid.rowReschedule(id),
    },
    {
      key: 'cancel',
      icon: 'close',
      labelKey: 'appointmentActionCancel',
      event: 'cancel',
      testId: tid.rowCancel(id),
    },
    {
      key: 'checkIn',
      icon: 'how_to_reg',
      labelKey: 'appointmentActionCheckIn',
      event: 'check-in',
      testId: tid.rowCheckIn(id),
    },
    {
      key: 'complete',
      icon: 'task_alt',
      labelKey: 'appointmentActionComplete',
      event: 'complete',
      testId: tid.rowComplete(id),
    },
    {
      key: 'noShow',
      icon: 'schedule',
      labelKey: 'appointmentActionNoShow',
      event: 'no-show',
      testId: tid.rowNoShow(id),
    },
  ]

  return catalog.filter(action => available[action.key])
}
</script>
