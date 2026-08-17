<template>
  <div>
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
        :disable="loading"
        :placeholder="t('clientPaymentSearchPlaceholder')"
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
        :columns="columns"
        :loading="false">
        <template #body-cell-number="scope">
          <q-td
            :props="scope"
            class="admin-data-table__primary-cell">
            <button
              type="button"
              class="admin-data-table__link"
              :data-testid="paymentListTestIds.rowView(
                scope.row.id,
              )"
              @click="openRow(scope.row)">
              {{ scope.row.paymentNumber || '—' }}
            </button>
            <div class="text-caption text-grey-7">
              {{ patientName(scope.row) }}
            </div>
          </q-td>
        </template>
        <template #no-data>
          <div class="q-pa-lg text-grey-7">
            {{ t('clientPaymentQueueEmpty') }}
          </div>
        </template>
      </AdminQTable>
    </AdminTablePanel>

    <ClientPaymentDetailDialog
      v-model="detailOpen"
      :payment="selected"
      :can-allocate="false"
      :can-reverse="false"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { quasarNotifyTypes } from 'components/constants.js'
import AdminTablePanel from
  'components/admin-table/AdminTablePanel.vue'
import AdminQTable from 'components/AdminQTable.vue'
import ClientPaymentDetailDialog from
  'components/payments/ClientPaymentDetailDialog.vue'
import { useAdminTableMobileGrid } from
  'src/composables/useAdminTableMobileGrid.js'
import { isAuthSessionEndUIError } from
  'src/utils/api-session-error.js'
import { moneyLabel } from 'src/utils/remittance-normalize.js'
import {
  listClientPaymentWorkQueue,
  clientPaymentApiErrorMessage,
} from 'src/utils/client-payment-api.js'
import {
  paymentMethodI18nKey,
  paymentStatusI18nKey,
} from 'src/utils/client-payment-normalize.js'
import { paymentListTestIds } from 'src/test-ids/index.js'

const { t } = useI18n()
const $q = useQuasar()
const { showGrid } = useAdminTableMobileGrid()
const loading = ref(false)
const searchQuery = ref('')
const rows = ref([])
const counts = ref({})
const selected = ref(null)
const detailOpen = ref(false)
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
    id: 'unapplied',
    label: t('clientPaymentUnapplied'),
    value: moneyLabel(counts.value.unappliedAmount),
    hint: t('paymentCardCount', {
      count: counts.value.unappliedCount ?? 0,
    }),
  },
  {
    id: 'reversed',
    label: t('clientPaymentStatus.REVERSED'),
    value: moneyLabel(counts.value.reversedAmount),
    hint: t('paymentCardCount', {
      count: counts.value.reversedCount ?? 0,
    }),
  },
])

const columns = computed(() => [
  {
    name: 'date',
    label: t('clientPaymentDate'),
    align: 'left',
    field: row => row.paymentDateDisplay,
  },
  {
    name: 'number',
    label: t('paymentColumnNumber'),
    align: 'left',
    field: row => row.paymentNumber,
  },
  {
    name: 'method',
    label: t('clientPaymentMethod'),
    align: 'left',
    field: row => t(paymentMethodI18nKey(row.paymentMethod)),
  },
  {
    name: 'amount',
    label: t('clientPaymentAmount'),
    align: 'right',
    field: row => row.amountLabel,
  },
  {
    name: 'applied',
    label: t('clientPaymentApplied'),
    align: 'right',
    field: row => row.appliedAmountLabel,
  },
  {
    name: 'unapplied',
    label: t('clientPaymentUnapplied'),
    align: 'right',
    field: row => row.unappliedAmountLabel,
  },
  {
    name: 'status',
    label: t('claimColumnStatus'),
    align: 'left',
    field: row => t(paymentStatusI18nKey(row.status)),
  },
])

onMounted(reloadCurrentPage)

function patientName(row) {
  const name = [row.clientFirstName, row.clientLastName]
    .filter(Boolean)
    .join(' ')

  return name || row.clientNumber || '—'
}

async function reloadCurrentPage() {
  loading.value = true
  try {
    const result = await listClientPaymentWorkQueue({
      q: searchQuery.value.trim() || undefined,
      limit: tablePagination.value.rowsPerPage,
      page: tablePagination.value.page,
    })
    rows.value = result.items
    counts.value = result.counts || {}
    tablePagination.value.rowsNumber = Number(
      result.pagination?.total ?? result.items.length,
    )
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: clientPaymentApiErrorMessage(
          error,
          t('clientPaymentLoadError'),
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

function openRow(row) {
  selected.value = row
  detailOpen.value = true
}

defineExpose({ reloadCurrentPage })
</script>
