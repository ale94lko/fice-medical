<template>
  <q-dialog
    v-model="open"
    persistent
    data-testid="add-client-vitals-record-dialog"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section
        ref="dialogBodyScrollRef"
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div class="row q-col-gutter-md add-client-vitals-tab__vitals-grid">
          <div class="col-12 col-md-6 add-client-vitals-tab__col">
            <AddClientLabeledField
              :label="t('vitalsBloodPressure')"
              required>
              <div class="row q-col-gutter-sm items-start">
                <div class="col">
                  <q-input
                    v-model="localDraft.systolic"
                    outlined
                    hide-bottom-space
                    :readonly="readonly"
                    :data-testid="tid.vitalsField('systolic')"
                    type="text"
                    inputmode="numeric"
                    :placeholder="t('vitalsSystolic')"
                    :error="Boolean(fieldErrors.systolic)"
                    :error-message="errorMessage('systolic')"
                    @update:model-value="onSystolicInput"
                  />
                </div>
                <div class="col-auto add-client-vitals-tab__bp-sep">/</div>
                <div class="col">
                  <q-input
                    v-model="localDraft.diastolic"
                    outlined
                    hide-bottom-space
                    :readonly="readonly"
                    :data-testid="tid.vitalsField('diastolic')"
                    type="text"
                    inputmode="numeric"
                    :placeholder="t('vitalsDiastolic')"
                    :error="Boolean(fieldErrors.diastolic)"
                    :error-message="errorMessage('diastolic')"
                    @update:model-value="onDiastolicInput"
                  />
                </div>
              </div>
            </AddClientLabeledField>
            <AddClientLabeledField
              :label="t('vitalsTemperature')"
              required
              spaced>
              <q-input
                v-model="localDraft.temperature"
                outlined
                hide-bottom-space
                :readonly="readonly"
                :data-testid="tid.vitalsField('temperature')"
                type="text"
                inputmode="decimal"
                :placeholder="t('vitalsUnitFahrenheit')"
                :error="Boolean(fieldErrors.temperature)"
                :error-message="errorMessage('temperature')"
                @update:model-value="onTemperatureInput"
              />
            </AddClientLabeledField>
            <AddClientLabeledField
              :label="t('vitalsOxygenSaturation')"
              spaced>
              <q-input
                v-model="localDraft.oxygenSaturation"
                outlined
                hide-bottom-space
                :readonly="readonly"
                :data-testid="tid.vitalsField('oxygenSaturation')"
                type="text"
                inputmode="numeric"
                :placeholder="t('vitalsUnitPercent')"
                :error="Boolean(fieldErrors.oxygenSaturation)"
                :error-message="errorMessage('oxygenSaturation')"
                @update:model-value="onSpo2Input"
              />
            </AddClientLabeledField>
            <AddClientLabeledField :label="t('vitalsHeight')" spaced>
              <q-input
                v-model="localDraft.height"
                outlined
                hide-bottom-space
                :readonly="readonly"
                :data-testid="tid.vitalsField('height')"
                type="text"
                inputmode="decimal"
                :placeholder="t('vitalsUnitInches')"
                :error="Boolean(fieldErrors.height)"
                :error-message="errorMessage('height')"
                @update:model-value="onHeightInput"
              />
            </AddClientLabeledField>
          </div>

          <div class="col-12 col-md-6 add-client-vitals-tab__col">
            <AddClientLabeledField :label="t('vitalsHeartRate')" required>
              <q-input
                v-model="localDraft.heartRate"
                outlined
                hide-bottom-space
                :readonly="readonly"
                :data-testid="tid.vitalsField('heartRate')"
                type="text"
                inputmode="numeric"
                :placeholder="t('vitalsUnitBpm')"
                :error="Boolean(fieldErrors.heartRate)"
                :error-message="errorMessage('heartRate')"
                @update:model-value="onHeartRateInput"
              />
            </AddClientLabeledField>
            <AddClientLabeledField :label="t('vitalsRespiratoryRate')" spaced>
              <q-input
                v-model="localDraft.respiratoryRate"
                outlined
                hide-bottom-space
                :readonly="readonly"
                :data-testid="tid.vitalsField('respiratoryRate')"
                type="text"
                inputmode="numeric"
                :placeholder="t('vitalsUnitBrMin')"
                :error="Boolean(fieldErrors.respiratoryRate)"
                :error-message="errorMessage('respiratoryRate')"
                @update:model-value="onRespiratoryInput"
              />
            </AddClientLabeledField>
            <AddClientLabeledField :label="t('vitalsWeight')" spaced>
              <q-input
                v-model="localDraft.weight"
                outlined
                hide-bottom-space
                :readonly="readonly"
                :data-testid="tid.vitalsField('weight')"
                type="text"
                inputmode="decimal"
                :placeholder="t('vitalsUnitLbs')"
                :error="Boolean(fieldErrors.weight)"
                :error-message="errorMessage('weight')"
                @update:model-value="onWeightInput"
              />
            </AddClientLabeledField>
            <AddClientLabeledField :label="t('vitalsBmi')" spaced>
              <q-input
                :model-value="bmiDisplay"
                outlined
                readonly
                hide-bottom-space
                :data-testid="tid.vitalsField('bmi')"
                :placeholder="t('vitalsUnitBmi')"
                class="add-client-vitals-tab__bmi-field"
              />
              <template #hint>
                {{ t('vitalsBmiHint') }}
              </template>
            </AddClientLabeledField>
          </div>
        </div>

        <div class="add-client-vitals-tab__pain-level q-mt-md">
          <AddClientLabeledField
            :label="t('vitalsPainLevel')"
            :test-id="tid.vitalsField('painLevel')">
            <div class="allergy-severity-grid">
              <q-btn
                v-for="opt in painOptions"
                :key="opt.value"
                flat
                no-caps
                :disable="readonly"
                :data-testid="tid.vitalsPainLevel(opt.modifier)"
                :class="[
                  'allergy-severity-chip',
                  `allergy-severity-chip--${opt.modifier}`,
                  {
                    'allergy-severity-chip--selected':
                      localDraft.painLevel === opt.value,
                  },
                ]"
                @click="selectPainLevel(opt.value)">
                <span :class="painDotClass(opt.modifier)" />
                <span class="allergy-severity-label">
                  {{ opt.label }}
                </span>
              </q-btn>
            </div>
          </AddClientLabeledField>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="info_outline"
            :title="t('vitalsAdditionalInfoTitle')"
          />
          <div class="row q-col-gutter-sm q-col-gutter-md q-mt-sm">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('vitalsDateTime')"
                required>
                <div
                  class="row q-col-gutter-sm
                    add-client-vitals-tab__datetime-row">
                  <div class="col-6">
                    <ClientDateField
                      v-model="localDraft.recordedDate"
                      class="add-client-vitals-tab__datetime-input"
                      :max-today="true"
                      :readonly="readonly"
                      :close-label="t('close')"
                      :test-id="tid.vitalsField('recordedDate')"
                    />
                  </div>
                  <div class="col-6">
                    <q-input
                      v-model="localDraft.recordedTime"
                      outlined
                      hide-bottom-space
                      :readonly="readonly"
                      class="add-client-vitals-tab__datetime-input"
                      :data-testid="tid.vitalsField('recordedTime')"
                      :placeholder="t('vitalsTimePlaceholder')"
                      :error="Boolean(fieldErrors.recordedTime)"
                      :error-message="errorMessage('recordedTime')"
                      @blur="normalizeRecordedTime"
                    >
                      <template #append>
                        <q-icon
                          name="schedule"
                          color="primary"
                          class="cursor-pointer">
                          <q-popup-proxy
                            cover
                            transition-show="scale"
                            transition-hide="scale">
                            <q-time
                              v-model="timePickerValue"
                              mask="h:mm A"
                              format12h
                              @update:model-value="onTimePickerChange">
                              <div class="row items-center justify-end">
                                <q-btn
                                  v-close-popup
                                  no-caps
                                  flat
                                  color="primary"
                                  :label="t('close')"
                                />
                              </div>
                            </q-time>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                </div>
                <div
                  v-if="fieldErrors.recordedDate"
                  class="form-field__error">
                  {{ errorMessage('recordedDate') }}
                </div>
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField :label="t('vitalsRecordedBy')" required>
                <FormSelect
                  v-model="localDraft.recordedBy"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  clearable
                  class="full-width"
                  :readonly="readonly"
                  :options="clinicianOptions"
                  :test-id="tid.vitalsField('recordedBy')"
                  :placeholder="t('vitalsSelectClinician')"
                  :error="Boolean(fieldErrors.recordedBy)"
                  :error-message="errorMessage('recordedBy')"
                />
              </AddClientLabeledField>
            </div>
          </div>
          <div class="row q-col-gutter-sm q-col-gutter-md">
            <div class="col-12">
              <AddClientLabeledField :label="t('vitalsNotes')" spaced>
                <q-input
                  v-model="localDraft.notes"
                  outlined
                  type="textarea"
                  rows="4"
                  class="full-width notes-field"
                  :readonly="readonly"
                  :data-testid="tid.vitalsField('notes')"
                  :placeholder="t('vitalsNotesPlaceholder')"
                  :maxlength="500"
                  counter
                  :error="Boolean(fieldErrors.notes)"
                  :error-message="errorMessage('notes')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="tid.vitalsBtnCancelEdit"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :data-testid="tid.vitalsBtnSave"
          :icon="editMode ? 'save' : 'add'"
          :label="saveButtonLabel"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import ClientDateField from 'components/ClientDateField.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormSelect from 'components/FormSelect.vue'
