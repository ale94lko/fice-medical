<template>
  <q-page
    class="admin-page admin-list-page superbill-list-page"
    :data-testid="denialListTestIds.page">
    <AppLoadingOverlay
      scope="content"
      :showing="loading"
    />

    <AdminListPageHeader
      :title="t('denialWorkspaceTitle')"
      :subtitle="t('denialWorkspaceSubtitle')">
      <template #actions>
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          icon="sync"
          :disable="loading"
          :data-testid="denialListTestIds.refresh"
          :label="t('claimQueueRefresh')"
          @click="reloadCurrentPage"
        />
      </template>
    </AdminListPageHeader>

    <DenialQueueSummaryCards
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
        :data-testid="denialListTestIds.search"
        :disable="loading"
        :placeholder="t('denialQueueSearchPlaceholder')"
        :aria-label="t('denialQueueSearchPlaceholder')"
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
        :row-class="denialRowClass"
        v-model:pagination="tablePagination"
        :rows-per-page-options="[10, 20, 50]"
        :grid="showGrid"
        :rows="rows"
        :columns="visibleColumns"
        :loading="false">
        <template #body-cell-claim="scope">
          <q-td :props="scope" class="admin-data-table__primary-cell">
            <button
              type="button"
              class="admin-data-table__link"
              :data-testid="denialListTestIds.rowView(
                scope.row.id,
              )"
              @click="openRow(scope.row)">
              {{ scope.row.claimNumber || scope.row.denialNumber
                || '—' }}
            </button>
          </q-td>
        </template>
        <template #body-cell-issue="scope">
          <q-td :props="scope">
            <AdminTableStatusCell
              :label="issueTypeLabel(scope.row.sourceType)"
              :variant="scope.row.sourceType === 'REJECTION'
                ? 'cancelled' : 'pending'"
            />
            <div class="text-caption text-grey-7">
              {{ categoryLabel(scope.row.category) }}
            </div>
          </q-td>
        </template>
        <template #body-cell-status="scope">
          <q-td :props="scope">
            <AdminTableStatusCell
              :label="statusLabel(scope.row.status)"
              :variant="denialStatusVariant(scope.row.status)"
            />
          </q-td>
        </template>
        <template #no-data>
          <div class="q-pa-lg text-grey-7">
            {{ t(denialQueueEmptyKey(queueTab)) }}
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
import { quasarNotifyTypes } from 'components/constants.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminQTable from 'components/AdminQTable.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import DenialQueueSummaryCards from
  'components/denials/DenialQueueSummaryCards.vue'
import { useAdminTableMobileGrid } from
  'src/composables/useAdminTableMobileGrid.js'
import { useAppFooterPagination } from
  'src/composables/useAppFooterPagination.js'
import { useSyncAppPageTitle } from
  'src/composables/useAppPageTitle.js'
import {
  denialApiErrorMessage,
  listDenialWorkQueue,
} from 'src/utils/denial-api.js'
import {
  denialQueueEmptyKey,
  denialQueueTabs,
  denialRowClass,
  denialStatusVariant,
} from 'src/utils/denial-work-queue.js'
import { denialListTestIds } from 'src/test-ids/index.js'

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()
const { showGrid } = useAdminTableMobileGrid()
const {
  setFooterPagination,
  patchFooterPagination,
  clearFooterPagination,
} = useAppFooterPagination()

useSyncAppPageTitle(computed(() => t('denialWorkspaceTitle')))

const loading = ref(false)
const searchQuery = ref('')
const queueTab = ref(denialQueueTabs.needsReview)
const rows = ref([])
const counts = ref({
  needsReview: 0,
  inProgress: 0,
  waiting: 0,
  readyForResubmission: 0,
  appeal: 0,
  resolved: 0,
  all: 0,
})
const tablePagination = ref({
  sortBy: 'createdAt',
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
})

const visibleColumns = computed(() => [
  {
    name: 'claim',
    label: t('claimColumnNumber'),
    align: 'left',
    field: row => row.claimNumber,
  },
  {
    name: 'client',
    label: t('claimColumnClient'),
    align: 'left',
    field: row => row.clientName,
  },
  {
    name: 'dos',
    label: t('claimColumnDos'),
    align: 'left',
    field: row => row.dateOfServiceDisplay,
  },
  {
    name: 'payer',
    label: t('claimColumnPayer'),
    align: 'left',
    field: row => row.payerName,
  },
  {
    name: 'service',
    label: t('denialColumnService'),
    align: 'left',
    field: row => row.procedureCode || t('denialEntireClaim'),
  },
  {
    name: 'issue',
    label: t('denialColumnIssue'),
    align: 'left',
    field: row => row.sourceType,
  },
  {
    name: 'amount',
    label: t('denialColumnAmount'),
    align: 'right',
    field: row => row.deniedAmountLabel,
  },
  {
    name: 'status',
    label: t('claimColumnStatus'),
    align: 'left',
    field: row => row.status,
  },
  {
    name: 'priority',
    label: t('denialColumnPriority'),
    align: 'left',
    field: row => row.priority,
  },
  {
    name: 'followUp',
    label: t('denialColumnFollowUp'),
    align: 'left',
    field: row => row.followUpDateDisplay || '—',
  },
])

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

function issueTypeLabel(sourceType) {
  if (sourceType === 'REJECTION') {
    return t('denialSourceRejection')
  }

  return t('denialSourceDenial')
}

function categoryLabel(category) {
  if (!category) {
    return '—'
  }

  return t(`denialCategory.${category}`)
}

function statusLabel(status) {
  if (!status) {
    return '—'
  }

  return t(`denialStatus.${status}`)
}

async function reloadCurrentPage() {
  loading.value = true
  try {
    const result = await listDenialWorkQueue({
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
        message: denialApiErrorMessage(
          error,
          t('denialListLoadError'),
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
  router.push({ name: 'DenialDetail', params: { id: row.id } })
}
</script>
