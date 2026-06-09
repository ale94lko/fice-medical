<template>
  <div class="add-client-allergies-tab">
    <AddClientAccordionSection
      v-model="section.addExpanded"
      icon="medication"
      :title="t('allergiesAddSectionTitle')"
      section-test-id="add-client-accordion-allergies-add"
      :toggle-test-id="tid.accordionToggle('allergies-add')">
      <div
        class="row q-col-gutter-sm q-col-gutter-md
          add-client-form__allergy-input-row">
        <div class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('allergyName')"
            :test-id="tid.allergyField('name')">
            <q-input
              v-model="section.draft.allergy"
              outlined
              hide-bottom-space
              :data-testid="tid.allergyField('name')"
              :error="Boolean(draftNameError)"
              :error-message="draftNameError"
              maxlength="100"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('allergyStartYear')"
            :test-id="tid.allergyField('startYear')">
            <ClientYearField
              v-model="section.draft.startYear"
              :min-year="allergyMinYear"
              :max-year="allergyMaxStartYear()"
              :error="Boolean(draftYearError)"
              :error-message="draftYearError"
              :close-label="t('close')"
              :test-id="tid.allergyField('startYear')"
            />
          </AddClientLabeledField>
          <FormFieldHint
            v-if="!draftYearError"
            hint-class="add-client-form__allergy-year-hint">
            {{ startYearHint }}
          </FormFieldHint>
        </div>
        <div class="col-12">
          <AddClientLabeledField
            :label="t('allergySeverity')"
            :test-id="tid.allergyField('severity')">
            <div class="add-client-form__allergy-severity-grid">
              <q-btn
                v-for="opt in severityOptions"
                :key="opt.value"
                flat
                no-caps
                :data-testid="tid.allergySeverity(opt.modifier)"
                :class="[
                  'add-client-form__allergy-severity-chip',
                  `add-client-form__allergy-severity-chip--${opt.modifier}`,
                  {
                    'add-client-form__allergy-severity-chip--selected':
                      section.draft.severity === opt.value,
                  },
                ]"
                @click="section.draft.severity = opt.value">
                <span
                  :class="severityDotClass(opt.modifier)"
                />
                <span class="add-client-form__allergy-severity-label">
                  {{ opt.label }}
                </span>
              </q-btn>
            </div>
          </AddClientLabeledField>
          <div
            v-if="draftSeverityError"
            class="form-field__error">
            {{ draftSeverityError }}
          </div>
        </div>
        <div class="col-12 flex justify-end">
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :data-testid="tid.allergyBtnAdd"
            :label="t('allergyAdd')"
            @click="onAddEntry"
          />
        </div>
      </div>
    </AddClientAccordionSection>

    <q-separator class="add-client-form__section-separator" />

    <AddClientAccordionSection
      icon="medical_services"
      :title="t('allergiesExistingTitle')"
      section-test-id="add-client-accordion-allergies-existing"
      :toggle-test-id="tid.accordionToggle('allergies-existing')">
      <div class="add-client-form__fmh-list-card q-pa-md">
        <AllergiesTable
          :entries="section.entries"
          :empty-label="t('allergiesExistingEmpty')"
          @edit="openEdit"
          @delete="openDelete"
        />
      </div>
      <p class="add-client-form__allergy-footer-hint">
        <q-icon name="info_outline" size="18px" class="q-mr-xs" />
        {{ t('allergiesFooterHint') }}
      </p>
    </AddClientAccordionSection>

    <AllergyEditDialog
      v-model="editDialogOpen"
      :entry="editingEntry"
      :entries="section.entries"
      :patient-dob="patientDob"
      @save="onEditSave"
    />

    <AllergyDeleteDialog
      v-model="deleteDialogOpen"
      :require-deletion-reason="requireDeletionReason"
      @confirm="onDeleteConfirm"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import ClientYearField from 'components/ClientYearField.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormFieldHint from 'components/FormFieldHint.vue'
import AddClientAccordionSection from 'components/AddClientAccordionSection.vue'
import AllergiesTable from 'components/AllergiesTable.vue'
import AllergyEditDialog from 'components/AllergyEditDialog.vue'
import AllergyDeleteDialog from 'components/AllergyDeleteDialog.vue'
import {
  clientAllergyMaxNameLength,
  clientAllergySeverityValues,
  quasarNotifyTypes,
} from 'components/constants.js'
import {
  allergyMaxStartYear,
  allergyMinStartYear,
  createEmptyAllergyDraft,
  getAllergyDraftFieldErrorKeys,
  isDuplicateAllergyEntry,
  nextAllergyId,
  trimAllergyField,
  validateAllergyForAdd,
} from 'src/utils/client-allergies.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  /** Patient DOB (mm/dd/yyyy); allergy start year cannot precede birth year. */
  patientDob: {
    type: String,
    default: '',
  },
  /** When editing an existing client, deletion requires an audit reason. */
  requireDeletionReason: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const $q = useQuasar()

const editDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const editingEntry = ref(null)
const deletingEntryId = ref(null)
const draftNameError = ref('')
const draftYearError = ref('')
const draftSeverityError = ref('')

