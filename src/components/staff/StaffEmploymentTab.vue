<template>
  <div class="staff-employment-tab">
    <AccordionSection
      icon="work"
      :title="t('staffEmploymentInformationTitle')">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <AddClientLabeledField :label="t('staffFilterEmploymentStatus')">
            <FormSelect
              v-model="employment.status"
              outlined
              hide-bottom-space
              emit-value
              map-options
              :readonly="readonly"
              :options="statusOptions"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('staffListColPosition')"
            required>
            <FormSelect
              v-model="employment.position"
              outlined
              hide-bottom-space
              emit-value
              map-options
              clearable
              :readonly="readonly"
              :options="positionOptions"
              :error="Boolean(fieldErrors.position)"
              :error-message="fieldErrors.position"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('staffSpecialtyLabel')"
            required>
            <FormSelect
              v-model="employment.specialtyId"
              outlined
              hide-bottom-space
              emit-value
              map-options
              clearable
              test-id="staff-field-specialty"
              :readonly="readonly"
              :options="specialtyOptions"
              :error="Boolean(fieldErrors.specialtyId)"
              :error-message="fieldErrors.specialtyId"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('staffProviderTypeLabel')">
            <FormSelect
              v-model="employment.providerTypeId"
              outlined
              hide-bottom-space
              emit-value
              map-options
              clearable
              test-id="staff-field-provider-type"
              :readonly="readonly"
              :options="providerTypeOptions"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField
            :label="t('staffListColHireDate')"
            required>
            <ClientDateField
              v-model="employment.hireDate"
              :readonly="readonly"
              :close-label="t('close')"
              :error="Boolean(fieldErrors.hireDate)"
              :error-message="fieldErrors.hireDate"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField :label="t('staffTerminationDate')">
            <ClientDateField
              v-model="employment.terminationDate"
              :readonly="readonly"
              :close-label="t('close')"
            />
          </AddClientLabeledField>
        </div>
      </div>
    </AccordionSection>

    <q-separator class="section-separator q-my-md" />

    <AccordionSection
      icon="payments"
      :title="t('staffCompensationTitle')">
      <p class="text-body2 text-grey-7 q-mb-md">
        {{ t('staffCompensationSubtitle') }}
      </p>

      <div
        v-if="!readonly"
        class="fmh-list-card q-pa-md q-mb-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('staffCompensationRateType')"
              required>
              <FormSelect
                v-model="employment.compensationDraft.rateType"
                outlined
                hide-bottom-space
                emit-value
                map-options
                clearable
                :options="rateTypeOptions"
                :error="Boolean(draftErrors.rateType)"
                :error-message="draftErrors.rateType"
                @update:model-value="clearDraftError('rateType')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('staffCompensationRate')"
              required>
              <q-input
                :model-value="employment.compensationDraft.rate"
                outlined
                hide-bottom-space
                inputmode="decimal"
                :placeholder="t('staffCompensationRatePlaceholder')"
                :error="Boolean(draftErrors.rate)"
                :error-message="draftErrors.rate"
                @update:model-value="onRateInput"
                @blur="onRateBlur"
              >
                <template #prepend>
                  <span class="text-grey-7 text-body2">$</span>
                </template>
              </q-input>
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('staffCompensationEffectiveFrom')">
              <ClientDateField
                v-model="employment.compensationDraft.effectiveFrom"
                :close-label="t('close')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('staffCompensationEffectiveTo')">
              <ClientDateField
                v-model="employment.compensationDraft.effectiveTo"
                :close-label="t('close')"
              />
            </AddClientLabeledField>
          </div>
        </div>
        <div class="row justify-end q-mt-md">
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :data-testid="staffFormTestIds.addCompensation"
            :label="t('staffCompensationAddRate')"
            @click="addCompensationRate"
          />
        </div>
      </div>

      <div class="fmh-list-card">
        <StaffCompensationTable
          :rates="employment.compensation"
          :empty-label="t('staffCompensationEmpty')"
          :can-delete="!readonly"
          @delete="removeCompensation"
        />
      </div>
    </AccordionSection>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AccordionSection from 'components/AccordionSection.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import StaffCompensationTable from
  'components/staff/StaffCompensationTable.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import {
  createEmptyStaffCompensation,
  formatStaffCompensationRateAmount,
  isValidStaffCompensationRate,
  nextStaffCompensationId,
  sanitizeStaffCompensationRateInput,
} from 'src/utils/staff-form.js'
import { staffStatusOptions } from 'src/utils/staff-status.js'
import { staffFormTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  positionOptions: {
    type: Array,
    default: () => [],
  },
  specialtyOptions: {
    type: Array,
    default: () => [],
  },
  providerTypeOptions: {
    type: Array,
    default: () => [],
  },
  fieldErrors: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const $q = useQuasar()

const draftErrors = ref({
  rateType: '',
  rate: '',
})

const employment = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const statusOptions = computed(() => staffStatusOptions(t))

const rateTypeOptions = computed(() => [
  { label: t('staffCompensationHourly'), value: 'hourly' },
  { label: t('staffCompensationSalary'), value: 'salary' },
  { label: t('staffCompensationPerVisit'), value: 'per_visit' },
])

function clearDraftError(field) {
  if (!draftErrors.value[field]) {
    return
  }
  draftErrors.value = {
    ...draftErrors.value,
    [field]: '',
  }
}

function clearDraftErrors() {
  draftErrors.value = {
    rateType: '',
    rate: '',
  }
}

function patchCompensationDraft(partial) {
  employment.value = {
    ...employment.value,
    compensationDraft: {
      ...employment.value.compensationDraft,
      ...partial,
    },
  }
}

function rateErrorForValue(value, { requireValue = false } = {}) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return requireValue ? t('fieldRequired') : ''
  }
  if (!isValidStaffCompensationRate(raw)) {
    return t('staffCompensationRateInvalid')
  }

  return ''
}

