<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="dialogTestId"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('insurancePayerPlan')"
              required
              :test-id="tid.insuranceField('payer')">
              <q-select
                v-model="payerSelection"
                outlined
                hide-bottom-space
                use-input
                fill-input
                hide-selected
                input-debounce="300"
                emit-value
                map-options
                :readonly="readonly"
                :loading="payerCatalogLoading"
                :options="payerOptions"
                :placeholder="t('insurancePayerPlaceholder')"
                :error="Boolean(fieldError('payer'))"
                :error-message="errorText('payer')"
                :data-testid="tid.insuranceField('payer')"
                @filter="onPayerFilter"
                @input-value="onPayerInput"
                @update:model-value="onPayerSelected">
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </q-select>
              <template #hint>
                {{ t('insurancePayerSearchHint') }}
              </template>
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('insurancePriority')"
              required
              :test-id="tid.insuranceField('priority')">
              <FormSelect
                v-model="local.priority"
                outlined
                hide-bottom-space
                emit-value
                map-options
                :readonly="readonly"
                :options="priorityOptions"
                :placeholder="t('insurancePriorityPlaceholder')"
                :error="Boolean(fieldError('priority'))"
                :error-message="errorText('priority')"
                :test-id="tid.insuranceField('priority')"
              />
            </AddClientLabeledField>
          </div>

          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('insuranceMemberId')"
              required
              :test-id="tid.insuranceField('memberId')">
              <q-input
                v-model="local.memberId"
                outlined
                hide-bottom-space
                :readonly="readonly"
                :placeholder="t('insuranceMemberIdPlaceholder')"
                :maxlength="clientInsuranceMaxMemberIdLength"
                :error="Boolean(fieldError('memberId'))"
                :error-message="errorText('memberId')"
                :data-testid="tid.insuranceField('memberId')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('insuranceType')"
              required
              :test-id="tid.insuranceField('type')">
              <FormSelect
                v-model="local.insuranceType"
                outlined
                hide-bottom-space
                emit-value
                map-options
                :readonly="readonly"
                :options="typeOptions"
                :placeholder="t('insuranceTypePlaceholder')"
                :error="Boolean(fieldError('insuranceType'))"
                :error-message="errorText('insuranceType')"
                :test-id="tid.insuranceField('type')"
              />
            </AddClientLabeledField>
          </div>

          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('insuranceEffectiveDate')"
              required
              :test-id="tid.insuranceField('effectiveDate')">
              <ClientDateField
                v-model="local.policyEffectiveDate"
                :readonly="readonly"
                :error="Boolean(fieldError('policyEffectiveDate'))"
                :error-message="errorText('policyEffectiveDate')"
                :close-label="t('close')"
                :test-id="tid.insuranceField('effectiveDate')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('insuranceExpirationDate')"
              :test-id="tid.insuranceField('expirationDate')">
              <ClientDateField
                v-model="local.policyExpirationDate"
                :readonly="readonly"
                :error="Boolean(fieldError('policyExpirationDate'))"
                :error-message="errorText('policyExpirationDate')"
                :close-label="t('close')"
                :test-id="tid.insuranceField('expirationDate')"
              />
            </AddClientLabeledField>
          </div>

          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('insuranceRelationship')"
              required
              :test-id="tid.insuranceField('relationship')">
              <FormSelect
                v-model="local.relationshipToSubscriber"
                outlined
                hide-bottom-space
                emit-value
                map-options
                :readonly="readonly"
                :options="relationshipOptions"
                :placeholder="t('insuranceRelationshipPlaceholder')"
                :error="Boolean(fieldError('relationshipToSubscriber'))"
                :error-message="errorText('relationshipToSubscriber')"
                :test-id="tid.insuranceField('relationship')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('insuranceSubscriberName')"
              :required="subscriberRequired"
              :test-id="tid.insuranceField('subscriberName')">
              <q-input
                v-model="local.subscriberName"
                outlined
                hide-bottom-space
                :readonly="readonly"
                :placeholder="t('insuranceSubscriberPlaceholder')"
                :maxlength="clientInsuranceMaxSubscriberNameLength"
                :error="Boolean(fieldError('subscriberName'))"
                :error-message="errorText('subscriberName')"
                :data-testid="tid.insuranceField('subscriberName')"
              />
            </AddClientLabeledField>
          </div>
        </div>

        <div class="insurance-dialog__identifiers q-mt-md q-pa-md">
          <p class="insurance-dialog__identifiers-title row items-center">
            <q-icon name="info_outline" size="18px" class="q-mr-xs" />
            {{ t('insuranceIdentifiersTitle') }}
          </p>
          <div class="row q-col-gutter-md q-mt-sm">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('insuranceMedicaidId')"
                :required="medicaidRequired"
                :test-id="tid.insuranceField('medicaidId')">
                <q-input
                  v-model="local.medicaidRecipientId"
                  outlined
                  hide-bottom-space
                  :readonly="readonly"
                  :placeholder="t('insuranceMedicaidPlaceholder')"
                  :maxlength="clientInsuranceMedicaidRecipientIdLength"
                  :error="Boolean(fieldError('medicaidRecipientId'))"
                  :error-message="errorText('medicaidRecipientId')"
                  :data-testid="tid.insuranceField('medicaidId')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('insuranceMedicareId')"
                :required="medicareRequired"
                :test-id="tid.insuranceField('medicareId')">
                <q-input
                  v-model="local.medicareMemberId"
                  outlined
                  hide-bottom-space
                  :readonly="readonly"
                  :placeholder="t('insuranceMedicarePlaceholder')"
                  :maxlength="clientInsuranceMedicareMemberIdLength"
                  :error="Boolean(fieldError('medicareMemberId'))"
                  :error-message="errorText('medicareMemberId')"
                  :data-testid="tid.insuranceField('medicareId')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('insuranceGoldenCardId')"
                :required="goldenCardRequired"
                :test-id="tid.insuranceField('goldenCardId')">
                <q-input
                  v-model="local.goldenCardMemberId"
                  outlined
                  hide-bottom-space
                  :readonly="readonly"
                  :placeholder="t('insuranceGoldenCardPlaceholder')"
                  :maxlength="clientInsuranceGoldenCardMemberIdLength"
                  :error-message="errorText('goldenCardMemberId')"
                  :data-testid="tid.insuranceField('goldenCardId')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('insuranceOtherId')"
                :test-id="tid.insuranceField('otherId')">
                <q-input
                  v-model="local.otherInsuranceId"
                  outlined
                  hide-bottom-space
                  :readonly="readonly"
                  :placeholder="t('insuranceOtherIdPlaceholder')"
                  :maxlength="clientInsuranceMaxMemberIdLength"
                  :error="Boolean(fieldError('otherInsuranceId'))"
                  :error-message="errorText('otherInsuranceId')"
                  :data-testid="tid.insuranceField('otherId')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <AddClientSubsectionHeading
            icon="credit_card"
            :title="t('insuranceCardSectionTitle')"
          />
          <p class="text-body2 text-grey-7 q-mb-md">
            {{ t('insuranceCardSectionSubtitle') }}
          </p>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <InsuranceCardUploadField
                v-model="local.frontCardFile"
                :label="t('insuranceCardFront')"
                :readonly="readonly"
                :error="''"
                :test-id="tid.insuranceField('card-front')"
              />
            </div>
            <div class="col-12 col-md-6">
              <InsuranceCardUploadField
                v-model="local.backCardFile"
                :label="t('insuranceCardBack')"
                :readonly="readonly"
                :error="''"
                :test-id="tid.insuranceField('card-back')"
              />
            </div>
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('insuranceStatus')"
              required
              :test-id="tid.insuranceField('status')">
              <FormSelect
                v-model="local.status"
                outlined
                hide-bottom-space
                emit-value
                map-options
                :readonly="readonly"
                :options="statusOptions"
                :error="Boolean(fieldError('status'))"
                :error-message="errorText('status')"
                :test-id="tid.insuranceField('status')"
              />
            </AddClientLabeledField>
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
          :label="readonly ? t('close') : t('cancel')"
          @click="onCancel"
        />
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :data-testid="saveTestId"
          :label="saveLabel"
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
import AddClientSubsectionHeading from
  'components/AddClientSubsectionHeading.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import InsuranceCardUploadField from 'components/InsuranceCardUploadField.vue'
