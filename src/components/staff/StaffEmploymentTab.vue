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
            <AddClientLabeledField :label="t('staffCompensationRateType')">
              <FormSelect
                v-model="employment.compensationDraft.rateType"
                outlined
                hide-bottom-space
                emit-value
                map-options
                clearable
                :options="rateTypeOptions"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField :label="t('staffCompensationRate')">
              <q-input
                v-model.number="employment.compensationDraft.rate"
                outlined
                hide-bottom-space
                type="number"
                min="0"
                step="0.01"
              />
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
            :label="t('staffCompensationAddRate')"
            @click="addCompensationRate"
          />
        </div>
      </div>

      <div class="add-client-form__fmh-list-card">
        <div
          v-if="employment.compensation.length"
          class="add-client-form__fmh-table-wrap">
          <table class="add-client-form__fmh-table">
            <thead>
              <tr>
                <th>{{ t('staffCompensationRateType') }}</th>
                <th>{{ t('staffCompensationRate') }}</th>
                <th>{{ t('staffCompensationEffectiveFrom') }}</th>
                <th>{{ t('staffCompensationEffectiveTo') }}</th>
                <th>{{ t('staffCompensationCurrent') }}</th>
                <th
                  v-if="!readonly"
                  class="add-client-form__fmh-table-actions-col">
                  {{ t('actions') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in employment.compensation"
                :key="row.id">
                <td>{{ rateTypeLabel(row.rateType) }}</td>
                <td>{{ formatRate(row.rate) }}</td>
                <td>{{ row.effectiveFrom || '—' }}</td>
                <td>{{ row.effectiveTo || '—' }}</td>
                <td>
                  <q-badge
                    v-if="row.isCurrent"
                    color="positive"
                    :label="t('staffCompensationCurrentBadge')"
                  />
                  <span v-else>—</span>
                </td>
                <td
                  v-if="!readonly"
                  class="add-client-form__fmh-table-actions">
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete"
                    :title="t('delete')"
                    @click="removeCompensation(row.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          v-else
          class="admin-data-table__empty full-width row flex-center
            text-grey-7 q-gutter-sm q-pa-lg">
          <q-icon name="inbox" size="md" />
          <span>{{ t('staffCompensationEmpty') }}</span>
        </div>
      </div>
    </AccordionSection>

    <q-separator class="section-separator q-my-md" />

    <AccordionSection
      icon="admin_panel_settings"
      :title="t('staffSystemAccessTitle')">
      <FormToggle
        v-model="employment.systemUser.enabled"
        :disable="readonly || !canCreateSystemUser"
        :label="t('staffSystemAccessEnabledLabel')"
      />
      <div
        v-if="employment.systemUser.enabled"
        class="fmh-list-card q-pa-md q-mt-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('username')"
              required>
              <TextInput
                v-model="employment.systemUser.username"
                :external-label="true"
                :disable="readonly"
                :error="Boolean(fieldErrors.username)"
                :error-message="fieldErrors.username"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('staffListColRole')"
              required>
              <FormSelect
                v-model="employment.systemUser.roleId"
                outlined
                hide-bottom-space
                emit-value
                map-options
                clearable
                :readonly="readonly"
                :options="roleOptions"
                :error="Boolean(fieldErrors.roleId)"
                :error-message="fieldErrors.roleId"
              />
            </AddClientLabeledField>
          </div>
          <div
            v-if="!readonly && !isEdit"
            class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('password')"
              required>
              <TextInput
                v-model="employment.systemUser.password"
                type="password"
                :external-label="true"
                :error="Boolean(fieldErrors.password)"
                :error-message="fieldErrors.password"
              />
            </AddClientLabeledField>
          </div>
        </div>
        <div class="staff-system-access-hint row items-start q-mt-md">
          <q-icon name="info_outline" color="primary" size="18px" />
          <span class="text-body2 q-ml-sm">
            {{ t('staffSystemAccessRoleHint') }}
          </span>
        </div>
      </div>
    </AccordionSection>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AccordionSection from 'components/AccordionSection.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import TextInput from 'components/TextInput.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import {
  createEmptyStaffCompensation,
  nextStaffCompensationId,
} from 'src/utils/staff-form.js'
import { staffStatusOptions } from 'src/utils/staff-status.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  roleOptions: {
    type: Array,
    default: () => [],
  },
  positionOptions: {
    type: Array,
    default: () => [],
  },
  canCreateSystemUser: {
    type: Boolean,
    default: false,
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
  fieldErrors: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const $q = useQuasar()

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

function rateTypeLabel(value) {
  return rateTypeOptions.value.find(opt => opt.value === value)?.label
    ?? value
    ?? '—'
}

function formatRate(value) {
  if (value == null || value === '') {
    return '—'
  }

  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function addCompensationRate() {
  const draft = employment.value.compensationDraft ?? {}
  const missingRate = !String(draft.rateType ?? '').trim()
    || draft.rate == null
    || draft.rate === ''
  if (missingRate) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('staffCompensationDraftRequired'),
    })
    return
  }
  const compensation = (employment.value.compensation ?? []).map(row => ({
    ...row,
    isCurrent: false,
  }))
  compensation.unshift({
    id: nextStaffCompensationId(),
    rateType: draft.rateType,
    rate: draft.rate,
    effectiveFrom: draft.effectiveFrom ?? '',
    effectiveTo: draft.effectiveTo ?? '',
    isCurrent: true,
  })
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
