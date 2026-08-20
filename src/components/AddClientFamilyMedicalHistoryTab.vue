<template>
  <div class="add-client-family-medical-history-tab">
    <div
      v-if="!canView"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('fmhNoPermission') }}
      </p>
    </div>

    <template v-else>
    <AccordionSection
      v-if="canAddMedicalHistory"
      icon="add_circle_outline"
      :title="t('fmhAddSectionTitle')"
      section-test-id="add-client-accordion-fmh-add"
      :toggle-test-id="tid.accordionToggle('fmh-add')">
      <div class="row q-col-gutter-md items-start">
          <div class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('fmhHistoryType')"
            required
            :test-id="tid.fmhField('history-type')">
            <FormSelect
              v-model="section.draft.historyType"
              :test-id="tid.fmhField('history-type')"
              outlined
              hide-bottom-space
              emit-value
              map-options
              clearable
              :options="historyTypeSelectOptions"
              :error="Boolean(draftHistoryTypeError)"
              :error-message="draftHistoryTypeError"
              @update:model-value="onHistoryTypeChange"
            />
          </AddClientLabeledField>
        </div>
        <div
          v-if="showFamilyRelationship"
          class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('fmhFamilyRelationship')"
            required
            :test-id="tid.fmhField('relationship')">
            <FormSelect
              v-model="section.draft.familyRelationship"
              :test-id="tid.fmhField('relationship')"
              outlined
              hide-bottom-space
              emit-value
              map-options
              clearable
              :options="familyRelationshipOptions"
              :error="Boolean(draftRelationshipError)"
              :error-message="draftRelationshipError"
            />
          </AddClientLabeledField>
        </div>
        <div
          v-if="selectedHistoryType"
          :class="showFamilyRelationship
            ? 'col-12'
            : 'col-12 col-md-6'">
          <AddClientLabeledField
            :label="conditionLabel"
            required
            :test-id="tid.fmhField('conditions')">
            <q-input
              v-model="section.draft.medicalConditions"
              outlined
              hide-bottom-space
              :data-testid="tid.fmhField('conditions')"
              :placeholder="conditionPlaceholder"
              :error="Boolean(draftConditionsError)"
              :error-message="draftConditionsError"
              maxlength="500"
            />
          </AddClientLabeledField>
        </div>
      </div>
      <div
        v-if="selectedHistoryType"
        class="row q-col-gutter-md items-end fmh-add-actions">
        <div class="col">
          <AddClientLabeledField
            :label="t('fmhNote')"
            :test-id="tid.fmhField('notes')">
            <q-input
              v-model="section.draft.notes"
              outlined
              hide-bottom-space
              :data-testid="tid.fmhField('notes')"
              :placeholder="t('fmhNotePlaceholder')"
              :error="Boolean(draftNotesError)"
              :error-message="draftNotesError"
              maxlength="500"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-auto">
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :data-testid="tid.fmhBtnAdd"
            :label="t('fmhAdd')"
            @click="onAddEntry"
          />
        </div>
      </div>
    </AccordionSection>

    <q-separator
      v-if="canAddMedicalHistory"
      class="section-separator" />

    <MedicalHistoryTypeSection
      icon="person"
      :title="t('fmhPersonalSectionTitle')"
      section-test-id="add-client-accordion-fmh-personal"
      :toggle-test-id="tid.accordionToggle('fmh-personal')"
      :flag-label="t('fmhNoSignificantPersonal')"
      :flag-tooltip="t('fmhNoSignificantPersonalHint')"
      :flag-test-id="tid.fmhField('no-significant-personal')"
      :confirmed-title="t('fmhNoSignificantPersonalConfirmed')"
      :confirmed-subtitle="t('fmhNoSignificantPersonalUncheck')"
      :empty-label="t('fmhPersonalEmpty')"
      :entries="personalEntries"
      :variant="medicalHistoryTypeValues.personal"
      :negative-checked="section.noSignificantPersonal"
      :can-edit-negative="canMutateProfile"
      :can-edit="canEditMedicalHistory"
      :can-delete="canDeleteMedicalHistory"
      @update:negative-checked="onNegativeToggle(
        medicalHistoryTypeValues.personal,
        $event,
      )"
      @edit="openEdit"
      @delete="openDelete"
    />

    <q-separator class="section-separator" />

    <MedicalHistoryTypeSection
      icon="healing"
      :title="t('fmhSurgicalSectionTitle')"
      section-test-id="add-client-accordion-fmh-surgical"
      :toggle-test-id="tid.accordionToggle('fmh-surgical')"
      :flag-label="t('fmhNoSurgicalHistory')"
      :flag-tooltip="t('fmhNoSurgicalHistoryHint')"
      :flag-test-id="tid.fmhField('no-surgical')"
      :confirmed-title="t('fmhNoSurgicalHistoryConfirmed')"
      :confirmed-subtitle="t('fmhNoSurgicalHistoryUncheck')"
      :empty-label="t('fmhSurgicalEmpty')"
      :entries="surgicalEntries"
      :variant="medicalHistoryTypeValues.surgical"
      :negative-checked="section.noSurgicalHistory"
      :can-edit-negative="canMutateProfile"
      :can-edit="canEditMedicalHistory"
      :can-delete="canDeleteMedicalHistory"
      @update:negative-checked="onNegativeToggle(
        medicalHistoryTypeValues.surgical,
        $event,
      )"
      @edit="openEdit"
      @delete="openDelete"
    />

    <q-separator class="section-separator" />

    <MedicalHistoryTypeSection
      icon="groups"
      :title="t('fmhFamilySectionTitle')"
      section-test-id="add-client-accordion-fmh-family"
      :toggle-test-id="tid.accordionToggle('fmh-family')"
      :flag-label="t('fmhNoSignificantFamily')"
      :flag-tooltip="t('fmhNoSignificantFamilyHint')"
      :flag-test-id="tid.fmhField('no-significant-family')"
      :confirmed-title="t('fmhNoSignificantFamilyConfirmed')"
      :confirmed-subtitle="t('fmhNoSignificantFamilyUncheck')"
      :empty-label="t('fmhFamilyEmpty')"
      :entries="familyEntries"
      :variant="medicalHistoryTypeValues.family"
      :negative-checked="section.noSignificantFamily"
      :can-edit-negative="canMutateProfile"
      :can-edit="canEditMedicalHistory"
      :can-delete="canDeleteMedicalHistory"
      @update:negative-checked="onNegativeToggle(
        medicalHistoryTypeValues.family,
        $event,
      )"
      @edit="openEdit"
      @delete="openDelete"
    />

    <q-separator class="section-separator" />

    <AccordionSection
      icon="diversity_3"
      :title="t('fmhSocialSectionTitle')"
      section-test-id="add-client-accordion-fmh-social"
      :toggle-test-id="tid.accordionToggle('fmh-social')">
      <AddClientSocialHistoryFields
        v-model="section.socialHistory"
        :can-edit="canMutateProfile"
      />
    </AccordionSection>

    <FamilyMedicalHistoryEditDialog
      v-model="editDialogOpen"
      mode="edit"
      :entry="editingEntry"
      :entries="section.entries"
      :relationship-options="familyRelationshipOptions"
      @save="onEditSave"
    />

    <FamilyMedicalHistoryDeleteDialog
      v-model="deleteDialogOpen"
      :require-deletion-reason="deleteDialogRequiresReason"
      @confirm="onDeleteConfirm"
    />

    <MedicalHistoryNegativeConfirmDialog
      v-model="negativeConfirmOpen"
      :title="negativeConfirmTitle"
      :message="negativeConfirmMessage"
      :confirm-label="t('fmhNegativeConfirmContinue')"
      :require-deletion-reason="negativeConfirmRequiresReason"
      @confirm="onNegativeConfirm"
      @cancel="onNegativeCancel"
    />
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormSelect from 'components/FormSelect.vue'
import AccordionSection from './AccordionSection.vue'
import AddClientSocialHistoryFields from
  'components/AddClientSocialHistoryFields.vue'
