<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="modalTestIds.dialog(testIdName)"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card
      app-dialog-card--sm">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('claimSubmitTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body
        q-px-lg q-pt-md q-pb-sm">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('claimSubmitMessage') }}
        </p>
        <dl class="superbill-detail__facts">
          <div>
            <dt>{{ t('claimColumnNumber') }}</dt>
            <dd>{{ claimNumber || '—' }}</dd>
          </div>
          <div>
            <dt>{{ t('claimColumnPayer') }}</dt>
            <dd>{{ payerName || '—' }}</dd>
          </div>
          <div>
            <dt>{{ t('claimColumnTotal') }}</dt>
            <dd>{{ totalLabel || '—' }}</dd>
          </div>
          <div>
            <dt>{{ t('claimTabServices') }}</dt>
            <dd>{{ serviceCount }}</dd>
          </div>
        </dl>
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
          :data-testid="modalTestIds.cancel(testIdName)"
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
          :data-testid="modalTestIds.confirm(testIdName)"
          :label="t('claimSubmitConfirm')"
          @click="emit('confirm')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import { modalTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  claimNumber: {
    type: String,
    default: '',
  },
  payerName: {
    type: String,
    default: '',
  },
  totalLabel: {
    type: String,
    default: '',
  },
  serviceCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])
const { t } = useI18n()
const testIdName = 'claim-submit'

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

function onCancel() {
  if (props.submitting) {
    return
  }
  open.value = false
}
</script>