import {
  clientInsuranceGoldenCardMemberIdLength,
  clientInsuranceMaxMemberIdLength,
  clientInsuranceMaxSubscriberNameLength,
  clientInsuranceMedicaidRecipientIdLength,
  clientInsuranceMedicareMemberIdLength,
  clientInsuranceRelationshipValues,
} from 'components/constants.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'
import {
  applyPayerSelection,
  insurancePriorityOptions,
  insuranceRelationshipOptions,
  insuranceStatusOptions,
  insuranceTypeOptions,
  isSubscriberNameRequired,
  requiresGoldenCardMemberId,
  requiresMedicaidRecipientId,
  requiresMedicareMemberId,
  resolvePayerFromProfile,
  validateInsuranceProfile,
} from 'src/utils/client-insurance.js'
import {
  filterInsurancePayers,
  formatPayerPlanLabel,
} from 'src/utils/insurance-payers.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'add',
  },
  profile: {
    type: Object,
    default: null,
  },
  section: {
    type: Object,
    required: true,
  },
  patientName: {
    type: String,
    default: '',
  },
  payerCatalogItems: {
    type: Array,
    default: () => [],
  },
  payerCatalogLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

const { t } = useI18n()

const local = ref({})
const validationErrors = ref({})
const payerOptions = ref([])
const payerSelection = ref(null)
const payerSearch = ref('')

