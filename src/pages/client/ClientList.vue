<template>
  <q-page
    class="admin-page admin-list-page client-list-page"
    :data-testid="clientListTestIds.page">
    <AppLoadingOverlay
      scope="content"
      :showing="loading"
    />

    <AdminListPageHeader
      :title="t('clients')"
      :subtitle="t('clientListSubtitle')">
      <template #center>
        <q-input
          v-model="searchQuery"
          dense
          outlined
          clearable
          hide-bottom-space
          class="client-list-page__search"
          :data-testid="clientListTestIds.search"
          :disable="loading"
          :placeholder="t('clientListSearchPlaceholder')"
          :aria-label="t('clientListSearchPlaceholder')">
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
            v-if="canAddClient"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :data-testid="clientListTestIds.addClient"
            :disable="loading"
            :label="t('addClient')"
            @click="addClient"
          />
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            icon="person_add"
            :data-testid="clientListTestIds.assignClinicians"
            :disable="selected.length === 0 || loading"
            :label="t('assignClinician')"
            @click="assignClinicians"
          />
          <q-btn
            v-if="canChangeStatus"
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            icon="sync"
            :data-testid="clientListTestIds.changeStatus"
            :disable="selected.length === 0 || loading"
            :label="t('changeStatus')"
            @click="changeStatus(selected)"
          />
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline admin-list-page__filters-btn"
            icon="filter_alt"
            :data-testid="clientListTestIds.filters"
            :disable="loading"
            :label="t('filters')"
            @click="showFilters"
          />
        </div>
      </template>
    </AdminListPageHeader>

    <ClientListSummaryCards
      class="client-list-page__summary"
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
      <template #pagination>
        <AdminTablePaginationBar
          :page="tablePagination.page"
          :rows-per-page="tablePagination.rowsPerPage"
          :rows-number="paginationRowsNumber"
          :disable="loading"
          summary-key="clientListPaginationSummary"
          per-page-key="adminTablePerPage"
          @update:page="onPageChange"
          @update:rows-per-page="onRowsPerPageChange"
        />
      </template>
      <AdminQTable
        class="table admin-data-table admin-data-table--inline-column-settings"
        flat
        selection="multiple"
        row-key="id"
        binary-state-sort
        v-model:selected="selected"
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

        <template #body-cell-clientNumber="scope">
          <q-td :props="scope">
            <button
              type="button"
              class="admin-data-table__link"
              :data-testid="clientListTestIds.rowView(scope.row.id)"
              @click="viewRow(scope.row)">
              <AdminTableSearchHighlight
                :text="scope.row[ck.clientNumber] || '—'"
                :query="trimmedQuery"
              />
            </button>
          </q-td>
        </template>

        <template #body-cell-name="scope">
          <q-td :props="scope">
            <AdminTableSearchHighlight
              :text="scope.row[ck.name] || '—'"
              :query="trimmedQuery"
            />
          </q-td>
        </template>

        <template #body-cell-email="scope">
          <q-td
            :props="scope"
            class="admin-data-table__secondary-cell
              client-list-page__email-cell">
            <div
              v-if="scope.row.emailEntries?.length"
              class="client-list-page__emails row items-center no-wrap">
              <span
                class="client-list-page__email-primary row
                  items-center no-wrap">
                <AdminTableSearchHighlight
                  :text="scope.row.emailEntries[0].email"
                  :query="trimmedQuery"
                />
                <span
                  v-if="scope.row.emailEntries[0].typeLabel"
                  class="client-list-page__email-type">
                  {{ scope.row.emailEntries[0].typeLabel }}
                </span>
              </span>
              <span
                v-if="scope.row.emailEntries.length > 1"
                class="client-list-page__email-more">
                +{{ scope.row.emailEntries.length - 1 }}
                <q-tooltip
                  anchor="top middle"
                  self="bottom middle"
                  class="client-list-page__email-tooltip"
                  :offset="[0, 6]">
                  <div
                    v-for="entry in scope.row.emailEntries"
                    :key="`tip-${entry.key}`"
                    class="client-list-page__email-tooltip-line row
                      items-center no-wrap">
                    <span class="client-list-page__email-tooltip-address">
                      {{ entry.email }}
                    </span>
                    <span
                      v-if="entry.typeLabel"
                      class="client-list-page__email-tooltip-type">
                      {{ entry.typeLabel }}
                    </span>
                  </div>
                </q-tooltip>
              </span>
            </div>
            <span v-else>—</span>
          </q-td>
        </template>

        <template #body-cell-dob="scope">
          <q-td :props="scope">
            <AdminTableSearchHighlight
              :text="scope.row[ck.dob] || '—'"
              :query="trimmedQuery"
            />
          </q-td>
        </template>

        <template #body-cell-admissionDate="scope">
          <q-td :props="scope">
            <AdminTableSearchHighlight
              :text="scope.row[ck.admissionDate] || '—'"
              :query="trimmedQuery"
            />
          </q-td>
        </template>

        <template #body-cell-clinicians="scope">
          <q-td :props="scope">
            <AdminTableClinicianAvatars
              v-if="scope.row.clinicianEntries?.length"
              :entries="scope.row.clinicianEntries"
            />
            <span
              v-else
              class="client-list-page__not-assigned">
              —
            </span>
          </q-td>
        </template>

        <template #body-cell-status="scope">
          <q-td :props="scope">
            <AdminTableStatusCell
              :label="scope.row[ck.status]"
              :variant="scope.row.statusVariant"
              :highlight-query="trimmedQuery"
            />
          </q-td>
        </template>

        <template #row-actions="{ row }">
          <AdminTableRowActions
            :show-view="canViewClient"
            :show-edit="canViewClient"
            :show-change-status="canChangeStatus"
            :view-test-id="clientListTestIds.rowView(row.id)"
            :edit-test-id="clientListTestIds.rowEdit(row.id)"
            :change-status-test-id="clientListTestIds.rowStatus(row.id)"
            @view="viewRow(row)"
            @edit="editRow(row)"
            @change-status="changeStatus([row])"
          />
        </template>

        <template #no-data>
          <div
            class="full-width row flex-center text-grey-7
              q-gutter-sm q-pa-lg">
            <q-icon name="inbox" size="md" />
            <span>
              {{
                isSearchActive
                  ? t('clientListSearchEmpty')
                  : t('clientListEmpty')
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
      @save="saveColumnPreferences"
      @reset="resetColumnPreferences"
    />
  </q-page>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSiteStore } from 'stores/site-store.js'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  clientFieldKeys,
  clientListColumnKeys,
  quasarNotifyTypes,
  siteBreakpointsPx,
} from 'components/constants.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTableClinicianAvatars from
  'components/admin-table/AdminTableClinicianAvatars.vue'
