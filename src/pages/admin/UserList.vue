<template>
  <q-page
    class="admin-page admin-list-page user-list-page"
    :data-testid="userListTestIds.page">
    <AppLoadingOverlay
      scope="content"
      :showing="loading"
    />

    <AdminListPageHeader
      :title="t('users')"
      :subtitle="t('userListSubtitle')">
      <template #center>
        <q-input
          :model-value="searchQuery"
          outlined
          clearable
          hide-bottom-space
          class="admin-list-page__search-input user-list-page__search"
          :data-testid="userListTestIds.search"
          :disable="loading"
          :placeholder="t('userListSearchPlaceholder')"
          :aria-label="t('userListSearchPlaceholder')"
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
            v-if="canAddUser"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :data-testid="userListTestIds.addUser"
            :disable="loading"
            :label="t('addUser')"
            @click="openAddDialog"
          />
        </div>
      </template>
    </AdminListPageHeader>

    <AdminTablePanel
      class="admin-list-page__table-panel"
      inline-column-settings
      :show-column-settings="false"
      :column-settings-test-id="adminTableTestIds.columnSettings"
      @open-column-settings="columnSettingsOpen = true">
      <AdminQTable
        class="table admin-data-table admin-data-table--inline-column-settings"
        flat
        row-key="id"
        binary-state-sort
        v-model:pagination="tablePagination"
        :rows-per-page-options="[20, 50, 100]"
        :grid="showGrid"
        :rows="rows"
        :columns="visibleColumns"
        :loading="false"
        @request="onTableRequest">
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

        <template #body-cell-name="scope">
          <q-td :props="scope" class="admin-data-table__primary-cell">
            <button
              type="button"
              class="admin-data-table__link"
              :data-testid="userListTestIds.rowView(scope.row.id)"
              @click="viewRow(scope.row)">
              <AdminTableSearchHighlight
                :text="scope.row[uk.name] || '—'"
                :query="highlightQuery"
              />
            </button>
          </q-td>
        </template>

        <template #body-cell-email="scope">
          <q-td
            :props="scope"
            class="admin-data-table__secondary-cell">
            <AdminTableSearchHighlight
              :text="scope.row[uk.email] || '—'"
              :query="highlightQuery"
            />
          </q-td>
        </template>

        <template #body-cell-role="scope">
          <q-td
            :props="scope"
            class="admin-data-table__secondary-cell">
            <AdminTableSearchHighlight
              :text="scope.row[uk.role] || '—'"
              :query="highlightQuery"
            />
          </q-td>
        </template>

        <template #body-cell-status="scope">
          <q-td :props="scope">
            <AdminTableStatusCell
              :label="scope.row[uk.status]"
              :variant="scope.row.statusVariant"
              :highlight-query="highlightQuery"
            />
          </q-td>
        </template>

        <template #body-cell-lastLogin="scope">
          <q-td
            :props="scope"
            class="admin-data-table__secondary-cell">
            <AdminTableSearchHighlight
              :text="scope.row[uk.lastLogin] || '—'"
              :query="highlightQuery"
            />
          </q-td>
        </template>

        <template #row-actions="{ row }">
          <AdminTableRowActions
            :show-view="canViewUsers"
            :show-edit="canEditUser"
            :show-more="canDeleteUser"
            :view-test-id="userListTestIds.rowView(row.id)"
            :edit-test-id="userListTestIds.rowEdit(row.id)"
            :more-test-id="userListTestIds.rowMore(row.id)"
            @view="viewRow(row)"
            @edit="editRow(row)">
            <template #more>
              <q-item
                v-if="canDeleteUser"
                v-close-popup
                clickable
                :data-testid="userListTestIds.rowDelete(row.id)"
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
            <span>
              {{
                isSearchActive
                  ? t('userListSearchEmpty')
                  : t('userListEmpty')
              }}
            </span>
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

    <UserDialog
      v-model="dialogOpen"
      :mode="dialogMode"
      :user="activeUser"
      :saving="dialogSaving"
      @save="onDialogSave"
      @cancel="closeDialog"
    />

    <ModalComponent
      v-model="deleteConfirmOpen"
      :title="t('userDeleteTitle')"
      :message="deleteConfirmMessage"
      :confirm-text="t('delete')"
      :cancel-text="t('cancel')"
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
import { useQuasar } from 'quasar'
import {
  quasarNotifyTypes,
  siteBreakpointsPx,
  userFieldKeys,
  userListColumnKeys,
} from 'components/constants.js'
import { useAdminStore } from 'stores/admin-store.js'
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
import UserDialog from 'components/UserDialog.vue'
import { adminTableIds } from 'src/constants/admin-table.js'
import { useAdminTableColumnPreferences } from
  'src/composables/useAdminTableColumnPreferences.js'
