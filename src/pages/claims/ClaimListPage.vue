<template>
  <q-page
    class="admin-page admin-list-page superbill-list-page"
    :data-testid="claimListTestIds.page">
    <AppLoadingOverlay
      scope="content"
      :showing="loading"
    />

    <AdminListPageHeader
      :title="t('claimWorkspaceTitle')"
      :subtitle="t('claimWorkspaceSubtitle')">
      <template #actions>
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          icon="sync"
          :disable="loading"
          :data-testid="claimListTestIds.refresh"
          :label="t('claimQueueRefresh')"
          @click="reloadCurrentPage"
        />
      </template>
    </AdminListPageHeader>

    <ClaimQueueSummaryCards
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
        :data-testid="claimListTestIds.search"
        :disable="loading"
        :placeholder="t('claimQueueSearchPlaceholder')"
        :aria-label="t('claimQueueSearchPlaceholder')"
        @update:model-value="onSearchInput"
        @clear="resetSearch">
        <template #prepend>
          <q-icon name="search" size="18px" />
        </template>
      </q-input>
      <FormSelect
        :model-value="dosPreset"
        :options="dosPresetOptions"
        emit-value
        map-options
        outlined
        hide-bottom-space
        :disable="loading"
        :test-id="claimListTestIds.dosFilter"
        @update:model-value="onDosPresetChange"
      />
      <q-input
        v-if="dosPreset === customDos"
        :model-value="customFrom"
        type="date"
        outlined
        hide-bottom-space
        :disable="loading"
        :aria-label="t('claimQueueDosFrom')"
        @update:model-value="onCustomFromChange"
      />
      <q-input
        v-if="dosPreset === customDos"
        :model-value="customTo"
        type="date"
        outlined
        hide-bottom-space
        :disable="loading"
        :aria-label="t('claimQueueDosTo')"
        @update:model-value="onCustomToChange"
      />
      <FormSelect
        :model-value="providerId"
        :options="providerOptions"
        emit-value
        map-options
        outlined
        hide-bottom-space
        :disable="loading"
        :test-id="claimListTestIds.providerFilter"
        @update:model-value="onProviderChange"
      />
      <FormSelect
        :model-value="payer"
        :options="payerOptions"
        emit-value
        map-options
        outlined
        hide-bottom-space
        :disable="loading"
        :test-id="claimListTestIds.payerFilter"
        @update:model-value="onPayerChange"
      />
      <q-input
        :model-value="serviceQuery"
        outlined
        clearable
        hide-bottom-space
        :data-testid="claimListTestIds.serviceFilter"
        :disable="loading"
        :placeholder="t('claimQueueServicePlaceholder')"
        :aria-label="t('claimQueueServicePlaceholder')"
        @update:model-value="onServiceInput"
      />
      <FormSelect
        :model-value="sortKey"
        :options="sortOptions"
        emit-value
        map-options
        outlined
        hide-bottom-space
        :disable="loading"
        :test-id="claimListTestIds.sortFilter"
        @update:model-value="onSortChange"
      />
      <FormToggle
        v-if="queueTab === allTab"
        :model-value="includeVoided"
        :label="t('claimQueueShowVoided')"
        :test-id="claimListTestIds.includeVoided"
        @update:model-value="onIncludeVoidedChange"
      />
    </div>

    <AdminTablePanel
      class="admin-list-page__table-panel"
      :show-column-settings="false">
      <template #toolbar>
        <span class="text-body2 text-grey-7">
          {{ t('claimQueueItemCount', {
            count: tablePagination.rowsNumber,
          }) }}
        </span>
      </template>
      <AdminQTable
        class="table admin-data-table"
        flat
        row-key="id"
        :row-class="claimWorkQueueRowClass"
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
              :data-testid="claimListTestIds.rowView(scope.row.id)"
              @click="openRow(scope.row)">
              {{ scope.row.claimNumber || '—' }}
            </button>
            <div class="text-caption text-grey-7">
              {{ scope.row.superbillNumber || '—' }}
            </div>
          </q-td>
        </template>
        <template #body-cell-client="scope">
          <q-td :props="scope">
            <div class="text-weight-medium">
              {{ scope.row.clientName || '—' }}
            </div>
          </q-td>
        </template>
        <template #body-cell-service="scope">
          <q-td :props="scope">
            <div class="text-weight-medium">
              {{ serviceCell(scope.row).code
                || serviceCell(scope.row).name
                || '—' }}
              <span
                v-if="serviceCell(scope.row).extraLabel"
                class="text-grey-7">
                {{ serviceCell(scope.row).extraLabel }}
              </span>
            </div>
            <div class="text-caption text-grey-7">
              {{ serviceCell(scope.row).name }}
            </div>
          </q-td>
        </template>
        <template #body-cell-status="scope">
          <q-td :props="scope">
            <div
              class="billing-queue-readiness"
              :class="readinessClass(scope.row)">
              {{ readinessLabel(scope.row) }}
            </div>
            <div class="text-caption text-grey-7">
              {{ readinessHint(scope.row) }}
            </div>
          </q-td>
        </template>
        <template #row-actions="{ row }">
          <q-btn
            no-caps
            outline
            dense
            color="primary"
            class="app-btn-outline"
            :data-testid="claimListTestIds.rowView(row.id)"
            :label="t('claimQueueView')"
            @click="openRow(row)"
          />
        </template>
        <template #no-data>
          <div
            class="full-width row flex-center text-grey-7
              q-gutter-sm q-pa-lg">
            <q-icon :name="emptyIcon" size="md" />
            <span>{{ t(emptyKey) }}</span>
          </div>
        </template>
      </AdminQTable>
    </AdminTablePanel>
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
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  claimStatuses,
  quasarNotifyTypes,
} from 'components/constants.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import ClaimQueueSummaryCards from
  'components/claims/ClaimQueueSummaryCards.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import { useAdminTableMobileGrid } from
  'src/composables/useAdminTableMobileGrid.js'
