<template>
  <div
    class="add-client-payments-tab"
    :data-testid="clientFinancialTestIds.payments">
    <div
      v-if="!hasClientId"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('appointmentSaveClientFirst') }}
      </p>
    </div>

    <div
      v-else-if="!canViewPayments"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('clientPaymentNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div class="appointments-header row items-center q-mb-md">
        <div class="col">
          <SectionHeading
            icon="paid"
            :title="t('clientPaymentHistoryTitle')"
          />
          <p class="text-body2 text-grey-7 q-mb-none q-mt-xs">
            {{ t('clientPaymentHistorySubtitle') }}
          </p>
        </div>
        <div class="col-grow appointments-header__search">
          <q-input
            :model-value="searchQuery"
            outlined
            dense
            clearable
            hide-bottom-space
            class="admin-list-page__search-input
              appointments-header__search-input"
            :data-testid="clientFinancialTestIds.paymentSearch"
            :disable="loading"
            :placeholder="t('clientPaymentSearchPlaceholder')"
            @update:model-value="onSearchInput">
            <template #prepend>
              <q-icon name="search" size="18px" />
            </template>
          </q-input>
        </div>
        <div
          v-if="canCreatePayment"
          class="col-auto appointments-header__actions">
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :data-testid="clientFinancialTestIds.recordPayment"
            :label="t('clientPaymentRecordTitle')"
            @click="openRecord"
          />
        </div>
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
          <template #body-cell-number="scope">
            <q-td
              :props="scope"
              class="admin-data-table__primary-cell">
              <button
                type="button"
                class="admin-data-table__link"
                :data-testid="
                  clientFinancialTestIds.paymentRowView(
                    scope.row.id,
                  )
                "
                @click="openRow(scope.row)">
                {{ scope.row.paymentNumber || '—' }}
              </button>
            </q-td>
          </template>
          <template #no-data>
            <div class="q-pa-lg text-grey-7">
              {{ t('clientPaymentEmpty') }}
            </div>
          </template>
        </AdminQTable>
      </AdminTablePanel>
    </template>

    <RecordClientPaymentDialog
      v-model="recordOpen"
      v-model:obligations="obligations"
      :submitting="actionBusy"
      :current-balance="currentBalance"
      @confirm="onRecord"
    />
    <ClientPaymentDetailDialog
      v-model="detailOpen"
      :payment="selected"
      :can-allocate="canAllocatePayment"
      :can-reverse="canReversePayment"
      @apply="onStartApply"
      @reverse="reverseOpen = true"
    />
    <ApplyClientPaymentDialog
      v-model="applyOpen"
      v-model:obligations="applyObligations"
      :submitting="actionBusy"
      :unapplied-amount="selected?.unappliedAmount || 0"
      @confirm="onApply"
    />
    <ReverseClientPaymentDialog
      v-model="reverseOpen"
      :submitting="actionBusy"
      @confirm="onReverse"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { quasarNotifyTypes } from 'components/constants.js'
import AdminQTable from 'components/AdminQTable.vue'
import AdminTablePanel from
  'components/admin-table/AdminTablePanel.vue'
import SectionHeading from 'components/SectionHeading.vue'
import ApplyClientPaymentDialog from
  'components/payments/ApplyClientPaymentDialog.vue'
import ClientPaymentDetailDialog from
  'components/payments/ClientPaymentDetailDialog.vue'
import RecordClientPaymentDialog from
  'components/payments/RecordClientPaymentDialog.vue'
import ReverseClientPaymentDialog from
  'components/payments/ReverseClientPaymentDialog.vue'
import { useClientFinancialPermissions } from
  'src/composables/useClientFinancialPermissions.js'
import { isAuthSessionEndUIError } from
  'src/utils/api-session-error.js'
import {
  allocateClientPayment,
  createClientPayment,
  listClientPayments,
  listOpenObligations,
  clientPaymentApiErrorMessage,
  reverseClientPayment,
} from 'src/utils/client-payment-api.js'
import {
  paymentMethodI18nKey,
  paymentStatusI18nKey,
} from 'src/utils/client-payment-normalize.js'
import { clientFinancialTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
})

