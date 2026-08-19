<template>
  <q-page
    class="admin-page admin-list-page superbill-list-page"
    :data-testid="superbillListTestIds.page">
    <AppLoadingOverlay
      scope="content"
      :showing="loading"
    />

    <AdminListPageHeader
      :title="t('billingWorkspaceTitle')"
      :subtitle="t('billingWorkspaceSubtitle')">
      <template #actions>
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          icon="sync"
          :disable="loading"
          :data-testid="superbillListTestIds.refresh"
          :label="t('billingQueueRefresh')"
          @click="reloadCurrentPage"
        />
      </template>
    </AdminListPageHeader>

    <BillingQueueSummaryCards
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
        :data-testid="superbillListTestIds.search"
        :disable="loading"
        :placeholder="t('billingQueueSearchPlaceholder')"
        :aria-label="t('billingQueueSearchPlaceholder')"
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
        :test-id="superbillListTestIds.dosFilter"
        @update:model-value="onDosPresetChange"
      />
      <q-input
        v-if="dosPreset === customDos"
        :model-value="customFrom"
        type="date"
        outlined
        hide-bottom-space
        :disable="loading"
        :aria-label="t('billingQueueDosFrom')"
        @update:model-value="onCustomFromChange"
      />
      <q-input
        v-if="dosPreset === customDos"
        :model-value="customTo"
        type="date"
        outlined
        hide-bottom-space
        :disable="loading"
        :aria-label="t('billingQueueDosTo')"
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
        :test-id="superbillListTestIds.providerFilter"
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
        :test-id="superbillListTestIds.payerFilter"
        @update:model-value="onPayerChange"
      />
      <FormSelect
        :model-value="locationId"
        :options="locationOptions"
        emit-value
        map-options
        outlined
        hide-bottom-space
        :disable="loading"
        :test-id="superbillListTestIds.locationFilter"
        @update:model-value="onLocationChange"
      />
      <q-input
        :model-value="serviceQuery"
        outlined
        clearable
        hide-bottom-space
        :data-testid="superbillListTestIds.serviceFilter"
        :disable="loading"
        :placeholder="t('billingQueueServicePlaceholder')"
        :aria-label="t('billingQueueServicePlaceholder')"
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
        :test-id="superbillListTestIds.sortFilter"
        @update:model-value="onSortChange"
      />
      <FormToggle
        v-if="queueTab === allTab"
        :model-value="includeVoided"
        :label="t('billingQueueShowVoided')"
        :test-id="superbillListTestIds.includeVoided"
        @update:model-value="onIncludeVoidedChange"
      />
    </div>

    <AdminTablePanel
      class="admin-list-page__table-panel"
      :show-column-settings="false">
      <template #toolbar>
        <span class="text-body2 text-grey-7">
          {{ t('billingQueueItemCount', {
            count: tablePagination.rowsNumber,
          }) }}
        </span>
      </template>
      <AdminQTable
        class="table admin-data-table"
        flat
        row-key="id"
        :row-class="workQueueRowClass"
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
              :data-testid="superbillListTestIds.rowView(scope.row.id)"
              @click="openRow(scope.row)">
              {{ scope.row.superbillNumber || '—' }}
            </button>
            <div class="text-caption text-grey-7">
              {{ scope.row.encounterNumber || '—' }}
            </div>
          </q-td>
        </template>
        <template #body-cell-client="scope">
          <q-td :props="scope">
            <div class="text-weight-medium">
              {{ scope.row.clientName || '—' }}
            </div>
            <div class="text-caption">
              <span
                v-if="scope.row.clientNumber"
                class="billing-queue-client-id">
                {{ scope.row.clientNumber }}
              </span>
            </div>
            <div
              v-if="scope.row.clientDobDisplay"
              class="text-caption text-grey-7">
              {{ t('superbillDob') }}
              {{ scope.row.clientDobDisplay }}
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
            <span
              v-if="(scope.row.services || []).length"
              class="billing-queue-service-badge">
              {{ t('billingQueueServiceCount', {
                count: scope.row.services.length,
              }) }}
            </span>
          </q-td>
        </template>
        <template #body-cell-provider="scope">
          <q-td :props="scope">
            <div class="text-weight-medium">
              {{ scope.row.renderingProviderName || '—' }}
            </div>
            <div
              v-if="scope.row.renderingProviderNpi"
              class="text-caption text-grey-7">
              NPI {{ scope.row.renderingProviderNpi }}
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
            :data-testid="superbillListTestIds.rowView(row.id)"
            :label="rowActionLabel(row)"
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
  billingResponsibilityValues,
  quasarNotifyTypes,
  superbillStatuses,
} from 'components/constants.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import BillingQueueSummaryCards from
  'components/billing/BillingQueueSummaryCards.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import { useAdminTableMobileGrid } from
  'src/composables/useAdminTableMobileGrid.js'
