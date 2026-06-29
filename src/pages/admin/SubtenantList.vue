<template>
  <q-page
    class="admin-page admin-list-page subtenant-list-page"
    :data-testid="subtenantListTestIds.page">
    <AppLoadingOverlay
      scope="content"
      :showing="loading"
    />

    <AdminListPageHeader
      :title="t('subtenantListTitle')"
      :subtitle="t('subtenantListSubtitle')">
      <template #actions>
        <div
          class="admin-list-page__actions row items-center
            q-gutter-sm no-wrap">
          <q-btn
            v-if="canAddSubtenant"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :data-testid="subtenantListTestIds.add"
            :disable="loading"
            :label="t('subtenantListAdd')"
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
              v-if="canViewSubtenants"
              type="button"
              class="admin-data-table__link"
              :data-testid="subtenantListTestIds.rowView(scope.row.id)"
              @click="viewRow(scope.row)">
              {{ scope.row[fk.name] || '—' }}
            </button>
            <span v-else>{{ scope.row[fk.name] || '—' }}</span>
          </q-td>
        </template>

        <template #body-cell-code="scope">
          <q-td
            :props="scope"
            class="admin-data-table__secondary-cell">
            {{ scope.row[fk.code] || '—' }}
          </q-td>
        </template>

        <template #body-cell-main="scope">
          <q-td :props="scope">
            {{ scope.row.mainLabel || '—' }}
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
            :show-view="canViewSubtenants"
            :show-edit="canEditSubtenants"
            :show-more="canDeleteSubtenant"
            :view-test-id="subtenantListTestIds.rowView(row.id)"
            :edit-test-id="subtenantListTestIds.rowEdit(row.id)"
            :more-test-id="subtenantListTestIds.rowMore(row.id)"
            @view="viewRow(row)"
            @edit="editRow(row)">
            <template #more>
              <q-item
                v-if="canDeleteSubtenant"
                v-close-popup
                clickable
                :data-testid="subtenantListTestIds.rowDelete(row.id)"
                @click="confirmDelete(row)">
                <q-item-section>{{ t('delete') }}</q-item-section>
              </q-item>
            </template>
          </AdminTableRowActions>
        </template>

        <template #no-data>
          <div
            class="full-width row flex-center text-grey-7
              q-gutter-sm q-pa-lg">
            <q-icon name="inbox" size="md" />
            <span>{{ t('subtenantListEmpty') }}</span>
          </div>
        </template>
      </AdminQTable>
    </AdminTablePanel>

    <SubtenantDialog
      v-model="dialogOpen"
      :mode="dialogMode"
      :subtenant="activeSubtenant"
      :saving="dialogSaving"
      @save="onDialogSave"
      @cancel="closeDialog"
    />

    <ModalComponent
      v-model="deleteConfirmOpen"
      :title="t('subtenantDeleteTitle')"
      :message="deleteConfirmMessage"
      :confirm-text="t('delete')"
      :cancel-text="t('cancel')"
      test-id="subtenant-delete"
      @confirm="onDeleteConfirm"
      @cancel="deleteConfirmOpen = false"
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
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  quasarNotifyTypes,
  siteBreakpointsPx,
  subtenantFieldKeys,
  subtenantListColumnKeys,
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
import ModalComponent from 'components/ModalComponent.vue'
import SubtenantDialog from 'components/admin/SubtenantDialog.vue'
import { useAppFooterPagination } from
  'src/composables/useAppFooterPagination.js'
import { useSubtenantPermissions } from
  'src/composables/useSubtenantPermissions.js'
import {
  createSubtenant,
  deleteSubtenant,
  fetchSubtenantById,
  listSubtenants,
  subtenantApiErrorMessage,
  updateSubtenant,
} from 'src/utils/subtenant-api.js'
import { syncAuthSubtenantsFromApi } from 'src/utils/sync-auth-subtenants.js'
import { subtenantListTestIds } from 'src/test-ids/index.js'

const { t } = useI18n()
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const fk = subtenantFieldKeys
const col = subtenantListColumnKeys

const {
  canViewSubtenants,
  canEditSubtenants,
  canAddSubtenant,
  canDeleteSubtenant,
} = useSubtenantPermissions()

const loading = ref(false)
const rows = ref([])
const listPagination = ref(null)
const dialogOpen = ref(false)
const dialogMode = ref('add')
const dialogSaving = ref(false)
const activeSubtenant = ref(null)
const deleteConfirmOpen = ref(false)
const pendingDeleteSubtenant = ref(null)

