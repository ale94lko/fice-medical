<template>
  <div class="add-client-allergies-tab">
    <AccordionSection
      v-model="section.addExpanded"
      icon="medication"
      :title="t('allergiesAddSectionTitle')"
      section-test-id="add-client-accordion-allergies-add"
      :toggle-test-id="tid.accordionToggle('allergies-add')">
      <div class="allergies-nka-toggle-card fmh-list-card q-pa-md">
        <q-checkbox
          :model-value="noKnownAllergiesChecked"
          :label="t('noKnownAllergiesLabel')"
          @update:model-value="onNoKnownAllergiesToggle"
        />
        <p class="allergies-nka-toggle-hint">
          {{ t('noKnownAllergiesHint') }}
        </p>
      </div>
      <div
        v-if="!noKnownAllergiesChecked"
        class="allergies-or-divider">
        <div class="allergies-or-divider__line" />
        <div class="allergies-or-divider__text">
          {{ t('orSeparator') }}
        </div>
        <div class="allergies-or-divider__line" />
      </div>
      <div
        v-if="!noKnownAllergiesChecked"
        class="row q-col-gutter-sm q-col-gutter-md allergy-input-row">
        <div class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('allergyName')"
            required
            :test-id="tid.allergyField('name')">
            <q-select
              v-model="section.draft.allergy"
              outlined
              hide-bottom-space
              :data-testid="tid.allergyField('name')"
              :error="Boolean(draftNameError)"
              :error-message="draftNameError"
              :placeholder="t('allergySearchPlaceholder')"
              :options="filteredAllergyOptions"
              :loading="allergyCatalogLoading"
              use-input
              fill-input
              hide-selected
              hide-dropdown-icon
              emit-value
              new-value-mode="add-unique"
              clearable
              input-debounce="0"
              @filter="onAllergyFilter"
            />
          </AddClientLabeledField>
          <FormFieldHint
            v-if="!draftNameError"
            hint-class="allergy-name-hint">
            {{ t('allergySearchHint') }}
          </FormFieldHint>
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
            hint-class="allergy-year-hint">
            {{ startYearHint }}
          </FormFieldHint>
        </div>
        <div class="col-12">
          <AddClientLabeledField
            :label="t('allergySeverity')"
            :test-id="tid.allergyField('severity')">
            <div class="allergy-severity-grid">
              <q-btn
                v-for="opt in severityOptions"
                :key="opt.value"
                flat
                no-caps
                :data-testid="tid.allergySeverity(opt.modifier)"
                :class="[
                  'allergy-severity-chip',
                  `allergy-severity-chip--${opt.modifier}`,
                  {
                    'allergy-severity-chip--selected':
                      section.draft.severity === opt.value,
                  },
                ]"
                @click="section.draft.severity = opt.value">
                <span
                  :class="severityDotClass(opt.modifier)"
                />
                <span class="allergy-severity-label">
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
    </AccordionSection>

    <q-separator class="section-separator" />

    <AccordionSection
      icon="medical_services"
      :title="t('allergiesExistingTitle')"
      section-test-id="add-client-accordion-allergies-existing"
      :toggle-test-id="tid.accordionToggle('allergies-existing')">
      <template v-if="!noKnownAllergiesChecked">
        <div class="fmh-list-card q-pa-md">
          <AllergiesTable
            :entries="visibleEntries"
            :invalid-row-ids="invalidDobRowIds"
            :empty-label="t('allergiesExistingEmpty')"
            @edit="openEdit"
            @delete="openDelete"
          />
        </div>
        <p class="allergy-footer-hint">
          <q-icon name="info_outline" size="18px" class="q-mr-xs" />
          {{ t('allergiesFooterHint') }}
        </p>
      </template>

      <template v-else>
        <div class="fmh-list-card q-pa-md">
          <div class="row items-start no-wrap q-col-gutter-sm">
            <q-icon
              name="check_circle"
              color="positive"
              size="22px" />
            <div>
              <div class="text-body1 text-strong">
                {{ t('noKnownAllergiesConfirmedTitle') }}
              </div>
              <div class="text-body2 text-grey-7 q-mt-xs">
                {{ t('noKnownAllergiesConfirmedSubtitle') }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </AccordionSection>

    <AllergyEditDialog
      v-if="!noKnownAllergiesChecked"
      v-model="editDialogOpen"
      :entry="editingEntry"
      :entries="visibleEntries"
      :patient-dob="patientDob"
      @save="onEditSave"
    />

    <AllergyDeleteDialog
      v-if="!noKnownAllergiesChecked"
      v-model="deleteDialogOpen"
      :require-deletion-reason="deleteDialogRequiresReason"
      @confirm="onDeleteConfirm"
    />

    <ModalComponent
      v-model="noKnownAllergiesRemoveConfirmOpen"
      test-id="no-known-allergies-remove"
      :title="t('noKnownAllergiesRemoveModalTitle')"
      :message="t('noKnownAllergiesRemoveModalMessage')"
      :confirm-text="t('noKnownAllergiesRemoveModalConfirm')"
      :cancel-text="t('cancel')"
      @confirm="onConfirmNoKnownAllergiesRemove"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import ClientYearField from 'components/ClientYearField.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormFieldHint from 'components/FormFieldHint.vue'
import AccordionSection from './AccordionSection.vue'
import AllergiesTable from 'components/AllergiesTable.vue'
import AllergyEditDialog from 'components/AllergyEditDialog.vue'
import AllergyDeleteDialog from 'components/AllergyDeleteDialog.vue'
import ModalComponent from 'components/ModalComponent.vue'
import {
  clientAllergyMaxNameLength,
  clientAllergySeverityValues,
  quasarNotifyTypes,
} from 'components/constants.js'
import {
  allergyEntriesDobInvalidIds,
  allergyMaxStartYear,
  allergyMinStartYear,
  allergyRowHasPersistedApiId,
  createEmptyAllergyDraft,
  getAllergyDraftFieldErrorKeys,
  isDuplicateAllergyEntry,
  nextAllergyId,
  trimAllergyField,
  validateAllergyForAdd,
  visibleAllergyEntries,
} from 'src/utils/client-allergies.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'
import { useValidationSaveFeedback } from
  'src/composables/useValidationSaveFeedback.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  /** Allergy autocomplete options from the `allergy_name` catalog. */
  allergyCatalogOptions: {
    type: Array,
    default: () => [],
  },
  allergyCatalogLoading: {
    type: Boolean,
    default: false,
  },
  /** Patient DOB (mm/dd/yyyy); allergy start year cannot precede birth year. */
  patientDob: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const $q = useQuasar()
const { notifyAndScrollToValidationErrors } = useValidationSaveFeedback()

const editDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const editingEntry = ref(null)
const deletingEntryId = ref(null)
const draftNameError = ref('')
const draftYearError = ref('')
const draftSeverityError = ref('')
const invalidDobRowIds = ref([])

const filteredAllergyOptions = ref([])

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

const noKnownAllergiesChecked = computed(
  () => Boolean(section.value.noKnownAllergies),
)

const visibleEntries = computed(() =>
  noKnownAllergiesChecked.value
    ? []
    : visibleAllergyEntries(section.value.entries),
)

const noKnownAllergiesRemoveConfirmOpen = ref(false)

function hasVisibleAllergies() {
  return visibleAllergyEntries(section.value.entries).length > 0
}

function applyNoKnownAllergiesConfirmed() {
  section.value.noKnownAllergies = true
  section.value.entries = []
  section.value.draft = createEmptyAllergyDraft()
  invalidDobRowIds.value = []
  applyDraftErrors({ ok: true })
}

function onConfirmNoKnownAllergiesRemove() {
  applyNoKnownAllergiesConfirmed()
}

function onNoKnownAllergiesToggle(nextValue) {
  const next = Boolean(nextValue)

  // Unchecking: remove confirmation and return to normal flow.
  if (!next) {
    section.value.noKnownAllergies = false
    section.value.draft = createEmptyAllergyDraft()
    invalidDobRowIds.value = []
    applyDraftErrors({ ok: true })
    editDialogOpen.value = false
    deleteDialogOpen.value = false
    return
  }

  // Checking: if there are existing allergies, confirm before deleting them.
  if (hasVisibleAllergies()) {
    noKnownAllergiesRemoveConfirmOpen.value = true
    return
  }

  applyNoKnownAllergiesConfirmed()
}

function normalizeAllergyForCompare(value) {
  return trimAllergyField(value).toLowerCase()
}

function resolveCanonicalAllergyName(typed) {
  const needle = normalizeAllergyForCompare(typed)
  if (!needle) {
    return null
  }

  const match = (props.allergyCatalogOptions ?? []).find(opt => {
    const raw = opt?.value ?? opt?.label ?? ''
    return normalizeAllergyForCompare(raw) === needle
  })

  return match?.value ?? match?.label ?? null
}

watch(
  () => props.allergyCatalogOptions,
  () => {
    const current = normalizeAllergyForCompare(section.value?.draft?.allergy)
    if (!current) {
      filteredAllergyOptions.value = []
      return
    }

    const all = props.allergyCatalogOptions ?? []
    filteredAllergyOptions.value = all.filter(opt => {
      const raw = String(opt?.label ?? opt?.value ?? '')
      return raw && normalizeAllergyForCompare(raw).includes(current)
    })
  },
  { immediate: true, deep: true },
)

function onAllergyFilter(val, update) {
  const needle = normalizeAllergyForCompare(val)
  update(() => {
    if (!needle) {
      filteredAllergyOptions.value = []
      return
    }

    const all = props.allergyCatalogOptions ?? []
    filteredAllergyOptions.value = all.filter(opt => {
      const raw = String(opt?.label ?? opt?.value ?? '')
      return raw && normalizeAllergyForCompare(raw).includes(needle)
    })
  })
}

/** Audit reason only when deleting an allergy already persisted (has apiId). */
const deleteDialogRequiresReason = computed(() => {
  const rowId = deletingEntryId.value
  if (!rowId) {
    return false
  }
  const row = (section.value.entries ?? []).find(e => e.id === rowId)

  return allergyRowHasPersistedApiId(row)
})

watch(
  () => [props.patientDob, section.value.entries],
  () => {
    if (!invalidDobRowIds.value.length) {
      return
    }
    invalidDobRowIds.value = allergyEntriesDobInvalidIds(
      section.value.entries ?? [],
      props.patientDob ?? '',
    )
  },
  { deep: true },
)

const allergyMinYear = computed(() =>
  allergyMinStartYear(props.patientDob ?? ''),
)

const startYearHint = computed(() => {
  const min = allergyMinYear.value
  const max = allergyMaxStartYear()
  if (min === max) {
    return t('allergyStartYearHintCurrentYearOnly')
  }

  return t('allergyStartYearHint', { min, max })
})

function severityDotClass(modifier) {
  return [
    'allergy-severity-dot',
    `allergy-severity-dot--${modifier}`,
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
  if (noKnownAllergiesChecked.value) {
    clearSaveValidation()
    return
  }

  applyAllergyDraftFieldErrorKeys(
    getAllergyDraftFieldErrorKeys(section.value, props.patientDob ?? ''),
  )
  invalidDobRowIds.value = allergyEntriesDobInvalidIds(
    section.value.entries ?? [],
    props.patientDob ?? '',
  )
}

function clearSaveValidation() {
  applyAllergyDraftFieldErrorKeys({
    name: null,
    severity: null,
    year: null,
  })
  invalidDobRowIds.value = []
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
    } else if (
      result.errorKey === 'allergyStartYearInvalid'
      || result.errorKey === 'allergyStartYearBeforeBirth'
      || result.errorKey === 'allergyStartYearAfterCurrent'
    ) {
      draftYearError.value = t(result.errorKey, {
        min: allergyMinYear.value,
        max: allergyMaxStartYear(),
      })
    }
  }
}

