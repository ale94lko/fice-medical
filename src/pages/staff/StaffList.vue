<template>
  <q-page
    class="admin-page admin-list-page staff-list-page"
    :data-testid="staffListTestIds.page">
    <AppLoadingOverlay
      scope="content"
      :showing="loading"
    />

    <AdminListPageHeader
      :title="t('staffList')"
      :subtitle="t('staffListSubtitle')">
      <template #center>
        <q-input
          :model-value="searchQuery"
          outlined
          clearable
          hide-bottom-space
          class="admin-list-page__search-input staff-list-page__search"
          :data-testid="staffListTestIds.search"
          :disable="loading"
          :placeholder="t('staffListSearchPlaceholder')"
          :aria-label="t('staffListSearchPlaceholder')"
          @update:model-value="setSearchQuery"
          @clear="resetSearchQuery">
          <template #prepend>
            <q-icon name="search" size="18px" />
          </template>
        </q-input>
      </template>
      <template #actions>
        <div
          class="admin-list-page__actions row items-center
            q-gutter-sm no-wrap">
          <q-btn
            v-if="canAddStaff"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :data-testid="staffListTestIds.addStaff"
            :disable="loading"
            :label="t('staffListAddStaff')"
            @click="goAddStaff"
          />
          <q-btn
            v-if="canAddClinician"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :data-testid="staffListTestIds.addClinician"
            :disable="loading"
            :label="t('staffListAddClinician')"
            @click="goAddClinician"
          />
          <q-btn
            v-if="canChangeStatus"
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            icon="sync"
            :data-testid="staffListTestIds.changeStatus"
            :disable="selected.length === 0 || loading"
            :label="t('changeStatus')"
            @click="openBulkChangeStatus"
          />
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline admin-list-page__filters-btn"
            icon="filter_alt"
            :data-testid="staffListTestIds.filters"
            :disable="loading"
            :label="filtersButtonLabel"
            @click="filtersOpen = true"
          />
        </div>
      </template>
    </AdminListPageHeader>

    <StaffListSummaryCards
      class="staff-list-page__summary"
      :metrics="summaryMetrics"
      :active-filter="activeSummaryFilter"
      @filter="onSummaryFilter"
    />

    <AdminTablePanel
      class="admin-list-page__table-panel"
      inline-column-settings
      :show-column-settings="false"
      :column-settings-test-id="adminTableTestIds.columnSettings"
      @open-column-settings="columnSettingsOpen = true">
      <AdminQTable
        class="table admin-data-table admin-data-table--inline-column-settings"
        flat
        selection="multiple"
        row-key="id"
        v-model:selected="selected"
        v-model:pagination="tablePagination"
        :rows-per-page-options="[20, 50, 100, 0]"
        :grid="showGrid"
        :rows="rows"
        :columns="visibleColumns"
        :loading="false"
        hide-bottom>
        <template #header-cell-actions="scope">
          <q-th
            :props="scope"
            class="admin-data-table__actions-header-cell">
            <AdminTableColumnSettingsHeader
              :label="scope.col.label"
              :test-id="adminTableTestIds.columnSettings"
              @open="columnSettingsOpen = true"
            />
          </q-th>
        </template>

        <template #body-cell-staffNo="scope">
          <q-td
            :props="scope"
            class="admin-data-table__primary-cell">
            <button
              type="button"
              class="admin-data-table__link"
              :data-testid="staffListTestIds.rowView(scope.row.id)"
              @click="viewRow(scope.row)">
              <AdminTableSearchHighlight
                :text="scope.row[fk.staffNo] || '—'"
                :query="highlightQuery"
              />
            </button>
          </q-td>
        </template>

        <template #body-cell-name="scope">
          <q-td
            :props="scope"
            class="admin-data-table__primary-cell">
            <AdminTableSearchHighlight
              :text="scope.row[fk.name] || '—'"
              :query="highlightQuery"
            />
          </q-td>
        </template>

        <template #body-cell-email="scope">
          <q-td
            :props="scope"
            class="admin-data-table__secondary-cell">
            <AdminTableSearchHighlight
              :text="scope.row[fk.email] || '—'"
              :query="highlightQuery"
            />
          </q-td>
        </template>

        <template #body-cell-position="scope">
          <q-td
            :props="scope"
            class="admin-data-table__secondary-cell">
            <AdminTableSearchHighlight
              :text="scope.row[fk.position] || '—'"
              :query="highlightQuery"
            />
          </q-td>
        </template>

        <template #body-cell-role="scope">
          <q-td
            :props="scope"
            class="admin-data-table__secondary-cell">
            <AdminTableSearchHighlight
              :text="scope.row[fk.role] || '—'"
              :query="highlightQuery"
            />
          </q-td>
        </template>

        <template #body-cell-status="scope">
          <q-td :props="scope">
            <AdminTableStatusCell
              :label="scope.row[fk.status]"
              :variant="scope.row.statusVariant"
              :highlight-query="highlightQuery"
            />
          </q-td>
        </template>

        <template #body-cell-clinician="scope">
          <q-td :props="scope" class="staff-list-page__clinician-cell">
            <q-icon
              v-if="scope.row[fk.isClinician]"
              name="check_circle"
              color="positive"
              size="20px"
              :aria-label="t('staffListClinicianYes')"
            />
            <span v-else class="text-grey-6">—</span>
          </q-td>
        </template>

        <template #body-cell-hireDate="scope">
          <q-td
            :props="scope"
            class="admin-data-table__secondary-cell">
            <AdminTableSearchHighlight
              :text="scope.row[fk.hireDate] || '—'"
              :query="highlightQuery"
            />
          </q-td>
        </template>

        <template #row-actions="{ row }">
          <AdminTableRowActions
            :show-view="canViewStaff"
            :show-edit="canEditStaff"
            :show-change-status="false"
            :show-more="canEditStaff"
            :view-test-id="staffListTestIds.rowView(row.id)"
            :edit-test-id="staffListTestIds.rowEdit(row.id)"
            :more-test-id="staffListTestIds.rowMore(row.id)"
            @view="viewRow(row)"
            @edit="editRow(row)">
            <template #more>
              <q-item
                v-if="canEditStaff"
                v-close-popup
                clickable
                :data-testid="staffListTestIds.rowDeactivate(row.id)"
                @click="openDeactivate(row)">
                <q-item-section avatar>
                  <q-icon name="person_off" size="18px" />
                </q-item-section>
                <q-item-section>
                  {{ t('staffListDeactivate') }}
                </q-item-section>
              </q-item>
            </template>
          </AdminTableRowActions>
        </template>

        <template #no-data>
          <div
            class="admin-data-table__empty full-width column flex-center
              text-grey-7 q-gutter-sm q-pa-lg">
            <div class="row items-center q-gutter-sm">
              <q-icon name="inbox" size="md" />
              <span>{{ emptyMessage }}</span>
            </div>
            <div
              v-if="showEmptyActions"
              class="row q-gutter-sm q-mt-sm">
              <q-btn
                v-if="canAddStaff"
                no-caps
                unelevated
                color="primary"
                class="app-btn-primary"
                icon="add"
                :label="t('staffListAddStaff')"
                @click="goAddStaff"
              />
              <q-btn
                v-if="canAddClinician"
                no-caps
                unelevated
                color="primary"
                class="app-btn-primary"
                icon="add"
                :label="t('staffListAddClinician')"
                @click="goAddClinician"
              />
            </div>
          </div>
        </template>
      </AdminQTable>
    </AdminTablePanel>

    <AdminTableColumnSettingsDialog
      v-model="columnSettingsOpen"
      :preferences="columnPreferences"
      :column-labels="columnLabels"
      :default-order="defaultColumnOrder"
      :is-required-column="isRequiredColumn"
      :is-locked-column="isLockedColumn"
      @save="onSaveColumnPreferences"
      @reset="onResetColumnPreferences"
    />

    <StaffFiltersDialog
      v-model="filtersOpen"
      :filters="panelFilters"
      :position-options="positionOptions"
      :role-options="roleOptions"
      @apply="onApplyFilters"
    />

    <StaffChangeStatusDialog
      v-model="changeStatusOpen"
      :selected-count="changeStatusTargetIds.length"
      @confirm="onConfirmChangeStatus"
    />

    <ModalComponent
      v-model="deactivateDialogOpen"
      test-id="staff-deactivate"
      :title="t('staffListDeactivateTitle')"
      :message="t('staffListDeactivateMessage')"
      :confirm-text="t('staffListDeactivate')"
      :cancel-text="t('cancel')"
      @confirm="confirmDeactivate"
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
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  quasarNotifyTypes,
  siteBreakpointsPx,
  staffStatuses,
} from 'components/constants.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTableColumnSettingsDialog from
  'components/admin-table/AdminTableColumnSettingsDialog.vue'