import FamilyMedicalHistoryEditDialog from
  'components/FamilyMedicalHistoryEditDialog.vue'
import FamilyMedicalHistoryDeleteDialog from
  'components/FamilyMedicalHistoryDeleteDialog.vue'
import MedicalHistoryNegativeConfirmDialog from
  'components/MedicalHistoryNegativeConfirmDialog.vue'
import MedicalHistoryTypeSection from
  'components/MedicalHistoryTypeSection.vue'
import {
  clientFamilyOnlyRelationshipOptions,
  familyMedicalHistoryMaxConditionsLength,
  familyMedicalHistoryMaxNotesLength,
  familyMedicalHistoryMaxRelationshipLength,
  medicalHistoryTypeOptions,
  medicalHistoryTypeValues,
  quasarNotifyTypes,
} from 'components/constants.js'
import {
  createEmptyFamilyMedicalHistoryDraft,
  fmhRowHasPersistedApiId,
  getFamilyMedicalHistoryDraftFieldErrorKeys,
  isDuplicateFamilyMedicalHistoryEntry,
  negativeFlagKeyForType,
  nextFamilyMedicalHistoryId,
  normalizeMedicalHistoryType,
  relationshipForHistoryType,
  splitFamilyMedicalHistoryEntries,
  trimFamilyMedicalField,
  validateMedicalHistoryDraftForAdd,
} from 'src/utils/client-family-medical-history.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'
import { useClientMedicalHistoryPermissions } from
  'src/composables/useClientMedicalHistoryPermissions.js'
