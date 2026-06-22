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
          :model-value="searchQuery"
          outlined
          clearable
          hide-bottom-space
          class="admin-list-page__search-input client-list-page__search"
          :data-testid="clientListTestIds.search"
          :disable="loading"
          :placeholder="t('clientListSearchPlaceholder')"
          :aria-label="t('clientListSearchPlaceholder')"
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
        @request="onTableRequest"
        @row-click="onRowClick">
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
                :query="highlightQuery"
              />
            </button>
          </q-td>
        </template>

        <template #body-cell-name="scope">
          <q-td :props="scope">
            <AdminTableSearchHighlight
              :text="scope.row[ck.name] || '—'"
              :query="highlightQuery"
            />
          </q-td>
        </template>

        <template #body-cell-email="scope">
          <q-td
            :props="scope"
            class="admin-data-table__secondary-cell
              client-list-page__email-cell">
            <AdminTableContactOverflow
              v-if="scope.row.emailEntries?.length"
              :entries="scope.row.emailEntries"
              value-key="email"
              type-key="typeLabel"
              icon="mail_outline"
            >
              <template #value="{ entry }">
                <AdminTableSearchHighlight
                  :text="entry.email"
                  :query="highlightQuery"
                />
              </template>
            </AdminTableContactOverflow>
            <span v-else>—</span>
          </q-td>
        </template>

        <template #body-cell-phones="scope">
          <q-td
            :props="scope"
            class="admin-data-table__secondary-cell
              client-list-page__email-cell">
            <AdminTableContactOverflow
              v-if="scope.row.phoneEntries?.length"
              :entries="scope.row.phoneEntries"
              value-key="phone"
              type-key="typeLabel"
              icon="phone"
            >
              <template #value="{ entry }">
                <AdminTableSearchHighlight
                  :text="entry.phone"
                  :query="highlightQuery"
                />
              </template>
            </AdminTableContactOverflow>
            <span v-else>—</span>
          </q-td>
        </template>

        <template #body-cell-allergies="scope">
          <q-td
            :props="scope"
            class="admin-data-table__secondary-cell
              client-list-page__email-cell">
            <span
              v-if="!scope.row.allergyEntries?.length"
              :class="[
                'allergy-severity-badge',
                'client-list-page__allergy-badge',
                allergySeverityBadgeClass('nka'),
              ]">
              {{ t('noKnownAllergiesLabel') }}
            </span>
            <AdminTableAllergyOverflow
              v-else
              :entries="scope.row.allergyEntries">
              <template #value="{ entry }">
                <AdminTableSearchHighlight
                  :text="entry.badgeLabel"
                  :query="highlightQuery"
                />
              </template>
            </AdminTableAllergyOverflow>
          </q-td>
        </template>

        <template #body-cell-dob="scope">
          <q-td :props="scope">
            <AdminTableSearchHighlight
              :text="scope.row[ck.dob] || '—'"
              :query="highlightQuery"
            />
          </q-td>
        </template>

        <template #body-cell-admissionDate="scope">
          <q-td :props="scope">
            <AdminTableSearchHighlight
              :text="scope.row[ck.admissionDate] || '—'"
              :query="highlightQuery"
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
              :highlight-query="highlightQuery"
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
      @save="onSaveColumnPreferences"
      @reset="onResetColumnPreferences"
    />
  </q-page>
</template>

<script setup>
import { onBeforeUnmount, onMounted, computed, ref, watch } from 'vue'
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
import AdminTableAllergyOverflow from
  'components/admin-table/AdminTableAllergyOverflow.vue'
import AdminTableContactOverflow from
  'components/admin-table/AdminTableContactOverflow.vue'
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
import ClientListSummaryCards from 'components/ClientListSummaryCards.vue'
import { adminTableTestIds } from 'src/test-ids/index.js'
import { clientListTestIds } from 'src/test-ids/index.js'
import {
  CLIENT_LIST_SUMMARY_FILTERS,
  useClientListColumnPreferences,
} from 'src/composables/useClientListColumnPreferences.js'
import { apiColumnKeyToFrontend } from 'src/utils/client-list-columns.js'
import { useClientListSearch } from
  'src/composables/useClientListSearch.js'
import { useAppFooterPagination } from
  'src/composables/useAppFooterPagination.js'
import { isClientListServerSearchQuery } from
  'src/utils/client-list-search.js'
