<template>
  <div
    v-if="rows.length"
    class="fmh-table-wrap fmh-table-wrap--wide">
    <table class="fmh-table fmh-table--wide">
      <thead>
        <tr>
          <th>{{ t('appointmentColDateTime') }}</th>
          <th>{{ t('appointmentColNumber') }}</th>
          <th>{{ t('appointmentColType') }}</th>
          <th>{{ t('appointmentColClinician') }}</th>
          <th>{{ t('status') }}</th>
          <th>{{ t('appointmentColTelemedicine') }}</th>
          <th class="fmh-table-actions-col appointment-table-actions-col">
            {{ t('actions') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.appointmentId">
          <td class="appointment-col-datetime">
            <div class="appointment-datetime__date">
              {{ formatDate(row.startAtUtc) }}
            </div>
            <div class="appointment-datetime__time text-grey-7">
              {{ formatTimeRange(row.startAtUtc, row.endAtUtc) }}
            </div>
          </td>
          <td>{{ row.appointmentNumber || '—' }}</td>
          <td>{{ row.appointmentTypeName || '—' }}</td>
          <td>{{ row.clinicianDisplayName || '—' }}</td>
          <td>
            <span
              class="appointment-status-badge"
              :class="statusBadgeClass(row.status)">
              {{ statusLabel(row.status) }}
            </span>
          </td>
          <td>
            <span class="row items-center no-wrap">
              {{ row.telemedicine ? t('yes') : t('no') }}
              <q-icon
                v-if="row.telemedicine"
                name="videocam"
                size="16px"
                class="q-ml-xs"
                color="primary"
              />
            </span>
          </td>
          <td class="fmh-table-actions appointment-table-actions">
            <div
              v-if="primaryActionButtons(row).length"
              class="appointment-table-actions__row">
              <q-btn
                v-for="action in primaryActionButtons(row)"
                :key="action.key"
                flat
                round
                size="sm"
                class="app-btn-icon-action"
                :color="action.color"
                :icon="action.icon"
                :aria-label="t(action.labelKey)"
                :data-testid="action.testId"
                @click="emit(action.event, row)"
              >
                <q-tooltip>{{ t(action.labelKey) }}</q-tooltip>
              </q-btn>
            </div>
            <div
              v-if="lifecycleActionButtons(row).length"
              class="appointment-table-actions__row">
              <q-btn
                v-for="action in lifecycleActionButtons(row)"
                :key="action.key"
                flat
                round
                size="sm"
                class="app-btn-icon-action"
                :color="action.color"
                :icon="action.icon"
                :aria-label="t(action.labelKey)"
                :data-testid="action.testId"
                @click="emit(action.event, row)"
              >
                <q-tooltip>{{ t(action.labelKey) }}</q-tooltip>
              </q-btn>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="fmh-empty text-body2 text-grey-7">
    {{ emptyLabel }}
  </p>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import {
  appointmentCanCancel,
  appointmentCanCheckIn,
  appointmentCanComplete,
  appointmentCanEdit,
  appointmentCanNoShow,
  appointmentCanReschedule,
  appointmentStatusBadgeClass,
} from 'src/utils/appointment-actions.js'
import {
  formatUtcDateLong,
  formatUtcTimeRange,
} from 'src/utils/appointment-datetime.js'
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

function statusBadgeClass(status) {
  return appointmentStatusBadgeClass(status)
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

function buildActionButtons(row, keys) {
  const available = actionsFor(row)
  const id = row.appointmentId

  const catalog = {
    view: {
      key: 'view',
      icon: 'visibility',
      color: 'primary',
      labelKey: 'appointmentActionView',
      event: 'view',
      testId: tid.rowView(id),
    },
    edit: {
      key: 'edit',
      icon: 'edit',
      color: 'primary',
      labelKey: 'edit',
      event: 'edit',
      testId: tid.rowEdit(id),
    },
    reschedule: {
      key: 'reschedule',
      icon: 'event',
      color: 'primary',
      labelKey: 'appointmentActionReschedule',
      event: 'reschedule',
      testId: tid.rowReschedule(id),
    },
    cancel: {
      key: 'cancel',
      icon: 'close',
      color: 'negative',
      labelKey: 'appointmentActionCancel',
      event: 'cancel',
      testId: tid.rowCancel(id),
    },
    checkIn: {
      key: 'checkIn',
      icon: 'how_to_reg',
      color: 'primary',
      labelKey: 'appointmentActionCheckIn',
      event: 'check-in',
      testId: tid.rowCheckIn(id),
    },
    complete: {
      key: 'complete',
      icon: 'task_alt',
      color: 'positive',
      labelKey: 'appointmentActionComplete',
      event: 'complete',
      testId: tid.rowComplete(id),
    },
    noShow: {
      key: 'noShow',
      icon: 'schedule',
      color: 'grey-8',
      labelKey: 'appointmentActionNoShow',
      event: 'no-show',
      testId: tid.rowNoShow(id),
    },
  }

  return keys
    .filter(key => available[key])
    .map(key => catalog[key])
}

function primaryActionButtons(row) {
  return buildActionButtons(row, [
    'view',
    'edit',
    'reschedule',
    'cancel',
  ])
}

function lifecycleActionButtons(row) {
  return buildActionButtons(row, [
    'checkIn',
    'complete',
    'noShow',
  ])
}
</script>

<style lang="scss" scoped>
.appointment-col-datetime {
  white-space: nowrap;
}

.appointment-datetime__date {
  font-weight: 600;
}

.appointment-datetime__time {
  font-size: 0.8125rem;
}

.appointment-table-actions-col,
.appointment-table-actions {
  min-width: 152px;
  width: 152px;
  white-space: normal;
}

.appointment-table-actions__row {
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 4px;

  & + & {
    margin-top: 4px;
  }

  .q-btn + .q-btn {
    margin-left: 0;
  }
}
</style>

<style lang="scss">
.appointment-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;

  &--pending { background: #fef9c3; color: #a16207; }
  &--confirmed { background: #dcfce7; color: #15803d; }
  &--checked-in { background: #dbeafe; color: #1d4ed8; }
  &--completed { background: #dbeafe; color: #1e40af; }
  &--cancelled { background: #fee2e2; color: #b91c1c; }
  &--no-show { background: #f3f4f6; color: #4b5563; }
  &--rescheduled { background: #f3e8ff; color: #7e22ce; }
}
</style>
