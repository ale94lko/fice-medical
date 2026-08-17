<template>
  <q-page
    class="admin-page admin-list-page superbill-list-page"
    :data-testid="paymentListTestIds.page">
    <AppLoadingOverlay
      scope="content"
      :showing="loading && activeTab === 'insurance'"
    />

    <AdminListPageHeader
      :title="t('paymentWorkspaceTitle')"
      :subtitle="t('paymentWorkspaceSubtitle')">
      <template #actions>
        <q-btn
          v-if="canProcess && activeTab === 'insurance'"
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="paymentListTestIds.ingest"
          :label="t('remittanceImportEra')"
          @click="ingestOpen = true"
        />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          icon="sync"
          :disable="loading"
          :data-testid="paymentListTestIds.refresh"
          :label="t('claimQueueRefresh')"
          @click="reloadCurrentPage"
        />
      </template>
    </AdminListPageHeader>

    <div class="q-mb-md">
      <q-btn
        flat
        no-caps
        color="primary"
        :data-testid="paymentListTestIds.tabInsurance"
        class="text-weight-medium"
        :class="{ 'text-weight-medium': activeTab === 'insurance' }"
        :label="t('paymentTabInsurance')"
        @click="activeTab = 'insurance'"
      />
      <q-btn
        v-if="canViewClient"
        flat
        no-caps
        color="primary"
        :data-testid="paymentListTestIds.tabClient"
        :class="{ 'text-weight-medium': activeTab === 'client' }"
        :label="t('paymentTabPatient')"
        @click="activeTab = 'client'"
      />
    </div>

    <ClientPaymentQueuePanel
      v-if="activeTab === 'client'"
    />
    <template v-else>

    <div class="client-list-summary billing-queue-summary
      row q-col-gutter-md q-mb-md">
      <div
        v-for="card in summaryCards"
        :key="card.id"
        class="client-list-summary__col col-12 col-sm-6 col-md">
        <article class="client-list-summary__card">
          <p class="client-list-summary__card-value q-mb-none">
            {{ card.value }}
          </p>
          <p class="client-list-summary__card-label q-mb-none">
            {{ card.label }}
          </p>
          <p class="client-list-summary__card-description q-mb-none">
            {{ card.hint }}
          </p>
        </article>
      </div>
    </div>

    <div class="billing-queue-filters">
      <q-input
        :model-value="searchQuery"
        outlined
        clearable
        hide-bottom-space
        class="billing-queue-filters__search"
        :data-testid="paymentListTestIds.search"
        :disable="loading"
        :placeholder="t('paymentSearchPlaceholder')"
        @update:model-value="onSearchInput">
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
        :rows="rows"
        :columns="visibleColumns"
        :loading="false">
        <template #body-cell-number="scope">
          <q-td :props="scope" class="admin-data-table__primary-cell">
            <button
              type="button"
              class="admin-data-table__link"
              :data-testid="paymentListTestIds.rowView(scope.row.id)"
              @click="openRemittance(scope.row)">
              {{ scope.row.paymentNumber || '—' }}
            </button>
            <div class="text-caption text-grey-7">
              {{ scope.row.paymentReference || '—' }}
            </div>
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
          </q-td>
        </template>
        <template #no-data>
          <div class="q-pa-lg text-grey-7">
            {{ t('paymentQueueEmpty') }}
          </div>
        </template>
      </AdminQTable>
    </AdminTablePanel>

    <p class="text-caption text-grey-7 q-mt-md">
      {{ t('paymentEraHint') }}
    </p>

    <RemittanceIngestDialog
      v-model="ingestOpen"
      :submitting="actionBusy"
      @confirm="onIngest"
    />
    </template>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  permissionNames,
  quasarNotifyTypes,
} from 'components/constants.js'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminQTable from 'components/AdminQTable.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import RemittanceIngestDialog from
  'components/remittances/RemittanceIngestDialog.vue'
import ClientPaymentQueuePanel from
  'components/payments/ClientPaymentQueuePanel.vue'
import { useAdminTableMobileGrid } from
  'src/composables/useAdminTableMobileGrid.js'
