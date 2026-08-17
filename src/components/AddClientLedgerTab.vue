<template>
  <div
    class="add-client-ledger-tab"
    :data-testid="clientFinancialTestIds.ledger">
    <div
      v-if="!hasClientId"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('appointmentSaveClientFirst') }}
      </p>
    </div>

    <div
      v-else-if="!canViewLedger"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('clientLedgerNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div class="row items-center q-mb-md">
        <div class="col">
          <SectionHeading
            icon="receipt_long"
            :title="t('clientLedgerTitle')"
          />
          <p class="text-body2 text-grey-7 q-mb-none q-mt-xs">
            {{ t('clientLedgerSubtitle') }}
          </p>
        </div>
        <div class="col-auto">
          <p class="text-caption text-grey-7 q-mb-none">
            {{ t('clientFinancialCurrentBalance') }}
          </p>
          <p class="text-h6 text-weight-medium q-mb-none">
            {{ currentBalanceLabel }}
          </p>
        </div>
      </div>

      <div class="billing-queue-filters q-mb-md">
        <q-input
          :model-value="searchQuery"
          outlined
          clearable
          hide-bottom-space
          class="billing-queue-filters__search"
          :data-testid="clientFinancialTestIds.search"
          :disable="loading"
          :placeholder="t('clientLedgerSearchPlaceholder')"
          :aria-label="t('clientLedgerSearchPlaceholder')"
          @update:model-value="onSearchInput"
          @clear="resetSearch">
          <template #prepend>
            <q-icon name="search" size="18px" />
          </template>
        </q-input>
        <FormSelect
          :model-value="entryType"
          :options="typeOptions"
          emit-value
          map-options
          outlined
          hide-bottom-space
          clearable
          :disable="loading"
          :test-id="clientFinancialTestIds.typeFilter"
          @update:model-value="onTypeChange"
        />
        <FormSelect
          :model-value="status"
          :options="statusOptions"
          emit-value
          map-options
          outlined
          hide-bottom-space
          clearable
          :disable="loading"
          :test-id="clientFinancialTestIds.statusFilter"
          @update:model-value="onStatusChange"
        />
        <q-input
          :model-value="fromDate"
          type="date"
          outlined
          hide-bottom-space
          :disable="loading"
          :aria-label="t('clientLedgerDateFrom')"
          :data-testid="clientFinancialTestIds.fromDate"
          @update:model-value="onFromChange"
        />
        <q-input
          :model-value="toDate"
          type="date"
          outlined
          hide-bottom-space
          :disable="loading"
          :aria-label="t('clientLedgerDateTo')"
          :data-testid="clientFinancialTestIds.toDate"
          @update:model-value="onToChange"
        />
      </div>

      <AdminTablePanel
        class="admin-table-panel--wide"
        :show-column-settings="false">
        <div
          v-if="loading"
          class="admin-data-table__empty full-width row
            flex-center text-grey-7 q-gutter-sm q-pa-lg">
          <q-spinner color="primary" size="28px" />
          <span>{{ t('appLoading') }}</span>
        </div>
        <AdminQTable
          v-else
          class="table admin-data-table"
          flat
          row-key="id"
          v-model:pagination="tablePagination"
          :rows-per-page-options="[10, 20, 50]"
          :rows="rows"
          :columns="columns"
          :loading="false"
          @request="onTableRequest">
          <template #body-cell-description="scope">
            <q-td :props="scope" class="admin-data-table__primary-cell">
              <button
                type="button"
                class="admin-data-table__link"
                :data-testid="clientFinancialTestIds.rowView(
                  scope.row.id,
                )"
                @click="openRow(scope.row)">
                {{ scope.row.description }}
              </button>
            </q-td>
          </template>
        </AdminQTable>
      </AdminTablePanel>
    </template>

    <LedgerEntryDetailDialog
      v-model="detailOpen"
      :entry="selected"
      :can-view-claim="canOpenClaim"
      :can-view-superbill="canOpenSuperbill"
      @view-claim="openClaim"
      @view-superbill="openSuperbill"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import {
  ledgerEntryStatuses,
  ledgerEntryTypes,
  permissionNames,
  quasarNotifyTypes,
} from 'components/constants.js'
import AdminQTable from 'components/admin-table/AdminQTable.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import FormSelect from 'components/FormSelect.vue'
import SectionHeading from 'components/SectionHeading.vue'
import LedgerEntryDetailDialog from
  'components/ledger/LedgerEntryDetailDialog.vue'
import { useClientFinancialPermissions } from
  'src/composables/useClientFinancialPermissions.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { hasPermission } from 'src/utils/auth-permissions.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  ledgerApiErrorMessage,
  listClientLedger,
} from 'src/utils/ledger-api.js'
import {
  formatLedgerMoney,
  ledgerStatusI18nKey,
  ledgerTypeI18nKey,
} from 'src/utils/ledger-normalize.js'
import { clientFinancialTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
})

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const { canViewLedger } = useClientFinancialPermissions()
const loading = ref(false)
const rows = ref([])
const searchQuery = ref('')
const entryType = ref(null)
const status = ref(null)
const fromDate = ref('')
const toDate = ref('')
const currentBalanceLabel = ref(formatLedgerMoney(0))
const selected = ref(null)
const detailOpen = ref(false)
const tablePagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
})

