<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card
      app-dialog-card--sm">
      <AppDialogHeader
        test-id="client-payment-reverse"
        @close="onCancel">
        {{ t('clientPaymentReverseTitle') }}
      </AppDialogHeader>
      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('clientPaymentReverseMessage') }}
        </p>
        <FormField
          :label="t('clientPaymentReverseReason')"
          required>
          <TextInput
            v-model="reason"
            type="textarea"
            hide-bottom-space
            :test-id="clientFinancialTestIds.paymentReverseReason"
          />
        </FormField>
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
          :data-testid="clientPaymentTestIds.reverseCancel"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="submitting"
          :disable="submitting || !reason.trim()"
          :label="t('clientPaymentReverseConfirm')"
          :data-testid="clientPaymentTestIds.reverseSubmit"
          @click="emit('confirm', reason.trim())"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormField from 'components/FormField.vue'
import TextInput from 'components/TextInput.vue'
import { clientFinancialTestIds, clientPaymentTestIds } from
  'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])
const { t } = useI18n()
const reason = ref('')

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

watch(
  () => props.modelValue,
  value => {
    if (value) {
      reason.value = ''
    }
  },
)

function onCancel() {
  open.value = false
}
</script>