import { useAppFooterPagination } from
  'src/composables/useAppFooterPagination.js'
import { useUserPermissions } from 'src/composables/useUserPermissions.js'
import {
  USER_LIST_SEARCH_DEBOUNCE_MS,
  USER_LIST_SEARCH_MIN_LENGTH,
  isUserListServerSearchQuery,
} from 'src/utils/user-list-search.js'
import { useAuthStore } from 'stores/auth-store.js'
import { cloneUser, userToFormPayload } from 'src/utils/user-orders.js'
import {
  adminTableTestIds,
  userListTestIds,
} from 'src/test-ids/index.js'

const { t } = useI18n()
const $q = useQuasar()
const adminStore = useAdminStore()
const authStore = useAuthStore()
const uk = userFieldKeys
const col = userListColumnKeys

const {
  canViewUsers,
  canAddUser,
  canEditUser,
  canDeleteUser,
} = useUserPermissions()

const loading = ref(false)
const columnSettingsOpen = ref(false)
const dialogOpen = ref(false)
const dialogMode = ref('add')
const dialogSaving = ref(false)
const activeUser = ref(null)
const deleteConfirmOpen = ref(false)
const pendingDeleteUser = ref(null)

const searchQuery = ref('')
let debounceTimer = null

const tablePagination = ref({
  sortBy: col.name,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

const defaultColumnOrder = [
  col.name,
  col.email,
  col.role,
  col.status,
  col.lastLogin,
  col.actions,
]

const {
  preferences: columnPreferences,
  savePreferences: saveColumnPreferences,
  resetPreferences: resetColumnPreferences,
  buildVisibleColumns,
  isRequiredColumn,
  isLockedColumn,
} = useAdminTableColumnPreferences({
  tableId: adminTableIds.users,
  defaultOrder: defaultColumnOrder,
  requiredColumns: [col.name, col.actions],
  lockedColumns: [col.name, col.actions],
})

const sourceRows = computed(() => adminStore.userList)

const trimmedQuery = computed(() => String(searchQuery.value ?? '').trim())
const isSearchActive = computed(() =>
  isUserListServerSearchQuery(trimmedQuery.value),
)
const highlightQuery = computed(() =>
  isSearchActive.value ? trimmedQuery.value : '',
)
const rows = computed(() => sourceRows.value)

const allColumns = computed(() => [
  {
    name: col.name,
    required: true,
    label: t('userListColName'),
    align: 'left',
    field: row => row[uk.name],
    sortable: true,
    headerStyle: 'min-width: 180px',
    style: 'min-width: 180px',
  },
  {
    name: col.email,
    required: true,
    label: t('email'),
    align: 'left',
    field: row => row[uk.email],
    sortable: true,
    headerStyle: 'min-width: 220px',
    style: 'min-width: 220px',
    classes: 'admin-data-table__secondary-cell',
  },
  {
    name: col.role,
    required: false,
    label: t('userRoles'),
    align: 'left',
    field: row => row[uk.role],
    sortable: true,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
    classes: 'admin-data-table__secondary-cell',
  },
  {
    name: col.status,
    required: true,
    label: t('status'),
    align: 'left',
    field: row => row[uk.status],
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: col.lastLogin,
    required: false,
    label: t('userListColLastLogin'),
    align: 'left',
    field: row => row[uk.lastLogin],
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
    classes: 'admin-data-table__secondary-cell',
  },
  {
    name: col.actions,
    required: true,
    label: t('actions'),
    align: 'center',
    field: row => row.actions,
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

const deleteConfirmMessage = computed(() => {
  const name = pendingDeleteUser.value?.[uk.name]
  if (!name) {
    return t('userDeleteMessageGeneric')
  }

  return t('userDeleteMessage', { name })
})

function tablePaginationFromStore(paginationPayload) {
  const meta = adminStore.userListPagination
  const total = meta?.total != null && Number.isFinite(Number(meta.total))
    ? Number(meta.total)
    : adminStore.userList.length
  let resolvedPage = paginationPayload.page
  if (meta && Number.isFinite(Number(meta.page))) {
    resolvedPage = Number(meta.page) + 1
  } else if (meta && meta.limit > 0 && Number.isFinite(meta.offset)) {
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

async function loadUsers(paginationPayload) {
  loading.value = true
  try {
    await adminStore.getUserList({
      page: paginationPayload.page,
      limit: paginationPayload.rowsPerPage,
      q: isUserListServerSearchQuery(trimmedQuery.value)
        ? trimmedQuery.value
        : null,
    }, t)
    tablePagination.value = tablePaginationFromStore(paginationPayload)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('userListError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function scheduleSearchReload() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    loadUsers({ ...tablePagination.value, page: 1 })
  }, USER_LIST_SEARCH_DEBOUNCE_MS)
}

function setSearchQuery(value) {
  searchQuery.value = value == null ? '' : String(value)
  tablePagination.value = { ...tablePagination.value, page: 1 }
  const q = trimmedQuery.value
  if (!q) {
    scheduleSearchReload()
    return
  }
  if (q.length >= USER_LIST_SEARCH_MIN_LENGTH) {
    scheduleSearchReload()
  }
}

function resetSearchQuery() {
  searchQuery.value = ''
  tablePagination.value = { ...tablePagination.value, page: 1 }
  scheduleSearchReload()
}

function onTableRequest(props) {
  const { pagination } = props
  const sortChanged = pagination.sortBy !== tablePagination.value.sortBy
    || pagination.descending !== tablePagination.value.descending
  if (!sortChanged) {
    return undefined
  }

  return loadUsers({
    ...tablePagination.value,
    sortBy: pagination.sortBy,
    descending: pagination.descending,
    page: 1,
  })
}

function onPageChange(page) {
  if (page === tablePagination.value.page) {
    return
  }
  tablePagination.value = { ...tablePagination.value, page }
  loadUsers(tablePagination.value)
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
  loadUsers(tablePagination.value)
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
  activeUser.value = null
  dialogOpen.value = true
}

function viewRow(row) {
  dialogMode.value = 'view'
  activeUser.value = cloneUser(row)
  dialogOpen.value = true
}

function editRow(row) {
  dialogMode.value = 'edit'
  activeUser.value = cloneUser(row)
  dialogOpen.value = true
}

function closeDialog() {
  dialogOpen.value = false
  activeUser.value = null
}

function confirmDelete(row) {
  pendingDeleteUser.value = row
  deleteConfirmOpen.value = true
}

async function onDeleteConfirm() {
  deleteConfirmOpen.value = false
  const row = pendingDeleteUser.value
  pendingDeleteUser.value = null
  if (!row?.id) {
    return
  }
  loading.value = true
  try {
    await adminStore.deleteUser(row.id, t)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('userDeleteSuccess'),
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('userDeleteError'),
      })
    }
  } finally {
    loading.value = false
  }
}

async function onDialogSave({ user, permissionTreeNodes }) {
  dialogSaving.value = true
  try {
    if (dialogMode.value === 'add') {
      await adminStore.createUser(user, t, {
        activeSubtenantId: authStore.activeSubtenantId,
        permissionTreeNodes,
      })
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('userCreateSuccess'),
      })
    } else {
      const payload = userToFormPayload(user)
      await adminStore.updateUser(user.id, payload, t)
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('userUpdateSuccess'),
      })
    }
    closeDialog()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('userSaveError'),
      })
    }
  } finally {
    dialogSaving.value = false
  }
}

function onSaveColumnPreferences(prefs) {
  saveColumnPreferences(prefs)
}

function onResetColumnPreferences() {
  resetColumnPreferences()
}

onMounted(async() => {
  setFooterPagination({
    page: tablePagination.value.page,
    rowsPerPage: tablePagination.value.rowsPerPage,
    rowsNumber: tablePagination.value.rowsNumber,
    disable: loading.value,
    summaryKey: 'userListPaginationSummary',
    perPageKey: 'adminTablePerPage',
    onPageChange,
    onRowsPerPageChange,
  })
  await loadUsers(tablePagination.value)
})

onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  clearFooterPagination()
})

watch(
  () => [
    tablePagination.value.page,
    tablePagination.value.rowsPerPage,
    tablePagination.value.rowsNumber,
    loading.value,
  ],
  () => {
    syncFooterPaginationBar()
  },
)

const showGrid = computed(() => $q.screen.width <= siteBreakpointsPx.XXS)
</script>

<style lang="scss" scoped>
.user-list-page {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: calc(100dvh - 56px);
  box-sizing: border-box;

  .admin-list-page__table-panel {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}
</style>