import AdminTableColumnSettingsHeader from
  'components/admin-table/AdminTableColumnSettingsHeader.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminTableRowActions from
  'components/admin-table/AdminTableRowActions.vue'
import AdminTableSearchHighlight from
  'components/admin-table/AdminTableSearchHighlight.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import ModalComponent from 'components/ModalComponent.vue'
import StaffListSummaryCards from 'components/StaffListSummaryCards.vue'
import StaffFiltersDialog from 'components/staff/StaffFiltersDialog.vue'
import StaffChangeStatusDialog from
  'components/staff/StaffChangeStatusDialog.vue'
import { adminTableTestIds } from 'src/test-ids/index.js'
import { staffListTestIds } from 'src/test-ids/index.js'
import { useStaffListColumnPreferences } from
  'src/composables/useStaffListColumnPreferences.js'
import { useStaffListSearch } from
  'src/composables/useStaffListSearch.js'
import { useAppFooterPagination } from
  'src/composables/useAppFooterPagination.js'
import { useStaffPermissions } from
  'src/composables/useStaffPermissions.js'
import {
  staffFieldKeys as fk,
  staffListColumnKeys as col,
} from 'src/utils/staff-list-columns.js'
import {
  countActiveStaffListFilters,
  createEmptyStaffListFilters,
  staffListFiltersToApiPayload,
} from 'src/utils/staff-list-filters.js'
import {
  fetchRolesList,
  fetchStaffSummaryMetrics,
  loadStaffListView,
  patchStaffStatus,
  patchStaffStatusBulk,
} from 'src/utils/staff-api.js'
import {
  catalogItemsFromCatalog,
  fetchCatalogsByNames,
  mapCatalogItemsToSelectOptions,
} from 'src/utils/catalogs.js'