import { useValidationSaveFeedback } from
  'src/composables/useValidationSaveFeedback.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const $q = useQuasar()
const { notifyAndScrollToValidationErrors } = useValidationSaveFeedback()
const {
  canViewMedicalHistory,
  canAddMedicalHistory,
  canEditMedicalHistory,
  canDeleteMedicalHistory,
} = useClientMedicalHistoryPermissions()

const canView = canViewMedicalHistory
const canMutateProfile = computed(() =>
  canAddMedicalHistory.value || canEditMedicalHistory.value,
)

const draftHistoryTypeError = ref('')
const draftRelationshipError = ref('')
const draftConditionsError = ref('')
const draftNotesError = ref('')
const editDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const editingEntry = ref(null)
const deletingEntry = ref(null)
const negativeConfirmOpen = ref(false)
const pendingNegativeType = ref(null)

const section = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const familyRelationshipOptions = clientFamilyOnlyRelationshipOptions

const historyTypeSelectOptions = computed(() =>
  medicalHistoryTypeOptions.map(option => ({
    label: t(option.labelKey),
    value: option.value,
  })),
)

const selectedHistoryType = computed(() =>
  trimFamilyMedicalField(section.value.draft?.historyType),
)

const showFamilyRelationship = computed(
  () => selectedHistoryType.value === medicalHistoryTypeValues.family,
)

const isSurgicalDraft = computed(
  () => selectedHistoryType.value === medicalHistoryTypeValues.surgical,
)

const conditionLabel = computed(() =>
  isSurgicalDraft.value
    ? t('fmhProcedureSurgery')
    : t('fmhMedicalConditionEvent'),
)

const conditionPlaceholder = computed(() =>
  isSurgicalDraft.value
    ? t('fmhProcedurePlaceholder')
    : t('fmhConditionPlaceholder'),
)

const splitEntries = computed(
  () => splitFamilyMedicalHistoryEntries(section.value.entries),
)

const personalEntries = computed(() => splitEntries.value.personal)
const familyEntries = computed(() => splitEntries.value.family)
const surgicalEntries = computed(() => splitEntries.value.surgical)