import { useAppFooterPagination } from
  'src/composables/useAppFooterPagination.js'
import { superbillListTestIds } from 'src/test-ids/index.js'
import {
  billingDosPresets,
  billingQueuePollMs,
  billingQueueTabs,
  compactServices,
  dosRangeForPreset,
  queueEmptyKey,
  queueStatusParam,
  workQueueRowClass,
} from 'src/utils/billing-work-queue.js'
import {
  listBillingWorkQueue,
  superbillApiErrorMessage,
} from 'src/utils/superbill-api.js'

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()
const { showGrid } = useAdminTableMobileGrid()

const allTab = billingQueueTabs.all
const customDos = billingDosPresets.custom
const loading = ref(false)
const rows = ref([])
const searchQuery = ref('')
const serviceQuery = ref('')
const queueTab = ref(billingQueueTabs.all)
const dosPreset = ref(billingDosPresets.last30)
const customFrom = ref('')
const customTo = ref('')
const providerId = ref(null)
const locationId = ref(null)
const payer = ref(null)
const includeVoided = ref(false)
const sortKey = ref('dateOfService:desc')
const counts = ref({
  needsAttention: 0,
  readyForReview: 0,
  onHold: 0,
  reviewed: 0,
  all: 0,
})
const payers = ref([])
const locations = ref([])
const providers = ref([])
let searchDebounceTimer = null
let pollTimer = null

const tablePagination = ref({
  sortBy: 'dateOfService',
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
})

const dosPresetOptions = computed(() => [
  { label: t('billingQueueDosAll'), value: billingDosPresets.all },
  { label: t('billingQueueDosToday'), value: billingDosPresets.today },
  { label: t('billingQueueDosLast7'), value: billingDosPresets.last7 },
  { label: t('billingQueueDosLast30'), value: billingDosPresets.last30 },
  { label: t('billingQueueDosCustom'), value: billingDosPresets.custom },
])

const providerOptions = computed(() => [
  { label: t('billingQueueAllProviders'), value: null },
  ...providers.value.map(item => ({
    label: item.name,
    value: item.id,
  })),
])

const locationOptions = computed(() => [
  { label: t('billingQueueAllLocations'), value: null },
  ...locations.value.map(item => ({
    label: item.name,
    value: item.id,
  })),
])

const payerOptions = computed(() => [
  { label: t('billingQueueAllPayers'), value: null },
  {
    label: t('superbillSelfPay'),
    value: billingResponsibilityValues.selfPay,
  },
  ...payers.value.map(name => ({ label: name, value: name })),
])

const sortOptions = computed(() => [
  {
    label: t('billingQueueSortDosNewest'),
    value: 'dateOfService:desc',
  },
  {
    label: t('billingQueueSortDosOldest'),
    value: 'dateOfService:asc',
  },
  {
    label: t('billingQueueSortNumber'),
    value: 'superbillNumber:asc',
  },
  {
    label: t('billingQueueSortClient'),
    value: 'client:asc',
  },
  {
    label: t('billingQueueSortStatus'),
    value: 'status:asc',
  },
  {
    label: t('billingQueueSortTotal'),
    value: 'totalCharge:desc',
  },
])