function onRateInput(value) {
  const sanitized = sanitizeStaffCompensationRateInput(value)
  patchCompensationDraft({ rate: sanitized })
  draftErrors.value = {
    ...draftErrors.value,
    rate: rateErrorForValue(sanitized),
  }
}

function onRateBlur() {
  const raw = employment.value.compensationDraft?.rate
  if (!String(raw ?? '').trim()) {
    return
  }
  const amount = formatStaffCompensationRateAmount(raw)
  if (!amount || !isValidStaffCompensationRate(amount)) {
    draftErrors.value = {
      ...draftErrors.value,
      rate: rateErrorForValue(raw, { requireValue: true }),
    }
    return
  }
  patchCompensationDraft({ rate: amount })
  draftErrors.value = {
    ...draftErrors.value,
    rate: '',
  }
}

function validateCompensationDraft(draft) {
  const nextErrors = {
    rateType: '',
    rate: '',
  }
  if (!String(draft.rateType ?? '').trim()) {
    nextErrors.rateType = t('fieldRequired')
  }
  nextErrors.rate = rateErrorForValue(draft.rate, { requireValue: true })

  draftErrors.value = nextErrors

  return !nextErrors.rateType && !nextErrors.rate
}

function addCompensationRate() {
  const draft = employment.value.compensationDraft ?? {}
  if (!validateCompensationDraft(draft)) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('staffCompensationDraftRequired'),
    })
    return
  }
  const rate = formatStaffCompensationRateAmount(draft.rate)
  const compensation = (employment.value.compensation ?? []).map(row => ({
    ...row,
    isCurrent: false,
  }))
  compensation.unshift({
    id: nextStaffCompensationId(),
    rateType: draft.rateType,
    rate,
    effectiveFrom: draft.effectiveFrom ?? '',
    effectiveTo: draft.effectiveTo ?? '',
    isCurrent: true,
  })
  clearDraftErrors()
  employment.value = {
    ...employment.value,
    compensation,
    compensationDraft: createEmptyStaffCompensation(),
  }
}

function removeCompensation(id) {
  employment.value = {
    ...employment.value,
    compensation: (employment.value.compensation ?? [])
      .filter(row => row.id !== id),
  }
}
</script>
