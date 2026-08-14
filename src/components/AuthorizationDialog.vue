<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ dialogSubtitle }}
        </p>

        <div class="referral-dialog__section">
          <SubsectionHeading
            icon="info"
            :title="t('authorizationSectionBasic')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                required
                :label="t('authorizationInsurance')"
                :test-id="tid.field('insurance')">
                <FormSelect
                  v-model="local.insuranceProfileId"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly || identityLocked"
                  :options="insuranceOptions"
                  :error="Boolean(errors.insuranceProfileId)"
                  :error-message="errors.insuranceProfileId"
                  :test-id="tid.field('insurance')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                required
                :label="t('authorizationService')"
                :test-id="tid.field('service')">
                <FormSelect
                  v-model="local.serviceId"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly || identityLocked"
                  :options="serviceOptions"
                  :error="Boolean(errors.serviceId)"
                  :error-message="errors.serviceId"
                  :test-id="tid.field('service')"
                />
              </AddClientLabeledField>
              <p
                v-if="serviceMeta"
                class="text-caption text-grey-7 q-mt-xs q-mb-none">
                {{ serviceMeta }}
              </p>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                required
                :label="t('authorizationStatus')"
                :test-id="tid.field('status')">
                <FormSelect
                  v-model="local.status"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly || statusLocked"
                  :options="statusOptions"
                  :error="Boolean(errors.status)"
                  :error-message="errors.status"
                  :test-id="tid.field('status')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                required
                :label="t('authorizationQuantityType')"
                :test-id="tid.field('quantity-type')">
                <FormSelect
                  v-model="local.quantityType"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly"
                  :options="quantityTypeOptions"
                  :error="Boolean(errors.quantityType)"
                  :error-message="errors.quantityType"
                  :test-id="tid.field('quantity-type')"
                />
              </AddClientLabeledField>
            </div>
          </div>
          <q-banner
            v-if="showPendingBanner"
            dense
            rounded
            class="bg-blue-1 text-blue-9 q-mt-md">
            {{ t('authorizationPendingBanner') }}
          </q-banner>
          <q-banner
            v-if="showNotRequiredWarning"
            dense
            rounded
            class="bg-orange-1 text-orange-9 q-mt-md">
            {{ t('authorizationNotRequiredWarning') }}
          </q-banner>
        </div>

        <div class="referral-dialog__section q-mt-lg">
          <SubsectionHeading
            icon="assignment"
            :title="t('authorizationSectionDetails')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('authorizationNumber')"
                :test-id="tid.field('number')">
                <TextInput
                  v-model="local.authorizationNumber"
                  :external-label="true"
                  :readonly="readonly"
                  :placeholder="t('authorizationNumberPlaceholder')"
                  :test-id="tid.field('number')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                required
                :label="t('authorizationRequestedDate')"
                :test-id="tid.field('requested-date')">
                <ClientDateField
                  v-model="local.requestedDate"
                  :readonly="readonly"
                  :error="Boolean(errors.requestedDate)"
                  :error-message="errors.requestedDate"
                  :close-label="t('close')"
                  :test-id="tid.field('requested-date')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                required
                :label="requestedQtyLabel"
                :test-id="tid.field('requested-qty')">
                <TextInput
                  v-model="local.requestedQuantity"
                  type="number"
                  :external-label="true"
                  :readonly="readonly"
                  :error="Boolean(errors.requestedQuantity)"
                  :error-message="errors.requestedQuantity"
                  :test-id="tid.field('requested-qty')"
                />
              </AddClientLabeledField>
              <p class="text-caption text-grey-7 q-mt-xs q-mb-none">
                {{ t('authorizationRequestedHint') }}
              </p>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :required="isApproved"
                :label="approvedQtyLabel"
                :test-id="tid.field('approved-qty')">
                <TextInput
                  v-model="local.approvedQuantity"
                  type="number"
                  :external-label="true"
                  :readonly="readonly || isDenied"
                  :error="Boolean(errors.approvedQuantity)"
                  :error-message="errors.approvedQuantity"
                  :test-id="tid.field('approved-qty')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                required
                :label="t('authorizationStartDate')"
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
                required
                :label="t('authorizationEndDate')"
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
                :label="t('authorizationPriority')"
                :test-id="tid.field('priority')">
                <FormSelect
                  v-model="local.priority"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly"
                  :options="priorityOptions"
                  :test-id="tid.field('priority')"
                />
              </AddClientLabeledField>
            </div>
            <div
              v-if="isDenied"
              class="col-12">
              <AddClientLabeledField
                required
                :label="t('authorizationDenialReason')"
                :test-id="tid.field('denial-reason')">
                <q-input
                  v-model="local.denialReason"
                  outlined
                  type="textarea"
                  rows="3"
                  hide-bottom-space
                  :readonly="readonly"
                  :error="Boolean(errors.denialReason)"
                  :error-message="errors.denialReason"
                  :data-testid="tid.field('denial-reason')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12">
              <AddClientLabeledField
                :label="t('authorizationNotes')"
                :test-id="tid.field('notes')">
                <q-input
                  v-model="local.notes"
                  outlined
                  type="textarea"
                  rows="3"
                  counter
                  hide-bottom-space
                  :maxlength="authorizationNotesMaxLength"
                  :readonly="readonly"
                  :placeholder="t('authorizationNotesPlaceholder')"
                  :data-testid="tid.field('notes')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div class="referral-dialog__section q-mt-lg">
          <SubsectionHeading
            icon="person"
            :title="t('authorizationSectionSupporting')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                required
                :label="t('authorizationProvider')"
                :test-id="tid.field('provider')">
                <ClinicianFormSelect
                  v-model="local.requestingProviderId"
                  :options="clinicianOptions"
                  :readonly="readonly"
                  :error="Boolean(errors.requestingProviderId)"
                  :error-message="errors.requestingProviderId"
                  :test-id="tid.field('provider')"
                />
              </AddClientLabeledField>
              <p class="text-caption text-grey-7 q-mt-xs q-mb-none">
                {{ t('authorizationProviderHint') }}
              </p>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('authorizationVerification')"
                :test-id="tid.field('verification')">
                <FormSelect
                  v-model="local.verificationSource"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  clearable
                  :readonly="readonly"
                  :options="verificationOptions"
                  :test-id="tid.field('verification')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('authorizationTracking')"
                :test-id="tid.field('tracking')">
                <TextInput
                  v-model="local.referenceTrackingNumber"
                  :external-label="true"
                  :readonly="readonly"
                  :placeholder="t('authorizationTrackingPlaceholder')"
                  :test-id="tid.field('tracking')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div class="referral-dialog__section q-mt-lg">
          <SubsectionHeading
            icon="attach_file"
            :title="t('authorizationSectionAttachments')"
          />
          <div class="q-mt-md">
            <ReferralDocumentUploadField
              :attachments="documentRows"
              :readonly="readonly || !canUploadDocuments || !canUploadYet"
              :uploading="documentUploading"
              :hint="uploadHint"
              :test-id="tid.field('documents')"
              @upload="onUpload"
              @download="onDownload"
              @remove="onRemove"
            />
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
          :disable="saving"
          :data-testid="tid.btn('cancel')"
          :label="readonly ? t('close') : t('cancel')"
          @click="onCancel"
        />
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="check"
          :loading="saving"
          :disable="saving || showNotRequiredWarning"
          :label="saveLabel"
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
import TextInput from 'components/TextInput.vue'
import ReferralDocumentUploadField from
  'components/ReferralDocumentUploadField.vue'