const visibleColumns = computed(() => [
  {
    name: 'number',
    label: t('superbillColumnNumber'),
    align: 'left',
    field: row => row.superbillNumber,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'client',
    label: t('superbillColumnClient'),
    align: 'left',
    field: row => row.clientName,
    sortable: false,
    headerStyle: 'min-width: 180px',
    style: 'min-width: 180px',
  },
  {
    name: 'dos',
    label: t('superbillColumnDos'),
    align: 'left',
    field: row => row.dateOfServiceDisplay,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
  },
  {
    name: 'service',
    label: t('superbillColumnService'),
    align: 'left',
    field: row => serviceCell(row).code,
    sortable: false,
    headerStyle: 'min-width: 180px',
    style: 'min-width: 180px',
  },
  {
    name: 'provider',
    label: t('superbillColumnProvider'),
    align: 'left',
    field: row => row.renderingProviderName,
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
  },
  {
    name: 'payer',
    label: t('superbillColumnPayer'),
    align: 'left',
    field: row => payerLabel(row),
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
  },
  {
    name: 'total',
    label: t('superbillColumnTotal'),
    align: 'right',
    field: row => row.totalChargeLabel,
    sortable: false,
    headerStyle: 'min-width: 110px',
    style: 'min-width: 110px',
  },
  {
    name: 'status',
    label: t('superbillColumnReadiness'),
    align: 'left',
    field: row => row.status,
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

const emptyKey = computed(() => queueEmptyKey(queueTab.value))
const emptyIcon = computed(() => (
  queueTab.value === billingQueueTabs.needsAttention
    ? 'check_circle'
    : 'inbox'
))

function serviceCell(row) {
  return compactServices(row?.services)
}

function readinessClass(row) {
  if (row?.onHold) {
    return 'billing-queue-readiness--hold'
  }
  if (row?.status === superbillStatuses.reviewed) {
    return 'billing-queue-readiness--ready'
  }
  if ((row?.blockingCount ?? 0) > 0) {
    return 'billing-queue-readiness--blockers'
  }
  if ((row?.warningCount ?? 0) > 0) {
    return 'billing-queue-readiness--warning'
  }
  if (row?.status === superbillStatuses.ready) {
    return 'billing-queue-readiness--ready'
  }

  return 'billing-queue-readiness--blockers'
}

function readinessLabel(row) {
  if (row?.onHold) {
    return t('billingQueueOnHold')
  }
  if (row?.status === superbillStatuses.reviewed) {
    return t('superbillStatusReviewed')
  }
  if ((row?.blockingCount ?? 0) > 0) {
    return t('billingQueueBlockers', {
      count: row.blockingCount,
    })
  }
  if ((row?.warningCount ?? 0) > 0) {
    return t('billingQueueWarnings', {
      count: row.warningCount,
    })
  }
  if (row?.status === superbillStatuses.ready) {
    return t('billingQueueReadyForReview')
  }

  return t('superbillStatusNotReady')
}

function readinessHint(row) {
  if (row?.onHold && row.holdReason) {
    return holdReasonLabel(row.holdReason)
  }
  if ((row?.blockingCount ?? 0) > 0) {
    return t('billingQueueRequiresAction')
  }
  if ((row?.warningCount ?? 0) > 0) {
    return t('billingQueueWarningHint')
  }
  if (row?.status === superbillStatuses.ready) {
    return t('billingQueueReadyHint')
  }

  return ''
}

function holdReasonLabel(reason) {
  const map = {
    WAITING_FOR_AUTHORIZATION: 'superbillHoldWaitingAuthorization',
    WAITING_FOR_INSURANCE: 'superbillHoldWaitingInsurance',
    WAITING_FOR_PROVIDER: 'superbillHoldWaitingProvider',
    WAITING_FOR_DOCUMENTATION: 'superbillHoldWaitingDocumentation',
    INTERNAL_REVIEW: 'superbillHoldInternalReview',
    OTHER: 'superbillHoldOther',
  }
  const key = map[reason]
  return key ? t(key) : reason
}

function payerLabel(row) {
  if (row.billingResponsibility === billingResponsibilityValues.selfPay) {
    return t('superbillSelfPay')
  }

  return row.payerName || t('superbillMissingValue')
}

function rowActionLabel(row) {
  if (row.status === superbillStatuses.reviewed
    || row.status === superbillStatuses.voided) {
    return t('billingQueueView')
  }

  return t('billingQueueReview')
}

function tablePaginationFromMeta(paginationPayload, meta) {
  const total = Number(meta?.total ?? 0)
  const limit = Number(meta?.limit ?? paginationPayload.rowsPerPage) || 10
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
    const result = await listBillingWorkQueue({
      page: paginationPayload.page,
      limit: paginationPayload.rowsPerPage,
      q: searchQuery.value,
      status: queueStatusParam(queueTab.value),
      from: range.from,
      to: range.to,
      providerId: providerId.value,
      locationId: locationId.value,
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
    locations.value = result.locations
    providers.value = result.providers
    tablePagination.value = tablePaginationFromMeta(
      paginationPayload,
      result.pagination,
    )
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: superbillApiErrorMessage(
          error,
          t('superbillListLoadError'),
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
  dosPreset.value = value || billingDosPresets.all
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

function onLocationChange(value) {
  locationId.value = value ?? null
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
    name: 'SuperbillDetail',
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
    summaryKey: 'billingQueuePaginationSummary',
    perPageKey: 'adminTablePerPage',
    onPageChange,
    onRowsPerPageChange,
  })
  await reloadCurrentPage()
  pollTimer = setInterval(() => {
    void reloadCurrentPage()
  }, billingQueuePollMs)
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