const hasClientId = computed(() => {
  const id = String(props.clientId ?? '').trim()

  return id.length > 0
})

const typeOptions = computed(() => [
  {
    label: t('ledgerEntryType.CLIENT_RESPONSIBILITY'),
    value: ledgerEntryTypes.clientResponsibility,
  },
  {
    label: t('ledgerEntryType.SELF_PAY_CHARGE'),
    value: ledgerEntryTypes.selfPayCharge,
  },
  {
    label: t('ledgerEntryType.REVERSAL'),
    value: ledgerEntryTypes.reversal,
  },
])

const statusOptions = computed(() => [
  {
    label: t('ledgerEntryStatus.POSTED'),
    value: ledgerEntryStatuses.posted,
  },
  {
    label: t('ledgerEntryStatus.REVERSED'),
    value: ledgerEntryStatuses.reversed,
  },
  {
    label: t('ledgerEntryStatus.PENDING'),
    value: ledgerEntryStatuses.pending,
  },
])

const columns = computed(() => [
  {
    name: 'date',
    label: t('clientLedgerColumnDate'),
    align: 'left',
    field: row => row.effectiveDateDisplay,
  },
  {
    name: 'description',
    label: t('clientLedgerColumnDescription'),
    align: 'left',
    field: row => row.description,
  },
  {
    name: 'type',
    label: t('clientLedgerColumnType'),
    align: 'left',
    field: row => t(ledgerTypeI18nKey(row.entryType)),
  },
  {
    name: 'reference',
    label: t('clientLedgerColumnReference'),
    align: 'left',
    field: row => row.referenceNumber || '—',
  },
  {
    name: 'charge',
    label: t('clientLedgerColumnCharge'),
    align: 'right',
    field: row => row.chargeLabel,
  },
  {
    name: 'credit',
    label: t('clientLedgerColumnCredit'),
    align: 'right',
    field: row => row.creditLabel,
  },
  {
    name: 'balance',
    label: t('clientLedgerColumnBalance'),
    align: 'right',
    field: row => row.runningBalanceLabel,
  },
  {
    name: 'status',
    label: t('clientLedgerColumnStatus'),
    align: 'left',
    field: row => t(ledgerStatusI18nKey(row.status)),
  },
])

const canOpenClaim = computed(() => {
  const perms = authStore.permissions

  return Boolean(selected.value?.claimId)
    && hasPermission(perms, permissionNames.claimView)
})

const canOpenSuperbill = computed(() => {
  const perms = authStore.permissions

  return Boolean(selected.value?.superbillId)
    && hasPermission(perms, permissionNames.superbillView)
})

async function reloadCurrentPage() {
  if (!hasClientId.value || !canViewLedger.value) {
    rows.value = []

    return
  }
  loading.value = true
  try {
    const result = await listClientLedger(props.clientId, {
      q: searchQuery.value.trim() || undefined,
      entryType: entryType.value || undefined,
      status: status.value || undefined,
      from: fromDate.value || undefined,
      to: toDate.value || undefined,
      limit: tablePagination.value.rowsPerPage,
      page: tablePagination.value.page,
    })
    rows.value = result.items
    currentBalanceLabel.value = result.currentBalanceLabel
      || formatLedgerMoney(0)
    tablePagination.value.rowsNumber = Number(
      result.pagination?.total ?? result.items.length,
    )
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: ledgerApiErrorMessage(
          error,
          t('clientLedgerLoadError'),
        ),
      })
    }
  } finally {
    loading.value = false
  }
}

function resetPageAndReload() {
  tablePagination.value.page = 1
  reloadCurrentPage()
}

function onSearchInput(value) {
  searchQuery.value = String(value ?? '')
  resetPageAndReload()
}

function resetSearch() {
  searchQuery.value = ''
  resetPageAndReload()
}

function onTypeChange(value) {
  entryType.value = value || null
  resetPageAndReload()
}

function onStatusChange(value) {
  status.value = value || null
  resetPageAndReload()
}

function onFromChange(value) {
  fromDate.value = String(value ?? '')
  resetPageAndReload()
}

function onToChange(value) {
  toDate.value = String(value ?? '')
  resetPageAndReload()
}

function onTableRequest(request) {
  const next = request?.pagination ?? {}
  tablePagination.value.page = next.page ?? 1
  tablePagination.value.rowsPerPage = next.rowsPerPage ?? 10
  reloadCurrentPage()
}

function openRow(row) {
  selected.value = row
  detailOpen.value = true
}

function openClaim() {
  const id = selected.value?.claimId
  if (!id) {
    return
  }
  router.push({ name: 'ClaimDetail', params: { id: String(id) } })
}

function openSuperbill() {
  const id = selected.value?.superbillId
  if (!id) {
    return
  }
  router.push({
    name: 'SuperbillDetail',
    params: { id: String(id) },
  })
}

watch(
  () => [props.clientId, canViewLedger.value],
  reloadCurrentPage,
  { immediate: true },
)
</script>
