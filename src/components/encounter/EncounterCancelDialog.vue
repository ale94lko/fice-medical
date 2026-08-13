<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale"
    data-testid="encounter-cancel-dialog">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('encounterCancelTitle') }}
      </AppDialogHeader>
      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('encounterCancelHint') }}
        </p>
        <FormField :label="t('encounterCancelReason')" required>
          <FormSelect
            v-model="reason"
            outlined
            emit-value
            map-options
            :options="reasonOptions"
            :placeholder="t('encounterCancelReasonPlaceholder')"
            test-id="encounter-cancel-reason"
          />
        </FormField>
        <FormField
          v-if="reason === encounterCancelReasons.other"
          class="q-mt-md"
          :label="t('encounterCancelNotes')"
          required>
          <q-input
            v-model="notes"
            type="textarea"
            outlined
            autogrow
            data-testid="encounter-cancel-notes"
          />
        </FormField>
      </q-card-section>
      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="negative"
          class="app-btn-primary"
          :disable="!canSubmit"
          :loading="saving"
          :label="t('encounterCancelConfirm')"
          data-testid="encounter-cancel-submit"
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
import FormSelect from 'components/FormSelect.vue'
import { encounterCancelReasons } from 'components/constants.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const { t } = useI18n()
const reason = ref(null)
const notes = ref('')

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const reasonOptions = computed(() => [
  {
    label: t('encounterCancelReasonStartedByMistake'),
    value: encounterCancelReasons.startedByMistake,
  },
  {
    label: t('encounterCancelReasonWrongPatient'),
    value: encounterCancelReasons.wrongPatient,
  },
  {
    label: t('encounterCancelReasonDuplicate'),
    value: encounterCancelReasons.duplicateEncounter,
  },
  {
    label: t('encounterCancelReasonPatientLeft'),
    value: encounterCancelReasons.patientLeft,
  },
  {
    label: t('encounterCancelReasonTechnical'),
    value: encounterCancelReasons.technicalIssue,
  },
  {
    label: t('encounterCancelReasonOther'),
    value: encounterCancelReasons.other,
  },
])

const canSubmit = computed(() => {
  if (!reason.value) {
    return false
  }
  if (reason.value === encounterCancelReasons.other) {
    return Boolean(notes.value.trim())
  }

  return true
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      return
    }
    reason.value = null
    notes.value = ''
  },
)

function onCancel() {
  open.value = false
}

function onConfirm() {
  if (!canSubmit.value) {
    return
  }
  emit('confirm', {
    reason: reason.value,
    notes: notes.value.trim(),
  })
}
</script>
