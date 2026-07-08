<template>
  <q-page
    class="admin-page admin-list-page service-procedure-list-page"
    :data-testid="serviceProcedureListTestIds.page">
    <AppLoadingOverlay
      scope="content"
      :showing="loading"
    />

    <AdminListPageHeader
      :title="t('serviceProcedureListTitle')"
      :subtitle="t('serviceProcedureListSubtitle')">
      <template #center>
        <div
          class="service-procedure-list-page__toolbar
            row items-center no-wrap">
          <q-input
            :model-value="searchQuery"
            outlined
            clearable
            hide-bottom-space
            class="admin-list-page__search-input
              service-procedure-list-page__search"
            :data-testid="serviceProcedureListTestIds.search"
            :disable="loading"
            :placeholder="t('serviceProcedureListSearchPlaceholder')"
            :aria-label="t('serviceProcedureListSearchPlaceholder')"
            @update:model-value="onSearchInput"
            @clear="resetSearch">
            <template #prepend>
              <q-icon name="search" size="18px" />
            </template>
          </q-input>
          <FormSelect
            :model-value="categoryFilter"
            :options="categoryFilterOptions"
            clearable
            outlined
            hide-bottom-space
            class="service-procedure-list-page__filter"
            :disable="loading"
            :test-id="serviceProcedureListTestIds.categoryFilter"
            @update:model-value="onCategoryFilterChange"
          />
        </div>
      </template>
      <template #actions>
        <div
          class="admin-list-page__actions row items-center
            q-gutter-sm no-wrap">
          <q-btn
            v-if="canAddServiceProcedure"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :data-testid="serviceProcedureListTestIds.add"
            :disable="loading"
            :label="t('serviceProcedureListAdd')"
            @click="openAddDialog"
          />
        </div>
      </template>
    </AdminListPageHeader>

    <AdminTablePanel class="admin-list-page__table-panel">
      <AdminQTable
        class="table admin-data-table"
        flat
        row-key="id"
        v-model:pagination="tablePagination"
        :rows-per-page-options="[20, 50, 100]"
        :grid="showGrid"
        :rows="rows"
        :columns="visibleColumns"
        :loading="false">
        <template #body-cell-name="scope">
          <q-td :props="scope" class="admin-data-table__primary-cell">
            <button
              v-if="canViewServiceProcedures"
              type="button"
              class="admin-data-table__link"
              :data-testid="serviceProcedureListTestIds.rowView(scope.row.id)"
              @click="viewRow(scope.row)">
              {{ scope.row[fk.name] || '—' }}
            </button>
            <span v-else>{{ scope.row[fk.name] || '—' }}</span>
          </q-td>
        </template>

        <template #body-cell-category="scope">
          <q-td
            :props="scope"
            class="admin-data-table__secondary-cell">
            {{ scope.row.categoryLabel || '—' }}
          </q-td>
        </template>

        <template #body-cell-duration="scope">
          <q-td :props="scope">
            {{ scope.row.durationLabel || '—' }}
          </q-td>
        </template>

        <template #body-cell-requiresAppointment="scope">
          <q-td :props="scope">
            {{ scope.row.requiresAppointmentLabel || '—' }}
          </q-td>
        </template>

        <template #body-cell-codes="scope">
          <q-td
            :props="scope"
            class="admin-data-table__secondary-cell">
            {{ scope.row.codesLabel || '—' }}
          </q-td>
        </template>

        <template #body-cell-status="scope">
          <q-td :props="scope">
            <AdminTableStatusCell
              :label="scope.row.statusLabel"
              :variant="scope.row.statusVariant"
            />
          </q-td>
        </template>

        <template #row-actions="{ row }">
          <AdminTableRowActions
            :show-view="canViewServiceProcedures"
            :show-edit="canEditServiceProcedures"
            :show-more="canChangeServiceProcedureStatus"
            :view-test-id="serviceProcedureListTestIds.rowView(row.id)"
            :edit-test-id="serviceProcedureListTestIds.rowEdit(row.id)"
            :more-test-id="serviceProcedureListTestIds.rowMore(row.id)"
            @view="viewRow(row)"
            @edit="editRow(row)">
            <template #more>
              <q-item
                v-if="canChangeServiceProcedureStatus"
                v-close-popup
                clickable
                :data-testid="serviceProcedureListTestIds.rowToggle(row.id)"
                @click="toggleStatus(row)">
                <q-item-section>
                  {{ row.statusVariant === 'active'
                    ? t('serviceProcedureDeactivate')
                    : t('serviceProcedureActivate') }}
                </q-item-section>
              </q-item>
            </template>
          </AdminTableRowActions>
        </template>

        <template #no-data>
          <div
            class="full-width row flex-center text-grey-7
              q-gutter-sm q-pa-lg">
            <q-icon name="inbox" size="md" />
            <span>{{ t('serviceProcedureListEmpty') }}</span>
          </div>
        </template>
      </AdminQTable>
    </AdminTablePanel>

    <ServiceProcedureDialog
      v-model="dialogOpen"
      :mode="dialogMode"
      :service-procedure="activeServiceProcedure"
      :saving="dialogSaving"
      @save="onDialogSave"
      @cancel="closeDialog"
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
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  quasarNotifyTypes,
  serviceProcedureFieldKeys as fk,
  serviceProcedureListColumnKeys as col,
  serviceProcedureStatusValues,
  siteBreakpointsPx,
} from 'components/constants.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminTableRowActions from
  'components/admin-table/AdminTableRowActions.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import FormSelect from 'components/FormSelect.vue'
