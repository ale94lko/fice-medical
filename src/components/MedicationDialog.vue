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
                  input-debounce="300"
                  emit-value
                  map-options
                  :readonly="readonly"
                  :loading="medicationSearchLoading"
                  :options="medicationOptions"
                  :placeholder="t('medicationMedicationPlaceholder')"
                  :error="Boolean(errors.medicationId)"
                  :error-message="errors.medicationId"
                  :data-testid="tid.field('medication')"
                  @filter="onMedicationFilter"
                  @update:model-value="onMedicationSelected"
                />
              </AddClientLabeledField>
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
                  :data-testid="tid.field('dosage')"
                />
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
                  :options="dosageUnitOptions"
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
                  :options="routeOptions"
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
                  :options="frequencyOptions"
                  :placeholder="t('medicationSelectFrequency')"
                  :error="Boolean(errors.frequency)"
                  :error-message="errors.frequency"
                  :test-id="tid.field('frequency')"
                />
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
                  v-model="local.prescriberId"
                  :readonly="readonly"
                  :options="clinicianOptions"
                  :placeholder="t('medicationPrescriberPlaceholder')"
                  :error="Boolean(errors.prescriberId)"
                  :error-message="errors.prescriberId"
                  :test-id="tid.field('prescriber')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('status')"
                required
                :test-id="tid.field('status')">
                <FormSelect
                  v-model="local.status"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly"
                  :options="statusOptions"
                  :placeholder="t('medicationSelectStatus')"
                  :error="Boolean(errors.status)"
                  :error-message="errors.status"
                  :test-id="tid.field('status')"
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
          <div class="row q-col-gutter-md q-mt-sm q-mb-sm">
            <div class="col-auto">
              <q-radio
                v-model="local.pharmacyMode"
                :val="pharmacyModeValues.preferred"
                :disable="readonly"
                color="primary"
                :label="t('medicationPharmacyModePreferred')"
                :data-testid="tid.field('pharmacy-mode-preferred')"
              />
            </div>
            <div class="col-auto">
              <q-radio
                v-model="local.pharmacyMode"
                :val="pharmacyModeValues.selected"
                :disable="readonly"
                color="primary"
                :label="t('medicationPharmacyModeSelected')"
                :data-testid="tid.field('pharmacy-mode-selected')"
              />
            </div>
            <div class="col-auto">
              <q-radio
                v-model="local.pharmacyMode"
                :val="pharmacyModeValues.none"
                :disable="readonly"
                color="primary"
                :label="t('medicationPharmacyModeNone')"
                :data-testid="tid.field('pharmacy-mode-none')"
              />
            </div>
          </div>

          <div v-if="local.pharmacyMode === pharmacyModeValues.preferred">
            <div
              v-if="preferredPharmacy"
              class="medication-dialog__pharmacy-card">
              <div class="medication-dialog__pharmacy-card-header">
                <q-icon name="local_pharmacy" size="20px" />
                <span class="medication-dialog__pharmacy-name">
                  {{ preferredPharmacy.name }}
                </span>
                <span class="medication-dialog__pharmacy-badge">
                  {{ t('medicationPreferredBadge') }}
                </span>
              </div>
              <p class="medication-dialog__pharmacy-detail">
                {{ formatPharmacyAddress(preferredPharmacy) }}
              </p>
              <p
                v-if="preferredPharmacy.phone"
                class="medication-dialog__pharmacy-detail">
                {{ preferredPharmacy.phone }}
              </p>
            </div>
            <p v-else class="text-body2 text-grey-7 q-mb-none">
              {{ t('medicationNoPreferredPharmacy') }}
            </p>
          </div>

          <div v-else-if="local.pharmacyMode === pharmacyModeValues.selected">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <FormSelect
                  v-model="local.pharmacyId"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly"
                  :options="pharmacySelectOptions"
                  :placeholder="t('medicationPharmacySearchPlaceholder')"
                  :error="Boolean(errors.pharmacyId)"
                  :error-message="errors.pharmacyId"
                  :test-id="tid.field('pharmacy')"
                />
              </div>
            </div>
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
            <div v-if="!readonly" class="q-mt-sm">
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
import SubsectionHeading from 'components/SubsectionHeading.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import ClinicianFormSelect from 'components/ClinicianFormSelect.vue'
import {
  medicationStatuses,
  pharmacyModeValues,
} from 'components/constants.js'
import {
  createEmptyMedicationForm,
  formatPharmacyAddress,
} from 'src/utils/medication-normalize.js'
import { searchReferenceMedications } from 'src/utils/medication-api.js'
import { medicationTestIds as tid } from 'src/test-ids/index.js'
import {
  useValidationSaveFeedback,
} from 'src/composables/useValidationSaveFeedback.js'

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
const { notifyAndScrollToValidationErrors } = useValidationSaveFeedback()

const dialogBodyScrollRef = ref(null)
const local = ref(createEmptyMedicationForm())
const errors = ref({})
const addAnother = ref(false)
const medicationOptions = ref([])
const medicationSearchLoading = ref(false)

const readonly = computed(() => props.mode === 'view')

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

const statusOptions = computed(() => [
  {
    label: t('medicationStatusActive'),
    value: medicationStatuses.active,
  },
  {
    label: t('medicationStatusCompleted'),
    value: medicationStatuses.completed,
  },
  {
    label: t('medicationStatusDiscontinued'),
    value: medicationStatuses.discontinued,
  },
])

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
  const name = local.value.medicationName
  const generic = local.value.medicationGenericName

  return [{
    label: generic ? `${name} (${generic})` : name,
    value: local.value.medicationId,
    name,
    genericName: generic,
  }]
}

watch(
  () => [open.value, props.medication, props.mode],
  () => {
    if (!open.value) {
      return
    }
    local.value = buildLocalForm(props.medication)
    errors.value = {}
    addAnother.value = false
    medicationOptions.value = currentMedicationOptions()
  },
  { immediate: true },
)

function mapMedicationOptions(list) {
  return list.map(item => ({
    label: item.label,
    value: item.id,
    name: item.name,
    genericName: item.genericName,
  }))
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
  if (!local.value.status) {
    nextErrors.status = t('medicationStatusRequired')
  }
}

function validatePharmacySelection(nextErrors) {
  if (
    local.value.pharmacyMode === pharmacyModeValues.selected
    && local.value.pharmacyId == null
  ) {
    nextErrors.pharmacyId = t('medicationPharmacyRequired')
  }
  if (
    local.value.pharmacyMode === pharmacyModeValues.preferred
    && !props.preferredPharmacy
  ) {
    nextErrors.pharmacyMode = t('medicationPharmacyRequired')
  }
}

function validate() {
  const nextErrors = {}
  validateMedicationInfo(nextErrors)
  validatePrescriptionDetails(nextErrors)
  validatePharmacySelection(nextErrors)
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