import { useSyncAppPageTitle } from
  'src/composables/useAppPageTitle.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'
import { moneyLabel } from 'src/utils/remittance-normalize.js'
import {
  ingestRemittance,
  listInsurancePayments,
  remittanceApiErrorMessage,
} from 'src/utils/remittance-api.js'
import { paymentPostingVariant } from
  'src/utils/remittance-work-queue.js'
import { paymentListTestIds } from 'src/test-ids/index.js'

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const { showGrid } = useAdminTableMobileGrid()

useSyncAppPageTitle(computed(() => t('paymentWorkspaceTitle')))

const canProcess = computed(() => hasPermission(
  authStore.permissions,
  permissionNames.remittanceProcess,
))
const canViewClient = computed(() => hasPermission(
  authStore.permissions,
  permissionNames.clientPaymentView,
))
const activeTab = ref('insurance')

const loading = ref(false)
const actionBusy = ref(false)
const ingestOpen = ref(false)
const searchQuery = ref('')
const rows = ref([])
const counts = ref({})
const tablePagination = ref({
  sortBy: 'paymentDate',
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
})

const summaryCards = computed(() => [
  {
    id: 'received',
    label: t('paymentCardTotalReceived'),
    value: moneyLabel(counts.value.totalReceived),
    hint: t('paymentCardThisMonth'),
  },
  {
    id: 'count',
    label: t('paymentCardPayments'),
    value: String(counts.value.paymentCount ?? 0),
    hint: t('paymentCardThisMonth'),
  },
  {
    id: 'process',
    label: t('paymentCardInProcess'),
    value: moneyLabel(counts.value.inProcessAmount),
    hint: t('paymentCardCount', {
      count: counts.value.inProcessCount ?? 0,
    }),
  },
  {
    id: 'pending',
    label: t('paymentCardPending'),
    value: moneyLabel(counts.value.pendingPostingAmount),
    hint: t('paymentCardCount', {
      count: counts.value.pendingPostingCount ?? 0,
    }),
  },
  {
    id: 'adj',
    label: t('paymentCardAdjustments'),
    value: moneyLabel(counts.value.totalAdjustments),
    hint: t('paymentCardThisMonth'),
  },
])

const visibleColumns = computed(() => [
  {
    name: 'number',
    label: t('paymentColumnNumber'),
    align: 'left',
    field: row => row.paymentNumber,
  },
  {
    name: 'date',
    label: t('paymentColumnDate'),
    align: 'left',
    field: row => row.paymentDate,
  },
  {
    name: 'payer',
    label: t('claimColumnPayer'),
    align: 'left',
    field: row => row.payerName,
  },
  {
    name: 'method',
    label: t('paymentColumnMethod'),
    align: 'left',
    field: row => row.paymentMethod,
  },
  {
    name: 'amount',
    label: t('paymentColumnAmount'),
    align: 'right',
    field: row => row.paymentAmountLabel,
  },
  {
    name: 'unallocated',
    label: t('paymentColumnUnallocated'),
    align: 'right',
    field: row => row.unallocatedAmountLabel,
  },
  {
    name: 'status',
    label: t('claimColumnStatus'),
    align: 'left',
    field: row => row.postingStatus,
  },
])

onMounted(reloadCurrentPage)

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
    const result = await listInsurancePayments({
      q: searchQuery.value.trim() || undefined,
      limit: tablePagination.value.rowsPerPage,
      page: tablePagination.value.page,
    })
    rows.value = result.items
    counts.value = result.counts
    tablePagination.value.rowsNumber = Number(
      result.pagination?.total ?? result.items.length,
    )
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: remittanceApiErrorMessage(
          error,
          t('paymentListLoadError'),
        ),
      })
    }
  } finally {
    loading.value = false
  }
}

function onSearchInput(value) {
  searchQuery.value = String(value ?? '')
  tablePagination.value.page = 1
  reloadCurrentPage()
}

function openRemittance(row) {
  if (!row?.remittanceId) {
    return
  }
  router.push({
    name: 'RemittanceDetail',
    params: { id: row.remittanceId },
  })
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