const priorityOptions = insurancePriorityOptions
const typeOptions = insuranceTypeOptions
const statusOptions = insuranceStatusOptions
const relationshipOptions = insuranceRelationshipOptions

const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const readonly = computed(() => props.mode === 'view')

const dialogTestId = computed(() => {
  if (props.mode === 'view') {
    return tid.insuranceModal('view')
  }
  if (props.mode === 'edit') {
    return tid.insuranceModal('edit')
  }

  return tid.insuranceModal('add')
})

const cancelTestId = computed(() =>
  tid.insuranceModalBtn(props.mode === 'view' ? 'close' : 'cancel'),
)
const saveTestId = computed(() => tid.insuranceModalBtn('save'))

const dialogTitle = computed(() => {
  if (props.mode === 'view') {
    return t('insuranceViewTitle')
  }
  if (props.mode === 'edit') {
    return t('insuranceEditTitle')
  }

  return t('insuranceAddTitle')
})

const saveLabel = computed(() =>
  props.mode === 'edit'
    ? t('insuranceSaveChanges')
    : t('insuranceSaveProfile'),
)

const subscriberRequired = computed(() =>
  isSubscriberNameRequired(local.value.relationshipToSubscriber),
)

const medicaidRequired = computed(() =>
  requiresMedicaidRecipientId(local.value.insuranceType),
)

const medicareRequired = computed(() =>
  requiresMedicareMemberId(local.value.insuranceType),
)

const goldenCardRequired = computed(() =>
  requiresGoldenCardMemberId(local.value.insuranceType),
)

watch(
  () => props.modelValue,
  visible => {
    if (!visible) {
      return
    }
    validationErrors.value = {}
    local.value = JSON.parse(JSON.stringify(props.profile ?? {}))
    syncPayerUiFromProfile()
    syncSubscriberFromRelationship()
  },
)

watch(
  () => props.payerCatalogItems,
  () => {
    if (!props.modelValue) {
      return
    }
    syncPayerUiFromProfile()
  },
  { deep: true },
)

function syncPayerUiFromProfile() {
  const payer = resolvePayerFromProfile(
    local.value,
    props.payerCatalogItems,
  )
  payerSelection.value = payer?.id ?? null
  payerOptions.value = payer
    ? [{
      label: formatPayerPlanLabel(payer),
      value: payer.id,
      payer,
    }]
    : []
}

watch(
  () => local.value.relationshipToSubscriber,
  () => {
    syncSubscriberFromRelationship()
  },
)

watch(
  () => props.patientName,
  () => {
    if (
      local.value.relationshipToSubscriber
      === clientInsuranceRelationshipValues.self
    ) {
      local.value.subscriberName = props.patientName
    }
  },
)

function syncSubscriberFromRelationship() {
  if (
    local.value.relationshipToSubscriber
    === clientInsuranceRelationshipValues.self
  ) {
    local.value.subscriberName = props.patientName
  }
}

function onPayerInput(val) {
  payerSearch.value = val
}

function onPayerFilter(val, update) {
  payerSearch.value = val
  update(() => {
    const matches = filterInsurancePayers(
      val,
      props.payerCatalogItems,
    ).map(item => ({
      label: formatPayerPlanLabel(item),
      value: item.id,
      payer: item,
    }))
    payerOptions.value = matches
  })
}

function onPayerSelected(payerId) {
  const option = payerOptions.value.find(item => item.value === payerId)
  if (option?.payer) {
    applyPayerSelection(local.value, option.payer)
  }
}

function fieldError(key) {
  return validationErrors.value[key] ?? ''
}

function errorText(key) {
  const code = fieldError(key)
  if (!code) {
    return ''
  }

  return t(code)
}

function onCancel() {
  open.value = false
}

function onSave() {
  const option = payerOptions.value.find(
    item => item.value === payerSelection.value,
  )
  if (option?.payer) {
    applyPayerSelection(local.value, option.payer)
  } else if (payerSearch.value.trim().length >= 2) {
    local.value.payerId = null
    local.value.payerName = payerSearch.value.trim()
    local.value.planName = ''
  }

  const result = validateInsuranceProfile(
    local.value,
    props.section,
    { excludeId: local.value.id },
  )
  if (!result.ok) {
    validationErrors.value = result.errors

    return
  }
  validationErrors.value = {}
  emit('save', { ...local.value })
  open.value = false
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.insurance-dialog__identifiers {
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: rgba($primary, 0.03);
}

.insurance-dialog__identifiers-title {
  margin: 0;
  font-weight: 600;
  color: $text-strong;
}
</style>
