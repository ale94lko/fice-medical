<template>
  <q-page
    class="admin-page admin-list-page superbill-list-page"
    :data-testid="remittanceListTestIds.page">
    <AppLoadingOverlay
      scope="content"
      :showing="loading"
    />

    <AdminListPageHeader
      :title="t('remittanceWorkspaceTitle')"
      :subtitle="t('remittanceWorkspaceSubtitle')">
      <template #actions>
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          icon="sync"
          :disable="loading"
          :data-testid="remittanceListTestIds.refresh"
          :label="t('claimQueueRefresh')"
          @click="reloadCurrentPage"
        />
        <q-btn
          v-if="canProcess"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :data-testid="remittanceListTestIds.ingest"
          :label="t('remittanceImportEra')"
          @click="ingestOpen = true"
        />
      </template>
    </AdminListPageHeader>

    <RemittanceQueueSummaryCards
      :active="queueTab"
      :counts="counts"
      @select="onQueueTabChange"
    />

    <div class="billing-queue-filters">
      <q-input
        :model-value="searchQuery"
        outlined
        clearable
        hide-bottom-space
        class="billing-queue-filters__search"
        :data-testid="remittanceListTestIds.search"
        :disable="loading"
        :placeholder="t('remittanceQueueSearchPlaceholder')"
        :aria-label="t('remittanceQueueSearchPlaceholder')"
        @update:model-value="onSearchInput"
        @clear="resetSearch">
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
        :row-class="remittanceRowClass"
        v-model:pagination="tablePagination"
        :rows-per-page-options="[10, 20, 50]"
        :grid="showGrid"
        :rows="rows"
        :columns="visibleColumns"
        :loading="false">
        <template #body-cell-number="scope">
          <q-td :props="scope" class="admin-data-table__primary-cell">
            <button
              type="button"
              class="admin-data-table__link"
              :data-testid="remittanceListTestIds.rowView(
                scope.row.id,
              )"
              @click="openRow(scope.row)">
              {{ scope.row.remittanceNumber || '—' }}
            </button>
          </q-td>
        </template>
        <template #body-cell-status="scope">
          <q-td :props="scope">
            <AdminTableStatusCell
              :label="postingLabel(scope.row.postingStatus)"
              :variant="paymentPostingVariant(
                scope.row.postingStatus,
              )"
            />
            <div class="text-caption text-grey-7">
              {{ processingLabel(scope.row.processingStatus) }}
            </div>
          </q-td>
        </template>
        <template #no-data>
          <div class="q-pa-lg text-grey-7">
            {{ t(remittanceQueueEmptyKey(queueTab)) }}
          </div>
        </template>
      </AdminQTable>
    </AdminTablePanel>

    <RemittanceIngestDialog
      v-model="ingestOpen"
      :submitting="actionBusy"
      @confirm="onIngest"
    />
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  permissionNames,
  quasarNotifyTypes,
} from 'components/constants.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminQTable from 'components/AdminQTable.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import RemittanceQueueSummaryCards from
  'components/remittances/RemittanceQueueSummaryCards.vue'
import RemittanceIngestDialog from
  'components/remittances/RemittanceIngestDialog.vue'
import { useAdminTableMobileGrid } from
  'src/composables/useAdminTableMobileGrid.js'
import { useAppFooterPagination } from
  'src/composables/useAppFooterPagination.js'
import { useSyncAppPageTitle } from
  'src/composables/useSyncAppPageTitle.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'
import {
  listRemittanceWorkQueue,
  ingestRemittance,
  remittanceApiErrorMessage,
} from 'src/utils/remittance-api.js'
import {
  paymentPostingVariant,
  remittanceQueueEmptyKey,
  remittanceQueueTabs,
  remittanceRowClass,
} from 'src/utils/remittance-work-queue.js'
import { remittanceListTestIds } from 'src/test-ids/index.js'

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const { showGrid } = useAdminTableMobileGrid()
const {
  setFooterPagination,
  patchFooterPagination,
  clearFooterPagination,
} = useAppFooterPagination()

useSyncAppPageTitle(computed(() => t('remittanceWorkspaceTitle')))

const canProcess = computed(() => hasPermission(
  authStore.permissions,
  permissionNames.remittanceProcess,
))

