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
        <div class="user-list-page__toolbar row items-center">
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
        </div>
      </template>
      <template #actions>
        <AdminListPageActions :actions="pageActions" />
      </template>
    </AdminListPageHeader>

    <AdminTablePanel
      class="admin-list-page__table-panel user-list-page__table-panel"
      :show-column-settings="false">
      <AdminQTable
        class="table admin-data-table user-list-page__table"
        flat
        row-key="id"
        binary-state-sort
        v-model:pagination="tablePagination"
        :rows-per-page-options="[20, 50, 100]"
        :grid="showGrid"
        :card-layout="mobileCardLayout"
        :rows="rows"
        :columns="visibleColumns"
        :loading="false"
        @request="onTableRequest">

        <template #body-cell-user="scope">
          <q-td :props="scope" class="admin-data-table__primary-cell">
            <AdminTableUserIdentityCell
              :name="scope.row[uk.name]"
              :email="scope.row[uk.email]"
              :caption="scope.row.staffMember?.position"
              :initials="scope.row.initials"
              :photo-file-id="scope.row.photoFileId"
              :highlight-query="highlightQuery"
              :name-test-id="userListTestIds.rowView(scope.row.id)"
              @open="viewRow(scope.row)"
            />
          </q-td>
        </template>

        <template #body-cell-roles="scope">
          <q-td :props="scope">
            <AdminTableRoleBadgesCell
              :roles="scope.row[uk.roles] ?? []"
              :highlight-query="highlightQuery"
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

        <template #body-cell-createdAt="scope">
          <q-td
            :props="scope"
            class="admin-data-table__secondary-cell">
            {{ scope.row[uk.createdAt] || '—' }}
          </q-td>
        </template>

        <template #body-cell-lastLogin="scope">
          <q-td
            :props="scope"
            class="admin-data-table__secondary-cell">
            {{ scope.row[uk.lastLogin] || '—' }}
          </q-td>
        </template>

        <template #row-actions="{ row }">
          <div class="admin-table-row-actions">
            <q-btn
              v-if="canEditUser"
              flat
              round
              dense
              icon="edit"
              class="app-btn-icon-action"
              :data-testid="userListTestIds.rowEdit(row.id)"
              :size="siteBreakpoints.SM"
              :aria-label="t('edit')"
              @click="editRow(row)"
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
              v-if="canEditUser"
              flat
              round
              dense
              icon="vpn_key"
              class="app-btn-icon-action"
              :data-testid="userListTestIds.rowPassword(row.id)"
              :size="siteBreakpoints.SM"
              :aria-label="t('userListResetPasswordAction')"
              @click="editRow(row)"
            >
              <q-tooltip
                class="app-info-tooltip"
                anchor="top middle"
                self="bottom middle"
                :offset="[0, 6]">
                {{ t('userListResetPasswordAction') }}
              </q-tooltip>
            </q-btn>
            <q-btn
              v-if="canDeleteUser"
              flat
              round
              dense
              icon="delete_outline"
              color="negative"
              class="app-btn-icon-action"
              :data-testid="userListTestIds.rowDelete(row.id)"
              :size="siteBreakpoints.SM"
              :aria-label="t('delete')"
              @click="confirmDelete(row)"
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

    <UserDialog
      v-model="dialogOpen"
      :mode="dialogMode"
      :user="activeUser"
      :saving="dialogSaving"
      @save="onDialogSave"
      @cancel="closeDialog"
    />

    <UserListFiltersDrawer
      v-model="filtersOpen"
      :filters="appliedFilters"
      @apply="onApplyFilters"
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
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  quasarNotifyTypes,
  siteBreakpoints,
  userFieldKeys,
  userListColumnKeys,
} from 'components/constants.js'
import { useAdminStore } from 'stores/admin-store.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import AdminListPageActions from
  'components/admin-table/AdminListPageActions.vue'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminTableRoleBadgesCell from
  'components/admin-table/AdminTableRoleBadgesCell.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AdminTableUserIdentityCell from
  'components/admin-table/AdminTableUserIdentityCell.vue'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import ModalComponent from 'components/ModalComponent.vue'
import UserDialog from 'components/UserDialog.vue'
import UserListFiltersDrawer from
  'components/admin/UserListFiltersDrawer.vue'
import { useAdminTableMobileGrid } from
  'src/composables/useAdminTableMobileGrid.js'
import { useAppFooterPagination } from
  'src/composables/useAppFooterPagination.js'
import { useUserPermissions } from 'src/composables/useUserPermissions.js'
import {
  USER_LIST_SEARCH_DEBOUNCE_MS,
  USER_LIST_SEARCH_MIN_LENGTH,
  isUserListServerSearchQuery,
} from 'src/utils/user-list-search.js'
import {
  cloneUserListFilters,
  countActiveUserListFilters,
  createEmptyUserListFilters,
} from 'src/utils/user-list-filters.js'
import { useAuthStore } from 'stores/auth-store.js'
import { cloneUser } from 'src/utils/user-orders.js'
import { userListTestIds } from 'src/test-ids/index.js'