const router = useRouter()
const $q = useQuasar()
const { t } = useI18n()

const {
  canViewStaff,
  canEditStaff,
  canAddStaff,
  canAddClinician,
  canChangeStatus,
} = useStaffPermissions()

const loading = ref(false)
const selected = ref([])
const columnSettingsOpen = ref(false)
const filtersOpen = ref(false)
const changeStatusOpen = ref(false)
const deactivateDialogOpen = ref(false)
const activeSummaryFilter = ref('')
const panelFilters = ref(createEmptyStaffListFilters())
const staffRows = ref([])
const staffPagination = ref(null)
const changeStatusTargetIds = ref([])
const deactivatingRow = ref(null)
const positionOptions = ref([])
const roleOptions = ref([])

const summaryMetrics = ref({
  totalStaff: 0,
  clinicians: 0,
  activeStaff: 0,
  onLeave: 0,
  expiringCredentials: 0,
})

const tablePagination = ref({
  sortBy: col.staffNo,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

const {
  preferences: columnPreferences,
  savePreferences: saveColumnPreferences,
  resetPreferences: resetColumnPreferences,
  buildVisibleColumns,
  isRequiredColumn,
  isLockedColumn,
  defaultOrder: defaultColumnOrder,
} = useStaffListColumnPreferences()

const sourceRows = computed(() => staffRows.value)

const {
  searchQuery,
  setSearchQuery,
  resetSearchQuery,
  isSearchActive,
  highlightQuery,
  rows,
  paginationRowsNumber,
  clearSearchQueryWithoutReload,
} = useStaffListSearch({
  sourceRows,
  tablePagination,
  onQueryChange: () => loadStaffList(tablePagination.value),
})

const filtersButtonLabel = computed(() => {
  const count = countActiveStaffListFilters(panelFilters.value)
  if (!count) {
    return t('filters')
  }

  return t('staffListFiltersActive', { count })
})

const emptyMessage = computed(() =>
  isSearchActive.value || countActiveStaffListFilters(panelFilters.value)
    ? t('staffListSearchEmpty')
    : t('staffListEmpty'),
)

const showEmptyActions = computed(() =>
  !isSearchActive.value
  && !countActiveStaffListFilters(panelFilters.value)
  && !activeSummaryFilter.value,
)

const showGrid = computed(() => $q.screen.width <= siteBreakpointsPx.XXS)

const allColumns = computed(() => [
  {
    name: col.staffNo,
    required: true,
    label: t('staffListColStaffNo'),
    align: 'left',
    field: row => row[fk.staffNo],
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: col.name,
    required: true,
    label: t('name'),
    align: 'left',
    field: row => row[fk.name],
    sortable: false,
    headerStyle: 'min-width: 180px',
    style: 'min-width: 180px',
  },
  {
    name: col.email,
    required: true,
    label: t('email'),
    align: 'left',
    field: row => row[fk.email],
    sortable: false,
    headerStyle: 'min-width: 200px',
    style: 'min-width: 200px',
  },
  {
    name: col.position,
    required: false,
    label: t('staffListColPosition'),
    align: 'left',
    field: row => row[fk.position],
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
  },
  {
    name: col.role,
    required: false,
    label: t('staffListColRole'),
    align: 'left',
    field: row => row[fk.role],
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: col.status,
    required: true,
    label: t('status'),
    align: 'left',
    field: row => row[fk.status],
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: col.clinician,
    required: false,
    label: t('staffListColClinician'),
    align: 'center',
    field: row => row[fk.isClinician],
    sortable: false,
    headerStyle: 'min-width: 96px',
    style: 'min-width: 96px',
  },
  {
    name: col.hireDate,
    required: false,
    label: t('staffListColHireDate'),
    align: 'left',
    field: row => row[fk.hireDate],
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: col.actions,
    required: true,
    label: t('actions'),
    align: 'center',
    field: row => row.id,
    sortable: false,
    headerStyle: 'min-width: 132px',
    style: 'min-width: 132px',
  },
])

const columnLabels = computed(() =>
  Object.fromEntries(
    allColumns.value.map(column => [column.name, column.label]),
  ),
)

const visibleColumns = computed(() =>
  buildVisibleColumns(allColumns.value),
)

function resolveApiLimit(rowsPerPage) {
  if (rowsPerPage === 0) {
    return 10000
  }

  return rowsPerPage
}

function staffTablePaginationFromStore(paginationPayload) {
  const meta = staffPagination.value
  const total = meta?.total != null && Number.isFinite(Number(meta.total))
    ? Number(meta.total)
    : staffRows.value.length
  let resolvedPage = paginationPayload.page
  if (meta && Number.isFinite(Number(meta.page))) {
    resolvedPage = Number(meta.page) + 1
  } else if (meta?.limit > 0 && Number.isFinite(meta.offset)) {
    resolvedPage = Math.floor(Number(meta.offset) / Number(meta.limit)) + 1
  }

  return {
    sortBy: paginationPayload.sortBy,
    descending: paginationPayload.descending,
    page: resolvedPage,
    rowsPerPage: paginationPayload.rowsPerPage,
    rowsNumber: total,
  }
}

async function loadSummaryMetrics() {
  try {
    summaryMetrics.value = await fetchStaffSummaryMetrics({
      panelFilters: panelFilters.value,
    })
  } catch {
    summaryMetrics.value = {
      totalStaff: 0,
      clinicians: 0,
      activeStaff: 0,
      onLeave: 0,
      expiringCredentials: 0,
    }
  }
}

async function loadStaffList(paginationPayload) {
  loading.value = true
  try {
    const limit = resolveApiLimit(paginationPayload.rowsPerPage)
    const { rows: nextRows, pagination } = await loadStaffListView({
      page: Math.max(0, paginationPayload.page - 1),
      limit,
      q: searchQuery.value,
      summaryFilter: activeSummaryFilter.value || null,
      filters: panelFilters.value,
      t,
    })
    staffRows.value = nextRows
    staffPagination.value = pagination
    tablePagination.value = staffTablePaginationFromStore(paginationPayload)
    await loadSummaryMetrics()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('staffListError'),
      })
    }
  } finally {
    loading.value = false
    syncFooterPaginationBar()
  }
}

