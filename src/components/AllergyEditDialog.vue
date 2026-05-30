<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="allergy-dialog">
      <q-toolbar class="q-px-md app-dialog-toolbar">
        <q-toolbar-title>{{ t('allergyEditTitle') }}</q-toolbar-title>
      </q-toolbar>
      <q-card-section class="q-px-lg q-pt-md q-pb-sm">
        <div
          class="row q-col-gutter-md q-col-gutter-lg-md
            add-client-form__allergy-input-row">
          <div class="col-12 col-md-6">
            <AddClientLabeledField :label="t('allergyName')">
              <q-input
                v-model="localAllergy"
                outlined
                hide-bottom-space
                :error="Boolean(nameError)"
                :error-message="nameError"
                maxlength="100"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField :label="t('allergyStartYear')">
              <ClientYearField
                v-model="localStartYear"
                :min-year="allergyMinStartYear()"
                :max-year="allergyMaxStartYear()"
                :error="Boolean(yearError)"
                :error-message="yearError"
                :close-label="t('close')"
              />
            </AddClientLabeledField>
            <p
              v-if="!yearError"
              class="add-client-form__allergy-year-hint">
              {{ startYearHint }}
            </p>
          </div>
          <div class="col-12">
            <AddClientSubsectionHeading
              icon="warning_amber"
              :title="t('allergySeverity')"
            />
            <div class="add-client-form__allergy-severity-grid">
              <q-btn
                v-for="opt in severityOptions"
                :key="opt.value"
                flat
                no-caps
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
            <div
              v-if="severityError"
              class="text-negative text-caption q-mt-xs">
              {{ severityError }}
            </div>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import ClientYearField from 'components/ClientYearField.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AddClientSubsectionHeading
  from 'components/AddClientSubsectionHeading.vue'
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

const startYearHint = computed(() =>
  t('allergyStartYearHint', {
    min: allergyMinStartYear(),
    max: allergyMaxStartYear(),
  }),
)

const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

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
        min: allergyMinStartYear(),
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

<style lang="scss" scoped>
.allergy-dialog {
  min-width: 520px;
  max-width: 720px;
  width: 100%;
}
</style>
