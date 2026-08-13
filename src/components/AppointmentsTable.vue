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
    <template #body-cell-date="scope">
      <q-td
        :props="scope"
        class="admin-data-table__primary-cell">
        <div class="appointments-table__date">
          <q-icon
            class="appointments-table__date-icon"
            name="calendar_today"
            size="16px"
            aria-hidden="true"
          />
          <span class="appointments-table__date-text">
            {{ formatDate(scope.row.startAtUtc) || '—' }}
          </span>
        </div>
      </q-td>
    </template>

    <template #body-cell-time="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        <span class="appointments-table__time">
          {{ formatTimeRange(
            scope.row.startAtUtc,
            scope.row.endAtUtc,
          ) || '—' }}
        </span>
      </q-td>
    </template>

    <template #body-cell-appointmentType="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        <span class="appointments-table__ellipsis">
          {{ truncatedServicesLabel(scope.row) }}
          <q-tooltip
            v-if="servicesTooltip(scope.row)"
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ servicesTooltip(scope.row) }}
          </q-tooltip>
        </span>
      </q-td>
    </template>

    <template #body-cell-serviceCode="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        <div
          v-if="serviceCodeEntries(scope.row).length"
          class="appointments-table__service-codes">
          <span
            v-for="entry in serviceCodeEntries(scope.row)"
            :key="entry.key"
            class="appointments-table__service-code-pill"
            :class="`appointments-table__service-code-pill--${
              entry.tone
            }`">
            {{ entry.displayCode }}
            <q-tooltip
              v-if="entry.name"
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ entry.name }}
            </q-tooltip>
          </span>
        </div>
        <span v-else>—</span>
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
        {{
          scope.row.placeOfServiceDisplayName
            || scope.row.placeOfServiceName
            || '—'
        }}
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
          :aria-label="t(action.labelKey)"
          @click="emit(action.event, row)"
        >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t(action.labelKey) }}
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
  appointmentCanDelete,
  appointmentCanEdit,
  appointmentCanNoShow,
  appointmentCanReschedule,
} from 'src/utils/appointment-actions.js'
import {
  formatUtcDateLong,
  formatUtcTimeRange,
} from 'src/utils/appointment-datetime.js'
import { formatServiceProcedureCode } from
  'src/utils/appointment-normalize.js'
import { clinicianInitialsFromPersonName } from
  'src/utils/clinician-display.js'
import { resolveRoleBadgeTone } from 'src/utils/user-list-display.js'
import { appointmentTestIds as tid } from 'src/test-ids/index.js'

const APPOINTMENT_SERVICE_LABEL_MAX = 60

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
  'delete',
  'reschedule',
  'check-in',
  'complete',
  'no-show',
])

const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const columns = computed(() => [
  {
    name: 'date',
    label: t('appointmentColDate'),
    align: 'left',
    field: row => row.startAtUtc,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'time',
    label: t('appointmentColTime'),
    align: 'left',
    field: row => row.startAtUtc,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
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
    name: 'serviceCode',
    label: t('appointmentColServiceCode'),
    align: 'left',
    field: row => row.servicesCodesLabel,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
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
    field: row => row.placeOfServiceDisplayName
      || row.placeOfServiceName,
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
    headerStyle: 'min-width: 236px; width: 236px',
    style: 'min-width: 236px; width: 236px',
  },
])

function formatDate(iso) {
  return formatUtcDateLong(iso)
}

function formatTimeRange(start, end) {
  return formatUtcTimeRange(start, end)
}

function truncateWithEllipsis(value, max = APPOINTMENT_SERVICE_LABEL_MAX) {
  const text = String(value ?? '').trim()
  if (!text) {
    return ''
  }
  if (text.length <= max) {
    return text
  }

  return `${text.slice(0, max)}...`
}

function fullServicesLabel(row) {
  return String(
    row?.servicesLabel || row?.appointmentTypeName || '',
  ).trim()
}

function truncatedServicesLabel(row) {
  return truncateWithEllipsis(fullServicesLabel(row)) || '—'
}

function servicesTooltip(row) {
  const full = fullServicesLabel(row)
  if (!full || full.length <= APPOINTMENT_SERVICE_LABEL_MAX) {
    return ''
  }

  return full
}

function serviceCodeEntries(row) {
  const lines = Array.isArray(row?.serviceProcedures)
    ? row.serviceProcedures
    : []
  const entries = []
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const code = formatServiceProcedureCode(line)
    if (!code) {
      continue
    }
    entries.push({
      key: `${line?.id || code}-${index}`,
      displayCode: truncateWithEllipsis(code),
      name: String(line?.name ?? '').trim(),
      tone: resolveRoleBadgeTone(code, index),
    })
  }

  return entries
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
  if (token === appointmentStatuses.inProgress) {
    return 'active'
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
    delete: p.canDelete && appointmentCanDelete(row),
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
      key: 'delete',
      icon: 'delete_outline',
      labelKey: 'appointmentActionDelete',
      event: 'delete',
      testId: tid.rowDelete(id),
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