import { useAppFooterPagination } from
  'src/composables/useAppFooterPagination.js'
import { claimListTestIds } from 'src/test-ids/index.js'
import {
  claimDosPresets,
  claimQueueEmptyKey,
  claimQueuePollMs,
  claimQueueStatusParam,
  claimQueueTabs,
  claimWorkQueueRowClass,
  compactServices,
  dosRangeForPreset,
} from 'src/utils/claim-work-queue.js'
import {
  claimApiErrorMessage,
  listClaimWorkQueue,
} from 'src/utils/claim-api.js'

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()
const { showGrid } = useAdminTableMobileGrid()

const allTab = claimQueueTabs.all
const customDos = claimDosPresets.custom
const loading = ref(false)
const rows = ref([])
const searchQuery = ref('')
const serviceQuery = ref('')
const queueTab = ref(claimQueueTabs.needsAttention)
const dosPreset = ref(claimDosPresets.last30)
const customFrom = ref('')
const customTo = ref('')
const providerId = ref(null)
const payer = ref(null)
const includeVoided = ref(false)
const sortKey = ref('dateOfService:desc')
const counts = ref({
  needsAttention: 0,
  ready: 0,
  submitted: 0,
  accepted: 0,
  rejected: 0,
  paid: 0,
  partiallyPaid: 0,
  denied: 0,
  all: 0,
})
const payers = ref([])
const providers = ref([])
let searchDebounceTimer = null
let pollTimer = null

const tablePagination = ref({
  sortBy: 'dateOfServiceFrom',
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
})

const dosPresetOptions = computed(() => [
  { label: t('claimQueueDosAll'), value: claimDosPresets.all },
  { label: t('claimQueueDosToday'), value: claimDosPresets.today },
  { label: t('claimQueueDosLast7'), value: claimDosPresets.last7 },
  { label: t('claimQueueDosLast30'), value: claimDosPresets.last30 },
  { label: t('claimQueueDosCustom'), value: claimDosPresets.custom },
])

const providerOptions = computed(() => [
  { label: t('claimQueueAllProviders'), value: null },
  ...providers.value.map(item => ({
    label: item.name,
    value: item.id,
  })),
])

const payerOptions = computed(() => [
  { label: t('claimQueueAllPayers'), value: null },
  ...payers.value.map(name => ({ label: name, value: name })),
])

const sortOptions = computed(() => [
  {
    label: t('claimQueueSortDosNewest'),
    value: 'dateOfService:desc',
  },
  {
    label: t('claimQueueSortDosOldest'),
    value: 'dateOfService:asc',
  },
  {
    label: t('claimQueueSortNumber'),
    value: 'claimNumber:asc',
  },
  {
    label: t('claimQueueSortClient'),
    value: 'client:asc',
  },
  {
    label: t('claimQueueSortStatus'),
    value: 'status:asc',
  },
  {
    label: t('claimQueueSortTotal'),
    value: 'totalCharge:desc',
  },
])

