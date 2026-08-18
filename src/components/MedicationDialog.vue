<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        :info="dialogSubtitle"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section
        ref="dialogBodyScrollRef"
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div class="insurance-dialog__card-section">
          <SubsectionHeading
            icon="medication"
            :title="t('medicationSectionInfo')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('medicationFieldMedication')"
                required
                :test-id="tid.field('medication')">
                <q-select
                  :model-value="local.medicationId"
                  outlined
                  hide-bottom-space
                  use-input
                  fill-input
                  hide-selected
                  hide-dropdown-icon
                  clearable
                  input-debounce="300"
                  emit-value
                  map-options
                  popup-content-class="medication-dialog__medication-menu"
                  :readonly="readonly"
                  :loading="medicationSearchLoading"
                  :options="medicationOptions"
                  :placeholder="t('medicationMedicationPlaceholder')"
                  :error="Boolean(errors.medicationId)"
                  :error-message="errors.medicationId"
                  :data-testid="tid.field('medication')"
                  @filter="onMedicationFilter"
                  @update:model-value="onMedicationSelected">
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section>
                        <q-item-label
                          class="medication-dialog__option-title">
                          {{ scope.opt.title || scope.opt.label }}
                        </q-item-label>
                        <q-item-label
                          v-if="scope.opt.detail"
                          caption
                          class="medication-dialog__option-detail">
                          {{ scope.opt.detail }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey-7">
                        {{ t('medicationSearchEmpty') }}
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </AddClientLabeledField>
              <FormFieldHint v-if="!errors.medicationId">
                {{ t('medicationMedicationHint') }}
              </FormFieldHint>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('medicationGenericName')"
                :test-id="tid.field('generic-name')">
                <q-input
                  :model-value="local.medicationGenericName"
                  outlined
                  hide-bottom-space
                  readonly
                  :data-testid="tid.field('generic-name')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('medicationDosage')"
                required
                :test-id="tid.field('dosage')">
                <q-input
                  v-model="local.dosage"
                  outlined
                  hide-bottom-space
                  type="number"
                  :readonly="readonly"
                  :placeholder="t('medicationDosagePlaceholder')"
                  :error="Boolean(errors.dosage)"
                  :error-message="errors.dosage"
                  :data-testid="tid.field('dosage')">
                  <template #append>
                    <q-icon
                      name="info_outline"
                      size="20px"
                      class="cursor-pointer text-grey-7">
                      <q-tooltip
                        class="app-info-tooltip"
                        anchor="top middle"
                        self="bottom middle"
                        :offset="[0, 6]">
                        {{ t('medicationDosageHint') }}
                      </q-tooltip>
                    </q-icon>
                  </template>
                </q-input>
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('medicationDosageUnit')"
                required
                :test-id="tid.field('dosage-unit')">
                <FormSelect
                  v-model="local.dosageUnit"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly"
                  :options="resolvedDosageUnitOptions"
                  :placeholder="t('medicationSelectUnit')"
                  :error="Boolean(errors.dosageUnit)"
                  :error-message="errors.dosageUnit"
                  :test-id="tid.field('dosage-unit')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('medicationRoute')"
                required
                :test-id="tid.field('route')">
                <FormSelect
                  v-model="local.route"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly"
                  :options="resolvedRouteOptions"
                  :placeholder="t('medicationSelectRoute')"
                  :error="Boolean(errors.route)"
                  :error-message="errors.route"
                  :test-id="tid.field('route')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('medicationFrequency')"
                required
                :test-id="tid.field('frequency')">
                <FormSelect
                  v-model="local.frequency"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly"
                  :options="resolvedFrequencyOptions"
                  :placeholder="t('medicationSelectFrequency')"
                  :error="Boolean(errors.frequency)"
                  :error-message="errors.frequency"
                  :test-id="tid.field('frequency')"
                />
              </AddClientLabeledField>
            </div>
            <div
              v-if="showCustomFrequency"
              class="col-12">
              <AddClientLabeledField
                :label="t('medicationCustomFrequency')"
                required
                :test-id="tid.field('custom-frequency')">
                <q-input
                  v-model="local.customFrequency"
                  outlined
                  hide-bottom-space
                  :readonly="readonly"
                  :placeholder="t('medicationCustomFrequencyPlaceholder')"
                  :error="Boolean(errors.customFrequency)"
                  :error-message="errors.customFrequency"
                  :data-testid="tid.field('custom-frequency')">
                  <template #append>
                    <q-icon
                      name="info_outline"
                      size="20px"
                      class="cursor-pointer text-grey-7">
                      <q-tooltip
                        class="app-info-tooltip"
                        anchor="top middle"
                        self="bottom middle"
                        :offset="[0, 6]">
                        {{ t('medicationCustomFrequencyHint') }}
                      </q-tooltip>
                    </q-icon>
                  </template>
                </q-input>
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="assignment"
            :title="t('medicationSectionDetails')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('medicationStartDate')"
                required
                :test-id="tid.field('start-date')">
                <ClientDateField
                  v-model="local.startDate"
                  :readonly="readonly"
                  :error="Boolean(errors.startDate)"
                  :error-message="errors.startDate"
                  :close-label="t('close')"
                  :test-id="tid.field('start-date')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('medicationEndDate')"
                :test-id="tid.field('end-date')">
                <ClientDateField
                  v-model="local.endDate"
                  :readonly="readonly"
                  :error="Boolean(errors.endDate)"
                  :error-message="errors.endDate"
                  :close-label="t('close')"
                  :test-id="tid.field('end-date')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('medicationPrescriber')"
                required
                :test-id="tid.field('prescriber')">
                <ClinicianFormSelect
                  :key="prescriberSelectKey"
                  v-model="local.prescriberId"
                  :readonly="readonly"
                  :options="prescriberSelectOptions"
                  :placeholder="t('medicationPrescriberPlaceholder')"
                  :error="Boolean(errors.prescriberId)"
                  :error-message="errors.prescriberId"
                  :test-id="tid.field('prescriber')"
                  @update:model-value="onPrescriberChange"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12">
              <AddClientLabeledField
                :label="t('medicationReason')"
                :test-id="tid.field('reason')">
                <q-input
                  v-model="local.reasonDiagnosis"
                  outlined
                  hide-bottom-space
                  :readonly="readonly"
                  :placeholder="t('medicationReasonPlaceholder')"
                  :data-testid="tid.field('reason')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="local_pharmacy"
            :title="t('medicationSectionPharmacy')"
          />
          <p
            v-if="!hasPharmacies"
            class="text-body2 text-grey-7 q-mb-sm">
            {{ t('medicationPharmacyModeNone') }}
          </p>

          <div
            v-if="hasPharmacies"
            class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <FormSelect
                v-model="local.pharmacyId"
                outlined
                hide-bottom-space
                emit-value
                map-options
                clearable
                :readonly="readonly"
                :options="pharmacySelectOptions"
                :placeholder="t('medicationPharmacySearchPlaceholder')"
                :error="Boolean(errors.pharmacyId)"
                :error-message="errors.pharmacyId"
                :test-id="tid.field('pharmacy')"
              />
            </div>
          </div>
          <p
            v-if="showPharmacyWarning"
            class="text-warning text-caption q-mt-sm q-mb-none">
            <q-icon name="warning" size="16px" class="q-mr-xs" />
            {{ t('medicationPharmacyMissingWarning') }}
          </p>
          <q-btn
            v-if="canAddPharmacy && !readonly"
            flat
            no-caps
            dense
            color="primary"
            class="medication-dialog__add-pharmacy-link q-mt-sm"
            icon="add"
            :label="t('medicationAddPharmacy')"
            :data-testid="tid.btn('add-pharmacy')"
            @click="emit('add-pharmacy')"
          />
          <div
            v-if="!readonly && showSetPreferred"
            class="q-mt-sm">
            <q-checkbox
              v-model="local.setPharmacyPreferred"
              :label="t('medicationSetPreferred')"
              :data-testid="tid.field('set-preferred')"
            />
            <p class="text-caption text-grey-7 q-mt-xs q-mb-none">
              {{ t('medicationSetPreferredHint') }}
            </p>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="notes"
            :title="t('medicationSectionAdditional')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12">
              <AddClientLabeledField
                :label="t('medicationInstructions')"
                required
                :test-id="tid.field('instructions')">
                <q-input
                  v-model="local.instructions"
                  outlined
                  hide-bottom-space
                  type="textarea"
                  autogrow
                  counter
                  :maxlength="medicationTextMaxLength"
                  :readonly="readonly"
                  :placeholder="t('medicationInstructionsPlaceholder')"
                  :error="Boolean(errors.instructions)"
                  :error-message="errors.instructions"
                  :data-testid="tid.field('instructions')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12">
              <AddClientLabeledField
                :label="t('medicationNotes')"
                :test-id="tid.field('notes')">
                <q-input
                  v-model="local.notes"
                  outlined
                  hide-bottom-space
                  type="textarea"
                  autogrow
                  counter
                  :maxlength="medicationTextMaxLength"
                  :readonly="readonly"
                  :placeholder="t('medicationNotesPlaceholder')"
                  :data-testid="tid.field('notes')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <div
          v-if="!readonly && mode === 'add'"
          class="medication-dialog__add-another">
          <q-checkbox
            v-model="addAnother"
            :label="t('medicationAddAnother')"
            :data-testid="tid.field('add-another')"
          />
          <p class="text-caption text-grey-7 q-mb-none q-mt-none">
            {{ t('medicationAddAnotherHint') }}
          </p>
        </div>
        <q-space v-if="!readonly && mode === 'add'" />
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="readonly ? t('close') : t('cancel')"
          :data-testid="tid.btn('cancel')"
          @click="onCancel"
        />
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="saving"
          :disable="saving"
          :label="t('medicationSave')"
          :data-testid="tid.btn('save')"
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
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormFieldHint from 'components/FormFieldHint.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import ClinicianFormSelect from 'components/ClinicianFormSelect.vue'
import {
  createEmptyMedicationForm,
  resolveDefaultPrescriberOption,
  toReferenceMedicationSelectOption,
} from 'src/utils/medication-normalize.js'
import {
  isSelectedPharmacyPreferred,
  resolveDefaultPharmacySelection,
  shouldWarnMissingPharmacy,
} from 'src/utils/medication-pharmacy.js'
import {
  isCustomMedicationFrequency,
  MEDICATION_DOSAGE_UNIT_OPTIONS,
  MEDICATION_FREQUENCY_OPTIONS,
  MEDICATION_ROUTE_OPTIONS,
  withCurrentCatalogOption,
} from 'src/utils/medication-catalogs.js'
import { searchReferenceMedications } from 'src/utils/medication-api.js'
import { todayDateUs } from 'src/utils/client-form.js'
import { medicationTestIds as tid } from 'src/test-ids/index.js'
import {
  useValidationSaveFeedback,
} from 'src/composables/useValidationSaveFeedback.js'
import {
  resolveClinicianOptionLabel,
} from 'src/utils/care-plan-orders.js'
import { useAuthStore } from 'src/stores/auth-store.js'

const medicationTextMaxLength = 500

const props = defineProps({
  mode: {
    type: String,
    default: 'add',
  },
  medication: {
    type: Object,
    default: null,
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
  pharmacyOptions: {
    type: Array,
    default: () => [],
  },
  preferredPharmacy: {
    type: Object,
    default: null,
  },
  dosageUnitOptions: {
    type: Array,
    default: () => [],
  },
  routeOptions: {
    type: Array,
    default: () => [],
  },
  frequencyOptions: {
    type: Array,
    default: () => [],
  },
  canAddPharmacy: {
    type: Boolean,
    default: false,
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['save', 'cancel', 'add-pharmacy'])

const open = defineModel({ type: Boolean, default: false })

const { t } = useI18n()
const authStore = useAuthStore()
const { notifyAndScrollToValidationErrors } = useValidationSaveFeedback()

const dialogBodyScrollRef = ref(null)
const local = ref(createEmptyMedicationForm())
const errors = ref({})
const addAnother = ref(false)
const medicationOptions = ref([])
const medicationSearchLoading = ref(false)

const readonly = computed(() => props.mode === 'view')

function applyDefaultPrescriber() {
  if (props.mode !== 'add' || local.value.prescriberId) {
    return
  }
  const option = resolveDefaultPrescriberOption(
    props.clinicianOptions,
    authStore.userInfo?.staffMember ?? null,
  )
  if (!option) {
    return
  }
  local.value.prescriberId = option.value
  local.value.prescriberName = option.label || option.name || ''
}

function applyDefaultPharmacy() {
  if (props.mode !== 'add' || local.value.pharmacyId) {
    return
  }
  const next = resolveDefaultPharmacySelection(props.pharmacyOptions)
  local.value.pharmacyMode = next.pharmacyMode
  local.value.pharmacyId = next.pharmacyId
  local.value.setPharmacyPreferred = false
}

function onPrescriberChange(id) {
  local.value.prescriberName = resolveClinicianOptionLabel(
    props.clinicianOptions,
    id,
  ) || String(local.value.prescriberName ?? '').trim()
}

const dialogTitle = computed(() => {
  if (props.mode === 'view') {
    return t('medicationViewTitle')
  }
  if (props.mode === 'edit') {
    return t('medicationEditTitle')
  }

  return t('medicationAddTitle')
})

const dialogSubtitle = computed(() => {
  if (props.mode === 'view') {
    return t('medicationViewSubtitle')
  }

  return t('medicationAddSubtitle')
})

const hasPharmacies = computed(
  () => (props.pharmacyOptions ?? []).length > 0,
)

const showCustomFrequency = computed(() =>
  isCustomMedicationFrequency(local.value.frequency),
)

const resolvedDosageUnitOptions = computed(() =>
  withCurrentCatalogOption(
    props.dosageUnitOptions?.length
      ? props.dosageUnitOptions
      : MEDICATION_DOSAGE_UNIT_OPTIONS,
    local.value.dosageUnit,
    local.value.dosageUnitLabel,
  ),
)

const resolvedRouteOptions = computed(() =>
  withCurrentCatalogOption(
    props.routeOptions?.length
      ? props.routeOptions
      : MEDICATION_ROUTE_OPTIONS,
    local.value.route,
    local.value.routeLabel,
  ),
)

const resolvedFrequencyOptions = computed(() =>
  withCurrentCatalogOption(
    props.frequencyOptions?.length
      ? props.frequencyOptions
      : MEDICATION_FREQUENCY_OPTIONS,
    local.value.frequency,
    local.value.frequencyLabel,
  ),
)

const prescriberSelectOptions = computed(() => {
  const list = [...(props.clinicianOptions ?? [])]
  const id = local.value.prescriberId
  if (id == null || id === '') {
    return list
  }
  if (list.some(option => String(option?.value) === String(id))) {
    return list
  }
  const name = String(local.value.prescriberName ?? '').trim()
    || String(id)

  return [{
    value: String(id),
    label: name,
    name,
  }, ...list]
})

const prescriberSelectKey = computed(() =>
  [
    'prescriber',
    String(local.value.prescriberId ?? ''),
    String(prescriberSelectOptions.value.length),
  ].join('-'),
)

const showPharmacyWarning = computed(() =>
  shouldWarnMissingPharmacy(
    props.pharmacyOptions,
    local.value.pharmacyId,
  ),
)

const showSetPreferred = computed(() => {
  if (!local.value.pharmacyId) {
    return false
  }

  return !isSelectedPharmacyPreferred(
    props.pharmacyOptions,
    local.value.pharmacyId,
  )
})

const pharmacySelectOptions = computed(() =>
  (props.pharmacyOptions ?? []).map(pharmacy => ({
    label: pharmacy.preferred
      ? `${pharmacy.name} (${t('medicationPreferredBadge')})`
      : pharmacy.name,
    value: pharmacy.id,
  })),
)

function buildLocalForm(medication) {
  const base = createEmptyMedicationForm()
  if (!medication) {
    return base
  }

  return {
    ...base,
    ...medication,
    dosage: medication.dosage != null ? String(medication.dosage) : '',
  }
}

function currentMedicationOptions() {
  if (local.value.medicationId == null) {
    return []
  }
  const option = toReferenceMedicationSelectOption({
    id: local.value.medicationId,
    name: local.value.medicationName,
    genericName: local.value.medicationGenericName,
  })

  return option ? [option] : []
}

watch(
  () => [open.value, props.medication, props.mode],
  () => {
    if (!open.value) {
      return
    }
    local.value = buildLocalForm(props.medication)
    if (!local.value.startDate) {
      local.value.startDate = todayDateUs()
    }
    applyDefaultPrescriber()
    applyDefaultPharmacy()
    if (
      local.value.prescriberId
      && !String(local.value.prescriberName ?? '').trim()
    ) {
      onPrescriberChange(local.value.prescriberId)
    }
    errors.value = {}
    addAnother.value = false
    medicationOptions.value = currentMedicationOptions()
  },
  { immediate: true },
)

watch(
  () => props.clinicianOptions,
  () => {
    if (!open.value) {
      return
    }
    applyDefaultPrescriber()
    if (
      local.value.prescriberId
      && !String(local.value.prescriberName ?? '').trim()
    ) {
      onPrescriberChange(local.value.prescriberId)
    }
  },
)

watch(
  () => props.pharmacyOptions,
  () => {
    if (!open.value) {
      return
    }
    applyDefaultPharmacy()
  },
)

watch(
  () => local.value.pharmacyId,
  () => {
    if (!showSetPreferred.value) {
      local.value.setPharmacyPreferred = false
    }
  },
)

function mapMedicationOptions(list) {
  return list
    .map(item => toReferenceMedicationSelectOption(item))
    .filter(Boolean)
}

async function onMedicationFilter(val, update) {
  const query = String(val ?? '').trim()
  medicationSearchLoading.value = true
  try {
    const results = query.length >= 2
      ? await searchReferenceMedications(query)
      : []
    update(() => {
      medicationOptions.value = results.length
        ? mapMedicationOptions(results)
        : currentMedicationOptions()
    })
  } catch {
    update(() => {
      medicationOptions.value = currentMedicationOptions()
    })
  } finally {
    medicationSearchLoading.value = false
  }
}

function onMedicationSelected(value) {
  if (value == null) {
    local.value.medicationId = null
    local.value.medicationName = ''
    local.value.medicationGenericName = ''

    return
  }
  const found = medicationOptions.value.find(opt => opt.value === value)
  local.value.medicationId = value
  local.value.medicationName = found?.name ?? local.value.medicationName
  local.value.medicationGenericName = found?.genericName ?? ''
}

function validateMedicationInfo(nextErrors) {
  if (local.value.medicationId == null) {
    nextErrors.medicationId = t('medicationMedicationRequired')
  }
  const dosageValue = Number(local.value.dosage)
  if (local.value.dosage === '' || !Number.isFinite(dosageValue)) {
    nextErrors.dosage = t('medicationDosageRequired')
  }
  if (!local.value.dosageUnit) {
    nextErrors.dosageUnit = t('medicationDosageUnitRequired')
  }
  if (!local.value.route) {
    nextErrors.route = t('medicationRouteRequired')
  }
  if (!local.value.frequency) {
    nextErrors.frequency = t('medicationFrequencyRequired')
  }
  if (
    isCustomMedicationFrequency(local.value.frequency)
    && !String(local.value.customFrequency ?? '').trim()
  ) {
    nextErrors.customFrequency = t('medicationCustomFrequencyRequired')
  }
}

function validatePrescriptionDetails(nextErrors) {
  if (!local.value.startDate) {
    nextErrors.startDate = t('medicationStartDateRequired')
  }
  if (local.value.startDate && local.value.endDate) {
    const start = new Date(local.value.startDate)
    const end = new Date(local.value.endDate)
    if (end < start) {
      nextErrors.endDate = t('medicationEndDateInvalid')
    }
  }
  if (!local.value.prescriberId) {
    nextErrors.prescriberId = t('medicationPrescriberRequired')
  }
}

function validate() {
  const nextErrors = {}
  validateMedicationInfo(nextErrors)
  validatePrescriptionDetails(nextErrors)
  if (!String(local.value.instructions ?? '').trim()) {
    nextErrors.instructions = t('medicationInstructionsRequired')
  }
  errors.value = nextErrors

  return Object.keys(nextErrors).length === 0
}

function onCancel() {
  emit('cancel')
  open.value = false
}

async function onSave() {
  if (!validate()) {
    await notifyAndScrollToValidationErrors(dialogBodyScrollRef)

    return
  }
  const form = {
    ...local.value,
    dosage: Number(local.value.dosage),
  }
  emit('save', { form, addAnother: addAnother.value })
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.medication-dialog__option-title,
.medication-dialog__option-detail {
  white-space: normal;
  line-height: 1.3;
  word-break: break-word;
}

.medication-dialog__pharmacy-card {
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface;
  padding: 12px 16px;
}

.medication-dialog__pharmacy-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: $text-strong;
  font-weight: 600;
}

.medication-dialog__pharmacy-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #dcfce7;
  color: #166534;
}

.medication-dialog__pharmacy-detail {
  margin: 4px 0 0;
  color: $text-muted;
  font-size: 0.875rem;
}

.medication-dialog__add-pharmacy-link {
  padding-left: 0;
}

.medication-dialog__add-another {
  flex: 1 1 auto;
  text-align: left;
}
</style>

<style lang="scss">
.medication-dialog__medication-menu {
  .q-item__label {
    white-space: normal;
    line-height: 1.3;
    word-break: break-word;
  }
}
</style>
