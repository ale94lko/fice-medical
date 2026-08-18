<template>
  <q-page
    class="admin-page admin-list-page
      portal-registration-list-page"
    :data-testid="tid.page">
    <AppLoadingOverlay
      scope="content"
      :showing="loading"
    />

    <AdminListPageHeader
      :title="t('portalRegistrationsTitle')"
      :subtitle="t('portalRegistrationsSubtitle')">
      <template #actions>
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          icon="sync"
          :disable="loading"
          :data-testid="tid.refresh"
          :label="t('claimQueueRefresh')"
          @click="loadRows"
        />
      </template>
    </AdminListPageHeader>

    <div class="billing-queue-filters">
      <q-input
        v-model="searchQuery"
        outlined
        clearable
        hide-bottom-space
        class="billing-queue-filters__search"
        :data-testid="tid.search"
        :disable="loading"
        :placeholder="t('portalRegistrationsSearchPlaceholder')"
        :aria-label="t('portalRegistrationsSearchPlaceholder')">
        <template #prepend>
          <q-icon name="search" size="18px" />
        </template>
      </q-input>
    </div>

    <AdminTablePanel
      class="admin-list-page__table-panel"
      :show-column-settings="false">
      <AdminQTable
        class="table admin-data-table"
        flat
        row-key="id"
        v-model:pagination="tablePagination"
        :rows-per-page-options="[10, 20, 50]"
        :grid="showGrid"
        :rows="filteredRows"
        :columns="columns"
        :loading="false">
        <template #body-cell-name="scope">
          <q-td
            :props="scope"
            class="admin-data-table__primary-cell">
            {{ displayName(scope.row) }}
          </q-td>
        </template>
        <template #row-actions="{ row }">
          <div class="admin-table-row-actions">
            <q-btn
              v-if="canCreate(row)"
              flat
              round
              dense
              icon="person_add"
              class="app-btn-icon-action"
              :size="siteBreakpoints.SM"
              :data-testid="tid.rowCreate(row.id)"
              :aria-label="t('portalRegistrationsCreateClient')"
              @click="openCreate(row)">
              <q-tooltip
                class="app-info-tooltip"
                anchor="top middle"
                self="bottom middle"
                :offset="[0, 6]">
                {{ t('portalRegistrationsCreateClient') }}
              </q-tooltip>
            </q-btn>
          </div>
        </template>
        <template #no-data>
          <div class="q-pa-lg text-grey-7">
            {{ t('portalRegistrationsEmpty') }}
          </div>
        </template>
      </AdminQTable>
    </AdminTablePanel>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  quasarNotifyTypes,
  siteBreakpoints,
} from 'components/constants.js'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import { useAdminTableMobileGrid } from
  'src/composables/useAdminTableMobileGrid.js'
import { useAppFooterPagination } from
  'src/composables/useAppFooterPagination.js'
import { useSyncAppPageTitle } from
  'src/composables/useAppPageTitle.js'
import { useClientPermissions } from
  'src/composables/useClientPermissions.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { apiDateToDisplay } from 'src/utils/app-datetime.js'
import { formatUtcDateLong } from 'src/utils/appointment-datetime.js'
import {
  listUnlinkedPortalAccounts,
  portalAccountApiErrorMessage,
  portalAccountMatchesQuery,
} from 'src/utils/portal-account-api.js'
import { portalRegistrationListTestIds as tid } from
  'src/test-ids/index.js'

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()
const { showGrid } = useAdminTableMobileGrid()
const { canAddClient } = useClientPermissions()
const {
  setFooterPagination,
  patchFooterPagination,
  clearFooterPagination,
} = useAppFooterPagination()

useSyncAppPageTitle(computed(() => t('portalRegistrationsTitle')))

const loading = ref(false)
const searchQuery = ref('')
const rows = ref([])
const tablePagination = ref({
  sortBy: 'createdAt',
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
})

const filteredRows = computed(() => rows.value.filter(row =>
  portalAccountMatchesQuery(row, searchQuery.value),
))

const columns = computed(() => [
  {
    name: 'name',
    label: t('portalRegistrationsColumnName'),
    align: 'left',
    field: row => displayName(row),
  },
  {
    name: 'email',
    label: t('portalRegistrationsColumnEmail'),
    align: 'left',
    field: row => row.email || '—',
  },
  {
    name: 'dob',
    label: t('portalRegistrationsColumnDob'),
    align: 'left',
    field: row => apiDateToDisplay(row.dateOfBirth) || '—',
  },
  {
    name: 'phone',
    label: t('portalRegistrationsColumnPhone'),
    align: 'left',
    field: row => row.phone || '—',
  },
  {
    name: 'registered',
    label: t('portalRegistrationsColumnRegistered'),
    align: 'left',
    field: row => formatUtcDateLong(row.createdAt) || '—',
  },
  {
    name: 'actions',
    label: t('actions'),
    field: 'actions',
    align: 'right',
  },
])

function displayName(row) {
  return row.displayName
    || t('portalRegistrationsUnnamed')
}

function canCreate(row) {
  return Boolean(canAddClient.value && row?.canCreateClient)
}

function openCreate(row) {
  if (!row?.id) {
    return
  }
  void router.push({
    path: '/clients/add',
    query: { portalAccountId: String(row.id) },
  })
}

function notifyError(error, fallbackKey) {
  if (isAuthSessionEndUIError(error)) {
    return
  }
  $q.notify({
    type: quasarNotifyTypes.negative,
    message: portalAccountApiErrorMessage(
      error,
      t(fallbackKey),
    ),
  })
}

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

function onPageChange(page) {
  tablePagination.value.page = page
  syncFooterPaginationBar()
}

function onRowsPerPageChange(rowsPerPage) {
  tablePagination.value.rowsPerPage = rowsPerPage
  tablePagination.value.page = 1
  syncFooterPaginationBar()
}

async function loadRows() {
  loading.value = true
  try {
    rows.value = await listUnlinkedPortalAccounts()
    tablePagination.value.page = 1
    tablePagination.value.rowsNumber = filteredRows.value.length
    syncFooterPaginationBar()
  } catch (error) {
    notifyError(error, 'portalRegistrationsLoadError')
  } finally {
    loading.value = false
    syncFooterPaginationBar()
  }
}

watch(searchQuery, () => {
  tablePagination.value.page = 1
  tablePagination.value.rowsNumber = filteredRows.value.length
  syncFooterPaginationBar()
})

watch(filteredRows, next => {
  tablePagination.value.rowsNumber = next.length
  syncFooterPaginationBar()
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
  void loadRows()
})

onBeforeUnmount(() => {
  clearFooterPagination()
})
</script>
