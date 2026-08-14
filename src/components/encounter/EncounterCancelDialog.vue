<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="tid.cancelDialog"
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog insurance-dialog--confirm
        app-dialog-card app-dialog-card--sm">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('encounterCancelTitle') }}
      </AppDialogHeader>
      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-sm">
        <p class="text-body1 q-mb-md">
          {{ t('encounterCancelHint') }}
        </p>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <AddClientLabeledField
              required
              :label="t('encounterCancelReason')">
              <FormSelect
                v-model="reason"
                outlined
                hide-bottom-space
                emit-value
                map-options
                :options="reasonOptions"
                :placeholder="t('encounterCancelReasonPlaceholder')"
                :error="Boolean(reasonError)"
                :error-message="reasonError"
                :test-id="tid.cancelReason"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12">
            <AddClientLabeledField
              :required="notesRequired"
              :label="t('encounterCancelNotes')">
              <q-input
                v-model="notes"
                outlined
                type="textarea"
                rows="3"
                counter
                maxlength="1000"
                hide-bottom-space
                :placeholder="t('encounterCancelNotesPlaceholder')"
                :error="Boolean(notesError)"
                :error-message="notesError"
                :data-testid="tid.cancelNotes"
              />
            </AddClientLabeledField>
          </div>
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
          :disable="saving"
          :data-testid="modalTestIds.cancel('encounter-cancel')"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :disable="saving"
          :loading="saving"
          :data-testid="tid.cancelSubmit"
          :label="t('encounterCancelConfirm')"
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
import FormSelect from 'components/FormSelect.vue'
import { encounterCancelReasons } from 'components/constants.js'
import { encounterTestIds as tid, modalTestIds } from
  'src/test-ids/index.js'

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
const reasonError = ref('')
const notesError = ref('')

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const notesRequired = computed(
  () => reason.value === encounterCancelReasons.other,
)

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

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      return
    }
    reason.value = null
    notes.value = ''
    reasonError.value = ''
    notesError.value = ''
  },
)

watch(reason, () => {
  reasonError.value = ''
  if (!notesRequired.value) {
    notesError.value = ''
  }
})

function onCancel() {
  if (props.saving) {
    return
  }
  open.value = false
}

function onConfirm() {
  reasonError.value = ''
  notesError.value = ''
  if (!reason.value) {
    reasonError.value = t('encounterCancelReasonRequired')

    return
  }
  const notesText = String(notes.value ?? '').trim()
  if (notesRequired.value && !notesText) {
    notesError.value = t('encounterCancelNotesRequired')

    return
  }
  emit('confirm', {
    reason: reason.value,
    notes: notesText,
  })
}
</script>