import {
  authorizationNotesMaxLength,
  authorizationPriorities,
  authorizationQuantityTypes,
  authorizationRequirementValues,
  authorizationStatuses,
} from 'components/constants.js'
import {
  authorizationVerificationOptions,
  cloneAuthorization,
  createEmptyAuthorization,
  isAuthorizationApproved,
  isAuthorizationDenied,
  isAuthorizationPending,
  quantityUnitLabel,
  validateAuthorizationForm,
} from 'src/utils/authorization-normalize.js'
import { authorizationTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'add',
  },
  authorization: {
    type: Object,
    default: null,
  },
  insuranceOptions: {
    type: Array,
    default: () => [],
  },
  serviceOptions: {
    type: Array,
    default: () => [],
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
  saving: {
    type: Boolean,
    default: false,
  },
  canUploadDocuments: {
    type: Boolean,
    default: false,
  },
  documentUploading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'save',
  'cancel',
  'upload-document',
  'download-document',
  'delete-document',
])

const { t } = useI18n()
const local = ref(createEmptyAuthorization())
const errors = ref({})
const pendingFiles = ref([])

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const isAddMode = computed(() => props.mode === 'add')
const readonly = computed(() => props.mode === 'view'
  || isAuthorizationDenied(local.value.status)
  || String(local.value.status).toUpperCase()
    === authorizationStatuses.cancelled)
const isApproved = computed(() =>
  isAuthorizationApproved(local.value.status))
const isDenied = computed(() => isAuthorizationDenied(local.value.status))
const isPending = computed(() =>
  isAuthorizationPending(local.value.status))
const identityLocked = computed(() =>
  !isAddMode.value && isApproved.value)
const statusLocked = computed(() =>
  !isAddMode.value && !isPending.value)
const showPendingBanner = computed(() =>
  isAddMode.value && isPending.value)