const { t } = useI18n()
const $q = useQuasar()
const {
  canViewPayments,
  canCreatePayment,
  canAllocatePayment,
  canReversePayment,
} = useClientFinancialPermissions()

const loading = ref(false)
const actionBusy = ref(false)
const rows = ref([])
const searchQuery = ref('')
const currentBalance = ref(0)
const selected = ref(null)
const obligations = ref([])
const applyObligations = ref([])
const recordOpen = ref(false)
const detailOpen = ref(false)
const applyOpen = ref(false)
const reverseOpen = ref(false)
const tablePagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
})

const hasClientId = computed(() =>
  String(props.clientId ?? '').trim().length > 0,
)

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

async function reloadCurrentPage() {
  if (!hasClientId.value || !canViewPayments.value) {
    rows.value = []

    return
  }
  loading.value = true
  try {
    const result = await listClientPayments(props.clientId, {
      q: searchQuery.value.trim() || undefined,
      limit: tablePagination.value.rowsPerPage,
      page: tablePagination.value.page,
    })
    rows.value = result.items
    currentBalance.value = result.currentBalance || 0
    tablePagination.value.rowsNumber = Number(
      result.pagination?.total ?? result.items.length,
    )
  } catch (error) {
    notifyError(error, t('clientPaymentLoadError'))
  } finally {
    loading.value = false
  }
}

function notifyError(error, fallback) {
  if (isAuthSessionEndUIError(error)) {
    return
  }
  $q.notify({
    type: quasarNotifyTypes.negative,
    message: clientPaymentApiErrorMessage(error, fallback),
  })
}

function onSearchInput(value) {
  searchQuery.value = String(value ?? '')
  tablePagination.value.page = 1
  reloadCurrentPage()
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

async function openRecord() {
  try {
    const result = await listOpenObligations(props.clientId)
    obligations.value = result.items
    currentBalance.value = result.currentBalance || 0
    recordOpen.value = true
  } catch (error) {
    notifyError(error, t('clientPaymentLoadError'))
  }
}

async function onRecord(body) {
  actionBusy.value = true
  try {
    await createClientPayment(
      props.clientId,
      body,
      body['idempotency_key'],
    )
    recordOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('clientPaymentRecorded'),
    })
    await reloadCurrentPage()
  } catch (error) {
    notifyError(error, t('clientPaymentRecordError'))
  } finally {
    actionBusy.value = false
  }
}

async function onStartApply() {
  try {
    const result = await listOpenObligations(props.clientId)
    applyObligations.value = result.items
    applyOpen.value = true
  } catch (error) {
    notifyError(error, t('clientPaymentLoadError'))
  }
}

async function onApply(allocations) {
  if (!selected.value?.id) {
    return
  }
  actionBusy.value = true
  try {
    selected.value = await allocateClientPayment(
      props.clientId,
      selected.value.id,
      allocations,
    )
    applyOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('clientPaymentAllocated'),
    })
    await reloadCurrentPage()
  } catch (error) {
    notifyError(error, t('clientPaymentAllocateError'))
  } finally {
    actionBusy.value = false
  }
}

async function onReverse(reason) {
  if (!selected.value?.id) {
    return
  }
  actionBusy.value = true
  try {
    selected.value = await reverseClientPayment(
      props.clientId,
      selected.value.id,
      { reason, version: selected.value.version },
    )
    reverseOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('clientPaymentReversed'),
    })
    await reloadCurrentPage()
  } catch (error) {
    notifyError(error, t('clientPaymentReverseError'))
  } finally {
    actionBusy.value = false
  }
}

watch(
  () => [props.clientId, canViewPayments.value],
  reloadCurrentPage,
  { immediate: true },
)
</script>
