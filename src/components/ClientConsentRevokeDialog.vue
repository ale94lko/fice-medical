<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="modalTestIds.dialog(tid.revokeDialog)"
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog insurance-dialog--confirm
        app-dialog-card app-dialog-card--sm">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('clientConsentRevokeTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-sm">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('clientConsentRevokeHint') }}
        </p>
        <FormField required :label="t('clientConsentRevocationReason')">
          <q-input
            v-model="reason"
            outlined
            type="textarea"
            rows="3"
            counter
            :maxlength="consentRevocationReasonMaxLength"
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
          :data-testid="tid.revokeCancel"
          :label="t('cancel')"
          :disable="saving"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :data-testid="tid.revokeSubmit"
          :label="t('clientConsentRevokeConfirm')"
          :loading="saving"
          :disable="!hasReason"
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
import FormField from 'components/FormField.vue'
import { consentRevocationReasonMaxLength } from 'components/constants.js'
import { clientConsentsTestIds as tid, modalTestIds } from
  'src/test-ids/index.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'confirm'])
const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const reason = ref('')
const hasReason = computed(() => Boolean(String(reason.value ?? '').trim()))

watch(open, value => {
  if (value) {
    reason.value = ''
  }
})

function onCancel() {
  open.value = false
}

function onConfirm() {
  if (!hasReason.value) {
    return
  }
  emit('confirm', String(reason.value).trim())
}
</script>