const selectedService = computed(() =>
  (props.serviceOptions ?? []).find(
    option => String(option.value) === String(local.value.serviceId),
  ) ?? null)
const showNotRequiredWarning = computed(() =>
  selectedService.value?.authorizationRequirement
    === authorizationRequirementValues.notUsuallyRequired)
const canUploadYet = computed(() => Boolean(local.value.id))
const documentRows = computed(() => [
  ...(local.value.files ?? []),
  ...pendingFiles.value.map((file, index) => ({
    id: `pending-${index}`,
    name: file.name,
  })),
])
const uploadHint = computed(() => {
  if (!canUploadYet.value) {
    return t('authorizationDocumentsAfterSave')
  }

  return ''
})

const dialogTitle = computed(() => {
  if (props.mode === 'view') {
    return t('authorizationViewTitle')
  }
  if (props.mode === 'edit') {
    return t('authorizationEditTitle')
  }

  return t('authorizationAddTitle')
})

const dialogSubtitle = computed(() =>
  t('authorizationAddSubtitle'))

const saveLabel = computed(() =>
  isAddMode.value
    ? t('authorizationCreate')
    : t('authorizationSave'))

const requestedQtyLabel = computed(() =>
  t('authorizationRequestedQty', {
    unit: quantityUnitLabel(local.value.quantityType, t),
  }))

const approvedQtyLabel = computed(() =>
  t('authorizationApprovedQty', {
    unit: quantityUnitLabel(local.value.quantityType, t),
  }))

const serviceMeta = computed(() => {
  const service = selectedService.value
  if (!service) {
    return ''
  }
  const duration = service.defaultDurationMin
    ? t('authorizationDurationValue', {
      minutes: service.defaultDurationMin,
    })
    : t('authorizationDurationEmpty')
  const cpt = service.cptCode || '—'
  const hcpcs = service.hcpcsCode || '—'

  return t('authorizationServiceMeta', { duration, cpt, hcpcs })
})

const statusOptions = computed(() => [
  {
    label: t('authorizationStatusPending'),
    value: authorizationStatuses.pending,
  },
  {
    label: t('authorizationStatusApproved'),
    value: authorizationStatuses.approved,
  },
  {
    label: t('authorizationStatusDenied'),
    value: authorizationStatuses.denied,
  },
])

const quantityTypeOptions = computed(() => [
  {
    label: t('authorizationQtyVisits'),
    value: authorizationQuantityTypes.visits,
  },
  {
    label: t('authorizationQtyUnits'),
    value: authorizationQuantityTypes.units,
  },
])

const priorityOptions = computed(() => [
  {
    label: t('authorizationPriorityRoutine'),
    value: authorizationPriorities.routine,
  },
  {
    label: t('authorizationPriorityUrgent'),
    value: authorizationPriorities.urgent,
  },
])

const verificationOptions = computed(() =>
  authorizationVerificationOptions.map(value => ({
    value,
    label: verificationLabel(value),
  })))

watch(
  () => [props.modelValue, props.authorization, props.mode],
  () => {
    if (!props.modelValue) {
      return
    }
    local.value = cloneAuthorization(
      props.authorization ?? createEmptyAuthorization(),
    )
    errors.value = {}
    pendingFiles.value = []
  },
)

function verificationLabel(value) {
  const map = {
    PAYER_PORTAL: t('authorizationVerifyPortal'),
    PHONE: t('authorizationVerifyPhone'),
    FAX: t('authorizationVerifyFax'),
    EMAIL: t('authorizationVerifyEmail'),
    OTHER: t('authorizationVerifyOther'),
  }

  return map[value] ?? value
}

function onCancel() {
  open.value = false
  emit('cancel')
}

function onUpload(file) {
  if (local.value.id) {
    emit('upload-document', file)

    return
  }
  pendingFiles.value = [...pendingFiles.value, file]
}

function onDownload(fileId) {
  if (String(fileId).startsWith('pending-')) {
    return
  }
  emit('download-document', fileId)
}

function onRemove(fileId) {
  const token = String(fileId ?? '')
  if (token.startsWith('pending-')) {
    const index = Number.parseInt(token.replace('pending-', ''), 10)
    pendingFiles.value = pendingFiles.value.filter(
      (_, itemIndex) => itemIndex !== index,
    )

    return
  }
  emit('delete-document', fileId)
}

function onSave() {
  if (showNotRequiredWarning.value) {
    return
  }
  const nextErrors = validateAuthorizationForm(local.value, t)
  errors.value = nextErrors
  if (Object.keys(nextErrors).length) {
    return
  }
  emit('save', {
    form: cloneAuthorization(local.value),
    pendingFiles: [...pendingFiles.value],
  })
}
</script>