import AdminTableColumnSettingsDialog from
  'components/admin-table/AdminTableColumnSettingsDialog.vue'
import AdminTableColumnSettingsHeader from
  'components/admin-table/AdminTableColumnSettingsHeader.vue'
import AdminTablePaginationBar from
  'components/admin-table/AdminTablePaginationBar.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminTableRowActions from
  'components/admin-table/AdminTableRowActions.vue'
import AdminTableSearchHighlight from
  'components/admin-table/AdminTableSearchHighlight.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import ClientListSummaryCards from 'components/ClientListSummaryCards.vue'
import { adminTableTestIds } from 'src/test-ids/index.js'
import { clientListTestIds } from 'src/test-ids/index.js'
import {
  CLIENT_LIST_SUMMARY_FILTERS,
  useClientListColumnPreferences,
} from 'src/composables/useClientListColumnPreferences.js'
import { useClientListSearch } from
  'src/composables/useClientListSearch.js'
import { useClientPermissions } from
  'src/composables/useClientPermissions.js'

const {
  canAddClient,
  canViewClient,
  canChangeStatus,
} = useClientPermissions()

const router = useRouter()
const $q = useQuasar()
const loading = ref(false)
const selected = ref([])
const columnSettingsOpen = ref(false)
const activeSummaryFilter = ref('')

const siteStore = useSiteStore()
const { t } = useI18n()
const ck = clientFieldKeys
const col = clientListColumnKeys

const {
  preferences: columnPreferences,
  savePreferences: saveColumnPreferences,
  resetPreferences: resetColumnPreferences,
  buildVisibleColumns,
  isRequiredColumn,
  isLockedColumn,
  defaultOrder: defaultColumnOrder,
} = useClientListColumnPreferences()