const tablePagination = ref({
  sortBy: col.name,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

const showGrid = computed(() => $q.screen.width < siteBreakpointsPx.MD)

const visibleColumns = computed(() => [
  {
    name: col.name,
    label: t('subtenantNameLabel'),
    align: 'left',
    field: row => row[fk.name],
    sortable: false,
    headerStyle: 'min-width: 200px',
    style: 'min-width: 200px',
  },
  {
    name: col.code,
    label: t('subtenantCodeLabel'),
    align: 'left',
    field: row => row[fk.code],
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
    classes: 'admin-data-table__secondary-cell',
  },
  {
    name: col.main,
    label: t('subtenantMainLabel'),
    align: 'left',
    field: row => row.mainLabel,
    sortable: false,
    headerStyle: 'min-width: 100px',
    style: 'min-width: 100px',
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

const deleteConfirmMessage = computed(() => {
  const name = pendingDeleteSubtenant.value?.[fk.name]
  if (!name) {
    return t('subtenantDeleteMessageGeneric')
  }

  return t('subtenantDeleteMessage', { name })
})

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

async function loadSubtenants(paginationPayload) {
  loading.value = true
  try {
    const result = await listSubtenants({
      page: paginationPayload.page,
      limit: paginationPayload.rowsPerPage,
    }, t)
    rows.value = result.items
    listPagination.value = result.pagination
    tablePagination.value = tablePaginationFromMeta(
      paginationPayload,
      result.pagination,
    )
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('subtenantListError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function onPageChange(page) {
  if (page === tablePagination.value.page) {
    return
  }
  tablePagination.value = { ...tablePagination.value, page }
  loadSubtenants(tablePagination.value)
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
  loadSubtenants(tablePagination.value)
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

function openAddDialog() {
  dialogMode.value = 'add'
  activeSubtenant.value = null
  dialogOpen.value = true
}

function maybeOpenAddFromRoute() {
  if (route.meta.subtenantListAutoOpen === 'add' && canAddSubtenant.value) {
    openAddDialog()
  }
}

async function viewRow(row) {
  dialogMode.value = 'view'
  try {
    activeSubtenant.value = await fetchSubtenantById(row.id)
    dialogOpen.value = true
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: subtenantApiErrorMessage(error, t('subtenantLoadError')),
      })
    }
  }
}

async function editRow(row) {
  dialogMode.value = 'edit'
  try {
    activeSubtenant.value = await fetchSubtenantById(row.id)
    dialogOpen.value = true
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: subtenantApiErrorMessage(error, t('subtenantLoadError')),
      })
    }
  }
}

function closeDialog() {
  dialogOpen.value = false
  activeSubtenant.value = null
  if (route.name === 'AdminSubtenantsAdd') {
    router.replace({ name: 'AdminSubtenantsList' })
  }
}

function confirmDelete(row) {
  pendingDeleteSubtenant.value = row
  deleteConfirmOpen.value = true
}

async function onDeleteConfirm() {
  deleteConfirmOpen.value = false
  const row = pendingDeleteSubtenant.value
  pendingDeleteSubtenant.value = null
  if (!row?.id) {
    return
  }
  loading.value = true
  try {
    await deleteSubtenant(row.id)
    await syncAuthSubtenantsFromApi()
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('subtenantDeleteSuccess'),
    })
    await loadSubtenants(tablePagination.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: subtenantApiErrorMessage(error, t('subtenantDeleteError')),
      })
    }
  } finally {
    loading.value = false
  }
}

async function onDialogSave(form) {
  dialogSaving.value = true
  try {
    if (dialogMode.value === 'add') {
      const created = await createSubtenant(form)
      await syncAuthSubtenantsFromApi()
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('subtenantCreateSuccess', { code: created.code }),
      })
    } else {
      await updateSubtenant(form.id, form)
      await syncAuthSubtenantsFromApi()
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('subtenantUpdateSuccess'),
      })
    }
    closeDialog()
    await loadSubtenants(tablePagination.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: subtenantApiErrorMessage(error, t('subtenantSaveError')),
      })
    }
  } finally {
    dialogSaving.value = false
  }
}

onMounted(async() => {
  setFooterPagination({
    page: tablePagination.value.page,
    rowsPerPage: tablePagination.value.rowsPerPage,
    rowsNumber: tablePagination.value.rowsNumber,
    disable: loading.value,
    summaryKey: 'subtenantListPaginationSummary',
    perPageKey: 'adminTablePerPage',
    onPageChange,
    onRowsPerPageChange,
  })
  await loadSubtenants(tablePagination.value)
  maybeOpenAddFromRoute()
})

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

onBeforeUnmount(() => {
  clearFooterPagination()
})
</script>
