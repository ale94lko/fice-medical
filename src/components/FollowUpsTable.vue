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
      :card-layout="mobileCardLayout"
      :card-class-fn="followUpCardClass">
      <template #body-cell-type="scope">
        <q-td
          :props="scope"
          class="admin-data-table__primary-cell">
          {{ typeLabel(scope.row.type) }}
        </q-td>
      </template>

      <template #body-cell-status="scope">
        <q-td
          v-if="!showGrid"
          :props="scope">
          <span
            class="follow-up-status-badge"
            :class="statusBadgeClass(scope.row)">
            {{ statusLabel(scope.row) }}
          </span>
        </q-td>
        <div
          v-else
          class="follow-ups-table__status-stack">
          <span
            class="follow-up-status-badge"
            :class="statusBadgeClass(scope.row)">
            {{ statusLabel(scope.row) }}
          </span>
          <span
            v-if="isUnsavedItem(scope.row)"
            class="follow-up-status-badge
              follow-up-status-badge--unsaved">
            {{ t('followUpPendingBadge') }}
          </span>
        </div>
      </template>

      <template #body-cell-dueDate="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.dueDate || '—' }}
        </q-td>
      </template>

      <template #body-cell-provider="scope">
        <q-td
          v-if="!showGrid"
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ formatProviderDesktop(scope.row) || '—' }}
        </q-td>
        <div
          v-else-if="providerName(scope.row)"
          class="follow-ups-table__provider-info">
          <span class="follow-ups-table__provider-name">
            {{ providerName(scope.row) }}
          </span>
          <AdminTableHoverCard v-if="providerDetail(scope.row)">
            <template #anchor>
              <q-icon
                name="info"
                color="info"
                size="18px"
                class="follow-ups-table__provider-info-icon"
                tabindex="0"
                :aria-label="providerDetail(scope.row)"
              />
            </template>
            <span class="follow-ups-table__provider-tip-badge">
              {{ providerDetail(scope.row) }}
            </span>
          </AdminTableHoverCard>
        </div>
        <span
          v-else
          class="text-grey-6">
          —
        </span>
      </template>

      <template #body-cell-related="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ relatedLabel(scope.row) || '—' }}
        </q-td>
      </template>

      <template #row-actions="{ row }">
        <div class="admin-table-row-actions">
          <q-btn
            v-if="canViewRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            :icon="adminTableActionIcons.view"
            :size="siteBreakpoints.SM"
            :aria-label="t('followUpActionView')"
            :data-testid="tid.rowView(row.id)"
            @click="emit('view', row)">
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('followUpActionView') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canEditRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            :icon="adminTableActionIcons.edit"
            :size="siteBreakpoints.SM"
            :aria-label="t('edit')"
            :data-testid="tid.rowEdit(row.id)"
            @click="emit('edit', row)">
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('edit') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canCompleteRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="task_alt"
            :size="siteBreakpoints.SM"
            :aria-label="t('followUpActionComplete')"
            :data-testid="tid.rowComplete(row.id)"
            @click="emit('complete', row)">
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('followUpActionComplete') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canCancelRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="cancel"
            :size="siteBreakpoints.SM"
            :aria-label="t('followUpActionCancel')"
            :data-testid="tid.rowCancel(row.id)"
            @click="emit('cancel', row)">
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('followUpActionCancel') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="canRemovePending(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="delete"
            :size="siteBreakpoints.SM"
            :aria-label="t('followUpActionRemovePending')"
            :data-testid="tid.rowRemove(row.id)"
            @click="emit('remove-pending', row)">
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('followUpActionRemovePending') }}
            </q-tooltip>
          </q-btn>
          <span
            v-if="!hasRowActions(row)"
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
import AdminTableHoverCard from
  'components/admin-table/AdminTableHoverCard.vue'
import { siteBreakpoints } from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { useAdminTableMobileGrid } from
  'src/composables/useAdminTableMobileGrid.js'
import { followUpTestIds as tid } from 'src/test-ids/index.js'
import {
  buildFollowUpTypeOptions,
  followUpCanEditRecord,
  followUpCanViewRecord,
  followUpStatusLabel,
  providerLabelForFollowUp,
  resolveFollowUpDisplayStatus,
} from 'src/utils/follow-up-utils.js'

const props = defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
  relatedLabelFn: {
    type: Function,
    default: null,
  },
  canAdd: {
    type: Boolean,
    default: false,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'edit',
  'view',
  'complete',
  'cancel',
  'remove-pending',
])

