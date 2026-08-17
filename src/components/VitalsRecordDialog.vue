<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="tid.vitalsRecordDialog"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        :test-id="tid.vitalsRecordDialog"
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
              <div class="row q-col-gutter-sm items-center
                add-client-vitals-tab__value-row">
                <div class="col add-client-vitals-tab__value">
                  <div class="row q-col-gutter-sm items-start
                    add-client-vitals-tab__bp-fields">
                    <div class="col">
                      <q-input
                        v-model="localDraft.systolic"
                        outlined
                        hide-bottom-space
                        :readonly="readonly"
                        :data-testid="tid.vitalsField('systolic')"
                        type="text"
                        inputmode="numeric"
                        :placeholder="systolicPlaceholder"
                        :error="Boolean(fieldErrors.systolic)"
                        :error-message="errorMessage('systolic')"
                        @keypress="onSystolicKeypress"
                        @update:model-value="onSystolicInput"
                      />
                    </div>
                    <div class="col-auto add-client-vitals-tab__bp-sep">
                      /
                    </div>
                    <div class="col">
                      <q-input
                        v-model="localDraft.diastolic"
                        outlined
                        hide-bottom-space
                        :readonly="readonly"
                        :data-testid="tid.vitalsField('diastolic')"
                        type="text"
                        inputmode="numeric"
                        :placeholder="diastolicPlaceholder"
                        :error="Boolean(fieldErrors.diastolic)"
                        :error-message="errorMessage('diastolic')"
                        @keypress="onDiastolicKeypress"
                        @update:model-value="onDiastolicInput"
                      />
                    </div>
                  </div>
                </div>
                <div class="col-auto add-client-vitals-tab__level">
                  <span
                    class="add-client-vitals-tab__level-badge"
                    :class="`add-client-vitals-tab__level-badge--${
                      bloodPressureLevel.modifier
                    }`"
                    :data-testid="tid.vitalsField('bloodPressureLevel')">
                    {{ bloodPressureLevelLabel }}
                  </span>
                </div>
              </div>
            </AddClientLabeledField>
            <AddClientLabeledField
              :label="t('vitalsTemperature')"
              required
              spaced>
              <div class="row q-col-gutter-sm items-center
                add-client-vitals-tab__value-row">
                <div class="col add-client-vitals-tab__value">
                  <q-input
                    v-model="localDraft.temperature"
                    outlined
                    hide-bottom-space
                    :readonly="readonly"
                    :data-testid="tid.vitalsField('temperature')"
                    type="text"
                    inputmode="decimal"
                    :error="Boolean(fieldErrors.temperature)"
                    :error-message="errorMessage('temperature')"
                    @keypress="onTemperatureKeypress"
                    @update:model-value="onTemperatureInput">
                    <template #append>
                      <span class="add-client-vitals-tab__unit">
                        {{ t('vitalsUnitFahrenheit') }}
                      </span>
                    </template>
                  </q-input>
                </div>
                <div class="col-auto add-client-vitals-tab__level">
                  <span
                    class="add-client-vitals-tab__level-badge"
                    :class="`add-client-vitals-tab__level-badge--${
                      temperatureLevel.modifier
                    }`"
                    :data-testid="tid.vitalsField('temperatureLevel')">
                    {{ temperatureLevelLabel }}
                  </span>
                </div>
              </div>
            </AddClientLabeledField>
            <AddClientLabeledField
              :label="t('vitalsOxygenSaturation')"
              spaced>
              <div class="row q-col-gutter-sm items-center
                add-client-vitals-tab__value-row">
                <div class="col add-client-vitals-tab__value">
                  <q-input
                    v-model="localDraft.oxygenSaturation"
                    outlined
                    hide-bottom-space
                    :readonly="readonly"
                    :data-testid="tid.vitalsField('oxygenSaturation')"
                    type="text"
                    inputmode="numeric"
                    :error="Boolean(fieldErrors.oxygenSaturation)"
                    :error-message="errorMessage('oxygenSaturation')"
                    @keypress="onSpo2Keypress"
                    @update:model-value="onSpo2Input">
                    <template #append>
                      <span class="add-client-vitals-tab__unit">
                        {{ t('vitalsUnitPercent') }}
                      </span>
                    </template>
                  </q-input>
                </div>
                <div class="col-auto add-client-vitals-tab__level">
                  <span
                    class="add-client-vitals-tab__level-badge"
                    :class="`add-client-vitals-tab__level-badge--${
                      spo2Level.modifier
                    }`"
                    :data-testid="tid.vitalsField('oxygenSaturationLevel')">
                    {{ spo2LevelLabel }}
                  </span>
                </div>
              </div>
            </AddClientLabeledField>
            <AddClientLabeledField :label="t('vitalsHeight')" spaced>
              <div class="row q-col-gutter-sm items-start">
                <div class="col">
                  <q-input
                    v-model="localDraft.heightFeet"
                    outlined
                    hide-bottom-space
                    :readonly="readonly"
                    :data-testid="tid.vitalsField('heightFeet')"
                    type="text"
                    inputmode="numeric"
                    :error="Boolean(fieldErrors.height)"
                    :error-message="errorMessage('height')"
                    @keypress="onIntegerKeypress"
                    @update:model-value="onHeightFeetInput">
                    <template #append>
                      <span class="add-client-vitals-tab__unit">
                        {{ t('vitalsUnitFeet') }}
                      </span>
                    </template>
                  </q-input>
                </div>
                <div class="col">
                  <q-input
                    v-model="localDraft.heightInches"
                    outlined
                    hide-bottom-space
                    :readonly="readonly"
                    :data-testid="tid.vitalsField('heightInches')"
                    type="text"
                    inputmode="numeric"
                    :error="Boolean(fieldErrors.height)"
                    @keypress="onIntegerKeypress"
                    @update:model-value="onHeightInchesInput">
                    <template #append>
                      <span class="add-client-vitals-tab__unit">
                        {{ t('vitalsUnitInches') }}
                      </span>
                    </template>
                  </q-input>
                </div>
              </div>
            </AddClientLabeledField>
          </div>

          <div class="col-12 col-md-6 add-client-vitals-tab__col">
            <AddClientLabeledField :label="t('vitalsHeartRate')" required>
              <div class="row q-col-gutter-sm items-center
                add-client-vitals-tab__value-row">
                <div class="col add-client-vitals-tab__value">
                  <q-input
                    v-model="localDraft.heartRate"
                    outlined
                    hide-bottom-space
                    :readonly="readonly"
                    :data-testid="tid.vitalsField('heartRate')"
                    type="text"
                    inputmode="numeric"
                    :error="Boolean(fieldErrors.heartRate)"
                    :error-message="errorMessage('heartRate')"
                    @keypress="onHeartRateKeypress"
                    @update:model-value="onHeartRateInput">
                    <template #append>
                      <span class="add-client-vitals-tab__unit">
                        {{ t('vitalsUnitBpm') }}
                      </span>
                    </template>
                  </q-input>
                </div>
                <div class="col-auto add-client-vitals-tab__level">
                  <span
                    class="add-client-vitals-tab__level-badge"
                    :class="`add-client-vitals-tab__level-badge--${
                      heartRateLevel.modifier
                    }`"
                    :data-testid="tid.vitalsField('heartRateLevel')">
                    {{ heartRateLevelLabel }}
                  </span>
                </div>
              </div>
            </AddClientLabeledField>
            <AddClientLabeledField :label="t('vitalsRespiratoryRate')" spaced>
              <div class="row q-col-gutter-sm items-center
                add-client-vitals-tab__value-row">
                <div class="col add-client-vitals-tab__value">
                  <q-input
                    v-model="localDraft.respiratoryRate"
                    outlined
                    hide-bottom-space
                    :readonly="readonly"
                    :data-testid="tid.vitalsField('respiratoryRate')"
                    type="text"
                    inputmode="numeric"
                    :error="Boolean(fieldErrors.respiratoryRate)"
                    :error-message="errorMessage('respiratoryRate')"
                    @keypress="onRespiratoryKeypress"
                    @update:model-value="onRespiratoryInput">
                    <template #append>
                      <span class="add-client-vitals-tab__unit">
                        {{ t('vitalsUnitBrMin') }}
                      </span>
                    </template>
                  </q-input>
                </div>
                <div class="col-auto add-client-vitals-tab__level">
                  <span
                    class="add-client-vitals-tab__level-badge"
                    :class="`add-client-vitals-tab__level-badge--${
                      respiratoryRateLevel.modifier
                    }`"
                    :data-testid="
                      tid.vitalsField('respiratoryRateLevel')
                    ">
                    {{ respiratoryRateLevelLabel }}
                  </span>
                </div>
              </div>
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
                :error="Boolean(fieldErrors.weight)"
                :error-message="errorMessage('weight')"
                @keypress="onDecimalKeypress"
                @update:model-value="onWeightInput">
                <template #append>
                  <span class="add-client-vitals-tab__unit">
                    {{ t('vitalsUnitLbs') }}
                  </span>
                </template>
              </q-input>
            </AddClientLabeledField>
            <AddClientLabeledField :label="t('vitalsBmi')" spaced>
              <div class="row q-col-gutter-sm items-center
                add-client-vitals-tab__value-row">
                <div class="col add-client-vitals-tab__value">
                  <q-input
                    :model-value="bmiDisplay"
                    outlined
                    readonly
                    hide-bottom-space
                    :data-testid="tid.vitalsField('bmi')"
                    class="add-client-vitals-tab__bmi-field">
                    <template #append>
                      <span class="add-client-vitals-tab__unit">
                        {{ t('vitalsUnitBmi') }}
                      </span>
                    </template>
                  </q-input>
                </div>
                <div class="col-auto add-client-vitals-tab__level">
                  <span
                    class="add-client-vitals-tab__level-badge"
                    :class="`add-client-vitals-tab__level-badge--${
                      bmiLevel.modifier
                    }`"
                    :data-testid="tid.vitalsField('bmiLevel')">
                    {{ bmiLevelLabel }}
                  </span>
                </div>
              </div>
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
                                  :data-testid="tid.vitalsBtnTimePickerClose"
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
                <ClinicianFormSelect
                  v-model="localDraft.recordedBy"
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
          :disable="saving"
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
          :disable="saving"
          :loading="saving"
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
import ClinicianFormSelect from 'components/ClinicianFormSelect.vue'
import { clientVitalsPainLevelValues } from 'components/constants.js'
import {
  calculateBmiFromUs,
  formatBmiDisplay,
  resolveBmiClassification,
} from 'src/utils/bmi-us.js'
import {
  VITALS_LIMITS,
  createEmptyVitalsDraft,
  draftFromVitalsEntry,
  draftHeightToInches,
  formatHeightFtIn,
  formatTime12h,
  parseTime12h,
  resolveBloodPressureLevel,
  resolveHeartRateLevel,
  resolveOxygenSaturationLevel,
  resolvePatientAgeContextForVitals,
  resolveRespiratoryRateLevel,
  resolveTemperatureLevel,
  sanitizeBpDiastolicInput,
  sanitizeBpSystolicInput,
  sanitizeDecimalInput,
  sanitizeHeartRateInput,
  sanitizeIntegerInput,
  sanitizeOxygenSaturationInput,
  sanitizeRespiratoryRateInput,
  sanitizeTemperatureInput,
  validateVitalsDraft,
  wouldBpAcceptDigit,
  wouldOxygenSaturationAcceptDigit,
  wouldTemperatureAcceptChar,
  getDiastolicInputMax,
} from 'src/utils/client-vitals.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'
import { useValidationSaveFeedback } from
  'src/composables/useValidationSaveFeedback.js'
import { useViewportLayout } from 'src/composables/useViewportLayout.js'
import { resolveDefaultResponsibleClinicianOption } from
  'src/utils/care-plan-orders.js'
import { useAuthStore } from 'src/stores/auth-store.js'

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
  patientGender: {
    type: String,
    default: '',
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

const { t } = useI18n()
const { isMobile } = useViewportLayout()
const authStore = useAuthStore()
const { notifyAndScrollToValidationErrors } = useValidationSaveFeedback()

const systolicPlaceholder = computed(() => (
  isMobile.value ? t('vitalsSystolicShort') : t('vitalsSystolic')
))
const diastolicPlaceholder = computed(() => (
  isMobile.value ? t('vitalsDiastolicShort') : t('vitalsDiastolic')
))

const localDraft = ref(createEmptyVitalsDraft())
const fieldErrors = ref({})
const dialogBodyScrollRef = ref(null)

const open = computed({
  get: () => props.modelValue,
  set: val => {
    if (!val && props.saving) {
      return
    }
    emit('update:modelValue', val)
  },
})

const editMode = computed(() => Boolean(props.entry?.id))

function applyDefaultRecordedBy() {
  if (editMode.value || localDraft.value.recordedBy) {
    return
  }
  const option = resolveDefaultResponsibleClinicianOption(
    props.clinicianOptions,
    { staffMember: authStore.userInfo?.staffMember ?? null },
  )
  if (!option) {
    return
  }
  localDraft.value.recordedBy = option.value
}

watch(
  () => [props.modelValue, props.entry],
  ([isOpen]) => {
    if (!isOpen) {
      return
    }
    localDraft.value = props.entry
      ? draftFromVitalsEntry(props.entry)
      : createEmptyVitalsDraft()
    applyDefaultRecordedBy()
    fieldErrors.value = {}
  },
  { immediate: true },
)

watch(
  () => props.clinicianOptions,
  () => {
    if (!open.value) {
      return
    }
    applyDefaultRecordedBy()
  },
)

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

const bmiValue = computed(() =>
  calculateBmiFromUs(
    localDraft.value.weight,
    draftHeightToInches(localDraft.value),
  ),
)

const bmiDisplay = computed(() => formatBmiDisplay(bmiValue.value))

const patientAgeContext = computed(() =>
  resolvePatientAgeContextForVitals({
    dobUs: props.patientDob,
    age: props.patientAge,
    ageUnit: props.patientAgeUnit,
    asOfDateUs: localDraft.value.recordedDate,
  }),
)

const bmiLevel = computed(() =>
  resolveBmiClassification({
    bmi: bmiValue.value,
    ageContext: patientAgeContext.value,
    sex: props.patientGender,
  }) ?? { modifier: 'empty', labelKey: null },
)

const bmiLevelLabel = computed(() => {
  const key = bmiLevel.value?.labelKey
  return key ? t(key) : ''
})

const spo2Level = computed(() =>
  resolveOxygenSaturationLevel(localDraft.value.oxygenSaturation)
  ?? { modifier: 'empty', labelKey: null },
)

const spo2LevelLabel = computed(() => {
  const key = spo2Level.value?.labelKey
  return key ? t(key) : ''
})

const temperatureLevel = computed(() =>
  resolveTemperatureLevel(localDraft.value.temperature)
  ?? { modifier: 'empty', labelKey: null },
)

const temperatureLevelLabel = computed(() => {
  const key = temperatureLevel.value?.labelKey
  return key ? t(key) : ''
})

const bloodPressureLevel = computed(() =>
  resolveBloodPressureLevel(
    localDraft.value.systolic,
    localDraft.value.diastolic,
  ) ?? { modifier: 'empty', labelKey: null },
)

const bloodPressureLevelLabel = computed(() => {
  const key = bloodPressureLevel.value?.labelKey
  return key ? t(key) : ''
})

const heartRateLevel = computed(() =>
  resolveHeartRateLevel(
    localDraft.value.heartRate,
    patientAgeContext.value,
  ) ?? { modifier: 'empty', labelKey: null },
)

const heartRateLevelLabel = computed(() => {
  const key = heartRateLevel.value?.labelKey
  return key ? t(key) : ''
})

const respiratoryRateLevel = computed(() =>
  resolveRespiratoryRateLevel(
    localDraft.value.respiratoryRate,
    patientAgeContext.value,
  ) ?? { modifier: 'empty', labelKey: null },
)

const respiratoryRateLevelLabel = computed(() => {
  const key = respiratoryRateLevel.value?.labelKey
  return key ? t(key) : ''
})

const timePickerValue = computed({
  get: () => localDraft.value.recordedTime,
  set: val => {
    localDraft.value.recordedTime = val
  },
})

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

function isModifierKeypress(event) {
  return event.ctrlKey || event.metaKey || event.altKey
}

function onIntegerKeypress(event) {
  if (isModifierKeypress(event) || event.key.length !== 1) {
    return
  }
  if (!/\d/.test(event.key)) {
    event.preventDefault()
  }
}

function onDecimalKeypress(event) {
  if (isModifierKeypress(event) || event.key.length !== 1) {
    return
  }
  if (!/[\d.]/.test(event.key)) {
    event.preventDefault()
  }
}

function onSystolicKeypress(event) {
  if (isModifierKeypress(event) || event.key.length !== 1) {
    return
  }
  if (!/\d/.test(event.key)) {
    event.preventDefault()

    return
  }
  const el = event.target
  const accepted = wouldBpAcceptDigit(
    localDraft.value.systolic,
    event.key,
    {
      start: el?.selectionStart ?? 0,
      end: el?.selectionEnd ?? 0,
    },
    VITALS_LIMITS.systolic.max,
  )
  if (!accepted) {
    event.preventDefault()
  }
}

function onDiastolicKeypress(event) {
  if (isModifierKeypress(event) || event.key.length !== 1) {
    return
  }
  if (!/\d/.test(event.key)) {
    event.preventDefault()

    return
  }
  const el = event.target
  const accepted = wouldBpAcceptDigit(
    localDraft.value.diastolic,
    event.key,
    {
      start: el?.selectionStart ?? 0,
      end: el?.selectionEnd ?? 0,
    },
    getDiastolicInputMax(localDraft.value.systolic),
  )
  if (!accepted) {
    event.preventDefault()
  }
}

function onSystolicInput(val) {
  localDraft.value.systolic = sanitizeBpSystolicInput(val)
  const sysStr = localDraft.value.systolic
  const diaStr = localDraft.value.diastolic
  if (!sysStr || !diaStr) {
    return
  }
  const sys = Number(sysStr)
  const dia = Number(diaStr)
  if (Number.isFinite(sys) && Number.isFinite(dia) && dia >= sys) {
    localDraft.value.diastolic = ''

    return
  }
  localDraft.value.diastolic = sanitizeBpDiastolicInput(diaStr, sysStr)
}

function onDiastolicInput(val) {
  localDraft.value.diastolic = sanitizeBpDiastolicInput(
    val,
    localDraft.value.systolic,
  )
}

function onHeartRateKeypress(event) {
  if (isModifierKeypress(event) || event.key.length !== 1) {
    return
  }
  if (!/\d/.test(event.key)) {
    event.preventDefault()

    return
  }
  const el = event.target
  const accepted = wouldBpAcceptDigit(
    localDraft.value.heartRate,
    event.key,
    {
      start: el?.selectionStart ?? 0,
      end: el?.selectionEnd ?? 0,
    },
    VITALS_LIMITS.heartRate.max,
  )
  if (!accepted) {
    event.preventDefault()
  }
}

function onHeartRateInput(val) {
  localDraft.value.heartRate = sanitizeHeartRateInput(val)
}

function onRespiratoryKeypress(event) {
  if (isModifierKeypress(event) || event.key.length !== 1) {
    return
  }
  if (!/\d/.test(event.key)) {
    event.preventDefault()

    return
  }
  const el = event.target
  const accepted = wouldBpAcceptDigit(
    localDraft.value.respiratoryRate,
    event.key,
    {
      start: el?.selectionStart ?? 0,
      end: el?.selectionEnd ?? 0,
    },
    VITALS_LIMITS.respiratoryRate.max,
  )
  if (!accepted) {
    event.preventDefault()
  }
}

function onRespiratoryInput(val) {
  localDraft.value.respiratoryRate = sanitizeRespiratoryRateInput(val)
}

function onTemperatureKeypress(event) {
  if (isModifierKeypress(event) || event.key.length !== 1) {
    return
  }
  if (!/^[\d.]$/.test(event.key)) {
    event.preventDefault()

    return
  }
  const el = event.target
  const accepted = wouldTemperatureAcceptChar(
    localDraft.value.temperature,
    event.key,
    {
      start: el?.selectionStart ?? 0,
      end: el?.selectionEnd ?? 0,
    },
  )
  if (!accepted) {
    event.preventDefault()
  }
}

function onTemperatureInput(val) {
  localDraft.value.temperature = sanitizeTemperatureInput(val)
}

function onSpo2Keypress(event) {
  if (isModifierKeypress(event) || event.key.length !== 1) {
    return
  }
  if (!/\d/.test(event.key)) {
    event.preventDefault()

    return
  }
  const el = event.target
  const accepted = wouldOxygenSaturationAcceptDigit(
    localDraft.value.oxygenSaturation,
    event.key,
    {
      start: el?.selectionStart ?? 0,
      end: el?.selectionEnd ?? 0,
    },
  )
  if (!accepted) {
    event.preventDefault()
  }
}

function onSpo2Input(val) {
  localDraft.value.oxygenSaturation = sanitizeOxygenSaturationInput(val)
}

function onWeightInput(val) {
  localDraft.value.weight = sanitizeDecimalInput(val)
}

function onHeightFeetInput(val) {
  localDraft.value.heightFeet = sanitizeIntegerInput(val, 2)
}

function onHeightInchesInput(val) {
  localDraft.value.heightInches = sanitizeIntegerInput(val, 2)
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
    order: 'vitalsBpDiastolicBelowSystolic',
    future: 'vitalsDateFuture',
    max: 'vitalsNotesMax',
  }
  const key = keyMap[code] ?? 'vitalsFieldInvalid'

  if (field === 'height' && code === 'range') {
    return t(key, {
      min: formatHeightFtIn(VITALS_LIMITS.height.min),
      max: formatHeightFtIn(VITALS_LIMITS.height.max),
    })
  }

  return t(key, {
    min: limits.min,
    max: limits.max,
    maxLen: VITALS_LIMITS.notesMaxLength,
  })
}

function onCancel() {
  if (props.saving) {
    return
  }
  open.value = false
  fieldErrors.value = {}
  localDraft.value = createEmptyVitalsDraft()
}

async function onSave() {
  if (props.saving) {
    return
  }
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
}
</script>
