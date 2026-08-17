<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader @close="onCancel">
        {{ t('clientPaymentRecordTitle') }}
      </AppDialogHeader>
      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('clientPaymentRecordSubtitle') }}
        </p>

        <div
          v-if="noOpenBalance"
          class="q-mb-md text-body2 text-orange-9">
          {{ t('clientPaymentNoBalanceWarning') }}
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <FormField
              :label="t('clientPaymentAmount')"
              required>
              <TextInput
                v-model="amount"
                type="number"
                hide-bottom-space
                :test-id="clientFinancialTestIds.paymentAmount"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-6">
            <FormField
              :label="t('clientPaymentDate')"
              required>
              <ClientDateField
                v-model="paymentDate"
                :close-label="t('close')"
                :test-id="clientFinancialTestIds.paymentDate"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-6">
            <FormField
              :label="t('clientPaymentMethod')"
              required>
              <FormSelect
                v-model="paymentMethod"
                emit-value
                map-options
                outlined
                hide-bottom-space
                :options="methodOptions"
                :test-id="clientFinancialTestIds.paymentMethod"
              />
            </FormField>
          </div>
          <div
            v-if="paymentMethod === METHODS.other"
            class="col-12 col-md-6">
            <FormField
              :label="t('clientPaymentMethodDescription')"
              required>
              <TextInput
                v-model="methodDescription"
                hide-bottom-space
                :test-id="
                  clientFinancialTestIds.paymentMethodDescription
                "
              />
            </FormField>
          </div>
          <div
            v-if="paymentMethod === METHODS.check"
            class="col-12 col-md-6">
            <FormField :label="t('clientPaymentCheckNumber')">
              <TextInput
                v-model="checkNumber"
                hide-bottom-space
                :test-id="clientFinancialTestIds.paymentCheckNumber"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-6">
            <FormField :label="t('clientPaymentReference')">
              <TextInput
                v-model="referenceNumber"
                hide-bottom-space
                :placeholder="t('clientPaymentReferenceHint')"
                :test-id="clientFinancialTestIds.paymentReference"
              />
            </FormField>
          </div>
          <div class="col-12">
            <FormField :label="t('clientPaymentNotes')">
              <TextInput
                v-model="notes"
                type="textarea"
                hide-bottom-space
                :test-id="clientFinancialTestIds.paymentNotes"
              />
            </FormField>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <p class="text-caption text-grey-7 q-mb-none">
            {{ t('clientPaymentAvailableBalance') }}
          </p>
          <p class="text-h6 text-weight-medium q-mb-none">
            {{ availableBalanceLabel }}
          </p>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <div class="row items-center q-mb-sm">
            <div class="col">
              <p class="text-subtitle2 text-weight-medium q-mb-none">
                {{ t('clientPaymentApplyTitle') }}
              </p>
            </div>
            <div class="col-auto">
              <q-btn
                no-caps
                outline
                color="primary"
                class="app-btn-outline"
                :disable="submitting || !obligations.length"
                :data-testid="clientFinancialTestIds.paymentAutoApply"
                :label="t('clientPaymentAutoApply')"
                @click="onAutoApply"
              />
            </div>
          </div>
          <div
            v-if="!obligations.length"
            class="text-body2 text-grey-7">
            {{ t('clientPaymentNoObligations') }}
          </div>
          <div
            v-else
            class="add-client-form__fmh-table-wrap">
            <table class="add-client-form__fmh-table">
              <thead>
                <tr>
                  <th>{{ t('clientPaymentApply') }}</th>
                  <th>{{ t('clientPaymentObligation') }}</th>
                  <th>{{ t('clientPaymentOutstanding') }}</th>
                  <th>{{ t('clientPaymentApplyAmount') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in obligations"
                  :key="row.ledgerEntryId">
                  <td>
                    <FormToggle
                      :model-value="row.selected"
                      :disable="submitting"
                      @update:model-value="
                        value => onToggle(row, value)
                      "
                    />
                  </td>
                  <td>
                    <p class="q-mb-none text-weight-medium">
                      {{ row.description }}
                    </p>
                    <p class="text-caption text-grey-7 q-mb-none">
                      {{ row.referenceNumber || '—' }}
                      · {{ row.effectiveDateDisplay }}
                    </p>
                  </td>
                  <td>{{ row.outstandingAmountLabel }}</td>
                  <td>
                    <TextInput
                      :model-value="row.applyAmount"
                      type="number"
                      :disable="submitting || !row.selected"
                      hide-bottom-space
                      @update:model-value="
                        value => onAmount(row, value)
                      "
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-4">
            <p class="text-caption text-grey-7 q-mb-none">
              {{ t('clientPaymentAmount') }}
            </p>
            <p class="text-body1 text-weight-medium q-mb-none">
              {{ paymentLabel }}
            </p>
          </div>
          <div class="col-12 col-md-4">
            <p class="text-caption text-grey-7 q-mb-none">
              {{ t('clientPaymentApplied') }}
            </p>
            <p class="text-body1 text-weight-medium
              text-positive q-mb-none">
              {{ appliedLabel }}
            </p>
          </div>
          <div class="col-12 col-md-4">
            <p class="text-caption text-grey-7 q-mb-none">
              {{ t('clientPaymentUnapplied') }}
            </p>
            <p class="text-body1 text-weight-medium
              text-orange q-mb-none">
              {{ unappliedLabel }}
            </p>
          </div>
        </div>
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :disable="submitting"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="submitting"
          :disable="submitting"
          :data-testid="clientFinancialTestIds.paymentSubmit"
          :label="t('clientPaymentRecordConfirm')"
          @click="onSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormField from 'components/FormField.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import TextInput from 'components/TextInput.vue'
import {
  clientPaymentMethods as METHODS,
} from 'components/constants.js'
import { todayDateUs, usDateToIso } from 'src/utils/client-form.js'
import { formatLedgerMoney } from 'src/utils/ledger-normalize.js'
import {
  appliedFromDraft,
  autoApplyObligations,
  selectedAllocations,
} from 'src/utils/client-payment-normalize.js'
import { clientFinancialTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  obligations: {
    type: Array,
    default: () => [],
  },
  currentBalance: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'update:obligations',
  'confirm',
])

const { t } = useI18n()
const amount = ref('')
const paymentDate = ref(todayDateUs())
const paymentMethod = ref(METHODS.cash)
const methodDescription = ref('')
const referenceNumber = ref('')
const checkNumber = ref('')
const notes = ref('')
const idempotencyKey = ref('')

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const methodOptions = computed(() => [
  { label: t('clientPaymentMethod.CASH'), value: METHODS.cash },
  { label: t('clientPaymentMethod.CARD'), value: METHODS.card },
  { label: t('clientPaymentMethod.CHECK'), value: METHODS.check },
  { label: t('clientPaymentMethod.OTHER'), value: METHODS.other },
])

const paymentAmount = computed(() => Number(amount.value) || 0)
const appliedAmount = computed(() =>
  appliedFromDraft(props.obligations),
)
const unappliedAmount = computed(() => Math.max(
  0,
  Math.round((paymentAmount.value - appliedAmount.value) * 100)
    / 100,
))
const paymentLabel = computed(() =>
  formatLedgerMoney(paymentAmount.value),
)
const appliedLabel = computed(() =>
  formatLedgerMoney(appliedAmount.value),
)
const unappliedLabel = computed(() =>
  formatLedgerMoney(unappliedAmount.value),
)
const availableBalanceLabel = computed(() =>
  formatLedgerMoney(Math.max(0, props.currentBalance)),
)
const noOpenBalance = computed(() => props.currentBalance <= 0)

watch(
  () => props.modelValue,
  value => {
    if (!value) {
      return
    }
    resetForm()
  },
)

function resetForm() {
  amount.value = ''
  paymentDate.value = todayDateUs()
  paymentMethod.value = METHODS.cash
  methodDescription.value = ''
  referenceNumber.value = ''
  checkNumber.value = ''
  notes.value = ''
  idempotencyKey.value = crypto.randomUUID()
}

function patchObligation(row, patch) {
  emit(
    'update:obligations',
    props.obligations.map(item => (
      item.ledgerEntryId === row.ledgerEntryId
        ? { ...item, ...patch }
        : item
    )),
  )
}

function onToggle(row, selected) {
  patchObligation(row, {
    selected,
    applyAmount: selected
      ? String(row.outstandingAmount.toFixed(2))
      : '',
  })
}

function onAmount(row, value) {
  patchObligation(row, { applyAmount: String(value ?? '') })
}

function onAutoApply() {
  emit(
    'update:obligations',
    autoApplyObligations(props.obligations, paymentAmount.value),
  )
}

function onCancel() {
  open.value = false
}

function onSubmit() {
  emit('confirm', {
    amount: paymentAmount.value,
    'payment_date': usDateToIso(paymentDate.value),
    'payment_method': paymentMethod.value,
    'method_description': methodDescription.value.trim() || null,
    'reference_number': referenceNumber.value.trim() || null,
    'check_number': checkNumber.value.trim() || null,
    notes: notes.value.trim() || null,
    'idempotency_key': idempotencyKey.value,
    allocations: selectedAllocations(props.obligations),
  })
}
</script>
