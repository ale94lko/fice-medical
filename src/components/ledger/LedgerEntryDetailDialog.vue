<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader @close="onClose">
        {{ title }}
      </AppDialogHeader>
      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('clientLedgerDetailSubtitle') }}
        </p>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <p class="form-field__label q-mb-xs">
              {{ t('clientLedgerColumnAmount') }}
            </p>
            <p class="text-body1 q-mb-none">
              {{ entry?.amountLabel || '—' }}
            </p>
          </div>
          <div class="col-12 col-md-6">
            <p class="form-field__label q-mb-xs">
              {{ t('clientLedgerColumnDate') }}
            </p>
            <p class="text-body1 q-mb-none">
              {{ entry?.effectiveDateDisplay || '—' }}
            </p>
          </div>
          <div class="col-12 col-md-6">
            <p class="form-field__label q-mb-xs">
              {{ t('clientLedgerColumnType') }}
            </p>
            <p class="text-body1 q-mb-none">
              {{ typeLabel }}
            </p>
          </div>
          <div class="col-12 col-md-6">
            <p class="form-field__label q-mb-xs">
              {{ t('clientLedgerColumnStatus') }}
            </p>
            <p class="text-body1 q-mb-none">
              {{ statusLabel }}
            </p>
          </div>
          <div
            v-if="entry?.responsibilityType"
            class="col-12 col-md-6">
            <p class="form-field__label q-mb-xs">
              {{ t('clientLedgerResponsibilityType') }}
            </p>
            <p class="text-body1 q-mb-none">
              {{ responsibilityLabel }}
            </p>
          </div>
          <div class="col-12 col-md-6">
            <p class="form-field__label q-mb-xs">
              {{ t('clientLedgerColumnSource') }}
            </p>
            <p class="text-body1 q-mb-none">
              {{ sourceLabel }}
            </p>
          </div>
          <div class="col-12">
            <p class="form-field__label q-mb-xs">
              {{ t('clientLedgerColumnDescription') }}
            </p>
            <p class="text-body1 q-mb-none">
              {{ entry?.description || '—' }}
            </p>
          </div>
          <div
            v-if="entry?.serviceCode || entry?.serviceName"
            class="col-12">
            <p class="form-field__label q-mb-xs">
              {{ t('clientLedgerColumnService') }}
            </p>
            <p class="text-body1 q-mb-none">
              {{ serviceLabel }}
            </p>
          </div>
          <div
            v-if="entry?.payerName"
            class="col-12 col-md-6">
            <p class="form-field__label q-mb-xs">
              {{ t('clientLedgerColumnPayer') }}
            </p>
            <p class="text-body1 q-mb-none">
              {{ entry.payerName }}
            </p>
          </div>
          <div class="col-12 col-md-6">
            <p class="form-field__label q-mb-xs">
              {{ t('clientLedgerColumnReference') }}
            </p>
            <p class="text-body1 q-mb-none">
              {{ entry?.referenceNumber || '—' }}
            </p>
          </div>
        </div>
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          v-if="canViewClaim"
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="clientFinancialTestIds.viewClaim"
          :label="t('clientLedgerViewClaim')"
          @click="emit('view-claim')"
        />
        <q-btn
          v-if="canViewSuperbill"
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="clientFinancialTestIds.viewSuperbill"
          :label="t('clientLedgerViewSuperbill')"
          @click="emit('view-superbill')"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :data-testid="clientFinancialTestIds.detailClose"
          :label="t('close')"
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
import { clientFinancialTestIds } from 'src/test-ids/index.js'
import {
  ledgerStatusI18nKey,
  ledgerTypeI18nKey,
} from 'src/utils/ledger-normalize.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  entry: {
    type: Object,
    default: null,
  },
  canViewClaim: {
    type: Boolean,
    default: false,
  },
  canViewSuperbill: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'view-claim',
  'view-superbill',
])
const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const title = computed(() => {
  if (!props.entry?.entryType) {
    return t('clientLedgerDetailTitle')
  }

  return t(ledgerTypeI18nKey(props.entry.entryType))
})

const typeLabel = computed(() => {
  if (!props.entry?.entryType) {
    return '—'
  }

  return t(ledgerTypeI18nKey(props.entry.entryType))
})

const statusLabel = computed(() => {
  if (!props.entry?.status) {
    return '—'
  }

  return t(ledgerStatusI18nKey(props.entry.status))
})

const responsibilityLabel = computed(() => {
  const type = props.entry?.responsibilityType
  if (!type) {
    return '—'
  }

  return t(`ledgerResponsibility.${type}`)
})

const sourceLabel = computed(() => {
  const source = props.entry?.sourceType
  if (!source) {
    return '—'
  }

  return t(`ledgerSourceType.${source}`)
})

const serviceLabel = computed(() => {
  const code = props.entry?.serviceCode
  const name = props.entry?.serviceName
  if (code && name) {
    return `${code} — ${name}`
  }

  return code || name || '—'
})

function onClose() {
  emit('update:modelValue', false)
}
</script>