const visibleColumns = computed(() => [
  {
    name: 'number',
    label: t('claimColumnNumber'),
    align: 'left',
    field: row => row.claimNumber,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'client',
    label: t('claimColumnClient'),
    align: 'left',
    field: row => row.clientName,
    sortable: false,
    headerStyle: 'min-width: 180px',
    style: 'min-width: 180px',
  },
  {
    name: 'dos',
    label: t('claimColumnDos'),
    align: 'left',
    field: row => row.dateOfServiceDisplay,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'payer',
    label: t('claimColumnPayer'),
    align: 'left',
    field: row => row.payerName,
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
  },
  {
    name: 'service',
    label: t('claimColumnService'),
    align: 'left',
    field: row => serviceCell(row).code,
    sortable: false,
    headerStyle: 'min-width: 180px',
    style: 'min-width: 180px',
  },
  {
    name: 'provider',
    label: t('claimColumnProvider'),
    align: 'left',
    field: row => row.renderingProviderName,
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
  },
  {
    name: 'total',
    label: t('claimColumnTotal'),
    align: 'right',
    field: row => row.totalChargeLabel,
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'status',
    label: t('claimColumnStatus'),
    align: 'left',
    field: row => row.status,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'activity',
    label: t('claimColumnLastActivity'),
    align: 'left',
    field: row => formatActivity(row.lastActivityAt),
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'actions',
    label: t('actions'),
    align: 'center',
    field: () => '',
    sortable: false,
    headerStyle: 'min-width: 88px',
    style: 'min-width: 88px',
  },
])

const emptyKey = computed(() => claimQueueEmptyKey(queueTab.value))
const emptyIcon = computed(() => (
  queueTab.value === claimQueueTabs.needsAttention
    ? 'check_circle'
    : 'inbox'
))

function serviceCell(row) {
  return compactServices(row?.services)
}

function formatActivity(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return '—'
  }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return raw
  }

  return date.toLocaleString()
}

function statusLabel(status) {
  if (status === claimStatuses.ready) {
    return t('claimStatusReady')
  }
  if (status === claimStatuses.submitted) {
    return t('claimStatusSubmitted')
  }
  if (status === claimStatuses.accepted) {
    return t('claimStatusAccepted')
  }
  if (status === claimStatuses.rejected) {
    return t('claimStatusRejected')
  }
  if (status === claimStatuses.paid) {
    return t('claimStatusPaid')
  }
  if (status === claimStatuses.partiallyPaid) {
    return t('claimStatusPartiallyPaid')
  }
  if (status === claimStatuses.denied) {
    return t('claimStatusDenied')
  }
  if (status === claimStatuses.voided) {
    return t('claimStatusVoided')
  }

  return t('claimStatusDraft')
}

function readinessClass(row) {
  if (row?.status === claimStatuses.ready
    && row?.issueKind !== 'SUBMISSION_READINESS') {
    return 'billing-queue-readiness--ready'
  }
  if (row?.status === claimStatuses.accepted
    || row?.status === claimStatuses.paid) {
    return 'billing-queue-readiness--ready'
  }
  if (row?.status === claimStatuses.submitted
    || row?.status === claimStatuses.partiallyPaid) {
    return 'billing-queue-readiness--hold'
  }
  if (row?.status === claimStatuses.voided
    || row?.status === claimStatuses.rejected
    || row?.status === claimStatuses.denied) {
    return 'billing-queue-readiness--hold'
  }
  if ((row?.blockingCount ?? 0) > 0
    || row?.issueKind === 'SUBMISSION_READINESS') {
    return 'billing-queue-readiness--blockers'
  }

  return 'billing-queue-readiness--blockers'
}

function readinessLabel(row) {
  if (row?.issueKind === 'SUBMISSION_READINESS') {
    return t('claimQueueSubmissionBlocker')
  }
  if (row?.issueKind === 'REJECTION') {
    return row.issueSummary || t('claimQueueRejectionIssue')
  }
  if ((row?.blockingCount ?? 0) > 0
    && row?.status === claimStatuses.draft) {
    return t('claimQueueBlockers', {
      count: row.blockingCount,
    })
  }

  return statusLabel(row?.status)
}