function onSaveColumnPreferences(prefs) {
  saveColumnPreferences(prefs)
}

function onResetColumnPreferences() {
  resetColumnPreferences()
}

function goAddStaff() {
  router.push({ name: 'AddStaff' })
}

function goAddClinician() {
  router.push({ name: 'AddClinician' })
}

function viewRow(row) {
  router.push({ name: 'StaffProfile', params: { id: row.id } })
}

function editRow(row) {
  router.push({ name: 'EditStaff', params: { id: row.id } })
}

function openBulkChangeStatus() {
  changeStatusTargetIds.value = selected.value.map(row => row.id)
  changeStatusOpen.value = true
}

function openDeactivate(row) {
  deactivatingRow.value = row
  deactivateDialogOpen.value = true
}

async function onConfirmChangeStatus(status) {
  const ids = changeStatusTargetIds.value
  if (!ids.length) {
    return
  }
  loading.value = true
  try {
    await patchStaffStatusBulk(ids, status)
    selected.value = []
    changeStatusTargetIds.value = []
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('staffChangeStatusSuccess'),
      position: 'top',
    })
    await loadStaffList(tablePagination.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('staffChangeStatusError'),
      })
    }
  } finally {
    loading.value = false
  }
}

async function confirmDeactivate() {
  const row = deactivatingRow.value
  if (!row?.id) {
    return
  }
  loading.value = true
  try {
    await patchStaffStatus(row.id, staffStatuses.inactive)
    deactivatingRow.value = null
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('staffListDeactivateSuccess'),
      position: 'top',
    })
    await loadStaffList(tablePagination.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('staffListDeactivateError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function onSummaryFilter(cardId) {
  if (isSearchActive.value) {
    clearSearchQueryWithoutReload()
  }
  activeSummaryFilter.value = activeSummaryFilter.value === cardId
    ? ''
    : cardId
  tablePagination.value = {
    ...tablePagination.value,
    page: 1,
  }
  loadStaffList(tablePagination.value)
}

function onApplyFilters(nextFilters) {
  panelFilters.value = staffListFiltersToApiPayload(nextFilters)
  if (activeSummaryFilter.value) {
    activeSummaryFilter.value = ''
  }
  tablePagination.value = {
    ...tablePagination.value,
    page: 1,
  }
  loadStaffList(tablePagination.value)
}

function onPageChange(page) {
  if (page === tablePagination.value.page) {
    return
  }
  tablePagination.value = {
    ...tablePagination.value,
    page,
  }
  loadStaffList(tablePagination.value)
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
  loadStaffList(tablePagination.value)
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
    rowsNumber: paginationRowsNumber.value,
    disable: loading.value,
    onPageChange,
    onRowsPerPageChange,
  })
}

async function loadFilterOptions() {
  try {
    const catalogs = await fetchCatalogsByNames(['staff_position'])
    const positionCatalog = catalogs.staff_position
    positionOptions.value = positionCatalog
      ? mapCatalogItemsToSelectOptions(
        catalogItemsFromCatalog(positionCatalog),
      )
      : []
  } catch {
    positionOptions.value = []
  }

  try {
    roleOptions.value = await fetchRolesList()
  } catch {
    roleOptions.value = []
  }
}

watch(loading, () => {
  syncFooterPaginationBar()
})

onMounted(async() => {
  setFooterPagination({
    page: tablePagination.value.page,
    rowsPerPage: tablePagination.value.rowsPerPage,
    rowsNumber: paginationRowsNumber.value,
    rowsPerPageChoices: [20, 50, 100, 0],
    disable: loading.value,
    summaryKey: 'staffListPaginationSummary',
    perPageKey: 'adminTablePerPage',
    onPageChange,
    onRowsPerPageChange,
  })
  loading.value = true
  try {
    await loadFilterOptions()
    await loadStaffList(tablePagination.value)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  clearFooterPagination()
})
</script>