async function onAddEntry() {
  const draft = section.value.draft

  const typed = trimAllergyField(draft.allergy)
  const canonical = resolveCanonicalAllergyName(typed)
  draft.allergy = canonical ?? typed

  const result = validateAllergyForAdd(
    draft.allergy,
    draft.severity,
    draft.startYear,
    props.patientDob ?? '',
  )
  if (!result.ok) {
    applyDraftErrors(result)
    await notifyAndScrollToValidationErrors(null)

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
    await notifyAndScrollToValidationErrors(null)

    return
  }

  section.value.entries.push({
    id: nextAllergyId(),
    apiId: null,
    allergy: allergyRaw,
    severity: severityRaw,
    startYear: yearRaw === '' ? null : Number(yearRaw),
    // eslint-disable-next-line camelcase -- mirrors API row shape
    deletion_reason: '',
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
  const prev = section.value.entries[index]
  section.value.entries[index] = {
    ...prev,
    id,
    allergy: updated.allergy,
    severity: updated.severity,
    startYear: updated.startYear,
  }
  notifySuccess(t('allergyUpdatedSuccess'))
}

function openDelete(entry) {
  deletingEntryId.value = entry.id
  deleteDialogOpen.value = true
}

function onDeleteConfirm(reason) {
  const id = deletingEntryId.value
  if (!id) {
    return
  }
  const index = section.value.entries.findIndex(e => e.id === id)
  if (index < 0) {
    return
  }
  const row = section.value.entries[index]
  const reasonText = trimAllergyField(reason)
  if (allergyRowHasPersistedApiId(row) && !reasonText) {
    return
  }
  if (!allergyRowHasPersistedApiId(row)) {
    section.value.entries.splice(index, 1)
    deletingEntryId.value = null
    notifySuccess(t('allergyDeletedSuccess'))

    return
  }
  section.value.entries[index] = {
    ...row,
    // eslint-disable-next-line camelcase -- mirrors API row shape
    deletion_reason: reasonText,
  }
  deletingEntryId.value = null
  notifySuccess(t('allergyDeletedSuccess'))
}

defineExpose({
  applySaveValidation,
  clearSaveValidation,
})
</script>
