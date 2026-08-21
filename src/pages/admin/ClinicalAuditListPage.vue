<template>
  <q-page
    class="admin-page admin-list-page clinical-audit-list-page"
    data-testid="clinical-audit-list-page">
    <AppLoadingOverlay scope="content" :showing="loading" />

    <AdminListPageHeader
      :title="t('clinicalAuditListTitle')"
      :subtitle="t('clinicalAuditListSubtitle')">
      <template #actions>
        <AdminListPageActions
          :actions="pageActions"
          :compact="false"
        />
      </template>
    </AdminListPageHeader>

    <AdminTablePanel
      class="admin-list-page__table-panel"
      :show-column-settings="false">
      <AdminQTable
        class="table admin-data-table"
        flat
        binary-state-sort
        row-key="id"
        v-model:pagination="tablePagination"
        :rows-per-page-options="[20, 50, 100]"
        :grid="showGrid"
        :card-layout="mobileCardLayout"
        :rows="rows"
        :columns="visibleColumns"
        :loading="false"
        @request="onTableRequest">
        <template #body-cell-createdAt="scope">
          <q-td :props="scope" class="admin-data-table__primary-cell">
            {{ formatClinicalAuditDateTime(scope.row.createdAt) }}
          </q-td>
        </template>

        <template #body-cell-action="scope">
          <q-td :props="scope">
            {{ actionLabel(scope.row.action) }}
          </q-td>
        </template>

        <template #body-cell-entityType="scope">
          <q-td :props="scope" class="admin-data-table__secondary-cell">
            {{ entityTypeLabel(scope.row.entityType) }}
          </q-td>
        </template>

        <template #body-cell-entityId="scope">
          <q-td :props="scope" class="admin-data-table__secondary-cell">
            {{ clinicalAuditDisplayLabel(
              scope.row.entityName,
              scope.row.entityId,
            ) }}
          </q-td>
        </template>

        <template #body-cell-clientNumber="scope">
          <q-td :props="scope" class="admin-data-table__secondary-cell">
            {{ clinicalAuditDisplayLabel(
              scope.row.clientName,
              scope.row.clientNumber,
            ) }}
          </q-td>
        </template>

        <template #body-cell-changedBy="scope">
          <q-td :props="scope" class="admin-data-table__secondary-cell">
            <p class="q-mb-none text-weight-medium">
              {{ performedByLabel(scope.row) }}
            </p>
            <p
              v-if="scope.row.triggeredByName"
              class="text-caption text-grey-7 q-mb-none">
              {{ t('clinicalAuditTriggeredByShort', {
                name: scope.row.triggeredByName,
              }) }}
            </p>
          </q-td>
        </template>

        <template #row-actions="{ row }">
          <AdminTableRowActions
            :show-view="true"
            :show-edit="false"
            :show-more="false"
            @view="viewRow(row)"
          />
        </template>

        <template #no-data>
          <AdminTableEmptyState
            :title="emptyTitle"
            :hint="emptyHint"
            :test-id="clinicalAuditTestIds.emptyState"
          />
        </template>
      </AdminQTable>
    </AdminTablePanel>

    <ClinicalAuditFiltersDrawer
      v-model="filtersOpen"
      :filters="appliedFilters"
      @apply="onApplyFilters"
    />

    <ClinicalAuditDetailDialog
      v-model="detailOpen"
      :record="detailRecord"
    />
  </q-page>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { permissionNames, quasarNotifyTypes } from
  'components/constants.js'
import AdminListPageActions from
  'components/admin-table/AdminListPageActions.vue'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTableEmptyState from
  'components/admin-table/AdminTableEmptyState.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminTableRowActions from
  'components/admin-table/AdminTableRowActions.vue'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import ClinicalAuditDetailDialog from
  'components/admin/ClinicalAuditDetailDialog.vue'
import ClinicalAuditFiltersDrawer from
  'components/admin/ClinicalAuditFiltersDrawer.vue'
import { useAdminTableMobileGrid } from
  'src/composables/useAdminTableMobileGrid.js'
import { useAppFooterPagination } from
  'src/composables/useAppFooterPagination.js'
