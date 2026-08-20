<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="dialogTestId"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="family-medical-history-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>
      <q-card-section
        ref="dialogBodyScrollRef"
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-sm">
        <div class="row q-col-gutter-md q-col-gutter-lg-md">
          <div
            v-if="isFamily"
            class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('fmhFamilyRelationship')"
              required
              :test-id="tid.fmhField('relationship')">
              <FormSelect
                v-model="localRelationship"
                :test-id="tid.fmhField('relationship')"
                outlined
                hide-bottom-space
                emit-value
                map-options
                clearable
                :options="relationshipOptions"
                :error="Boolean(relationshipError)"
                :error-message="relationshipError"
              >
                <template #append>
                  <q-icon name="info_outline" class="cursor-pointer">
                    <q-tooltip
                      class="app-info-tooltip"
                      anchor="top middle"
                      self="bottom middle"
                      :offset="[0, 6]">
                      {{ t('fmhRelationshipTooltip') }}
                    </q-tooltip>
                  </q-icon>
                </template>
              </FormSelect>
            </AddClientLabeledField>
          </div>
          <div
            :class="isFamily ? 'col-12' : 'col-12 col-md-6'">
            <AddClientLabeledField
              :label="conditionLabel"
              required
              :test-id="tid.fmhField('conditions')">
              <q-input
                v-model="localConditions"
                outlined
                hide-bottom-space
                :data-testid="tid.fmhField('conditions')"
                :placeholder="conditionPlaceholder"
                :error="Boolean(conditionsError)"
                :error-message="conditionsError"
                maxlength="500"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('fmhNote')"
              :test-id="tid.fmhField('notes')">
              <q-input
                v-model="localNotes"
                outlined
                hide-bottom-space
                :data-testid="tid.fmhField('notes')"
                :placeholder="t('fmhNotePlaceholder')"
                :error="Boolean(notesError)"
                :error-message="notesError"
                maxlength="500"
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
          :data-testid="cancelTestId"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :data-testid="confirmTestId"
          :label="t('save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormSelect from 'components/FormSelect.vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  familyMedicalHistoryMaxConditionsLength,
  familyMedicalHistoryMaxNotesLength,
  familyMedicalHistoryMaxRelationshipLength,
  medicalHistoryTypeValues,
} from 'components/constants.js'
import {
  isDuplicateFamilyMedicalHistoryEntry,
  normalizeMedicalHistoryType,
  trimFamilyMedicalField,
  validateMedicalHistoryDraftForAdd,
} from 'src/utils/client-family-medical-history.js'
import {
  addClientTestIds as tid,
  modalTestIds,
} from 'src/test-ids/index.js'
import { useValidationSaveFeedback } from
  'src/composables/useValidationSaveFeedback.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'edit',
  },
  entry: {
    type: Object,
    default: null,
  },
  entries: {
    type: Array,
    default: () => [],
  },
  relationshipOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

const { t } = useI18n()
const { notifyAndScrollToValidationErrors } = useValidationSaveFeedback()

const dialogBodyScrollRef = ref(null)
const localRelationship = ref('')
const localConditions = ref('')
const localNotes = ref('')
const relationshipError = ref('')
const conditionsError = ref('')
const notesError = ref('')
const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const historyType = computed(() =>
  normalizeMedicalHistoryType(
    props.entry?.historyType,
    props.entry?.familyRelationship,
  ),
)

const isFamily = computed(
  () => historyType.value === medicalHistoryTypeValues.family,
)

const isSurgical = computed(
  () => historyType.value === medicalHistoryTypeValues.surgical,
)

const dialogTitle = computed(() => {
  if (isSurgical.value) {
    return t('fmhEditSurgicalTitle')
  }
  if (isFamily.value) {
    return t('fmhEditFamilyTitle')
  }

  return t('fmhEditPersonalTitle')
})

const conditionLabel = computed(() =>
  isSurgical.value
    ? t('fmhProcedureSurgery')
    : t('fmhMedicalConditionEvent'),
)

const conditionPlaceholder = computed(() =>
  isSurgical.value
    ? t('fmhProcedurePlaceholder')
    : t('fmhConditionPlaceholder'),
)

const dialogTestId = modalTestIds.dialog('fmh-edit')
const cancelTestId = modalTestIds.cancel('fmh-edit')
const confirmTestId = modalTestIds.confirm('fmh-edit')

watch(
  () => props.modelValue,
  visible => {
    if (!visible) {
      return
    }
    relationshipError.value = ''
    conditionsError.value = ''
    notesError.value = ''
    localRelationship.value = props.entry?.familyRelationship ?? ''
    localConditions.value = props.entry?.medicalConditions ?? ''
    localNotes.value = props.entry?.notes ?? ''
  },
)

function onCancel() {
  open.value = false
}

function applyDraftErrors(result) {
  relationshipError.value = ''
  conditionsError.value = ''
  notesError.value = ''
  if (result.relationship) {
    relationshipError.value = t(
      result.relationship,
      result.relationship === 'fmhRelationshipMax'
        ? { max: familyMedicalHistoryMaxRelationshipLength }
        : {},
    )
  }
  if (result.conditions) {
    conditionsError.value = t(
      result.conditions,
      result.conditions === 'fmhConditionsInvalid'
        || result.conditions === 'fmhProcedureInvalid'
        ? { max: familyMedicalHistoryMaxConditionsLength }
        : {},
    )
  }
  if (result.notes) {
    notesError.value = t(
      result.notes,
      { max: familyMedicalHistoryMaxNotesLength },
    )
  }
}

async function onSave() {
  const result = validateMedicalHistoryDraftForAdd({
    historyType: historyType.value,
    familyRelationship: localRelationship.value,
    medicalConditions: localConditions.value,
    notes: localNotes.value,
  })
  if (!result.ok) {
    applyDraftErrors(result)
    await notifyAndScrollToValidationErrors(dialogBodyScrollRef)

    return
  }

  const excludeId = props.entry?.id ?? null
  if (
    isDuplicateFamilyMedicalHistoryEntry(
      props.entries,
      localRelationship.value,
      localConditions.value,
      excludeId,
      historyType.value,
    )
  ) {
    conditionsError.value = t('fmhDuplicateEntry')
    await notifyAndScrollToValidationErrors(dialogBodyScrollRef)

    return
  }

  emit('save', {
    historyType: historyType.value,
    familyRelationship: trimFamilyMedicalField(localRelationship.value),
    medicalConditions: trimFamilyMedicalField(localConditions.value),
    notes: trimFamilyMedicalField(localNotes.value),
  })
  open.value = false
}
</script>
