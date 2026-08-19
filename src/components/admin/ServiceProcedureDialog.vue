<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog service-procedure-dialog app-dialog-card"
      :data-testid="serviceProcedureDialogTestIds.dialog">
      <AppDialogHeader
        :close-label="t('close')"
        :info="dialogSubtitle"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md
          service-procedure-dialog__body">
        <div class="row items-center justify-between">
          <SubsectionHeading
            icon="medical_services"
            :title="t('serviceProcedureSectionGeneral')"
          />
          <div class="row items-center no-wrap q-gutter-md">
            <FormToggle
              v-model="statusActive"
              :disable="readonly"
              :label="t('serviceProcedureStatusActiveLabel')"
            />
            <FormToggle
              v-model="local.requiresAppointment"
              :disable="readonly"
              :label="t('serviceProcedureRequiresAppointmentLabel')"
            />
          </div>
        </div>
        <div class="row items-center q-gutter-md q-mt-md">
          <FormToggle
            v-model="local.showInClinic"
            :disable="readonly"
            :label="t('serviceProcedureShowInClinicLabel')"
            :test-id="serviceProcedureDialogTestIds.field(
              'show-in-clinic',
            )"
          />
          <FormToggle
            v-model="local.showInPortal"
            :disable="readonly"
            :label="t('serviceProcedureShowInPortalLabel')"
            :test-id="serviceProcedureDialogTestIds.field(
              'show-in-portal',
            )"
          />
        </div>
        <p
          v-if="errors.showInClinic"
          class="text-negative text-caption q-mt-sm">
          {{ errors.showInClinic }}
        </p>
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('serviceProcedureNameLabel')"
              required>
              <TextInput
                v-model="local.name"
                :external-label="true"
                :readonly="readonly"
                :error="Boolean(errors.name)"
                :error-message="errors.name"
                :test-id="serviceProcedureDialogTestIds.field('name')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('serviceProcedureCategoryLabel')"
              required>
              <FormSelect
                v-model="local.category"
                outlined
                hide-bottom-space
                emit-value
                map-options
                :options="categoryOptions"
                :readonly="readonly"
                :error="Boolean(errors.category)"
                :error-message="errors.category"
                :test-id="serviceProcedureDialogTestIds.field('category')"
              />
            </AddClientLabeledField>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-4">
            <AddClientLabeledField
              :label="t('serviceProcedureAuthorizationRequirementLabel')"
              required>
              <FormSelect
                v-model="local.authorizationRequirement"
                outlined
                hide-bottom-space
                emit-value
                map-options
                :options="authorizationOptions"
                :readonly="readonly"
                :error="Boolean(errors.authorizationRequirement)"
                :error-message="errors.authorizationRequirement"
                :test-id="serviceProcedureDialogTestIds.field('auth-req')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-4">
            <AddClientLabeledField
              :label="t('serviceProcedureMinDurationLabel')">
              <TextInput
                v-model="local.minDurationMin"
                type="number"
                :external-label="true"
                :readonly="readonly"
                :error="Boolean(errors.minDurationMin)"
                :error-message="errors.minDurationMin"
                :test-id="serviceProcedureDialogTestIds.field('min-duration')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-4">
            <AddClientLabeledField
              :label="t('serviceProcedureMaxDurationLabel')">
              <TextInput
                v-model="local.maxDurationMin"
                type="number"
                :external-label="true"
                :readonly="readonly"
                :error="Boolean(errors.maxDurationMin)"
                :error-message="errors.maxDurationMin"
                :test-id="serviceProcedureDialogTestIds.field('max-duration')"
              />
            </AddClientLabeledField>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12">
            <AddClientLabeledField
              :label="t('serviceProcedureDescriptionLabel')">
              <TextInput
                v-model="local.description"
                type="textarea"
                autogrow
                class="service-procedure-dialog__desc"
                :external-label="true"
                :readonly="readonly"
                :test-id="serviceProcedureDialogTestIds.field('description')"
              />
            </AddClientLabeledField>
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('serviceProcedureDefaultClinicalNoteTemplate')">
              <FormSelect
                v-model="local.defaultClinicalNoteTemplateId"
                outlined
                hide-bottom-space
                clearable
                emit-value
                map-options
                :options="templateOptions"
                :readonly="readonly"
                :test-id="serviceProcedureDialogTestIds.field(
                  'clinical-note-template',
                )"
              />
            </AddClientLabeledField>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="verified_user"
            :title="t('serviceProcedureSectionProviderEligibility')"
          />
          <p class="text-body2 text-grey-7 q-mt-md q-mb-sm">
            {{ t('serviceProcedureEligibilityWho') }}
          </p>
          <div class="row q-col-gutter-md q-mb-sm">
            <div class="col-auto">
              <q-radio
                v-model="local.providerEligibilityMode"
                :val="eligibilityModes.anyEligibleProvider"
                :disable="readonly"
                color="primary"
                :label="t('serviceProcedureEligibilityAny')"
                :data-testid="serviceProcedureDialogTestIds.field(
                  'eligibility-mode-any',
                )"
              />
            </div>
            <div class="col-auto">
              <q-radio
                v-model="local.providerEligibilityMode"
                :val="eligibilityModes.selectedProviderTypes"
                :disable="readonly"
                color="primary"
                :label="t('serviceProcedureEligibilitySelected')"
                :data-testid="serviceProcedureDialogTestIds.field(
                  'eligibility-mode-selected',
                )"
              />
            </div>
            <div class="col-auto">
              <q-radio
                v-model="local.providerEligibilityMode"
                :val="eligibilityModes.inheritFromBaseService"
                :disable="readonly"
                color="primary"
                :label="t('serviceProcedureEligibilityInherit')"
                :data-testid="serviceProcedureDialogTestIds.field(
                  'eligibility-mode-inherit',
                )"
              />
            </div>
          </div>
          <div
            v-if="isSelectedProviderTypes"
            class="row q-col-gutter-md q-mt-md">
            <div class="col-12">
              <AddClientLabeledField
                :label="t('serviceProcedureEligibilityAllowedTypes')"
                required>
                <FormSelect
                  v-model="local.allowedProviderTypeIds"
                  outlined
                  hide-bottom-space
                  multiple
                  use-chips
                  emit-value
                  map-options
                  :options="providerTypeOptions"
                  :readonly="readonly"
                  :error="Boolean(errors.allowedProviderTypeIds)"
                  :error-message="errors.allowedProviderTypeIds"
                  :test-id="serviceProcedureDialogTestIds.field(
                    'allowed-provider-types',
                  )"
                />
              </AddClientLabeledField>
            </div>
          </div>
          <div
            v-if="!isInheritEligibility"
            class="row q-col-gutter-md q-mt-md">
            <div class="col-12">
              <AddClientLabeledField
                :label="t('serviceProcedureEligibilityCapability')"
                :required="isSelectedProviderTypes">
                <FormSelect
                  v-model="local.requiredClinicalCapabilityId"
                  outlined
                  hide-bottom-space
                  clearable
                  emit-value
                  map-options
                  :options="capabilityOptions"
                  :readonly="readonly"
                  :error="Boolean(
                    errors.requiredClinicalCapabilityId,
                  )"
                  :error-message="
                    errors.requiredClinicalCapabilityId
                  "
                  :test-id="serviceProcedureDialogTestIds.field(
                    'required-capability',
                  )"
                />
              </AddClientLabeledField>
            </div>
          </div>
          <div
            v-if="isInheritEligibility"
            class="row q-col-gutter-md q-mt-md">
            <div class="col-12">
              <AddClientLabeledField
                :label="t('serviceProcedureEligibilityBaseService')"
                required>
                <FormSelect
                  v-model="local.baseServiceProcedureId"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :options="baseServiceOptions"
                  :readonly="readonly"
                  :error="Boolean(errors.baseServiceProcedureId)"
                  :error-message="errors.baseServiceProcedureId"
                  :test-id="serviceProcedureDialogTestIds.field(
                    'base-service',
                  )"
                />
              </AddClientLabeledField>
            </div>
          </div>
          <p class="text-body2 text-grey-7 q-mb-none q-mt-md">
            {{ t('serviceProcedureEligibilityHint') }}
          </p>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="payments"
            :title="t('serviceProcedureSectionBilling')"
          />
          <div class="row items-center q-mt-md">
            <FormToggle
              :model-value="local.billable"
              :disable="readonly"
              :label="t('serviceProcedureBillableLabel')"
              :test-id="serviceProcedureDialogTestIds.field('billable')"
              @update:model-value="onBillableInput"
            />
          </div>
          <p class="text-body2 text-grey-7 q-mb-none q-mt-xs">
            {{ t('serviceProcedureBillableHint') }}
          </p>
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField :label="t('serviceProcedureCptCodeLabel')">
                <TextInput
                  v-model="local.cptCode"
                  :external-label="true"
                  :disable="billingFieldsDisabled"
                  :error="Boolean(errors.cptCode)"
                  :error-message="errors.cptCode"
                  :test-id="serviceProcedureDialogTestIds.field('cpt-code')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('serviceProcedureHcpcsCodeLabel')">
                <TextInput
                  v-model="local.hcpcsCode"
                  :external-label="true"
                  :disable="billingFieldsDisabled"
                  :error="Boolean(errors.hcpcsCode)"
                  :error-message="errors.hcpcsCode"
                  :test-id="serviceProcedureDialogTestIds.field('hcpcs-code')"
                />
              </AddClientLabeledField>
            </div>
          </div>
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('serviceProcedureDefaultFeeLabel')">
                <q-input
                  :model-value="local.defaultFee"
                  outlined
                  hide-bottom-space
                  inputmode="decimal"
                  :disable="billingFieldsDisabled"
                  :placeholder="t('serviceProcedureDefaultFeePlaceholder')"
                  :error="Boolean(errors.defaultFee)"
                  :error-message="errors.defaultFee"
                  :data-testid="
                    serviceProcedureDialogTestIds.field('default-fee')"
                  @update:model-value="onDefaultFeeInput"
                  @blur="onDefaultFeeBlur">
                  <template #prepend>
                    <span class="text-grey-7 text-body2">$</span>
                  </template>
                </q-input>
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('serviceProcedureDefaultUnitsLabel')">
                <TextInput
                  v-model="local.defaultUnits"
                  type="number"
                  :external-label="true"
                  :disable="billingFieldsDisabled"
                  :error="Boolean(errors.defaultUnits)"
                  :error-message="errors.defaultUnits"
                  :test-id="
                    serviceProcedureDialogTestIds.field('default-units')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <ServiceProcedureRequirementsSection
            :service-procedure-id="requirementsServiceId"
            :readonly="readonly"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="readonly ? t('close') : t('cancel')"
          :data-testid="serviceProcedureDialogTestIds.btn('cancel')"
          @click="onCancel"
        />
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="saving"
          :label="t('save')"
          :data-testid="serviceProcedureDialogTestIds.btn('save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  providerEligibilityModeValues,
  serviceProcedureStatusValues,
} from 'components/constants.js'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import TextInput from 'components/TextInput.vue'
import ServiceProcedureRequirementsSection from
  'components/admin/ServiceProcedureRequirementsSection.vue'
