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
      :pagination="tablePagination"
      :grid="showGrid"
      :card-layout="mobileCardLayout">
    <template #body-cell-referralDate="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        {{ formatReferralListDate(scope.row.referralDate) }}
      </q-td>
    </template>

    <template #body-cell-referralNumber="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        {{ scope.row.referralNumber || '—' }}
      </q-td>
    </template>

    <template #body-cell-type="scope">
      <q-td :props="scope">
        <AdminTableStatusCell
          :label="typeLabel(scope.row.type)"
          :variant="typeVariant(scope.row.type)"
        />
      </q-td>
    </template>

    <template #body-cell-priority="scope">
      <q-td :props="scope">
        <AdminTableStatusCell
          :label="priorityLabel(scope.row.priority)"
          :variant="priorityVariant(scope.row.priority)"
        />
      </q-td>
    </template>

    <template #body-cell-referredByTo="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell">
        <div
          v-if="partyClinicianEntries(scope.row).length"
          class="referrals-table__party row items-center no-wrap">
          <AdminTableClinicianAvatars
            :entries="partyClinicianEntries(scope.row)"
          />
          <span
            v-if="partyOrganization(scope.row)"
            class="referrals-table__party-org">
            {{ partyOrganization(scope.row) }}
          </span>
        </div>
        <span
          v-else
          class="referrals-table__ellipsis">
          {{ partyLabel(scope.row) }}
        </span>
      </q-td>
    </template>

    <template #body-cell-reason="scope">
      <q-td
        :props="scope"
        class="admin-data-table__secondary-cell
          referrals-table__reason-cell">
        <span class="referrals-table__ellipsis">
          {{ scope.row.reason || '—' }}
          <q-tooltip
            v-if="reasonTooltip(scope.row.reason)"
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ scope.row.reason }}
          </q-tooltip>
        </span>
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
          :aria-label="t('referralActionView')"
          @click="emit('view', row)"
        >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('referralActionView') }}
          </q-tooltip>
        </q-btn>
        <q-btn
          v-if="canEditRow(row)"
          flat
          round
          dense
          class="app-btn-icon-action"
          :icon="adminTableActionIcons.edit"
          :data-testid="tid.rowEdit(row.id)"
          :size="siteBreakpoints.SM"
          :aria-label="t('edit')"
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
          v-if="canScheduleRow(row)"
          flat
          round
          dense
          class="app-btn-icon-action"
          icon="event"
          :data-testid="tid.rowSchedule(row.id)"
          :size="siteBreakpoints.SM"
          :aria-label="t('referralActionSchedule')"
          @click="emit('schedule', row)"
        >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('referralActionSchedule') }}
          </q-tooltip>
        </q-btn>
        <q-btn
          v-if="canDeclineRow(row)"
          flat
          round
          dense
          class="app-btn-icon-action"
          icon="thumb_down"
          :data-testid="tid.rowDecline(row.id)"
          :size="siteBreakpoints.SM"
          :aria-label="t('referralActionDecline')"
          @click="emit('decline', row)"
        >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('referralActionDecline') }}
          </q-tooltip>
        </q-btn>
        <q-btn
          v-if="canCloseRow(row)"
          flat
          round
          dense
          class="app-btn-icon-action"
          icon="cancel"
          :data-testid="tid.rowCancel(row.id)"
          :size="siteBreakpoints.SM"
          :aria-label="t('referralActionClose')"
          @click="emit('close', row)"
        >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('referralActionClose') }}
          </q-tooltip>
        </q-btn>
        <q-btn
          v-if="canDeleteRow(row)"
          flat
          round
          dense
          class="app-btn-icon-action"
          icon="delete"
          :data-testid="tid.rowDelete(row.id)"
          :size="siteBreakpoints.SM"
          :aria-label="t('delete')"
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
import AdminTableClinicianAvatars from
  'components/admin-table/AdminTableClinicianAvatars.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import {
  referralPriorities,
  referralStatuses,
  referralTypes,
  siteBreakpoints,
} from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { useAdminTableMobileGrid } from
  'src/composables/useAdminTableMobileGrid.js'