const summaryMetrics = ref({
  upcomingAppointments: 12,
  missingInformation: 5,
  pendingBilling: 8,
  authorizationsExpiring: 3,
})

const tablePagination = ref({
  sortBy: col.clientNumber,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

const sourceRows = computed(() => siteStore.clientList)

const {
  searchQuery,
  trimmedQuery,
  isSearchActive,
  rows,
  paginationRowsNumber,
} = useClientListSearch(sourceRows, tablePagination)

const allColumns = computed(() => [
  {
    name: col.clientNumber,
    required: true,
    label: t('clientNumber'),
    align: 'left',
    field: row => row[ck.clientNumber],
    sortable: true,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: col.name,
    required: true,
    label: t('name'),
    align: 'left',
    field: row => row[ck.name],
    sortable: true,
    headerStyle: 'min-width: 180px',
    style: 'min-width: 180px',
  },
  {
    name: col.email,
    required: true,
    label: t('email'),
    align: 'left',
    field: row => row[ck.email],
    sortable: true,
    headerStyle: 'min-width: 220px',
    style: 'min-width: 220px',
    classes: 'admin-data-table__secondary-cell',
  },
  {
    name: col.dob,
    required: true,
    label: t('dob'),
    align: 'left',
    field: row => row[ck.dob],
    sortable: true,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: col.clinicians,
    required: true,
    label: t('clinician'),
    align: 'left',
    field: row => row[ck.clinicians],
    sortable: false,
    headerStyle: 'min-width: 100px',
    style: 'min-width: 100px',
  },
  {
    name: col.admissionDate,
    required: true,
    label: t('admissionDate'),
    align: 'left',
    field: row => row[ck.admissionDate],
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: col.status,
    required: true,
    label: t('status'),
    align: 'left',
    field: row => row[ck.status],
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
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

function clientTablePaginationFromStore(paginationPayload) {
  const meta = siteStore.clientListPagination
  const total = meta?.total != null && Number.isFinite(Number(meta.total))
    ? Number(meta.total)
    : siteStore.clientList.length
  let resolvedPage = paginationPayload.page
  if (meta && meta.limit > 0 && Number.isFinite(meta.offset)) {
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

async function loadClients(paginationPayload) {
  loading.value = true
  try {
    const filter = activeSummaryFilter.value
      ? CLIENT_LIST_SUMMARY_FILTERS[activeSummaryFilter.value]
      : null
    await siteStore.getClientList({
      page: paginationPayload.page,
      limit: paginationPayload.rowsPerPage,
      filter,
    }, t)
    tablePagination.value = clientTablePaginationFromStore(paginationPayload)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('clientListError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function onTableRequest(props) {
  const { pagination } = props
  const sortChanged = pagination.sortBy !== tablePagination.value.sortBy
    || pagination.descending !== tablePagination.value.descending
  if (!sortChanged) {
    return undefined
  }

  return loadClients({
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
  tablePagination.value = {
    ...tablePagination.value,
    page,
  }
  if (!isSearchActive.value) {
    loadClients(tablePagination.value)
  }
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
  if (!isSearchActive.value) {
    loadClients(tablePagination.value)
  }
}

function onSummaryFilter(cardId) {
  activeSummaryFilter.value = activeSummaryFilter.value === cardId
    ? ''
    : cardId
  tablePagination.value = {
    ...tablePagination.value,
    page: 1,
  }
  loadClients(tablePagination.value)
}

onMounted(() => {
  loadClients(tablePagination.value)
})

const showGrid = computed(() => $q.screen.width <= siteBreakpointsPx.XXS)

const addClient = () => {
  router.push('/clients/add')
}

function viewRow(row) {
  editRow(row)
}

function assignClinicians() {
  console.log('Assign Clinician', selected.value)
}

const changeStatus = () => {
  console.log('Change Status')
}

const showFilters = () => {
  console.log('Show Filters')
}

function editRow(row) {
  const id = row?.id
  if (id == null || id === '') {
    return
  }
  router.push({ name: 'EditClient', params: { id: String(id) } })
}

</script>