import {
  buildAuthorizationRequirementOptions,
  buildServiceProcedureCategoryOptions,
} from 'src/composables/useServiceProcedurePermissions.js'
import {
  cloneServiceProcedureForm,
  createEmptyServiceProcedureForm,
  validateServiceProcedureForm,
} from 'src/utils/service-procedure-form.js'
import {
  formatStaffCompensationRateAmount,
  sanitizeStaffCompensationRateInput,
} from 'src/utils/staff-form.js'
import { serviceProcedureDialogTestIds } from 'src/test-ids/index.js'
import { listActiveClinicalNoteTemplates } from
  'src/utils/clinical-note-template-api.js'
import {
  listActiveServiceProcedures,
  listServiceClinicalCapabilities,
  listServiceProviderTypes,
} from 'src/utils/service-procedure-api.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: {
    type: String,
    default: 'add',
    validator: value => ['add', 'edit', 'view'].includes(value),
  },
  serviceProcedure: { type: Object, default: null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])
const { t } = useI18n()

const local = ref(createEmptyServiceProcedureForm())
const errors = ref({})
const templateOptions = ref([])
const providerTypeOptions = ref([])
const capabilityOptions = ref([])
const baseServiceOptions = ref([])
const eligibilityModes = providerEligibilityModeValues

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const readonly = computed(() => props.mode === 'view')
const requirementsServiceId = computed(() =>
  local.value?.id ?? props.serviceProcedure?.id ?? null,
)
const categoryOptions = computed(() => buildServiceProcedureCategoryOptions(t))
const authorizationOptions = computed(() =>
  buildAuthorizationRequirementOptions(t),
)

