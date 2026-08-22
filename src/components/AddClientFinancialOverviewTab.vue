<template>
  <div
    class="add-client-financial-overview"
    :data-testid="clientFinancialTestIds.overview">
    <div
      v-if="!hasClientId"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
      <p class="add-client-financial-overview__empty">
        {{ t('appointmentSaveClientFirst') }}
      </p>
    </div>

    <div
      v-else-if="!canViewFinancial"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="add-client-financial-overview__empty">
        {{ t('clientFinancialNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div class="add-client-financial-overview__header
        appointments-header row items-center">
        <div class="add-client-financial-overview__heading col">
          <SectionHeading
            icon="account_balance_wallet"
            :title="t('clientFinancialOverviewTitle')"
          />
          <p class="add-client-financial-overview__subtitle">
            {{ t('clientFinancialOverviewSubtitle') }}
          </p>
        </div>
        <div
          v-if="canCreatePayment"
          class="add-client-financial-overview__actions
            appointments-header__actions col-auto">
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

      <div
        v-if="loading"
        class="fmh-list-card q-pa-lg row flex-center
          text-grey-7 q-gutter-sm">
        <q-spinner color="primary" size="28px" />
        <span>{{ t('appLoading') }}</span>
      </div>

      <template v-else>
        <div class="add-client-financial-overview__summary">
          <article
            v-for="card in cards"
            :key="card.id"
            class="add-client-financial-overview__kpi"
            :class="`add-client-financial-overview__kpi--${
              card.tone
            }`">
            <header class="add-client-financial-overview__kpi-head">
              <div class="add-client-financial-overview__kpi-icon">
                <q-icon :name="card.icon" size="18px" />
              </div>
              <p class="add-client-financial-overview__kpi-label
                q-mb-none">
                {{ card.label }}
              </p>
            </header>
            <p
              class="add-client-financial-overview__kpi-value
                q-mb-none"
              :class="card.valueClass">
              {{ card.value }}
            </p>
            <p
              class="add-client-financial-overview__kpi-hint
                q-mb-none"
              :title="card.description">
              {{ card.description }}
            </p>
          </article>
        </div>

        <div class="add-client-financial-overview__panel">
          <SubsectionHeading
            icon="pie_chart"
            :title="t('clientFinancialResponsibilityBreakdown')"
          />
          <div class="add-client-financial-overview__metrics">
            <div
              v-for="item in breakdownItems"
              :key="item.id"
              class="add-client-financial-overview__metric">
              <p class="add-client-financial-overview__metric-label
                q-mb-none">
                <q-icon :name="item.icon" size="16px" />
                {{ item.label }}
              </p>
              <p class="add-client-financial-overview__metric-value
                q-mb-none">
                {{ item.value }}
              </p>
            </div>
          </div>
        </div>

        <div class="add-client-financial-overview__activity">
          <SubsectionHeading
            icon="history"
            :title="t('clientFinancialRecentActivity')"
          />
          <div
            v-if="!recent.length"
            class="fmh-list-card q-pa-lg text-center">
            <p class="add-client-financial-overview__empty">
              {{ t('clientLedgerEmpty') }}
            </p>
          </div>
          <div
            v-else
            class="fmh-list-card q-pa-none">
            <div class="fmh-table-wrap">
              <table class="fmh-table">
                <thead>
                  <tr>
                    <th>{{ t('clientLedgerColumnDate') }}</th>
                    <th>
                      {{ t('clientLedgerColumnDescription') }}
                    </th>
                    <th>{{ t('clientLedgerColumnType') }}</th>
                    <th>
                      {{ t('clientLedgerColumnReference') }}
                    </th>
                    <th class="text-right">
                      {{ t('clientLedgerColumnAmount') }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in recent"
                    :key="row.id"
                    :data-testid="
                      clientFinancialTestIds.recentRow(row.id)
                    ">
                    <td>{{ row.effectiveDateDisplay }}</td>
                    <td
                      class="add-client-financial-overview__desc"
                      :title="row.description">
                      {{ row.description }}
                    </td>
                    <td>{{ typeLabel(row.entryType) }}</td>
                    <td>{{ row.referenceNumber || '—' }}</td>
                    <td
                      class="text-right
                        add-client-financial-overview__amount"
                      :class="amountClass(row.amount)">
                      {{ row.amountLabel }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>
    </template>

    <RecordClientPaymentDialog
      v-model="recordOpen"
      v-model:obligations="obligations"
      :submitting="actionBusy"
      :current-balance="summary?.currentBalance || 0"
      @confirm="onRecord"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { quasarNotifyTypes } from 'components/constants.js'
import SectionHeading from 'components/SectionHeading.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import RecordClientPaymentDialog from
  'components/payments/RecordClientPaymentDialog.vue'
import { useClientFinancialPermissions } from
  'src/composables/useClientFinancialPermissions.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  getClientFinancialSummary,
  ledgerApiErrorMessage,
} from 'src/utils/ledger-api.js'
import { ledgerTypeI18nKey } from 'src/utils/ledger-normalize.js'
import {
  createClientPayment,
  listOpenObligations,
  clientPaymentApiErrorMessage,
} from 'src/utils/client-payment-api.js'
import { clientFinancialTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
})

const { t } = useI18n()
const $q = useQuasar()
const { canViewFinancial, canCreatePayment } =
  useClientFinancialPermissions()
const loading = ref(false)
const actionBusy = ref(false)
const summary = ref(null)
const recordOpen = ref(false)
const obligations = ref([])

const hasClientId = computed(() => {
  const id = String(props.clientId ?? '').trim()

  return id.length > 0
})

function lastPaymentCard(data, zero) {
  const hasPayment = Boolean(
    data?.lastPaymentNumber
    || data?.lastPaymentDate
    || (data?.lastPaymentAmount ?? 0) !== 0,
  )
  const details = [
    data?.lastPaymentNumber,
    data?.lastPaymentDateDisplay,
  ].filter(value => value && value !== '—')

  return {
    id: 'last',
    label: t('clientFinancialLastPayment'),
    description: hasPayment && details.length
      ? details.join(' · ')
      : t('clientPaymentNoLastPayment'),
    value: hasPayment
      ? (data.lastPaymentAmountLabel || zero)
      : zero,
    icon: 'paid',
    tone: 'green',
    valueClass: hasPayment
      ? 'add-client-financial-overview__kpi-value--credit'
      : '',
  }
}

const cards = computed(() => {
  const data = summary.value
  const zero = t('clientLedgerZeroBalance')
  const displayBalance = (data?.currentBalance ?? 0) > 0
    ? data.currentBalanceLabel
    : zero

  return [
    {
      id: 'balance',
      label: t('clientFinancialCurrentBalance'),
      description: t('clientFinancialCurrentBalanceHint'),
      value: displayBalance,
      icon: 'account_balance_wallet',
      tone: 'orange',
      valueClass: (data?.currentBalance ?? 0) > 0
        ? 'add-client-financial-overview__kpi-value--due'
        : '',
    },
    {
      id: 'open',
      label: t('clientFinancialOpenObligations'),
      description: t('clientFinancialOpenObligationsHint'),
      value: data?.openObligationsLabel || zero,
      icon: 'receipt_long',
      tone: 'teal',
      valueClass: '',
    },
    {
      id: 'credit',
      label: t('clientFinancialAvailableCredit'),
      description: t('clientFinancialAvailableCreditHint'),
      value: data?.availableCreditLabel || zero,
      icon: 'savings',
      tone: 'blue',
      valueClass: (data?.availableCredit ?? 0) > 0
        ? 'add-client-financial-overview__kpi-value--credit'
        : '',
    },
    lastPaymentCard(data, zero),
  ]
})

const breakdownItems = computed(() => {
  const pr = summary.value?.clientResponsibility || {}

  return [
    {
      id: 'copay',
      icon: 'payments',
      label: t('ledgerResponsibility.COPAY'),
      value: pr.copayLabel || t('clientLedgerZeroBalance'),
    },
    {
      id: 'deductible',
      icon: 'percent',
      label: t('ledgerResponsibility.DEDUCTIBLE'),
      value: pr.deductibleLabel || t('clientLedgerZeroBalance'),
    },
    {
      id: 'coinsurance',
      icon: 'pie_chart',
      label: t('ledgerResponsibility.COINSURANCE'),
      value: pr.coinsuranceLabel || t('clientLedgerZeroBalance'),
    },
    {
      id: 'other',
      icon: 'more_horiz',
      label: t('ledgerResponsibility.OTHER'),
      value: pr.otherLabel || t('clientLedgerZeroBalance'),
    },
  ]
})

const recent = computed(() => summary.value?.recentActivity ?? [])

function typeLabel(entryType) {
  if (!entryType) {
    return '—'
  }

  return t(ledgerTypeI18nKey(entryType))
}

function amountClass(amount) {
  if (amount < 0) {
    return 'add-client-financial-overview__amount--credit'
  }
  if (amount > 0) {
    return 'add-client-financial-overview__amount--charge'
  }

  return ''
}

async function loadSummary() {
  if (!hasClientId.value || !canViewFinancial.value) {
    summary.value = null

    return
  }
  loading.value = true
  try {
    summary.value = await getClientFinancialSummary(props.clientId)
  } catch (error) {
    summary.value = null
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: ledgerApiErrorMessage(
          error,
          t('clientFinancialLoadError'),
        ),
      })
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.clientId, canViewFinancial.value],
  loadSummary,
  { immediate: true },
)

async function openRecord() {
  try {
    const result = await listOpenObligations(props.clientId)
    obligations.value = result.items
    recordOpen.value = true
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
    await loadSummary()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: clientPaymentApiErrorMessage(
          error,
          t('clientPaymentRecordError'),
        ),
      })
    }
  } finally {
    actionBusy.value = false
  }
}
</script>
