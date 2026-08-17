<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        test-id="client-payment-detail"
        @close="onClose">
        {{ title }}
      </AppDialogHeader>
      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <p class="form-field__label q-mb-xs">
              {{ t('clientPaymentAmount') }}
            </p>
            <p class="text-body1 q-mb-none">
              {{ payment?.amountLabel || '—' }}
            </p>
          </div>
          <div class="col-12 col-md-6">
            <p class="form-field__label q-mb-xs">
              {{ t('clientPaymentDate') }}
            </p>
            <p class="text-body1 q-mb-none">
              {{ payment?.paymentDateDisplay || '—' }}
            </p>
          </div>
          <div class="col-12 col-md-6">
            <p class="form-field__label q-mb-xs">
              {{ t('clientPaymentMethod') }}
            </p>
            <p class="text-body1 q-mb-none">
              {{ methodLabel }}
            </p>
          </div>
          <div class="col-12 col-md-6">
            <p class="form-field__label q-mb-xs">
              {{ t('claimColumnStatus') }}
            </p>
            <p class="text-body1 q-mb-none">
              {{ statusLabel }}
            </p>
          </div>
          <div
            v-if="payment?.referenceNumber"
            class="col-12 col-md-6">
            <p class="form-field__label q-mb-xs">
              {{ t('clientPaymentReference') }}
            </p>
            <p class="text-body1 q-mb-none">
              {{ payment.referenceNumber }}
            </p>
          </div>
          <div
            v-if="payment?.checkNumber"
            class="col-12 col-md-6">
            <p class="form-field__label q-mb-xs">
              {{ t('clientPaymentCheckNumber') }}
            </p>
            <p class="text-body1 q-mb-none">
              {{ payment.checkNumber }}
            </p>
          </div>
          <div
            v-if="payment?.notes"
            class="col-12">
            <p class="form-field__label q-mb-xs">
              {{ t('clientPaymentNotes') }}
            </p>
            <p class="text-body1 q-mb-none">
              {{ payment.notes }}
            </p>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <p class="text-subtitle2 text-weight-medium q-mb-sm">
            {{ t('clientPaymentAllocation') }}
          </p>
          <div
            v-if="!activeAllocations.length"
            class="text-body2 text-grey-7">
            {{ t('clientPaymentNoAllocations') }}
          </div>
          <div
            v-for="row in activeAllocations"
            :key="row.id"
            class="row items-center q-py-xs">
            <div class="col">
              <p class="q-mb-none text-weight-medium">
                {{ row.description }}
              </p>
              <p class="text-caption text-grey-7 q-mb-none">
                {{ row.referenceNumber || '—' }}
              </p>
            </div>
            <div class="col-auto">
              {{ row.amountLabel }}
            </div>
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-4">
            <p class="text-caption text-grey-7 q-mb-none">
              {{ t('clientPaymentApplied') }}
            </p>
            <p class="text-body1 text-positive text-weight-medium
              q-mb-none">
              {{ payment?.appliedAmountLabel || '—' }}
            </p>
          </div>
          <div class="col-12 col-md-4">
            <p class="text-caption text-grey-7 q-mb-none">
              {{ t('clientPaymentUnapplied') }}
            </p>
            <p class="text-body1 text-orange text-weight-medium
              q-mb-none">
              {{ payment?.unappliedAmountLabel || '—' }}
            </p>
          </div>
        </div>
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          v-if="canAllocate && hasUnapplied"
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="clientFinancialTestIds.paymentApply"
          :label="t('clientPaymentApplyExisting')"
          @click="emit('apply')"
        />
        <q-btn
          v-if="canReverse && isPosted"
          no-caps
          outline
          color="negative"
          class="app-btn-outline"
          :data-testid="clientFinancialTestIds.paymentReverse"
          :label="t('clientPaymentReverse')"
          @click="emit('reverse')"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('close')"
          :data-testid="clientPaymentTestIds.detailClose"
          @click="onClose"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import { clientPaymentStatuses } from 'components/constants.js'
import {
  paymentMethodI18nKey,
  paymentStatusI18nKey,
} from 'src/utils/client-payment-normalize.js'
import { clientFinancialTestIds, clientPaymentTestIds } from
  'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  payment: {
    type: Object,
    default: null,
  },
  canAllocate: {
    type: Boolean,
    default: false,
  },
  canReverse: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'apply', 'reverse'])
const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const title = computed(() => t('clientPaymentDetailTitle', {
  number: props.payment?.paymentNumber || '—',
}))

const methodLabel = computed(() => {
  const method = props.payment?.paymentMethod
  if (!method) {
    return '—'
  }

  return t(paymentMethodI18nKey(method))
})

const statusLabel = computed(() => {
  const status = props.payment?.status
  if (!status) {
    return '—'
  }

  return t(paymentStatusI18nKey(status))
})

const activeAllocations = computed(() =>
  (props.payment?.allocations ?? []).filter(
    row => row.status === 'ACTIVE',
  ),
)

const hasUnapplied = computed(() =>
  (props.payment?.unappliedAmount ?? 0) > 0,
)

const isPosted = computed(() =>
  props.payment?.status === clientPaymentStatuses.posted,
)

function onClose() {
  open.value = false
}
</script>