function readinessHint(row) {
  if (row?.issueKind === 'SUBMISSION_READINESS') {
    return row.issueSummary || t('claimQueueSubmissionBlocker')
  }
  if (row?.issueKind === 'REJECTION') {
    return t('claimQueueRejectionIssue')
  }
  if (row?.issueKind === 'AWAITING_ACKNOWLEDGMENT') {
    return t('claimQueueAwaitingAck')
  }
  if ((row?.blockingCount ?? 0) > 0) {
    return t('claimQueueRequiresAction')
  }
  if ((row?.warningCount ?? 0) > 0) {
    return t('claimQueueWarnings', {
      count: row.warningCount,
    })
  }
  if (row?.status === claimStatuses.ready) {
    return t('claimQueueReadyBody')
  }

  return statusLabel(row?.status)
}

function tablePaginationFromMeta(paginationPayload, meta) {
  const total = Number(meta?.total ?? 0)
  const limit = Number(meta?.limit ?? paginationPayload.rowsPerPage)
    || 10
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

function parseSort(value) {
  const [sort, dir] = String(value || 'dateOfService:desc').split(':')

  return {
    sort,
    sortDir: dir === 'asc' ? 'ASC' : 'DESC',
  }
}

async function loadRows(paginationPayload) {
  loading.value = true
  try {
    const range = dosRangeForPreset(
      dosPreset.value,
      customFrom.value,
      customTo.value,
    )
    const sort = parseSort(sortKey.value)
    const result = await listClaimWorkQueue({
      page: paginationPayload.page,
      limit: paginationPayload.rowsPerPage,
      q: searchQuery.value,
      status: claimQueueStatusParam(queueTab.value),
      from: range.from,
      to: range.to,
      providerId: providerId.value,
      payer: payer.value || undefined,
      service: serviceQuery.value || undefined,
      includeVoided: queueTab.value === allTab
        && includeVoided.value,
      sort: sort.sort,
      sortDir: sort.sortDir,
    })
    rows.value = result.items
    counts.value = result.counts
    payers.value = result.payers
    providers.value = result.providers
    tablePagination.value = tablePaginationFromMeta(
      paginationPayload,
      result.pagination,
    )
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: claimApiErrorMessage(
          error,
          t('claimListLoadError'),
        ),
      })
    }
  } finally {
    loading.value = false
  }
}

function reloadCurrentPage() {
  return loadRows(tablePagination.value)
}

function resetToFirstPage() {
  tablePagination.value = { ...tablePagination.value, page: 1 }
  void reloadCurrentPage()
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

function debounceReload() {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  searchDebounceTimer = setTimeout(() => {
    resetToFirstPage()
  }, 300)
}

function onSearchInput(value) {
  searchQuery.value = String(value ?? '')
  debounceReload()
}

function resetSearch() {
  searchQuery.value = ''
  resetToFirstPage()
}

function onServiceInput(value) {
  serviceQuery.value = String(value ?? '')
  debounceReload()
}

function onQueueTabChange(tab) {
  queueTab.value = tab
  resetToFirstPage()
}

function onDosPresetChange(value) {
  dosPreset.value = value || claimDosPresets.all
  resetToFirstPage()
}

function onCustomFromChange(value) {
  customFrom.value = String(value ?? '')
  resetToFirstPage()
}

function onCustomToChange(value) {
  customTo.value = String(value ?? '')
  resetToFirstPage()
}

function onProviderChange(value) {
  providerId.value = value ?? null
  resetToFirstPage()
}

function onPayerChange(value) {
  payer.value = value ?? null
  resetToFirstPage()
}

function onSortChange(value) {
  sortKey.value = value || 'dateOfService:desc'
  resetToFirstPage()
}

function onIncludeVoidedChange(value) {
  includeVoided.value = Boolean(value)
  resetToFirstPage()
}

function openRow(row) {
  if (row?.id == null) {
    return
  }
  void router.push({
    name: 'ClaimDetail',
    params: { id: String(row.id) },
  })
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
    summaryKey: 'claimQueuePaginationSummary',
    perPageKey: 'adminTablePerPage',
    onPageChange,
    onRowsPerPageChange,
  })
  await reloadCurrentPage()
  pollTimer = setInterval(() => {
    void reloadCurrentPage()
  }, claimQueuePollMs)
})

onBeforeUnmount(() => {
  clearFooterPagination()
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  if (pollTimer) {
    clearInterval(pollTimer)
  }
})
</script>
