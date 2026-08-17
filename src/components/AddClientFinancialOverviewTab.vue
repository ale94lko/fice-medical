<template>
  <div
    class="add-client-financial-overview"
    :data-testid="clientFinancialTestIds.overview">
    <div
      v-if="!hasClientId"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('appointmentSaveClientFirst') }}
      </p>
    </div>

    <div
      v-else-if="!canViewFinancial"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('clientFinancialNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div class="row items-center q-mb-md">
        <div class="col">
          <SectionHeading
            icon="account_balance_wallet"
            :title="t('clientFinancialOverviewTitle')"
          />
          <p class="text-body2 text-grey-7 q-mb-none q-mt-xs">
            {{ t('clientFinancialOverviewSubtitle') }}
          </p>
        </div>
        <div class="col-auto">
          <q-btn
            v-if="canCreatePayment"
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
        <div class="client-list-summary billing-queue-summary
          row q-col-gutter-md q-mb-lg">
          <div
            v-for="card in cards"
            :key="card.id"
            class="client-list-summary__col col-12 col-sm-6
              col-md-4">
            <article class="client-list-summary__card">
              <div class="client-list-summary__card-main
                row items-center no-wrap">
                <p class="client-list-summary__card-value
                  q-mb-none">
                  {{ card.value }}
                </p>
                <div class="client-list-summary__card-copy col">
                  <p class="client-list-summary__card-label
                    q-mb-none">
                    {{ card.label }}
                  </p>
                  <p class="client-list-summary__card-description
                    q-mb-none">
                    {{ card.description }}
                  </p>
                </div>
                <div
                  class="client-list-summary__card-icon"
                  :class="`client-list-summary__card-icon--${
                    card.tone
                  }`">
                  <q-icon :name="card.icon" size="18px" />
                </div>
              </div>
            </article>
          </div>
        </div>

        <div class="fmh-list-card q-pa-md">
          <p class="text-subtitle2 text-weight-medium q-mb-sm">
            {{ t('clientFinancialResponsibilityBreakdown') }}
          </p>
          <div class="row q-col-gutter-md">
            <div
              v-for="item in breakdownItems"
              :key="item.id"
              class="col-12 col-sm-6 col-md-3">
              <p class="text-caption text-grey-7 q-mb-none">
                {{ item.label }}
              </p>
              <p class="text-body1 text-weight-medium q-mb-none">
                {{ item.value }}
              </p>
            </div>
          </div>
        </div>

        <div class="q-mt-lg">
          <p class="text-subtitle2 text-weight-medium q-mb-sm">
            {{ t('clientFinancialRecentActivity') }}
          </p>
          <div
            v-if="!recent.length"
            class="fmh-list-card q-pa-lg text-center
              text-grey-7">
            {{ t('clientLedgerEmpty') }}
          </div>
          <div
            v-else
            class="fmh-list-card q-pa-none">
            <div
              v-for="row in recent"
              :key="row.id"
              class="row items-center q-px-md q-py-sm"
              :data-testid="clientFinancialTestIds.recentRow(
                row.id,
              )">
              <div class="col">
                <p class="q-mb-none text-weight-medium">
                  {{ row.description }}
                </p>
                <p class="text-caption text-grey-7 q-mb-none">
                  {{ row.effectiveDateDisplay }}
                  · {{ typeLabel(row.entryType) }}
                  · {{ row.referenceNumber || '—' }}
                </p>
              </div>
              <div class="col-auto text-right">
                <p class="q-mb-none text-weight-medium">
                  {{ row.amountLabel }}
                </p>
              </div>
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

const cards = computed(() => {
  const data = summary.value
  const zero = t('clientLedgerZeroBalance')
  const displayBalance = (data?.currentBalance ?? 0) > 0
    ? data.currentBalanceLabel
    : zero
  const lastPayment = data?.lastPaymentNumber
    ? `${data.lastPaymentAmountLabel} · ${
      data.lastPaymentDateDisplay
    }`
    : t('clientPaymentNoLastPayment')

  return [
    {
      id: 'balance',
      label: t('clientFinancialCurrentBalance'),
      description: t('clientFinancialCurrentBalanceHint'),
      value: displayBalance,
      icon: 'account_balance_wallet',
      tone: 'orange',
    },
    {
      id: 'open',
      label: t('clientFinancialOpenObligations'),
      description: t('clientFinancialOpenObligationsHint'),
      value: data?.openObligationsLabel || zero,
      icon: 'receipt_long',
      tone: 'teal',
    },
    {
      id: 'credit',
      label: t('clientFinancialAvailableCredit'),
      description: t('clientFinancialAvailableCreditHint'),
      value: data?.availableCreditLabel || zero,
      icon: 'savings',
      tone: 'blue',
    },
    {
      id: 'last',
      label: t('clientFinancialLastPayment'),
      description: data?.lastPaymentNumber || zero,
      value: lastPayment,
      icon: 'paid',
      tone: 'teal',
    },
  ]
})

const breakdownItems = computed(() => {
  const pr = summary.value?.clientResponsibility || {}

  return [
    {
      id: 'copay',
      label: t('ledgerResponsibility.COPAY'),
      value: pr.copayLabel || t('clientLedgerZeroBalance'),
    },
    {
      id: 'deductible',
      label: t('ledgerResponsibility.DEDUCTIBLE'),
      value: pr.deductibleLabel || t('clientLedgerZeroBalance'),
    },
    {
      id: 'coinsurance',
      label: t('ledgerResponsibility.COINSURANCE'),
      value: pr.coinsuranceLabel || t('clientLedgerZeroBalance'),
    },
    {
      id: 'other',
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