const negativeConfirmTitle = computed(() => {
  const type = pendingNegativeType.value
  if (type === medicalHistoryTypeValues.personal) {
    return t('fmhNegativePersonalTitle')
  }
  if (type === medicalHistoryTypeValues.surgical) {
    return t('fmhNegativeSurgicalTitle')
  }

  return t('fmhNegativeFamilyTitle')
})

const negativeConfirmMessage = computed(() => {
  const type = pendingNegativeType.value
  if (type === medicalHistoryTypeValues.personal) {
    return t('fmhNegativePersonalMessage')
  }
  if (type === medicalHistoryTypeValues.surgical) {
    return t('fmhNegativeSurgicalMessage')
  }

  return t('fmhNegativeFamilyMessage')
})

const pendingNegativeEntries = computed(() => {
  const type = pendingNegativeType.value
  if (type === medicalHistoryTypeValues.personal) {
    return personalEntries.value
  }
  if (type === medicalHistoryTypeValues.surgical) {
    return surgicalEntries.value
  }

  return familyEntries.value
})

const negativeConfirmRequiresReason = computed(() =>
  pendingNegativeEntries.value.some(entry =>
    fmhRowHasPersistedApiId(entry),
  ),
)

function notifySuccess(message) {
  $q.notify({
    type: quasarNotifyTypes.positive,
    message,
    position: 'top',
  })
}

function onHistoryTypeChange() {
  if (!showFamilyRelationship.value) {
    section.value.draft.familyRelationship = ''
  }
  draftHistoryTypeError.value = ''
  draftRelationshipError.value = ''
  draftConditionsError.value = ''
  draftNotesError.value = ''
}

function applyDraftFieldErrorKeys(keys) {
  draftHistoryTypeError.value = keys.historyType
    ? t(keys.historyType)
    : ''
  draftRelationshipError.value = ''
  draftConditionsError.value = ''
  draftNotesError.value = ''
  if (keys.relationship) {
    draftRelationshipError.value = t(
      keys.relationship,
      keys.relationship === 'fmhRelationshipMax'
        ? { max: familyMedicalHistoryMaxRelationshipLength }
        : {},
    )
  }
  if (keys.conditions) {
    draftConditionsError.value = t(
      keys.conditions,
      keys.conditions === 'fmhConditionsInvalid'
        || keys.conditions === 'fmhProcedureInvalid'
        ? { max: familyMedicalHistoryMaxConditionsLength }
        : {},
    )
  }
  if (keys.notes) {
    draftNotesError.value = t(
      keys.notes,
      { max: familyMedicalHistoryMaxNotesLength },
    )
  }
}

function applySaveValidation() {
  applyDraftFieldErrorKeys(
    getFamilyMedicalHistoryDraftFieldErrorKeys(section.value),
  )
}

function clearSaveValidation() {
  applyDraftFieldErrorKeys({
    historyType: null,
    relationship: null,
    conditions: null,
    notes: null,
  })
}

async function onAddEntry() {
  if (!canAddMedicalHistory.value) {
    return
  }
  const draft = section.value.draft
  const result = validateMedicalHistoryDraftForAdd(draft)
  if (!result.ok) {
    applyDraftFieldErrorKeys(result)
    await notifyAndScrollToValidationErrors(null)

    return
  }

  const historyType = normalizeMedicalHistoryType(
    draft.historyType,
    draft.familyRelationship,
  )
  const relationship = relationshipForHistoryType(
    historyType,
    draft.familyRelationship,
  )
  const conditions = trimFamilyMedicalField(draft.medicalConditions)
  const notes = trimFamilyMedicalField(draft.notes)

  if (
    isDuplicateFamilyMedicalHistoryEntry(
      section.value.entries,
      relationship,
      conditions,
      null,
      historyType,
    )
  ) {
    draftConditionsError.value = t('fmhDuplicateEntry')
    await notifyAndScrollToValidationErrors(null)

    return
  }

  section.value.entries.push({
    id: nextFamilyMedicalHistoryId(),
    historyType,
    familyRelationship: relationship,
    medicalConditions: conditions,
    notes,
  })
  const flagKey = negativeFlagKeyForType(historyType)
  section.value[flagKey] = false
  section.value.draft = createEmptyFamilyMedicalHistoryDraft()
  clearSaveValidation()
  notifySuccess(t('fmhAddedSuccess'))
}

