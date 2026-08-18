<template>
  <div class="care-plan-goals-table">
    <div class="row items-center justify-between q-mb-md">
      <SubsectionHeading icon="flag" :title="t('carePlanSectionGoals')" />
      <q-btn
        v-if="canAdd"
        no-caps
        outline
        color="primary"
        class="app-btn-outline"
        icon="add"
        :label="t('carePlanAddGoal')"
        :data-testid="tid.btn('add-goal')"
        @click="emit('add')"
      />
    </div>

    <AdminTablePanel
      class="care-plan-goals-table-panel admin-table-panel--wide"
      :show-column-settings="false">
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
          <template #body-cell-title="scope">
            <q-td
              :props="scope"
              class="admin-data-table__primary-cell">
              <div>{{ scope.row.title || '—' }}</div>
              <button
                v-if="relatedGoal(scope.row)"
                type="button"
                class="care-plan-goal-relation"
                @click="emit('view', relatedGoal(scope.row))">
                {{ replacementCaption(scope.row) }}
              </button>
              <p
                v-else-if="replacementCaption(scope.row)"
                class="text-caption text-grey-7 q-mb-none q-mt-xs">
                {{ replacementCaption(scope.row) }}
              </p>
            </q-td>
          </template>

          <template #body-cell-targetDate="scope">
            <q-td
              :props="scope"
              class="admin-data-table__secondary-cell">
              {{ scope.row.targetDate || '—' }}
            </q-td>
          </template>

          <template #body-cell-status="scope">
            <q-td :props="scope">
              <AdminTableStatusCell
                :label="goalStatusLabel(scope.row.status)"
                :variant="statusVariant(scope.row.status)"
              />
            </q-td>
          </template>

          <template #body-cell-progress="scope">
            <q-td
              :props="scope"
              class="admin-data-table__secondary-cell">
              <CarePlanProgressCell
                compact
                :progress="scope.row.progress"
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
                :size="siteBreakpoints.SM"
                :aria-label="t('carePlanActionView')"
                :data-testid="tid.rowView(row.id)"
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
                v-if="canEdit"
                flat
                round
                dense
                class="app-btn-icon-action"
                :icon="adminTableActionIcons.edit"
                :size="siteBreakpoints.SM"
                :aria-label="t('edit')"
                :data-testid="tid.rowEdit(row.id)"
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
                v-if="canLifecycle(row)"
                flat
                round
                dense
                class="app-btn-icon-action"
                icon="swap_horiz"
                :size="siteBreakpoints.SM"
                :aria-label="t('carePlanActionReplaceGoal')"
                :data-testid="tid.rowReplace(row.id)"
                @click="emit('replace', row)"
              >
                <q-tooltip
                  class="app-info-tooltip"
                  anchor="top middle"
                  self="bottom middle"
                  :offset="[0, 6]">
                  {{ t('carePlanActionReplaceGoal') }}
                </q-tooltip>
              </q-btn>
              <q-btn
                v-if="canLifecycle(row)"
                flat
                round
                dense
                class="app-btn-icon-action"
                icon="block"
                :size="siteBreakpoints.SM"
                :aria-label="t('carePlanActionDiscontinueGoal')"
                :data-testid="tid.rowDiscontinue(row.id)"
                @click="emit('discontinue', row)"
              >
                <q-tooltip
                  class="app-info-tooltip"
                  anchor="top middle"
                  self="bottom middle"
                  :offset="[0, 6]">
                  {{ t('carePlanActionDiscontinueGoal') }}
                </q-tooltip>
              </q-btn>
              <q-btn
                v-if="canEdit"
                flat
                round
                dense
                class="app-btn-icon-action"
                icon="delete"
                :size="siteBreakpoints.SM"
                :aria-label="t('delete')"
                :data-testid="tid.rowDelete(row.id)"
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
        <span>{{ t('carePlanGoalsEmpty') }}</span>
      </div>
    </AdminTablePanel>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminQTable from 'components/AdminQTable.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import CarePlanProgressCell from 'components/CarePlanProgressCell.vue'
import { siteBreakpoints } from 'components/constants.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { carePlanI18nKey } from 'src/utils/care-plan-i18n.js'
import {
  canAddCarePlanGoals,
  canEditExistingGoal,
  canLifecycleGoal,
} from 'src/utils/care-plan-lifecycle.js'
import { carePlanTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  goals: {
    type: Array,
    default: () => [],
  },
  plan: {
    type: Object,
    default: null,
  },
  mode: {
    type: String,
    default: 'edit',
  },
})

const emit = defineEmits([
  'add',
  'view',
  'edit',
  'delete',
  'discontinue',
  'replace',
])

const { t } = useI18n()

const tablePagination = { rowsPerPage: 0 }

const rows = computed(() => props.goals ?? [])

const canAdd = computed(() => canAddCarePlanGoals(props.plan, props.mode))

const canEdit = computed(() => canEditExistingGoal(props.plan, props.mode))

const columns = computed(() => [
  {
    name: 'title',
    label: t('carePlanGoalColTitle'),
    align: 'left',
    field: row => row.title,
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
  },
  {
    name: 'targetDate',
    label: t('carePlanGoalColTargetDate'),
    align: 'left',
    field: row => row.targetDate,
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
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'progress',
    label: t('carePlanColProgress'),
    align: 'left',
    field: row => row.progress?.percent,
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
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
  },
])

function canLifecycle(row) {
  return canLifecycleGoal(props.plan, row, props.mode)
}

function relatedGoal(row) {
  const relatedId = row?.replacedByGoalId || row?.replacesGoalId
  if (relatedId == null) {
    return null
  }

  return rows.value.find(item => String(item.id) === String(relatedId))
    ?? null
}

function relatedGoalTitle(row) {
  const related = relatedGoal(row)
  if (related?.title) {
    return related.title
  }
  if (row?.replacesGoalTitle) {
    return row.replacesGoalTitle
  }

  return '—'
}

function replacementCaption(row) {
  if (row?.replacedByGoalId) {
    return t('carePlanGoalReplacedBy', { title: relatedGoalTitle(row) })
  }
  if (row?.replacesGoalId) {
    return t('carePlanGoalReplaces', { title: relatedGoalTitle(row) })
  }

  return ''
}

function goalStatusLabel(status) {
  const key = carePlanI18nKey('carePlanGoalStatus', status)
  const translated = t(key)
  if (translated !== key) {
    return translated
  }

  return status || '—'
}

function statusVariant(status) {
  const token = String(status ?? '').toUpperCase()
  if (token === 'COMPLETED') {
    return 'active'
  }
  if (token === 'DISCONTINUED' || token === 'CANCELLED') {
    return 'inactive'
  }
  if (token === 'IN_PROGRESS') {
    return 'pending'
  }

  return 'other'
}
</script>

<style lang="scss" scoped>
.care-plan-goal-relation {
  display: block;
  margin-top: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  color: $primary;
  font-size: 0.75rem;
  line-height: 1.3;
  text-align: left;
  cursor: pointer;
}

.care-plan-goal-relation:hover {
  text-decoration: underline;
}
</style>
