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
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-sm">
        <div
          class="row q-col-gutter-md q-col-gutter-lg-md
            add-client-form__allergy-input-row">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('allergyName')"
              :test-id="tid.allergyField('name')">
              <q-input
                v-model="localAllergy"
                outlined
                hide-bottom-space
                :data-testid="tid.allergyField('name')"
                :error="Boolean(nameError)"
                :error-message="nameError"
                maxlength="100"
              />
            </AddClientLabeledField>
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
                        localSeverity === opt.value,
                    },
                  ]"
                  @click="localSeverity = opt.value">
                  <span
                    :class="[
                      'add-client-form__allergy-severity-dot',
                      `add-client-form__allergy-severity-dot--${opt.modifier}`,
                    ]"
                  />
                  <span class="add-client-form__allergy-severity-label">
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
})

const emit = defineEmits(['update:modelValue', 'save'])

const { t } = useI18n()

const localAllergy = ref('')
const localSeverity = ref('')
const localStartYear = ref('')
const nameError = ref('')
const severityError = ref('')
const yearError = ref('')

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
  allergyMinStartYear(props.patientDob ?? ''),
)

const startYearHint = computed(() =>
  t('allergyStartYearHint', {
    min: allergyMinYear.value,
    max: allergyMaxStartYear(),
  }),
)

const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const dialogTestId = modalTestIds.dialog('allergy-edit')
const cancelTestId = modalTestIds.cancel('allergy-edit')
const confirmTestId = modalTestIds.confirm('allergy-edit')

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
      nameError.value = t(result.errorKey, { max: 100 })
    } else if (result.errorKey === 'allergySeverityRequired') {
      severityError.value = t(result.errorKey)
    } else if (result.errorKey === 'allergyStartYearInvalid') {
      yearError.value = t(result.errorKey, {
        min: allergyMinYear.value,
        max: allergyMaxStartYear(),
      })
    }
  }
}

function onSave() {
  const result = validateAllergyForAdd(
    localAllergy.value,
    localSeverity.value,
    localStartYear.value,
    props.patientDob ?? '',
  )
  if (!result.ok) {
    applyErrors(result)

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