const { t } = useI18n()
const { showGrid } = useAdminTableMobileGrid()

const tablePagination = { rowsPerPage: 0 }

const rows = computed(() => props.entries ?? [])

const typeOptions = computed(() => buildFollowUpTypeOptions(t))

/** Same compact card hierarchy as Labs / Vitals (mobile). */
const mobileCardLayout = {
  title: 'type',
  status: 'status',
  subtitle: null,
  contact: null,
  identifier: null,
  badges: ['dueDate', 'provider', 'related'],
  hideEmpty: true,
}

const columns = computed(() => [
  {
    name: 'type',
    label: t('followUpType'),
    align: 'left',
    field: row => typeLabel(row.type),
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
  },
  {
    name: 'status',
    label: t('status'),
    align: 'left',
    field: row => statusLabel(row),
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'dueDate',
    label: t('followUpDueDate'),
    align: 'left',
    field: row => row.dueDate,
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'provider',
    label: t('followUpAssignedProvider'),
    align: 'left',
    field: row => providerName(row),
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
  },
  {
    name: 'related',
    label: t('followUpRelatedTo'),
    align: 'left',
    field: row => relatedLabel(row),
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'actions',
    label: t('actions'),
    align: 'center',
    field: row => row.id,
    sortable: false,
    required: true,
    headerStyle: 'min-width: 168px',
    style: 'min-width: 168px',
  },
])

function typeLabel(type) {
  const match = typeOptions.value.find(
    opt => String(opt.value) === String(type),
  )

  return match?.label ?? type ?? '—'
}

function providerLabel(item) {
  return providerLabelForFollowUp(item, props.clinicianOptions)
}

/** Split "Name - Specialty" (and drop commas from specialty). */
function splitProviderLabel(item) {
  const raw = providerLabel(item)
  if (!raw) {
    return { name: '', detail: '' }
  }
  const parts = raw.split(' - ').map(part => part.trim()).filter(Boolean)
  const name = (parts[0] || '').replace(/,/g, '').replace(/\s+/g, ' ').trim()
  const detail = parts.slice(1).join(' ')
    .replace(/,/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return { name, detail }
}

function providerName(item) {
  return splitProviderLabel(item).name
}

function providerDetail(item) {
  return splitProviderLabel(item).detail
}

function formatProviderDesktop(item) {
  const { name, detail } = splitProviderLabel(item)
  if (!name) {
    return ''
  }
  if (!detail) {
    return name
  }

  return `${name} ${detail}`
}

function relatedLabel(item) {
  if (typeof props.relatedLabelFn === 'function') {
    return props.relatedLabelFn(item) || ''
  }

  return ''
}

function statusLabel(item) {
  return followUpStatusLabel(t, resolveFollowUpDisplayStatus(item))
}

function statusBadgeClass(item) {
  const status = resolveFollowUpDisplayStatus(item)

  return `follow-up-status-badge--${status.toLowerCase()}`
}

function isUnsavedItem(item) {
  return item.isPending || item.isDirty || Boolean(item.pendingAction)
}

function canEditRow(item) {
  if (item.isPending) {
    return props.canAdd
  }

  return props.canEdit && followUpCanEditRecord(item)
}

function canCompleteRow(item) {
  return props.canEdit
    && followUpCanEditRecord(item)
    && !item.isPending
}

function canCancelRow(item) {
  return canCompleteRow(item)
}

function canViewRow(item) {
  return followUpCanViewRecord(item) && !item.isPending
}

function canRemovePending(item) {
  return item.isPending && props.canAdd
}

function hasRowActions(item) {
  return canEditRow(item)
    || canCompleteRow(item)
    || canCancelRow(item)
    || canViewRow(item)
    || canRemovePending(item)
}

function followUpCardClass(row) {
  return row?.overdue ? 'follow-ups-table__card--overdue' : ''
}
</script>

<style lang="scss" scoped>
.follow-ups-table__provider-info {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.follow-ups-table__provider-name {
  min-width: 0;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.35;
  color: inherit;
  word-break: break-word;
}

.follow-ups-table__provider-info-icon {
  cursor: pointer;
  flex-shrink: 0;
}

.follow-ups-table__status-stack {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
</style>

<style lang="scss">
.follow-ups-table__provider-tip-badge {
  display: inline-flex;
  align-items: center;
  max-width: 260px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.3;
  color: #0f766e;
  background: #e0f2f1;
  word-break: break-word;
}
</style>