const dialogTitle = computed(() => {
  if (props.mode === 'add') {
    return t('serviceProcedureDialogAddTitle')
  }
  if (props.mode === 'edit') {
    return t('serviceProcedureDialogEditTitle')
  }

  return t('serviceProcedureDialogViewTitle')
})

const dialogSubtitle = computed(() => {
  if (props.mode === 'add') {
    return t('serviceProcedureDialogAddSubtitle')
  }
  if (props.mode === 'edit') {
    return t('serviceProcedureDialogEditSubtitle')
  }

  return ''
})

const statusActive = computed({
  get: () => local.value.status === serviceProcedureStatusValues.active,
  set: value => {
    local.value.status = value
      ? serviceProcedureStatusValues.active
      : serviceProcedureStatusValues.inactive
  },
})

const billingFieldsDisabled = computed(() =>
  readonly.value || !local.value.billable,
)

const isSelectedProviderTypes = computed(() =>
  local.value.providerEligibilityMode
    === eligibilityModes.selectedProviderTypes,
)

const isInheritEligibility = computed(() =>
  local.value.providerEligibilityMode
    === eligibilityModes.inheritFromBaseService,
)

function onBillableInput(value) {
  local.value.billable = Boolean(value)
  if (local.value.billable
    && !String(local.value.defaultUnits ?? '').trim()) {
    local.value.defaultUnits = '1'
  }
}

