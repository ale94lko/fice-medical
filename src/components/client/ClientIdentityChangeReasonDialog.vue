<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="tid.identityReasonDialog"
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog insurance-dialog--confirm
        app-dialog-card app-dialog-card--sm">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('clientIdentityChangeTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-sm">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('clientIdentityChangeMessage') }}
        </p>
        <AddClientLabeledField
          required
          :label="t('clientIdentityChangeReasonLabel')"
          :test-id="tid.identityReasonField">
          <q-input
            v-model="reason"
            outlined
            type="textarea"
            rows="3"
            counter
            maxlength="500"
            :placeholder="t('clientIdentityChangeReasonPlaceholder')"
            :error="Boolean(reasonError)"
            :error-message="reasonError"
            :data-testid="tid.identityReasonField"
          />
        </AddClientLabeledField>
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
          :data-testid="tid.identityReasonCancel"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="submitting"
          :disable="submitting || !canConfirm"
          :data-testid="tid.identityReasonConfirm"
          :label="t('clientIdentityChangeConfirm')"
          @click="onConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import { addClientTestIds as tid } from 'src/test-ids/index.js'

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
const reasonError = ref('')

const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const canConfirm = computed(
  () => String(reason.value ?? '').trim().length >= 5,
)

watch(
  () => props.modelValue,
  visible => {
    if (!visible) {
      return
    }
    reason.value = ''
    reasonError.value = ''
  },
)

function onCancel() {
  if (props.submitting) {
    return
  }
  open.value = false
}

function onConfirm() {
  const next = String(reason.value ?? '').trim()
  if (next.length < 5) {
    reasonError.value = t('clientIdentityChangeReasonRequired')

    return
  }
  reasonError.value = ''
  emit('confirm', next)
}
</script>
