<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="modalTestIds.dialog(testIdName)"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card app-dialog-card--sm">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ title }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-sm">
        <p
          v-if="message"
          class="text-body1 q-mb-md">
          {{ message }}
        </p>
        <AddClientLabeledField
          required
          :label="reasonLabel">
          <q-input
            v-model="reason"
            outlined
            type="textarea"
            rows="3"
            hide-bottom-space
            :placeholder="reasonPlaceholder"
            :error="Boolean(reasonError)"
            :error-message="reasonError"
            :data-testid="modalTestIds.dialog(`${testIdName}-reason`)"
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
          :label="confirmLabel"
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
import { modalTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
  reasonLabel: {
    type: String,
    default: '',
  },
  reasonPlaceholder: {
    type: String,
    default: '',
  },
  confirmLabel: {
    type: String,
    default: '',
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  testIdName: {
    type: String,
    default: 'superbill-reason',
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])
const { t } = useI18n()
const reason = ref('')
const reasonError = ref('')

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

watch(() => props.modelValue, value => {
  if (value) {
    reason.value = ''
    reasonError.value = ''
  }
})

function onCancel() {
  open.value = false
}

function onConfirm() {
  const text = String(reason.value ?? '').trim()
  if (!text) {
    reasonError.value = t('superbillReasonRequired')

    return
  }
  reasonError.value = ''
  emit('confirm', text)
}
</script>