import { clinicalAuditTestIds } from 'src/test-ids/index.js'
import { hasPermission } from 'src/utils/auth-permissions.js'
import { useAuthStore } from 'stores/auth-store.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  clinicalAuditApiErrorMessage,
  listClinicalAudit,
} from 'src/utils/clinical-audit-api.js'
import {
  cloneClinicalAuditFilters,
  countActiveClinicalAuditFilters,
  createEmptyClinicalAuditFilters,
} from 'src/utils/clinical-audit-filters.js'
import {
  clinicalAuditActionI18nKey,
  clinicalAuditDisplayLabel,
  clinicalAuditEntityI18nKey,
  formatClinicalAuditDateTime,
  isClinicalAuditSortDescending,
  sortClinicalAuditRows,
} from 'src/utils/clinical-audit-normalize.js'

const { t, te } = useI18n()
const $q = useQuasar()
const authStore = useAuthStore()

const canView = computed(() =>
  hasPermission(authStore.permissions, permissionNames.viewClinicalAudit),
)

const loading = ref(false)
const rows = ref([])
const appliedFilters = ref(createEmptyClinicalAuditFilters())
const filtersOpen = ref(false)
const detailOpen = ref(false)
const detailRecord = ref(null)

const tablePagination = ref({
  sortBy: 'createdAt',
  descending: true,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

const { showGrid } = useAdminTableMobileGrid()

const mobileCardLayout = {
  title: 'action',
  subtitle: 'entityType',
  identifier: {
    column: 'entityId',
    labelKey: 'adminTableCardNoLabel',
  },
  badges: ['createdAt', 'changedBy', 'clientNumber'],
  hideEmpty: true,
}

const activeFilterCount = computed(() =>
  countActiveClinicalAuditFilters(appliedFilters.value),
)

const filtersButtonLabel = computed(() => {
  const count = activeFilterCount.value
  if (count > 0) {
    return t('clinicalAuditFiltersActive', { count })
  }

  return t('filters')
})

const emptyTitle = computed(() =>
  activeFilterCount.value > 0
    ? t('adminTableNoResultsTitle')
    : t('clinicalAuditListEmptyTitle'),
)

const emptyHint = computed(() =>
  activeFilterCount.value > 0
    ? t('clinicalAuditListNoResultsHint')
    : t('clinicalAuditListEmpty'),
)

const pageActions = computed(() => [
  {
    key: 'filters',
    label: filtersButtonLabel.value,
    icon: 'filter_alt',
    variant: 'outline',
    testId: 'clinical-audit-btn-filters',
    disable: loading.value,
    className: 'admin-list-page__filters-btn',
    onClick: () => {
      filtersOpen.value = true
    },
  },
])

const visibleColumns = computed(() => [
  {
    name: 'createdAt',
    label: t('clinicalAuditColCreatedAt'),
    align: 'left',
    field: row => row.createdAt,
    sortable: true,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
  },
  {
    name: 'changedBy',
    label: t('clinicalAuditColChangedBy'),
    align: 'left',
    field: row => clinicalAuditDisplayLabel(row.changedByName, row.changedBy),
    sortable: true,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'clientNumber',
    label: t('clinicalAuditColClientId'),
    align: 'left',
    field: row => clinicalAuditDisplayLabel(row.clientName, row.clientNumber),
    sortable: true,
    headerStyle: 'min-width: 100px',
    style: 'min-width: 100px',
  },
  {
    name: 'entityId',
    label: t('clinicalAuditColEntityId'),
    align: 'left',
    field: row => clinicalAuditDisplayLabel(row.entityName, row.entityId),
    sortable: true,
    headerStyle: 'min-width: 100px',
    style: 'min-width: 100px',
  },
  {
    name: 'action',
    label: t('clinicalAuditColAction'),
    align: 'left',
    field: row => row.action,
    sortable: true,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'entityType',
    label: t('clinicalAuditColEntityType'),
    align: 'left',
    field: row => row.entityType,
    sortable: true,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'actions',
    label: t('actions'),
    align: 'center',
    field: () => '',
    sortable: false,
    headerStyle: 'min-width: 72px',
    style: 'min-width: 72px',
  },
])

function actionLabel(action) {
  const token = String(action ?? '').trim()
  if (!token) {
    return '—'
  }
  const key = clinicalAuditActionI18nKey(token)

  return key && te(key) ? t(key) : token
}

function entityTypeLabel(entityType) {
  const token = String(entityType ?? '').trim()
  if (!token) {
    return '—'
  }
  const key = clinicalAuditEntityI18nKey(token)

  return key && te(key) ? t(key) : token
}

function performedByLabel(row) {
  const source = String(row?.source ?? '').trim().toUpperCase()
  const name = String(row?.changedByName ?? '').trim()
  if (source === 'SYSTEM' && !name) {
    return t('clinicalAuditPerformedBySystem')
  }

  return clinicalAuditDisplayLabel(row?.changedByName, row?.changedBy)
}

function tablePaginationFromMeta(paginationPayload, meta) {
  const total = Number(meta?.total ?? 0)
  const limit = Number(meta?.limit ?? paginationPayload.rowsPerPage) || 20
  let resolvedPage = paginationPayload.page
  if (meta && Number.isFinite(Number(meta.page))) {
    resolvedPage = Number(meta.page) + 1
  }

  return {
    sortBy: paginationPayload.sortBy,
    descending: paginationPayload.descending,
    page: resolvedPage,
    rowsPerPage: limit,
    rowsNumber: total,
  }
}

async function loadRows(paginationPayload) {
  if (!canView.value) {
    rows.value = []
    return
  }
  loading.value = true
  try {
    const filters = appliedFilters.value
    const result = await listClinicalAudit({
      page: paginationPayload.page,
      limit: paginationPayload.rowsPerPage,
      sortBy: paginationPayload.sortBy,
      descending: paginationPayload.descending,
      entityType: filters.entityType,
      action: filters.action,
      from: filters.from,
      to: filters.to,
      clientNumber: filters.clientNumber,
      changedBy: filters.changedBy,
    })
    rows.value = sortClinicalAuditRows(
      result.items,
      paginationPayload.sortBy || 'createdAt',
      isClinicalAuditSortDescending(paginationPayload.descending),
    )
    tablePagination.value = tablePaginationFromMeta(
      paginationPayload,
      result.pagination,
    )
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: clinicalAuditApiErrorMessage(
          error,
          t('clinicalAuditListError'),
        ),
      })
    }
  } finally {
    loading.value = false
  }
}