import { referralI18nKey } from 'src/utils/referral-i18n.js'
import {
  isExtraReferralDraft,
  isIntakeReferralDraft,
  isLocalReferralDraft,
} from 'src/utils/referral-intake.js'
import {
  formatReferralListDate,
  isReferralClosable,
  isReferralDeclinable,
  isReferralDeletable,
  isReferralSchedulable,
} from 'src/utils/referral-normalize.js'
import { isReferralEditable } from 'src/utils/referral-orders.js'
import {
  resolveReferralClinicianEntriesFromPartyLabel,
} from 'src/utils/referral-clinician-display.js'
import { referralTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  clinicianOptions: {
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
  canDecline: {
    type: Boolean,
    default: true,
  },
  canClose: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits([
  'view',
  'edit',
  'schedule',
  'decline',
  'close',
  'delete',
])

const { t } = useI18n()
const { showGrid } = useAdminTableMobileGrid()

const tablePagination = { rowsPerPage: 0 }

const mobileCardLayout = {
  title: 'referralNumber',
  status: 'status',
  subtitle: null,
  contact: null,
  identifier: null,
  badges: [
    'type',
    'priority',
    'referralDate',
    'referredByTo',
    'reason',
  ],
  hideEmpty: true,
}

const columns = computed(() => [
  {
    name: 'referralDate',
    label: t('referralColDate'),
    align: 'left',
    field: row => formatReferralListDate(row.referralDate),
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'referralNumber',
    label: t('referralColNumberShort'),
    align: 'left',
    field: row => row.referralNumber,
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'type',
    label: t('referralColType'),
    align: 'left',
    field: row => row.type,
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'priority',
    label: t('referralColPriority'),
    align: 'left',
    field: row => row.priority,
    sortable: false,
    headerStyle: 'min-width: 100px',
    style: 'min-width: 100px',
  },
  {
    name: 'referredByTo',
    label: t('referralColReferredByTo'),
    align: 'left',
    field: row => partyLabel(row),
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'reason',
    label: t('referralColReason'),
    align: 'left',
    field: row => row.reason,
    sortable: false,
    headerStyle: 'min-width: 140px; max-width: 240px',
    style: 'min-width: 140px; max-width: 240px',
  },
  {
    name: 'status',
    label: t('status'),
    align: 'left',
    field: row => row.status,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'actions',
    label: t('actions'),
    align: 'center',
    field: row => row.id,
    sortable: false,
    required: true,
    headerStyle: 'min-width: 200px; width: 200px',
    style: 'min-width: 200px; width: 200px',
  },
])

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

function typeVariant(type) {
  if (type === referralTypes.incoming) {
    return 'active'
  }
  if (type === referralTypes.outgoing) {
    return 'completed'
  }

  return 'other'
}

function priorityVariant(priority) {
  const token = String(priority ?? '').toUpperCase()
  if (token === referralPriorities.stat) {
    return 'cancelled'
  }
  if (token === referralPriorities.urgent) {
    return 'pending'
  }
  if (token === referralPriorities.low) {
    return 'inactive'
  }

  return 'other'
}

function statusVariant(status) {
  const token = String(status ?? '').toUpperCase()
  if (
    token === referralStatuses.received
    || token === referralStatuses.accepted
  ) {
    return 'active'
  }
  if (token === referralStatuses.scheduled) {
    return 'completed'
  }
  if (token === referralStatuses.pendingReview) {
    return 'pending'
  }
  if (token === referralStatuses.completed) {
    return 'active'
  }
  if (token === referralStatuses.declined) {
    return 'cancelled'
  }
  if (token === referralStatuses.closed) {
    return 'inactive'
  }

  return 'other'
}

function partyLabel(row) {
  if (row.type === referralTypes.outgoing) {
    return row.referredToLabel || '—'
  }

  return row.referredByLabel || '—'
}

function partyProviderLabel(row) {
  if (row.type === referralTypes.outgoing) {
    return row.referredToProvider || ''
  }

  return row.referringProvider || ''
}

function partyOrganization(row) {
  if (row.type === referralTypes.outgoing) {
    return row.referredToOrganization || ''
  }

  return row.referringOrganization || ''
}

function partyClinicianEntries(row) {
  return resolveReferralClinicianEntriesFromPartyLabel(
    partyProviderLabel(row),
    props.clinicianOptions,
  )
}

function canEditRow(row) {
  return props.canEdit && isReferralEditable(row)
}

function canScheduleRow(row) {
  return props.canSchedule
    && isReferralSchedulable(row)
    && !isLocalReferralDraft(row)
}

function canDeclineRow(row) {
  return props.canDecline
    && isReferralDeclinable(row)
    && !isLocalReferralDraft(row)
}

function canCloseRow(row) {
  return props.canClose
    && isReferralClosable(row)
    && !isLocalReferralDraft(row)
}

function canDeleteRow(row) {
  if (isIntakeReferralDraft(row)) {
    return false
  }
  if (isExtraReferralDraft(row)) {
    return props.canEdit || props.canDelete
  }

  return props.canDelete && isReferralDeletable(row)
}

function reasonTooltip(reason) {
  return String(reason ?? '').trim().length > 0
}
</script>