function resetErrors() {
  errors.value = {}
}

function syncLocalFromProps() {
  if (props.serviceProcedure) {
    local.value = cloneServiceProcedureForm(props.serviceProcedure)
  } else {
    local.value = createEmptyServiceProcedureForm()
  }
  resetErrors()
}

watch(
  () => [props.modelValue, props.serviceProcedure, props.mode],
  () => {
    if (props.modelValue) {
      syncLocalFromProps()
      void loadTemplateOptions()
      void loadEligibilityCatalogs()
    }
  },
  { immediate: true },
)

async function loadTemplateOptions() {
  try {
    const templates = await listActiveClinicalNoteTemplates()
    templateOptions.value = templates.map(item => ({
      label: item.name,
      value: item.id,
    }))
  } catch {
    templateOptions.value = []
  }
}

async function loadEligibilityCatalogs() {
  const [typesResult, capsResult, servicesResult] =
    await Promise.allSettled([
      listServiceProviderTypes(),
      listServiceClinicalCapabilities(),
      listActiveServiceProcedures(t),
    ])
  providerTypeOptions.value = typesResult.status === 'fulfilled'
    ? typesResult.value
    : []
  capabilityOptions.value = capsResult.status === 'fulfilled'
    ? capsResult.value
    : []
  const currentId = local.value.id
  const services = servicesResult.status === 'fulfilled'
    ? servicesResult.value?.items ?? []
    : []
  baseServiceOptions.value = services
    .filter(item => item.id != null && item.id !== currentId)
    .map(item => ({
      label: item.name,
      value: item.id,
    }))
}

function onCancel() {
  emit('cancel')
  open.value = false
}

function onDefaultFeeInput(value) {
  local.value.defaultFee = sanitizeStaffCompensationRateInput(value)
}

function onDefaultFeeBlur() {
  const raw = local.value.defaultFee
  if (!String(raw ?? '').trim()) {
    return
  }
  const amount = formatStaffCompensationRateAmount(raw)
  if (amount) {
    local.value.defaultFee = amount
  }
}

function onSave() {
  const nextErrors = validateServiceProcedureForm(local.value, t)
  errors.value = nextErrors
  if (Object.keys(nextErrors).length > 0) {
    return
  }
  emit('save', cloneServiceProcedureForm(local.value))
}
</script>

<style lang="scss" scoped>
.service-procedure-dialog {
  &__body {
    max-height: min(75vh, 720px);
    overflow-y: auto;
  }

  &__desc :deep(textarea.q-field__native) {
    min-height: 40px !important;
    max-height: 40px;
  }
}
</style>