import ServiceProcedureDialog from
  'components/admin/ServiceProcedureDialog.vue'
import { useAppFooterPagination } from
  'src/composables/useAppFooterPagination.js'
import {
  buildServiceProcedureCategoryOptions,
  useServiceProcedurePermissions,
} from 'src/composables/useServiceProcedurePermissions.js'
import {
  createServiceProcedure,
  fetchServiceProcedureById,
  listServiceProcedures,
  serviceProcedureApiErrorMessage,
  updateServiceProcedure,
  updateServiceProcedureStatus,
} from 'src/utils/service-procedure-api.js'
import { serviceProcedureListTestIds } from 'src/test-ids/index.js'

const { t } = useI18n()
const $q = useQuasar()
const route = useRoute()

const {
  canViewServiceProcedures,
  canEditServiceProcedures,
  canAddServiceProcedure,
  canChangeServiceProcedureStatus,
} = useServiceProcedurePermissions()

const loading = ref(false)
const rows = ref([])
const searchQuery = ref('')
const categoryFilter = ref(null)
const dialogOpen = ref(false)
const dialogMode = ref('add')
const dialogSaving = ref(false)
const activeServiceProcedure = ref(null)
let searchDebounceTimer = null

const tablePagination = ref({
  sortBy: col.name,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

const showGrid = computed(() => $q.screen.width < siteBreakpointsPx.MD)

const categoryFilterOptions = computed(() =>
  buildServiceProcedureCategoryOptions(t),
)

const visibleColumns = computed(() => [
  {
    name: col.name,
    label: t('serviceProcedureNameLabel'),
    align: 'left',
    field: row => row[fk.name],
    sortable: false,
    headerStyle: 'min-width: 200px',
    style: 'min-width: 200px',
  },
  {
    name: col.category,
    label: t('serviceProcedureCategoryLabel'),
    align: 'left',
    field: row => row.categoryLabel,
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
    classes: 'admin-data-table__secondary-cell',
  },
  {
    name: col.duration,
    label: t('serviceProcedureDurationColumnLabel'),
    align: 'left',
    field: row => row.durationLabel,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: col.requiresAppointment,
    label: t('serviceProcedureRequiresAppointmentShortLabel'),
    align: 'left',
    field: row => row.requiresAppointmentLabel,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: col.codes,
    label: t('serviceProcedureCodesColumnLabel'),
    align: 'left',
    field: row => row.codesLabel,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
    classes: 'admin-data-table__secondary-cell',
  },
  {
    name: col.status,
    label: t('status'),
    align: 'left',
    field: row => row.statusLabel,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: col.actions,
    label: t('actions'),
    align: 'center',
    field: () => '',
    sortable: false,
    headerStyle: 'min-width: 132px',
    style: 'min-width: 132px',
  },
])

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

async function loadServiceProcedures(paginationPayload) {
  loading.value = true
  try {
    const result = await listServiceProcedures({
      page: paginationPayload.page,
      limit: paginationPayload.rowsPerPage,
      search: searchQuery.value,
      category: categoryFilter.value ?? undefined,
    }, t)
    rows.value = result.items
    tablePagination.value = tablePaginationFromMeta(
      paginationPayload,
      result.pagination,
    )
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('serviceProcedureListError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function reloadCurrentPage() {
  return loadServiceProcedures(tablePagination.value)
}

function onPageChange(page) {
  if (page === tablePagination.value.page) {
    return
  }
  tablePagination.value = { ...tablePagination.value, page }
  void reloadCurrentPage()
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
  void reloadCurrentPage()
}

function onSearchInput(value) {
  searchQuery.value = String(value ?? '')
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  searchDebounceTimer = setTimeout(() => {
    tablePagination.value = { ...tablePagination.value, page: 1 }
    void reloadCurrentPage()
  }, 300)
}

function resetSearch() {
  searchQuery.value = ''
  tablePagination.value = { ...tablePagination.value, page: 1 }
  void reloadCurrentPage()
}

function onCategoryFilterChange(value) {
  categoryFilter.value = value ?? null
  tablePagination.value = { ...tablePagination.value, page: 1 }
  void reloadCurrentPage()
}

function openAddDialog() {
  activeServiceProcedure.value = null
  dialogMode.value = 'add'
  dialogOpen.value = true
}

async function openRowDialog(mode, row) {
  dialogMode.value = mode
  dialogSaving.value = false
  try {
    loading.value = true
    activeServiceProcedure.value = await fetchServiceProcedureById(row.id)
    dialogOpen.value = true
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('serviceProcedureLoadError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function viewRow(row) {
  void openRowDialog('view', row)
}

function editRow(row) {
  void openRowDialog('edit', row)
}

function closeDialog() {
  dialogOpen.value = false
  activeServiceProcedure.value = null
}

function resolveSaveErrorMessage(error) {
  const code = serviceProcedureApiErrorMessage(error)
  if (code === 'SERVICE_PROCEDURE_NAME_DUPLICATE') {
    return t('serviceProcedureNameDuplicate')
  }

  return t('serviceProcedureSaveError')
}

async function onDialogSave(form) {
  dialogSaving.value = true
  try {
    if (dialogMode.value === 'add') {
      await createServiceProcedure(form)
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('serviceProcedureCreateSuccess'),
      })
    } else {
      await updateServiceProcedure(form.id, form)
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('serviceProcedureUpdateSuccess'),
      })
    }
    closeDialog()
    await reloadCurrentPage()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: resolveSaveErrorMessage(error),
      })
    }
  } finally {
    dialogSaving.value = false
  }
}

