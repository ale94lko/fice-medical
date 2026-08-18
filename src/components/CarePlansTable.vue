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
      <template #body-cell-planName="scope">
        <q-td
          :props="scope"
          class="admin-data-table__primary-cell">
          <span class="care-plans-table__ellipsis">
            {{ scope.row.name || '—' }}
          </span>
        </q-td>
      </template>

      <template #body-cell-problem="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          <span>
            {{ formatProblemDisplay(scope.row.problem) }}
            <q-tooltip
              v-if="isProblemTruncated(scope.row.problem)"
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ scope.row.problem }}
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

      <template #body-cell-progress="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell
            care-plans-table__progress-cell">
          <CarePlanProgressCell
            compact
            :progress="scope.row.progress"
          />
        </q-td>
      </template>

      <template #body-cell-targetDate="scope">
        <q-td
          :props="scope"
          class="admin-data-table__secondary-cell">
          {{ scope.row.targetDate || '—' }}
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
            :aria-label="t('carePlanActionView')"
            @click="emit('view', row)"
          >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('carePlanActionView') }}
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
            v-if="canSignRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="draw"
            :data-testid="tid.rowSign(row.id)"
            :size="siteBreakpoints.SM"
            :aria-label="t('carePlanActionSign')"
            @click="emit('sign', row)"
          >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('carePlanActionSign') }}
          </q-tooltip>
        </q-btn>
          <q-btn
            v-if="canCompleteRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="check_circle"
            :data-testid="tid.rowComplete(row.id)"
            :size="siteBreakpoints.SM"
            :aria-label="t('carePlanActionMarkCompleted')"
            @click="emit('status', row, 'COMPLETED')"
          >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('carePlanActionMarkCompleted') }}
          </q-tooltip>
        </q-btn>
          <q-btn
            v-if="canArchiveRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="archive"
            :data-testid="tid.rowArchive(row.id)"
            :size="siteBreakpoints.SM"
            :aria-label="t('carePlanActionArchive')"
            @click="requestStatus(row, 'ARCHIVED')"
          >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('carePlanActionArchive') }}
          </q-tooltip>
        </q-btn>
          <q-btn
            v-if="canCancelRow(row)"
            flat
            round
            dense
            class="app-btn-icon-action"
            icon="cancel"
            :data-testid="tid.rowCancel(row.id)"
            :size="siteBreakpoints.SM"
            :aria-label="t('carePlanActionCancel')"
            @click="requestStatus(row, 'CANCELLED')"
          >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('carePlanActionCancel') }}
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

  <CarePlanReasonDialog
    v-model="reasonOpen"
    :title="reasonTitle"
    :message="reasonMessage"
    :reason-label="reasonLabel"
    :confirm-label="reasonConfirm"
    :reason-field="reasonField"
    @confirm="onReasonConfirm"
  />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminQTable from 'components/AdminQTable.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import CarePlanProgressCell from 'components/CarePlanProgressCell.vue'
import CarePlanReasonDialog from 'components/CarePlanReasonDialog.vue'
import {
  carePlanProblemListDisplayMaxLength,
  carePlanStatuses,
  siteBreakpoints,
} from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { carePlanI18nKey } from 'src/utils/care-plan-i18n.js'
import { carePlanTestIds as tid } from 'src/test-ids/index.js'
import {
  isCarePlanActive,
  isCarePlanDraft,
  isCarePlanTerminal,
} from 'src/utils/care-plan-lifecycle.js'

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
  canSign: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['view', 'edit', 'sign', 'status'])

const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const columns = computed(() => [
  {
    name: 'planName',
    label: t('carePlanColName'),
    align: 'left',
    field: row => row.name,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'problem',
    label: t('carePlanColProblem'),
    align: 'left',
    field: row => row.problem,
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
    headerStyle: 'min-width: 100px',
    style: 'min-width: 100px',
  },
  {
    name: 'progress',
    label: t('carePlanColProgress'),
    align: 'left',
    field: row => row.progress,
    sortable: false,
    headerStyle: 'min-width: 90px',
    style: 'min-width: 90px',
  },
  {
    name: 'targetDate',
    label: t('carePlanColTargetDate'),
    align: 'left',
    field: row => row.targetDate,
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'actions',
    label: t('actions'),
    align: 'center',
    field: row => row.id,
    sortable: false,
    required: true,
    headerStyle: 'min-width: 240px',
    style: 'min-width: 240px',
  },
])

function problemText(problem) {
  return String(problem ?? '').trim()
}

function isProblemTruncated(problem) {
  return problemText(problem).length
    > carePlanProblemListDisplayMaxLength
}

function formatProblemDisplay(problem) {
  const text = problemText(problem)
  if (!text) {
    return '—'
  }
  if (!isProblemTruncated(text)) {
    return text
  }

  return `${text.slice(0, carePlanProblemListDisplayMaxLength)}...`
}

function statusLabel(status) {
  const key = carePlanI18nKey('carePlanStatus', status)
  const translated = t(key)
  if (translated !== key) {
    return translated
  }

  return status || '—'
}

function statusVariant(status) {
  if (status === carePlanStatuses.draft) {
    return 'pending'
  }
  if (status === carePlanStatuses.active) {
    return 'active'
  }
  if (status === carePlanStatuses.completed) {
    return 'completed'
  }
  if (status === carePlanStatuses.archived) {
    return 'inactive'
  }
  if (status === carePlanStatuses.cancelled) {
    return 'cancelled'
  }

  return 'other'
}

function canEditRow(row) {
  return props.canEdit && !isCarePlanTerminal(row.status)
}

function canSignRow(row) {
  return props.canSign
    && !row.signed
    && (isCarePlanDraft(row.status)
      || (isCarePlanActive(row.status) && !row.signed))
}

function canCompleteRow(row) {
  return props.canEdit && isCarePlanActive(row.status)
}

function canArchiveRow(row) {
  return props.canEdit && isCarePlanActive(row.status)
}

function canCancelRow(row) {
  return props.canEdit && !isCarePlanTerminal(row.status)
}

const reasonOpen = ref(false)
const pendingRow = ref(null)
const pendingStatus = ref('')

const isArchiveReason = computed(
  () => pendingStatus.value === carePlanStatuses.archived,
)

const reasonTitle = computed(() =>
  isArchiveReason.value
    ? t('carePlanArchiveTitle')
    : t('carePlanCancelTitle'),
)

const reasonMessage = computed(() =>
  isArchiveReason.value
    ? t('carePlanArchiveMessage')
    : t('carePlanCancelMessage'),
)

const reasonLabel = computed(() =>
  isArchiveReason.value
    ? t('carePlanArchiveReasonLabel')
    : t('carePlanCancelReasonLabel'),
)

const reasonConfirm = computed(() =>
  isArchiveReason.value
    ? t('carePlanActionArchive')
    : t('carePlanActionCancel'),
)

const reasonField = computed(() =>
  isArchiveReason.value ? 'archive-reason' : 'cancel-reason',
)

function requestStatus(row, status) {
  pendingRow.value = row
  pendingStatus.value = status
  reasonOpen.value = true
}

function onReasonConfirm(reason) {
  if (!pendingRow.value || !pendingStatus.value) {
    return
  }
  emit('status', pendingRow.value, pendingStatus.value, reason)
}
</script>
