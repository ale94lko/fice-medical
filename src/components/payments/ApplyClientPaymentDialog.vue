<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale"
    :data-testid="tid.applyDialog">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        test-id="client-payment-apply"
        @close="onCancel">
        {{ t('clientPaymentApplyExisting') }}
      </AppDialogHeader>
      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('clientPaymentApplyExistingHint', {
            amount: unappliedLabel,
          }) }}
        </p>
        <div class="row items-center q-mb-sm">
          <div class="col" />
          <div class="col-auto">
            <q-btn
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              :disable="submitting || !obligations.length"
              :label="t('clientPaymentAutoApply')"
              :data-testid="tid.applyAddLine"
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
          :data-testid="tid.applyCancel"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="submitting"
          :disable="submitting"
          :label="t('clientPaymentApplyConfirm')"
          :data-testid="tid.applySubmit"
          @click="onSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormToggle from 'components/FormToggle.vue'
import TextInput from 'components/TextInput.vue'
import {
  autoApplyObligations,
  selectedAllocations,
} from 'src/utils/client-payment-normalize.js'
import { formatLedgerMoney } from 'src/utils/ledger-normalize.js'
import { clientPaymentTestIds as tid } from 'src/test-ids/index.js'

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
  unappliedAmount: {
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

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const unappliedLabel = computed(() =>
  formatLedgerMoney(props.unappliedAmount),
)

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
    autoApplyObligations(
      props.obligations,
      props.unappliedAmount,
    ),
  )
}

function onCancel() {
  open.value = false
}

function onSubmit() {
  emit('confirm', selectedAllocations(props.obligations))
}
</script>