import {
  clientListAllergySeverityBadgeClass as allergySeverityBadgeClass,
} from 'src/utils/client-list-allergy-severity.js'
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
  loadPreferences: loadColumnPreferences,
  savePreferences: saveColumnPreferences,
  resetPreferences: resetColumnPreferences,
  buildVisibleColumns,
  isRequiredColumn,
  isLockedColumn,
  defaultOrder: defaultColumnOrder,
  columnCatalog,
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
  setSearchQuery,
  resetSearchQuery,
  isSearchActive,
  highlightQuery,
  rows,
  paginationRowsNumber,
  clearSearchQueryWithoutReload,
} = useClientListSearch({
  sourceRows,
  tablePagination,
  onQueryChange: () => loadClientsOrSearch(tablePagination.value),
})

async function loadClientsOrSearch(paginationPayload) {
  loading.value = true
  try {
    const q = String(searchQuery.value ?? '').trim()
    if (isClientListServerSearchQuery(q)) {
      await siteStore.searchClientList({
        q,
        page: paginationPayload.page,
        limit: paginationPayload.rowsPerPage,
      }, t)
    } else {
      const filter = activeSummaryFilter.value
        ? CLIENT_LIST_SUMMARY_FILTERS[activeSummaryFilter.value]
        : null
      await siteStore.getClientList({
        page: paginationPayload.page,
        limit: paginationPayload.rowsPerPage,
        filter,
      }, t)
    }
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
    name: col.phones,
    required: false,
    label: t('phone'),
    align: 'left',
    field: row => row.phoneEntries,
    sortable: false,
    headerStyle: 'min-width: 180px',
    style: 'min-width: 180px',
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
    name: col.allergies,
    required: false,
    label: t('clientListColAllergies'),
    align: 'left',
    field: row => row.allergyEntries,
    sortable: false,
    headerStyle: 'min-width: 180px',
    style: 'min-width: 180px',
    classes: 'admin-data-table__secondary-cell',
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

const columnLabels = computed(() => {
  const fromColumns = Object.fromEntries(
    allColumns.value.map(column => [column.name, column.label]),
  )
  const fromCatalog = Object.fromEntries(
    columnCatalog.value
      .map(entry => [
        apiColumnKeyToFrontend(entry.key),
        entry.label,
      ])
      .filter(([key]) => Boolean(key)),
  )

  return {
    ...fromColumns,
    ...fromCatalog,
  }
})

const visibleColumns = computed(() =>
  buildVisibleColumns(allColumns.value),
)

function clientTablePaginationFromStore(paginationPayload) {
  const meta = siteStore.clientListPagination
  const total = meta?.total != null && Number.isFinite(Number(meta.total))
    ? Number(meta.total)
    : siteStore.clientList.length
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

function onSaveColumnPreferences(prefs) {
  saveColumnPreferences(prefs).catch((error) => {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('clientListColumnConfigError'),
      })
    }
  })
}

function onResetColumnPreferences() {
  resetColumnPreferences().catch((error) => {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('clientListColumnConfigError'),
      })
    }
  })
}

async function loadClients(paginationPayload) {
  return loadClientsOrSearch(paginationPayload)
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
  loadClientsOrSearch(tablePagination.value)
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
  loadClientsOrSearch(tablePagination.value)
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
  loadClientsOrSearch(tablePagination.value)
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

onMounted(async() => {
  setFooterPagination({
    page: tablePagination.value.page,
    rowsPerPage: tablePagination.value.rowsPerPage,
    rowsNumber: paginationRowsNumber.value,
    disable: loading.value,
    summaryKey: 'clientListPaginationSummary',
    perPageKey: 'adminTablePerPage',
    onPageChange,
    onRowsPerPageChange,
  })
  loading.value = true
  try {
    await loadColumnPreferences()
    await loadClients(tablePagination.value)
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
})

onBeforeUnmount(() => {
  clearFooterPagination()
})

watch(
  () => [
    tablePagination.value.page,
    tablePagination.value.rowsPerPage,
    paginationRowsNumber.value,
    loading.value,
  ],
  () => {
    syncFooterPaginationBar()
  },
)

const showGrid = computed(() => $q.screen.width <= siteBreakpointsPx.XXS)

const addClient = () => {
  router.push('/clients/add')
}

function onRowClick(evt, row) {
  const target = evt?.target
  if (target?.closest?.(
    '.admin-data-table__actions-cell, .q-checkbox, button, a',
  )) {
    return
  }

  openClientOverview(row)
}

function viewRow(row) {
  openClientOverview(row)
}

function openClientOverview(row) {
  const id = row?.id
  if (id == null || id === '') {
    return
  }
  router.push({ name: 'ClientOverview', params: { id: String(id) } })
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
