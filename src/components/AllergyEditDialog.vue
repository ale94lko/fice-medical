<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="dialogTestId"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="allergy-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('allergyEditTitle') }}
      </AppDialogHeader>
      <q-card-section
        ref="dialogBodyScrollRef"
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-sm">
        <div
          class="row q-col-gutter-md q-col-gutter-lg-md
            allergy-input-row">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('allergyName')"
              :test-id="tid.allergyField('name')">
              <q-select
                v-model="localAllergy"
                outlined
                hide-bottom-space
                :data-testid="tid.allergyField('name')"
                :error="Boolean(nameError)"
                :error-message="nameError"
                :placeholder="t('allergySearchPlaceholder')"
                :options="filteredAllergyOptions"
                :loading="allergyCatalogLoading"
                use-input
                fill-input
                hide-selected
                hide-dropdown-icon
                emit-value
                map-options
                new-value-mode="add-unique"
                clearable
                input-debounce="0"
                @filter="onAllergyFilter"
                @new-value="onNewAllergyName"
                @input-value="onAllergyInputValue"
                @blur="onAllergyBlur"
              />
            </AddClientLabeledField>
            <FormFieldHint
              v-if="!nameError"
              hint-class="allergy-name-hint">
              {{ t('allergySearchHint') }}
            </FormFieldHint>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('allergyStartYear')"
              :test-id="tid.allergyField('startYear')">
              <ClientYearField
                v-model="localStartYear"
                :min-year="allergyMinYear"
                :max-year="allergyMaxStartYear()"
                :error="Boolean(yearError)"
                :error-message="yearError"
                :close-label="t('close')"
                :test-id="tid.allergyField('startYear')"
              />
            </AddClientLabeledField>
            <FormFieldHint
              v-if="!yearError"
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
                        localSeverity === opt.value,
                    },
                  ]"
                  @click="localSeverity = opt.value">
                  <span
                    :class="[
                      'allergy-severity-dot',
                      `allergy-severity-dot--${opt.modifier}`,
                    ]"
                  />
                  <span class="allergy-severity-label">
                    {{ opt.label }}
                  </span>
                </q-btn>
              </div>
            </AddClientLabeledField>
            <div
              v-if="severityError"
              class="form-field__error">
              {{ severityError }}
            </div>
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
import ClientYearField from 'components/ClientYearField.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormFieldHint from 'components/FormFieldHint.vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  clientAllergyMaxNameLength,
  clientAllergySeverityValues,
} from 'components/constants.js'
import {
  allergyMaxStartYear,
  allergyMinStartYear,
  isDuplicateAllergyEntry,
  trimAllergyField,
  validateAllergyForAdd,
} from 'src/utils/client-allergies.js'
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
  entry: {
    type: Object,
    default: null,
  },
  entries: {
    type: Array,
    default: () => [],
  },
  /** Patient DOB (mm/dd/yyyy); allergy start year cannot precede birth year. */
  patientDob: {
    type: String,
    default: '',
  },
  patientAge: {
    type: [String, Number],
    default: '',
  },
  patientAgeUnit: {
    type: String,
    default: '',
  },
  allergyCatalogOptions: {
    type: Array,
    default: () => [],
  },
  allergyCatalogLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

const { t } = useI18n()
const { notifyAndScrollToValidationErrors } = useValidationSaveFeedback()

const dialogBodyScrollRef = ref(null)
const localAllergy = ref('')
const localSeverity = ref('')
const localStartYear = ref('')
const nameError = ref('')
const severityError = ref('')
const yearError = ref('')
const filteredAllergyOptions = ref([])
const allergySearchInput = ref('')

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

const allergyMinYear = computed(() =>
  allergyMinStartYear({
    dobUs: props.patientDob ?? '',
    age: props.patientAge,
    ageUnit: props.patientAgeUnit,
  }),
)

const startYearHint = computed(() => {
  const min = allergyMinYear.value
  const max = allergyMaxStartYear()
  if (min === max) {
    return t('allergyStartYearHintCurrentYearOnly')
  }

  return t('allergyStartYearHint', { min, max })
})

const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const dialogTestId = modalTestIds.dialog('allergy-edit')
const cancelTestId = modalTestIds.cancel('allergy-edit')
const confirmTestId = modalTestIds.confirm('allergy-edit')

