<template>
  <div class="add-client-vitals-tab">
    <AccordionSection
      v-model="section.recordExpanded"
      icon="monitor_heart"
      :title="recordSectionTitle"
      section-test-id="add-client-accordion-vitals-record"
      :toggle-test-id="tid.accordionToggle('vitals-record')">
      <div class="row q-col-gutter-md add-client-vitals-tab__vitals-grid">
        <div class="col-12 col-md-6 add-client-vitals-tab__col">
          <AddClientLabeledField
            :label="t('vitalsBloodPressure')"
            required>
            <div class="row q-col-gutter-sm items-start">
              <div class="col">
                <q-input
                  v-model="section.draft.systolic"
                  outlined
                  hide-bottom-space
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
                  v-model="section.draft.diastolic"
                  outlined
                  hide-bottom-space
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
              v-model="section.draft.temperature"
              outlined
              hide-bottom-space
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
              v-model="section.draft.oxygenSaturation"
              outlined
              hide-bottom-space
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
              v-model="section.draft.height"
              outlined
              hide-bottom-space
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
              v-model="section.draft.heartRate"
              outlined
              hide-bottom-space
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
              v-model="section.draft.respiratoryRate"
              outlined
              hide-bottom-space
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
              v-model="section.draft.weight"
              outlined
              hide-bottom-space
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
              :data-testid="tid.vitalsPainLevel(opt.modifier)"
              :class="[
                'allergy-severity-chip',
                `allergy-severity-chip--${opt.modifier}`,
                {
                  'allergy-severity-chip--selected':
                    section.draft.painLevel === opt.value,
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
    </AccordionSection>

    <q-separator class="section-separator" />

    <AccordionSection
      v-model="section.additionalInfoExpanded"
      icon="info_outline"
      :title="t('vitalsAdditionalInfoTitle')"
      section-test-id="add-client-accordion-vitals-additional"
      :toggle-test-id="tid.accordionToggle('vitals-additional')">
      <div class="row q-col-gutter-sm q-col-gutter-md">
        <div class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('vitalsDateTime')"
            required>
            <div
              class="row q-col-gutter-sm
                add-client-vitals-tab__datetime-row">
              <div class="col-6">
                <ClientDateField
                  v-model="section.draft.recordedDate"
                  class="add-client-vitals-tab__datetime-input"
                  :max-today="true"
                  :close-label="t('close')"
                  :test-id="tid.vitalsField('recordedDate')"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="section.draft.recordedTime"
                  outlined
                  hide-bottom-space
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
              v-model="section.draft.recordedBy"
              outlined
              hide-bottom-space
              emit-value
              map-options
              clearable
              class="full-width"
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
              v-model="section.draft.notes"
              outlined
              type="textarea"
              rows="4"
              class="full-width notes-field"
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
      <div class="row q-col-gutter-sm q-col-gutter-md">
        <div class="col-12 flex justify-end q-gutter-sm">
          <q-btn
            v-if="section.editingId"
            no-caps
            outline
            color="primary"
            :data-testid="tid.vitalsBtnCancelEdit"
            :label="t('cancel')"
            @click="cancelEdit"
          />
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :data-testid="tid.vitalsBtnSave"
            :icon="section.editingId ? 'save' : 'add'"
            :label="saveButtonLabel"
            @click="onSaveEntry"
          />
        </div>
      </div>
    </AccordionSection>

    <q-separator class="section-separator" />

    <AccordionSection
      v-model="section.historyExpanded"
      icon="history"
      :title="t('vitalsHistoryTitle')"
      section-test-id="add-client-accordion-vitals-history"
      :toggle-test-id="tid.accordionToggle('vitals-history')">
      <div class="fmh-list-card q-pa-md">
        <VitalsHistoryTable
          :entries="sortedEntries"
          :empty-label="t('vitalsHistoryEmpty')"
          :clinician-options="clinicianOptions"
          @edit="startEdit"
          @delete="openDelete"
        />
      </div>
    </AccordionSection>

    <ModalComponent
      v-model="deleteDialogOpen"
      test-id="vitals-delete"
      :title="t('vitalsDeleteTitle')"
      :message="t('vitalsDeleteMessage')"
      :confirm-text="t('remove')"
      :cancel-text="t('cancel')"
      @confirm="confirmDelete"
      @cancel="deleteDialogOpen = false"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import ClientDateField from 'components/ClientDateField.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormSelect from 'components/FormSelect.vue'
import AccordionSection from './AccordionSection.vue'
import VitalsHistoryTable from 'components/VitalsHistoryTable.vue'
import ModalComponent from 'components/ModalComponent.vue'
import {
  clientVitalsPainLevelValues,
  quasarNotifyTypes,
} from 'components/constants.js'
import {
  VITALS_LIMITS,
  calculateBmiFromUs,
  createEmptyVitalsDraft,
  draftFromVitalsEntry,
  formatBmiDisplay,
  formatTime12h,
  getVitalsDraftFieldErrorKeys,
  nextVitalsId,
  normalizeVitalsEntry,
  parseTime12h,
  sanitizeDecimalInput,
  sanitizeIntegerInput,
  sortVitalsEntriesDesc,
  validateVitalsDraft,
} from 'src/utils/client-vitals.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'
import { useValidationSaveFeedback } from
  'src/composables/useValidationSaveFeedback.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const $q = useQuasar()
const { notifyAndScrollToValidationErrors } = useValidationSaveFeedback()

const deleteDialogOpen = ref(false)
const deletingEntryId = ref(null)
const fieldErrors = ref({})

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

const section = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const sortedEntries = computed(() =>
  sortVitalsEntriesDesc(section.value.entries),
)

const bmiDisplay = computed(() =>
  formatBmiDisplay(
    calculateBmiFromUs(
      section.value.draft.weight,
      section.value.draft.height,
    ),
  ),
)

const recordSectionTitle = computed(() =>
  section.value.editingId
    ? t('vitalsEditSectionTitle')
    : t('vitalsRecordSectionTitle'),
)

const saveButtonLabel = computed(() =>
  section.value.editingId
    ? t('vitalsUpdate')
    : t('vitalsSave'),
)

const timePickerValue = computed({
  get: () => section.value.draft.recordedTime,
  set: val => {
    section.value.draft.recordedTime = val
  },
})

function painDotClass(modifier) {
  return [
    'allergy-severity-dot',
    `allergy-severity-dot--${modifier}`,
  ]
}

function selectPainLevel(value) {
  patchDraft({ painLevel: value })
}

function patchDraft(patch) {
  section.value = {
    ...section.value,
    draft: {
      ...section.value.draft,
      ...patch,
    },
  }
}

function onSystolicInput(val) {
  patchDraft({ systolic: sanitizeIntegerInput(val, 3) })
}

function onDiastolicInput(val) {
  patchDraft({ diastolic: sanitizeIntegerInput(val, 3) })
}

function onHeartRateInput(val) {
  patchDraft({ heartRate: sanitizeIntegerInput(val, 3) })
}

function onRespiratoryInput(val) {
  patchDraft({ respiratoryRate: sanitizeIntegerInput(val, 2) })
}

function onTemperatureInput(val) {
  patchDraft({ temperature: sanitizeDecimalInput(val) })
}

function onSpo2Input(val) {
  patchDraft({ oxygenSaturation: sanitizeIntegerInput(val, 3) })
}

function onWeightInput(val) {
  patchDraft({ weight: sanitizeDecimalInput(val) })
}

function onHeightInput(val) {
  patchDraft({ height: sanitizeDecimalInput(val) })
}

function normalizeRecordedTime() {
  const parsed = parseTime12h(section.value.draft.recordedTime)
  if (parsed) {
    const d = new Date()
    d.setHours(parsed.hours, parsed.minutes, 0, 0)
    patchDraft({ recordedTime: formatTime12h(d) })
  }
}

function onTimePickerChange(val) {
  patchDraft({ recordedTime: val })
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

function applyFieldErrors(errors) {
  fieldErrors.value = errors ?? {}
}

function applySaveValidation() {
  applyFieldErrors(getVitalsDraftFieldErrorKeys(section.value))
}

function clearSaveValidation() {
  applyFieldErrors({})
}

function resetDraft() {
  section.value = {
    ...section.value,
    draft: createEmptyVitalsDraft(),
    editingId: null,
  }
  clearSaveValidation()
}

async function onSaveEntry() {
  const result = validateVitalsDraft(section.value.draft)
  if (!result.ok) {
    applyFieldErrors(result.errors)
    await notifyAndScrollToValidationErrors(null)

    return
  }
  clearSaveValidation()
  const wasEdit = Boolean(section.value.editingId)
  const normalized = normalizeVitalsEntry(section.value.draft)
  const entries = [...section.value.entries]
  if (wasEdit) {
    const idx = entries.findIndex(
      e => e.id === section.value.editingId,
    )
    if (idx >= 0) {
      entries[idx] = {
        ...entries[idx],
        ...normalized,
      }
    }
  } else {
    entries.push({
      id: nextVitalsId(),
      ...normalized,
    })
  }
  section.value = {
    ...section.value,
    entries,
    editingId: null,
    draft: createEmptyVitalsDraft(),
  }
  $q.notify({
    type: quasarNotifyTypes.positive,
    message: wasEdit
      ? t('vitalsUpdatedSuccess')
      : t('vitalsSavedSuccess'),
    position: 'top',
  })
}

function startEdit(row) {
  section.value = {
    ...section.value,
    editingId: row.id,
    draft: draftFromVitalsEntry(row),
    recordExpanded: true,
  }
  clearSaveValidation()
}

function cancelEdit() {
  resetDraft()
}

function openDelete(row) {
  deletingEntryId.value = row.id
  deleteDialogOpen.value = true
}

function confirmDelete() {
  const id = deletingEntryId.value
  if (!id) {
    return
  }
  section.value = {
    ...section.value,
    entries: section.value.entries.filter(e => e.id !== id),
    editingId:
      section.value.editingId === id ? null : section.value.editingId,
  }
  if (section.value.editingId === id) {
    resetDraft()
  }
  deletingEntryId.value = null
  deleteDialogOpen.value = false
}

defineExpose({
  applySaveValidation,
  clearSaveValidation,
})
</script>
