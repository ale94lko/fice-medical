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
        {{ t('superbillHoldTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body
        q-px-lg q-pt-md q-pb-sm">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('superbillHoldMessage') }}
        </p>
        <AddClientLabeledField
          required
          :label="t('superbillHoldReason')">
          <FormSelect
            v-model="reason"
            :options="reasonOptions"
            emit-value
            map-options
            outlined
            hide-bottom-space
            :error="Boolean(reasonError)"
            :error-message="reasonError"
            :test-id="modalTestIds.dialog(`${testIdName}-reason`)"
          />
        </AddClientLabeledField>
        <AddClientLabeledField
          class="q-mt-md"
          :required="notesRequired"
          :label="t('superbillHoldNotes')">
          <q-input
            v-model="notes"
            outlined
            type="textarea"
            rows="3"
            hide-bottom-space
            :placeholder="t('superbillHoldNotesPlaceholder')"
            :error="Boolean(notesError)"
            :error-message="notesError"
            :data-testid="modalTestIds.dialog(`${testIdName}-notes`)"
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
          :label="t('superbillHoldConfirm')"
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
import AddClientLabeledField from
  'components/AddClientLabeledField.vue'
import FormSelect from 'components/FormSelect.vue'
import { superbillHoldReasons } from 'components/constants.js'
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
  testIdName: {
    type: String,
    default: 'superbill-hold',
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])
const { t } = useI18n()
const reason = ref('')
const notes = ref('')
const reasonError = ref('')
const notesError = ref('')

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const notesRequired = computed(() =>
  reason.value === superbillHoldReasons.other)

const reasonOptions = computed(() => [
  {
    label: t('superbillHoldWaitingAuthorization'),
    value: superbillHoldReasons.waitingForAuthorization,
  },
  {
    label: t('superbillHoldWaitingInsurance'),
    value: superbillHoldReasons.waitingForInsurance,
  },
  {
    label: t('superbillHoldWaitingProvider'),
    value: superbillHoldReasons.waitingForProvider,
  },
  {
    label: t('superbillHoldWaitingDocumentation'),
    value: superbillHoldReasons.waitingForDocumentation,
  },
  {
    label: t('superbillHoldInternalReview'),
    value: superbillHoldReasons.internalReview,
  },
  {
    label: t('superbillHoldOther'),
    value: superbillHoldReasons.other,
  },
])

watch(() => props.modelValue, value => {
  if (!value) {
    return
  }
  reason.value = ''
  notes.value = ''
  reasonError.value = ''
  notesError.value = ''
})

function onCancel() {
  open.value = false
}

function onConfirm() {
  reasonError.value = ''
  notesError.value = ''
  if (!reason.value) {
    reasonError.value = t('superbillHoldReasonRequired')
    return
  }
  const trimmed = String(notes.value || '').trim()
  if (notesRequired.value && !trimmed) {
    notesError.value = t('superbillHoldNotesRequired')
    return
  }
  emit('confirm', {
    reason: reason.value,
    notes: trimmed,
  })
}
</script>