function onApplyFilters(nextFilters) {
  appliedFilters.value = cloneClinicalAuditFilters(nextFilters)
  tablePagination.value = {
    ...tablePagination.value,
    page: 1,
  }
  loadRows(tablePagination.value)
}

function onPageChange(page) {
  if (page === tablePagination.value.page) {
    return
  }
  tablePagination.value = { ...tablePagination.value, page }
  loadRows(tablePagination.value)
}

function onRowsPerPageChange(rowsPerPage) {
  if (rowsPerPage === tablePagination.value.rowsPerPage) {
    return
  }
  tablePagination.value = {
    ...tablePagination.value,
    page: 1,
    rowsPerPage,
  }
  loadRows(tablePagination.value)
}

function onTableRequest(props) {
  const { pagination } = props
  const nextSortBy = pagination.sortBy
    || tablePagination.value.sortBy
    || 'createdAt'
  // Quasar may already sync v-model before @request; always honor
  // the event payload. Explicit true → DESC, otherwise ASC.
  const nextDescending = pagination.sortBy == null
    ? !tablePagination.value.descending
    : pagination.descending === true

  loadRows({
    ...tablePagination.value,
    sortBy: nextSortBy,
    descending: nextDescending,
    page: 1,
  })
}

const {
  setFooterPagination,
  patchFooterPagination,
  clearFooterPagination,
} = useAppFooterPagination()

function syncFooterPaginationBar() {
  patchFooterPagination({
    page: tablePagination.value.page,
    rowsPerPage: tablePagination.value.rowsPerPage,
    rowsNumber: tablePagination.value.rowsNumber,
    disable: loading.value,
    onPageChange,
    onRowsPerPageChange,
  })
}

function viewRow(row) {
  if (!row?.id) {
    return
  }
  detailRecord.value = row
  detailOpen.value = true
}

watch(
  [tablePagination, loading],
  () => {
    syncFooterPaginationBar()
  },
  { deep: true },
)

watch(detailOpen, open => {
  if (!open) {
    detailRecord.value = null
  }
})

onMounted(() => {
  setFooterPagination({
    page: tablePagination.value.page,
    rowsPerPage: tablePagination.value.rowsPerPage,
    rowsNumber: tablePagination.value.rowsNumber,
    disable: loading.value,
    onPageChange,
    onRowsPerPageChange,
  })
  loadRows(tablePagination.value)
})

onBeforeUnmount(() => {
  clearFooterPagination()
  detailOpen.value = false
  filtersOpen.value = false
})
</script>