const severityOptions = [
  {
    value: clientAllergySeverityValues.mild,
    label: clientAllergySeverityValues.mild,
    modifier: 'mild',
  },
  {
    value: clientAllergySeverityValues.moderate,
    label: clientAllergySeverityValues.moderate,
    modifier: 'moderate',
  },
  {
    value: clientAllergySeverityValues.severe,
    label: clientAllergySeverityValues.severe,
    modifier: 'severe',
  },
]

const section = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const allergyMinYear = computed(() =>
  allergyMinStartYear(props.patientDob ?? ''),
)

const startYearHint = computed(() =>
  t('allergyStartYearHint', {
    min: allergyMinYear.value,
    max: allergyMaxStartYear(),
  }),
)

function severityDotClass(modifier) {
  return [
    'add-client-form__allergy-severity-dot',
    `add-client-form__allergy-severity-dot--${modifier}`,
  ]
}

function notifySuccess(message) {
  $q.notify({
    type: quasarNotifyTypes.positive,
    message,
    position: 'top',
  })
}

function applyAllergyDraftFieldErrorKeys(keys) {
  draftNameError.value = ''
  draftYearError.value = ''
  draftSeverityError.value = ''
  if (keys.name) {
    draftNameError.value = t(keys.name, {
      max: clientAllergyMaxNameLength,
      maxName: clientAllergyMaxNameLength,
    })
  }
  if (keys.severity) {
    draftSeverityError.value = t(keys.severity)
  }
  if (keys.year) {
    draftYearError.value = t(keys.year, {
      min: allergyMinYear.value,
      max: allergyMaxStartYear(),
    })
  }
}

function applySaveValidation() {
  applyAllergyDraftFieldErrorKeys(
    getAllergyDraftFieldErrorKeys(section.value, props.patientDob ?? ''),
  )
}

function clearSaveValidation() {
  applyAllergyDraftFieldErrorKeys({
    name: null,
    severity: null,
    year: null,
  })
}

function applyDraftErrors(result) {
  draftNameError.value = ''
  draftYearError.value = ''
  draftSeverityError.value = ''
  if (!result.ok && result.errorKey) {
    if (
      result.errorKey === 'allergyNameRequired'
      || result.errorKey === 'allergyNameInvalid'
      || result.errorKey === 'allergyAddRequired'
    ) {
      draftNameError.value = t(result.errorKey, {
        maxName: clientAllergyMaxNameLength,
      })
    } else if (result.errorKey === 'allergySeverityRequired') {
      draftSeverityError.value = t(result.errorKey)
    } else if (result.errorKey === 'allergyStartYearInvalid') {
      draftYearError.value = t(result.errorKey, {
        min: allergyMinYear.value,
        max: allergyMaxStartYear(),
      })
    } else {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t(result.errorKey),
        position: 'top',
      })
    }
  }
}

function onAddEntry() {
  const draft = section.value.draft
  const result = validateAllergyForAdd(
    draft.allergy,
    draft.severity,
    draft.startYear,
    props.patientDob ?? '',
  )
  if (!result.ok) {
    applyDraftErrors(result)

    return
  }

  const allergyRaw = trimAllergyField(draft.allergy)
  const severityRaw = trimAllergyField(draft.severity)
  const yearRaw = trimAllergyField(draft.startYear)
  if (
    isDuplicateAllergyEntry(
      section.value.entries,
      allergyRaw,
      severityRaw,
      yearRaw,
    )
  ) {
    draftNameError.value = t('allergyDuplicateEntry')

    return
  }

  section.value.entries.push({
    id: nextAllergyId(),
    allergy: allergyRaw,
    severity: severityRaw,
    startYear: yearRaw === '' ? null : Number(yearRaw),
  })
  section.value.draft = createEmptyAllergyDraft()
  applyDraftErrors({ ok: true })
  notifySuccess(t('allergyAddedSuccess'))
}

function openEdit(entry) {
  editingEntry.value = { ...entry }
  editDialogOpen.value = true
}

function onEditSave(updated) {
  const id = editingEntry.value?.id
  if (!id) {
    return
  }
  const index = section.value.entries.findIndex(e => e.id === id)
  if (index < 0) {
    return
  }
  section.value.entries[index] = {
    id,
    ...updated,
  }
  notifySuccess(t('allergyUpdatedSuccess'))
}

function openDelete(entry) {
  deletingEntryId.value = entry.id
  deleteDialogOpen.value = true
}

function onDeleteConfirm(reason) {
  if (props.requireDeletionReason && !trimAllergyField(reason)) {
    return
  }
  const id = deletingEntryId.value
  if (!id) {
    return
  }
  const index = section.value.entries.findIndex(e => e.id === id)
  if (index < 0) {
    return
  }
  const removed = section.value.entries[index]
  section.value.entries.splice(index, 1)
  if (props.requireDeletionReason) {
    section.value.deletionAudit.push({
      allergy: removed.allergy,
      severity: removed.severity,
      startYear: removed.startYear,
      reason: trimAllergyField(reason),
    })
  }
  deletingEntryId.value = null
  notifySuccess(t('allergyDeletedSuccess'))
}

defineExpose({
  applySaveValidation,
  clearSaveValidation,
})
</script>