const { t } = useI18n()
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const authStore = useAuthStore()
const uk = userFieldKeys
const col = userListColumnKeys

const {
  canAddUser,
  canEditUser,
  canDeleteUser,
} = useUserPermissions()

const loading = ref(false)
const filtersOpen = ref(false)
const appliedFilters = ref(createEmptyUserListFilters())
const dialogOpen = ref(false)
const dialogMode = ref('add')
const dialogSaving = ref(false)
const activeUser = ref(null)
const deleteConfirmOpen = ref(false)
const pendingDeleteUser = ref(null)

const searchQuery = ref('')
let debounceTimer = null

const tablePagination = ref({
  sortBy: col.user,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
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

const activeFilterCount = computed(() =>
  countActiveUserListFilters(appliedFilters.value),
)

const filtersButtonLabel = computed(() => {
  const count = activeFilterCount.value
  if (count > 0) {
    return t('userListFiltersActive', { count })
  }

  return t('filters')
})

const visibleColumns = computed(() => [
  {
    name: col.user,
    required: true,
    label: t('userListColUser'),
    align: 'left',
    field: row => row[uk.name],
    sortable: true,
    headerStyle: 'min-width: 260px',
    style: 'min-width: 260px',
  },
  {
    name: col.roles,
    required: true,
    label: t('userRoles'),
    align: 'left',
    field: row => row[uk.roles],
    sortable: false,
    headerStyle: 'min-width: 180px',
    style: 'min-width: 180px',
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
    name: col.createdAt,
    required: false,
    label: t('userListColCreatedAt'),
    align: 'left',
    field: row => row[uk.createdAt],
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
    classes: 'admin-data-table__secondary-cell',
  },
  {
    name: col.lastLogin,
    required: false,
    label: t('userListColLastLogin'),
    align: 'left',
    field: row => row[uk.lastLogin],
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
    classes: 'admin-data-table__secondary-cell',
  },
  {
    name: col.actions,
    required: true,
    label: t('actions'),
    align: 'center',
    field: () => '',
    sortable: false,
    headerStyle: 'min-width: 132px',
    style: 'min-width: 132px',
  },
])

const deleteConfirmMessage = computed(() => {
  const email = pendingDeleteUser.value?.[uk.email]
  if (!email) {
    return t('userDeleteMessageGeneric')
  }

  return t('userDeleteMessage', { name: email })
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
    const filters = appliedFilters.value
    await adminStore.getUserList({
      page: paginationPayload.page,
      limit: paginationPayload.rowsPerPage,
      q: isUserListServerSearchQuery(trimmedQuery.value)
        ? trimmedQuery.value
        : null,
      status: filters.status,
      role: filters.role,
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

function onApplyFilters(nextFilters) {
  appliedFilters.value = cloneUserListFilters(nextFilters)
  tablePagination.value = {
    ...tablePagination.value,
    page: 1,
  }
  loadUsers(tablePagination.value)
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

const pageActions = computed(() => [
  {
    key: 'addUser',
    label: t('addUser'),
    icon: 'add',
    variant: 'primary',
    testId: userListTestIds.addUser,
    disable: loading.value,
    visible: canAddUser.value,
    onClick: openAddDialog,
  },
  {
    key: 'filters',
    label: filtersButtonLabel.value,
    icon: 'filter_alt',
    variant: 'outline',
    testId: userListTestIds.filters,
    disable: loading.value,
    className: 'admin-list-page__filters-btn',
    onClick: () => {
      filtersOpen.value = true
    },
  },
])

function maybeOpenAddFromRoute() {
  if (route.meta.userListAutoOpen === 'add' && canAddUser.value) {
    openAddDialog()
  }
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
  if (route.name === 'AdminUsersAdd') {
    router.replace({ name: 'AdminUsersList' })
  }
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

async function onDialogSave({ user, permissionTreeNodes, roleOptions }) {
  dialogSaving.value = true
  try {
    if (dialogMode.value === 'add') {
      await adminStore.createUser(user, t, {
        activeSubtenantId: authStore.activeSubtenantId,
        permissionTreeNodes,
        roleOptions,
      })
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('userCreateSuccess'),
      })
      tablePagination.value = { ...tablePagination.value, page: 1 }
      await loadUsers(tablePagination.value)
    } else {
      await adminStore.updateUser(user.id, user, t, {
        permissionTreeNodes,
        roleOptions,
        activeSubtenantId: authStore.activeSubtenantId,
      })
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('userUpdateSuccess'),
      })
      await loadUsers(tablePagination.value)
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
  maybeOpenAddFromRoute()
})

watch(() => route.name, () => {
  maybeOpenAddFromRoute()
})

onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  clearFooterPagination()
  filtersOpen.value = false
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

const { showGrid } = useAdminTableMobileGrid()

const mobileCardLayout = {
  title: col.user,
  status: col.status,
  badges: [col.roles, col.createdAt, col.lastLogin],
  hideEmpty: true,
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.user-list-page {
  &__table {
    :deep(thead tr th) {
      background: #f8fafc;
    }

    :deep(tbody tr:nth-child(even) td) {
      background: rgba($primary, 0.02);
    }
  }
}
</style>