import { clientVitalsPainLevelValues } from 'components/constants.js'
import {
  VITALS_LIMITS,
  calculateBmiFromUs,
  createEmptyVitalsDraft,
  draftFromVitalsEntry,
  formatBmiDisplay,
  formatTime12h,
  parseTime12h,
  sanitizeDecimalInput,
  sanitizeIntegerInput,
  validateVitalsDraft,
} from 'src/utils/client-vitals.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'
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
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

const { t } = useI18n()
const { notifyAndScrollToValidationErrors } = useValidationSaveFeedback()

const localDraft = ref(createEmptyVitalsDraft())
const fieldErrors = ref({})
const dialogBodyScrollRef = ref(null)

const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const editMode = computed(() => Boolean(props.entry?.id))

const dialogTitle = computed(() =>
  editMode.value
    ? t('vitalsEditSectionTitle')
    : t('vitalsRecordSectionTitle'),
)

const saveButtonLabel = computed(() =>
  editMode.value
    ? t('vitalsUpdate')
    : t('vitalsSave'),
)

const painOptions = computed(() => [
  {
    value: clientVitalsPainLevelValues.mild,
    label: t('vitalsPainMild'),
    modifier: 'mild',
  },
  {
    value: clientVitalsPainLevelValues.moderate,
    label: t('vitalsPainModerate'),
    modifier: 'moderate',
  },
  {
    value: clientVitalsPainLevelValues.severe,
    label: t('vitalsPainSevere'),
    modifier: 'severe',
  },
])