const loading = ref(false)
const actionBusy = ref(false)
const ingestOpen = ref(false)
const searchQuery = ref('')
const queueTab = ref(remittanceQueueTabs.needsReview)
const rows = ref([])
const counts = ref({
  needsReview: 0,
  readyToPost: 0,
  posted: 0,
  all: 0,
})
const tablePagination = ref({
  sortBy: 'receivedAt',
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
})

const visibleColumns = computed(() => [
  {
    name: 'number',
    label: t('remittanceColumnNumber'),
    align: 'left',
    field: row => row.remittanceNumber,
  },
  {
    name: 'payer',
    label: t('claimColumnPayer'),
    align: 'left',
    field: row => row.payerName,
  },
  {
    name: 'received',
    label: t('remittanceColumnReceived'),
    align: 'left',
    field: row => row.receivedAt,
  },
  {
    name: 'payment',
    label: t('remittanceColumnPayment'),
    align: 'right',
    field: row => row.totalPaymentAmountLabel,
  },
  {
    name: 'claims',
    label: t('remittanceColumnClaims'),
    align: 'left',
    field: row => `${row.matchedClaimCount}/${row.claimCount}`,
  },
  {
    name: 'status',
    label: t('claimColumnStatus'),
    align: 'left',
    field: row => row.postingStatus,
  },
])

useAppFooterPagination()

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
  reloadCurrentPage()
}

function onRowsPerPageChange(rowsPerPage) {
  tablePagination.value.rowsPerPage = rowsPerPage
  tablePagination.value.page = 1
  reloadCurrentPage()
}

watch(loading, () => {
  syncFooterPaginationBar()
})

onMounted(() => {
  setFooterPagination({
    page: tablePagination.value.page,
    rowsPerPage: tablePagination.value.rowsPerPage,
    rowsNumber: tablePagination.value.rowsNumber,
    disable: loading.value,
    summaryKey: 'claimQueuePaginationSummary',
    perPageKey: 'adminTablePerPage',
    onPageChange,
    onRowsPerPageChange,
  })
  reloadCurrentPage()
})

onBeforeUnmount(() => {
  clearFooterPagination()
})

function processingLabel(status) {
  if (status === 'PARTIALLY_MATCHED') {
    return t('remittanceProcessingPartial')
  }
  if (status === 'FAILED') {
    return t('remittanceProcessingFailed')
  }
  if (status === 'PROCESSED') {
    return t('remittanceProcessingProcessed')
  }

  return status || '—'
}

function postingLabel(status) {
  if (status === 'POSTED') {
    return t('paymentStatusPosted')
  }
  if (status === 'PARTIALLY_POSTED') {
    return t('paymentStatusInProcess')
  }

  return t('paymentStatusPending')
}

async function reloadCurrentPage() {
  loading.value = true
  try {
    const result = await listRemittanceWorkQueue({
      queue: queueTab.value,
      q: searchQuery.value.trim() || undefined,
      limit: tablePagination.value.rowsPerPage,
      page: tablePagination.value.page,
    })
    rows.value = result.items
    counts.value = result.counts
    tablePagination.value.rowsNumber = Number(
      result.pagination?.total ?? result.items.length,
    )
    syncFooterPaginationBar()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: remittanceApiErrorMessage(
          error,
          t('remittanceListLoadError'),
        ),
      })
    }
  } finally {
    loading.value = false
  }
}

function onQueueTabChange(tab) {
  queueTab.value = tab
  tablePagination.value.page = 1
  reloadCurrentPage()
}

function onSearchInput(value) {
  searchQuery.value = String(value ?? '')
  tablePagination.value.page = 1
  reloadCurrentPage()
}

function resetSearch() {
  searchQuery.value = ''
  tablePagination.value.page = 1
  reloadCurrentPage()
}

function openRow(row) {
  if (!row?.id) {
    return
  }
  router.push({ name: 'RemittanceDetail', params: { id: row.id } })
}

async function onIngest(body) {
  actionBusy.value = true
  try {
    const result = await ingestRemittance(body)
    ingestOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: result.duplicate
        ? t('remittanceDuplicateIgnored')
        : t('remittanceIngestSuccess'),
    })
    if (result.id) {
      await router.push({
        name: 'RemittanceDetail',
        params: { id: result.id },
      })
      return
    }
    await reloadCurrentPage()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: remittanceApiErrorMessage(
          error,
          t('remittanceIngestError'),
        ),
      })
    }
  } finally {
    actionBusy.value = false
  }
}
</script>
