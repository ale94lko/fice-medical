<template>
  <div v-if="rows.length" class="fmh-table-wrap fmh-table-wrap--wide">
    <table class="fmh-table fmh-table--wide referrals-table">
      <thead>
        <tr>
          <th>{{ t('referralColDate') }}</th>
          <th>{{ t('referralColNumberShort') }}</th>
          <th>{{ t('referralColType') }}</th>
          <th>{{ t('referralColPriority') }}</th>
          <th>{{ t('referralColReferredByTo') }}</th>
          <th>{{ t('referralColReason') }}</th>
          <th>{{ t('status') }}</th>
          <th class="fmh-table-actions-col">{{ t('actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td>{{ formatReferralListDate(row.referralDate) }}</td>
          <td>{{ row.referralNumber || '—' }}</td>
          <td>
            <span
              class="referral-type-badge"
              :class="`referral-type-badge--${row.type}`">
              {{ typeLabel(row.type) }}
            </span>
          </td>
          <td>
            <span class="referral-priority-label row items-center no-wrap">
              <span
                class="referral-priority-dot"
                :class="priorityDotClass(row.priority)"
              />
              {{ priorityLabel(row.priority) }}
            </span>
          </td>
          <td>{{ partyLabel(row) }}</td>
          <td>{{ row.reason || '—' }}</td>
          <td>
            <span
              class="referral-status-badge"
              :class="`referral-status-badge--${row.status}`">
              {{ statusLabel(row.status) }}
            </span>
          </td>
          <td class="fmh-table-actions referrals-table__actions">
            <q-btn
              flat
              round
              size="sm"
              class="app-btn-icon-action referrals-table__action"
              icon="visibility"
              :data-testid="tid.rowView(row.id)"
              :aria-label="t('referralActionView')"
              @click="emit('view', row)"
            />
            <q-btn
              v-if="canEditRow(row)"
              flat
              round
              size="sm"
              class="app-btn-icon-action referrals-table__action"
              icon="edit"
              :data-testid="tid.rowEdit(row.id)"
              :aria-label="t('edit')"
              @click="emit('edit', row)"
            />
            <q-btn
              v-if="canScheduleRow(row)"
              flat
              round
              size="sm"
              class="app-btn-icon-action referrals-table__action"
              icon="event"
              :data-testid="tid.rowSchedule(row.id)"
              :aria-label="t('referralActionSchedule')"
              @click="emit('schedule', row)"
            />
            <q-btn
              v-if="canDeleteRow()"
              flat
              round
              size="sm"
              class="app-btn-icon-action referrals-table__action"
              icon="delete"
              :data-testid="tid.rowDelete(row.id)"
              :aria-label="t('delete')"
              @click="emit('delete', row)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div
    v-else
    class="referrals-empty text-center q-pa-xl">
    <q-icon name="groups" size="48px" color="grey-5" />
    <p class="text-body2 text-grey-7 q-mt-md q-mb-none">
      {{ emptyLabel }}
    </p>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import {
  referralPriorities,
  referralTypes,
} from 'components/constants.js'
import {
  formatReferralListDate,
  isReferralSchedulable,
} from 'src/utils/referral-normalize.js'
import { referralI18nKey } from 'src/utils/referral-i18n.js'
import { isReferralEditable } from 'src/utils/referral-orders.js'
import { referralTestIds as tid } from 'src/test-ids/index.js'

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
  canSchedule: {
    type: Boolean,
    default: true,
  },
  canDelete: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['view', 'edit', 'schedule', 'delete'])

const { t } = useI18n()

function enumLabel(prefix, token) {
  const key = referralI18nKey(prefix, token)
  const translated = t(key)
  if (translated !== key) {
    return translated
  }

  return token || '—'
}

function typeLabel(type) {
  return enumLabel('referralType', type)
}

function statusLabel(status) {
  return enumLabel('referralStatus', status)
}

function priorityLabel(priority) {
  return enumLabel('referralPriority', priority)
}

function priorityDotClass(priority) {
  const token = String(priority ?? '').toUpperCase()
  if (token === referralPriorities.stat) {
    return 'referral-priority-dot--urgent'
  }
  if (token === referralPriorities.urgent) {
    return 'referral-priority-dot--high'
  }

  return 'referral-priority-dot--medium'
}

function partyLabel(row) {
  if (row.type === referralTypes.outgoing) {
    return row.referredToLabel || '—'
  }

  return row.referredByLabel || '—'
}

function canEditRow(row) {
  return props.canEdit && isReferralEditable(row)
}

function canScheduleRow(row) {
  return props.canSchedule && isReferralSchedulable(row)
}

function canDeleteRow() {
  return props.canDelete
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.referral-type-badge,
.referral-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  white-space: nowrap;
}

.referral-type-badge--INCOMING {
  background: #dcfce7;
  color: #166534;
}

.referral-type-badge--OUTGOING {
  background: #ede9fe;
  color: #5b21b6;
}

.referral-priority-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}

.referral-priority-dot--medium {
  background: #eab308;
}

.referral-priority-dot--high {
  background: #f97316;
}

.referral-priority-dot--urgent {
  background: #ef4444;
}

.referral-priority-label {
  font-size: 0.875rem;
  color: $text-strong;
}

.referral-status-badge--RECEIVED,
.referral-status-badge--ACCEPTED,
.referral-status-badge--SCHEDULED {
  background: #dbeafe;
  color: #1d4ed8;
}

.referral-status-badge--PENDING_REVIEW {
  background: #ffedd5;
  color: #c2410c;
}

.referral-status-badge--COMPLETED {
  background: #dcfce7;
  color: #166534;
}

.referral-status-badge--DECLINED {
  background: #fee2e2;
  color: #b91c1c;
}

.referral-status-badge--CLOSED {
  background: #f1f5f9;
  color: $text-muted;
}

.referrals-table__actions {
  white-space: nowrap;
}

.referrals-table__action {
  color: $text-muted !important;
}
</style>