function openEdit(entry) {
  if (!canEditMedicalHistory.value) {
    return
  }
  editingEntry.value = { ...entry }
  editDialogOpen.value = true
}

function onEditSave(payload) {
  const index = section.value.entries.findIndex(
    e => e.id === editingEntry.value?.id,
  )
  if (index < 0) {
    return
  }
  const historyType = normalizeMedicalHistoryType(
    payload.historyType ?? editingEntry.value.historyType,
    payload.familyRelationship,
  )
  section.value.entries[index] = {
    ...section.value.entries[index],
    ...payload,
    historyType,
    familyRelationship: relationshipForHistoryType(
      historyType,
      payload.familyRelationship,
    ),
  }
  notifySuccess(t('fmhUpdatedSuccess'))
}

function openDelete(entry) {
  if (!canDeleteMedicalHistory.value) {
    return
  }
  deletingEntry.value = entry
  deleteDialogOpen.value = true
}

const deleteDialogRequiresReason = computed(() =>
  fmhRowHasPersistedApiId(deletingEntry.value),
)

function pushDeletionAudit(entry, reason) {
  if (!fmhRowHasPersistedApiId(entry)) {
    return
  }
  if (!section.value.deletionAudit) {
    section.value.deletionAudit = []
  }
  section.value.deletionAudit.push({
    apiId: entry.apiId,
    historyType: entry.historyType,
    familyRelationship: entry.familyRelationship,
    medicalConditions: entry.medicalConditions,
    notes: entry.notes,
    reason,
  })
}

function onDeleteConfirm(reason) {
  const entry = deletingEntry.value
  if (!entry?.id) {
    return
  }
  const index = section.value.entries.findIndex(e => e.id === entry.id)
  if (index < 0) {
    deletingEntry.value = null

    return
  }
  const reasonText = trimFamilyMedicalField(reason)
  if (fmhRowHasPersistedApiId(entry) && !reasonText) {
    return
  }
  pushDeletionAudit(entry, reasonText)
  section.value.entries.splice(index, 1)
  deletingEntry.value = null
  notifySuccess(t('fmhDeletedSuccess'))
}

function entriesForType(historyType) {
  if (historyType === medicalHistoryTypeValues.personal) {
    return personalEntries.value
  }
  if (historyType === medicalHistoryTypeValues.surgical) {
    return surgicalEntries.value
  }

  return familyEntries.value
}

function onNegativeToggle(historyType, checked) {
  if (!canMutateProfile.value) {
    return
  }
  const flagKey = negativeFlagKeyForType(historyType)
  if (!checked) {
    section.value[flagKey] = false

    return
  }
  if (!entriesForType(historyType).length) {
    section.value[flagKey] = true

    return
  }
  pendingNegativeType.value = historyType
  negativeConfirmOpen.value = true
}

function onNegativeCancel() {
  pendingNegativeType.value = null
}

function onNegativeConfirm(reason) {
  const historyType = pendingNegativeType.value
  if (!historyType) {
    return
  }
  const reasonText = trimFamilyMedicalField(reason)
  const ids = new Set(entriesForType(historyType).map(entry => entry.id))
  for (const entry of [...section.value.entries]) {
    if (!ids.has(entry.id)) {
      continue
    }
    pushDeletionAudit(entry, reasonText)
  }
  section.value.entries = section.value.entries.filter(
    entry => !ids.has(entry.id),
  )
  section.value[negativeFlagKeyForType(historyType)] = true
  pendingNegativeType.value = null
}

defineExpose({
  applySaveValidation,
  clearSaveValidation,
})
</script>