async function toggleStatus(row) {
  const nextStatus = row.statusVariant === 'active'
    ? serviceProcedureStatusValues.inactive
    : serviceProcedureStatusValues.active
  loading.value = true
  try {
    await updateServiceProcedureStatus(row.id, nextStatus)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: nextStatus === serviceProcedureStatusValues.active
        ? t('serviceProcedureActivateSuccess')
        : t('serviceProcedureDeactivateSuccess'),
    })
    await reloadCurrentPage()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('serviceProcedureStatusError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function maybeOpenAddFromRoute() {
  if (route.meta?.serviceProcedureListAutoOpen === 'add'
    && canAddServiceProcedure.value) {
    openAddDialog()
  }
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

watch(() => route.name, () => {
  maybeOpenAddFromRoute()
})

watch(loading, () => {
  syncFooterPaginationBar()
})

watch(
  () => [
    tablePagination.value.page,
    tablePagination.value.rowsPerPage,
    tablePagination.value.rowsNumber,
  ],
  () => {
    syncFooterPaginationBar()
  },
)

onMounted(async() => {
  setFooterPagination({
    page: tablePagination.value.page,
    rowsPerPage: tablePagination.value.rowsPerPage,
    rowsNumber: tablePagination.value.rowsNumber,
    disable: loading.value,
    summaryKey: 'serviceProcedureListPaginationSummary',
    perPageKey: 'adminTablePerPage',
    onPageChange,
    onRowsPerPageChange,
  })
  await reloadCurrentPage()
  maybeOpenAddFromRoute()
})

onBeforeUnmount(() => {
  clearFooterPagination()
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
})
</script>