const bmiDisplay = computed(() =>
  formatBmiDisplay(
    calculateBmiFromUs(
      localDraft.value.weight,
      localDraft.value.height,
    ),
  ),
)

const timePickerValue = computed({
  get: () => localDraft.value.recordedTime,
  set: val => {
    localDraft.value.recordedTime = val
  },
})

watch(
  () => [props.modelValue, props.entry],
  ([isOpen]) => {
    if (!isOpen) {
      return
    }
    localDraft.value = props.entry
      ? draftFromVitalsEntry(props.entry)
      : createEmptyVitalsDraft()
    fieldErrors.value = {}
  },
  { immediate: true },
)

function painDotClass(modifier) {
  return [
    'allergy-severity-dot',
    `allergy-severity-dot--${modifier}`,
  ]
}

function selectPainLevel(value) {
  if (props.readonly) {
    return
  }
  localDraft.value = {
    ...localDraft.value,
    painLevel: value,
  }
}

function onSystolicInput(val) {
  localDraft.value.systolic = sanitizeIntegerInput(val, 3)
}

function onDiastolicInput(val) {
  localDraft.value.diastolic = sanitizeIntegerInput(val, 3)
}

function onHeartRateInput(val) {
  localDraft.value.heartRate = sanitizeIntegerInput(val, 3)
}

function onRespiratoryInput(val) {
  localDraft.value.respiratoryRate = sanitizeIntegerInput(val, 2)
}

function onTemperatureInput(val) {
  localDraft.value.temperature = sanitizeDecimalInput(val)
}

function onSpo2Input(val) {
  localDraft.value.oxygenSaturation = sanitizeIntegerInput(val, 3)
}

function onWeightInput(val) {
  localDraft.value.weight = sanitizeDecimalInput(val)
}

function onHeightInput(val) {
  localDraft.value.height = sanitizeDecimalInput(val)
}

function normalizeRecordedTime() {
  const parsed = parseTime12h(localDraft.value.recordedTime)
  if (parsed) {
    const d = new Date()
    d.setHours(parsed.hours, parsed.minutes, 0, 0)
    localDraft.value.recordedTime = formatTime12h(d)
  }
}

function onTimePickerChange(val) {
  localDraft.value.recordedTime = val
}

function errorMessage(field) {
  const code = fieldErrors.value[field]
  if (!code) {
    return ''
  }
  const limits = VITALS_LIMITS[field] ?? {}

  const keyMap = {
    required: 'vitalsFieldRequired',
    invalid: 'vitalsFieldInvalid',
    positive: 'vitalsFieldPositive',
    range: 'vitalsFieldRange',
    future: 'vitalsDateFuture',
    max: 'vitalsNotesMax',
  }
  const key = keyMap[code] ?? 'vitalsFieldInvalid'

  return t(key, {
    min: limits.min,
    max: limits.max,
    maxLen: VITALS_LIMITS.notesMaxLength,
  })
}

function onCancel() {
  open.value = false
  fieldErrors.value = {}
  localDraft.value = createEmptyVitalsDraft()
}

async function onSave() {
  const result = validateVitalsDraft(localDraft.value)
  if (!result.ok) {
    fieldErrors.value = result.errors
    await notifyAndScrollToValidationErrors(dialogBodyScrollRef)

    return
  }
  fieldErrors.value = {}
  emit('save', {
    id: props.entry?.id ?? null,
    draft: { ...localDraft.value },
  })
  open.value = false
  localDraft.value = createEmptyVitalsDraft()
}
</script>