function patientBirthContext() {
  return {
    dobUs: props.patientDob ?? '',
    age: props.patientAge,
    ageUnit: props.patientAgeUnit,
  }
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

function ensureAllergyOptionVisible(label) {
  const normalized = normalizeAllergyForCompare(label)
  if (!normalized) {
    return
  }

  const exists = filteredAllergyOptions.value.some(opt => {
    const raw = opt?.value ?? opt?.label ?? ''
    return normalizeAllergyForCompare(raw) === normalized
  })
  if (exists) {
    return
  }

  filteredAllergyOptions.value = [
    { label, value: label },
    ...filteredAllergyOptions.value,
  ]
}

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

function onNewAllergyName(value, done) {
  done(trimAllergyField(value), 'add-unique')
}

function onAllergyInputValue(val) {
  allergySearchInput.value = val ?? ''
}

function onAllergyBlur() {
  const typed = trimAllergyField(allergySearchInput.value)
  if (!typed) {
    return
  }

  const current = trimAllergyField(localAllergy.value)
  if (
    current
    && normalizeAllergyForCompare(current) === normalizeAllergyForCompare(typed)
  ) {
    return
  }

  ensureAllergyOptionVisible(typed)
  localAllergy.value = typed
}

watch(
  () => localAllergy.value,
  val => {
    allergySearchInput.value = trimAllergyField(val)
  },
)

watch(
  () => props.allergyCatalogOptions,
  () => {
    const current = normalizeAllergyForCompare(localAllergy.value)
    if (!current) {
      filteredAllergyOptions.value = []
      return
    }

    ensureAllergyOptionVisible(localAllergy.value)
    const all = props.allergyCatalogOptions ?? []
    filteredAllergyOptions.value = all.filter(opt => {
      const raw = String(opt?.label ?? opt?.value ?? '')
      return raw && normalizeAllergyForCompare(raw).includes(current)
    })
  },
  { immediate: true, deep: true },
)

watch(
  () => props.modelValue,
  visible => {
    if (!visible) {
      return
    }
    nameError.value = ''
    severityError.value = ''
    yearError.value = ''
    localAllergy.value = props.entry?.allergy ?? ''
    localSeverity.value = props.entry?.severity ?? ''
    const year = props.entry?.startYear
    localStartYear.value = year != null && year !== ''
      ? String(year)
      : ''
    allergySearchInput.value = trimAllergyField(localAllergy.value)
    if (localAllergy.value) {
      ensureAllergyOptionVisible(localAllergy.value)
    }
    applyEditEntryValidation()
  },
)

watch(
  () => [
    props.patientDob,
    props.patientAge,
    props.patientAgeUnit,
    localStartYear.value,
  ],
  () => {
    applyEditEntryValidation()
  },
)

function onCancel() {
  open.value = false
}

function applyErrors(result) {
  nameError.value = ''
  severityError.value = ''
  yearError.value = ''
  if (!result.ok && result.errorKey) {
    if (
      result.errorKey === 'allergyNameRequired'
      || result.errorKey === 'allergyNameInvalid'
      || result.errorKey === 'allergyAddRequired'
    ) {
      nameError.value = t(result.errorKey, {
        max: clientAllergyMaxNameLength,
        maxName: clientAllergyMaxNameLength,
      })
    } else if (result.errorKey === 'allergySeverityRequired') {
      severityError.value = t(result.errorKey)
    } else if (
      result.errorKey === 'allergyStartYearInvalid'
      || result.errorKey === 'allergyStartYearBeforeBirth'
      || result.errorKey === 'allergyStartYearAfterCurrent'
    ) {
      yearError.value = t(result.errorKey, {
        min: allergyMinYear.value,
        max: allergyMaxStartYear(),
      })
    }
  }
}

function applyEditEntryValidation() {
  if (!open.value) {
    return
  }

  const result = validateAllergyForAdd(
    localAllergy.value,
    localSeverity.value,
    localStartYear.value,
    patientBirthContext(),
  )
  applyErrors(result)
}

async function onSave() {
  const typed = trimAllergyField(localAllergy.value)
  const canonical = resolveCanonicalAllergyName(typed)
  localAllergy.value = canonical ?? typed

  const result = validateAllergyForAdd(
    localAllergy.value,
    localSeverity.value,
    localStartYear.value,
    patientBirthContext(),
  )
  if (!result.ok) {
    applyErrors(result)
    await notifyAndScrollToValidationErrors(dialogBodyScrollRef)

    return
  }

  const allergy = trimAllergyField(localAllergy.value)
  const severity = trimAllergyField(localSeverity.value)
  const yearRaw = trimAllergyField(localStartYear.value)

  if (
    isDuplicateAllergyEntry(
      props.entries,
      allergy,
      severity,
      yearRaw,
      props.entry?.id ?? null,
    )
  ) {
    nameError.value = t('allergyDuplicateEntry')
    await notifyAndScrollToValidationErrors(dialogBodyScrollRef)

    return
  }

  emit('save', {
    allergy,
    severity,
    startYear: yearRaw === '' ? null : Number(yearRaw),
  })
  open.value = false
}
</script>

