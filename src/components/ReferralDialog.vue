<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card referral-dialog">
      <AppDialogHeader
        test-id="referral"
        :close-label="t('close')"
        :info="referralHeaderInfo"
        @close="onCancel">
        {{ dialogTitle }}
        <span
          v-if="referralNumberLabel"
          class="text-body2 text-grey-7 q-ml-sm">
          {{ referralNumberLabel }}
        </span>
      </AppDialogHeader>

      <q-card-section
        ref="dialogBodyRef"
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div class="referral-dialog__section">
          <SubsectionHeading
            icon="info"
            :title="t('referralSectionInformation')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('referralType')"
                required
                :test-id="tid.field('type')">
                <FormSelect
                  v-model="local.type"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly || !isAddMode"
                  :options="typeOptions"
                  :error="Boolean(errors.type)"
                  :error-message="errors.type"
                  :test-id="tid.field('type')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('referralDate')"
                required
                :test-id="tid.field('date')">
                <ClientDateField
                  v-model="local.referralDate"
                  :readonly="readonly"
                  :error="Boolean(errors.referralDate)"
                  :error-message="errors.referralDate"
                  :close-label="t('close')"
                  :test-id="tid.field('date')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('status')"
                required
                :test-id="tid.field('status')">
                <FormSelect
                  :model-value="local.status"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly || statusReadonly"
                  :options="statusOptions"
                  :error="Boolean(errors.status)"
                  :error-message="errors.status"
                  :test-id="tid.field('status')"
                  @update:model-value="onStatusChange"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('referralPriority')"
                :test-id="tid.field('priority')">
                <ReferralPrioritySelect
                  v-model="local.priority"
                  :readonly="readonly"
                  :disable="readonly"
                  :test-id="tid.field('priority')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div
          v-if="isIncoming"
          class="referral-dialog__section q-mt-lg">
          <SubsectionHeading
            icon="call_received"
            :title="t('referralSectionSourceIncoming')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('referralReferringProvider')"
                required
                :test-id="tid.field('referring-provider')">
                <q-select
                  :model-value="local.referringProvider"
                  outlined
                  hide-bottom-space
                  use-input
                  fill-input
                  hide-selected
                  input-debounce="0"
                  :readonly="readonly"
                  :options="filteredProviderOptions"
                  :placeholder="t('referralReferringProviderPlaceholder')"
                  :error="Boolean(errors.referringProvider)"
                  :error-message="errors.referringProvider"
                  :data-testid="tid.field('referring-provider')"
                  @filter="onProviderFilter"
                  @input-value="onReferringProviderInput"
                  @update:model-value="onReferringProviderSelect"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('referralReferringOrganization')"
                :test-id="tid.field('referring-organization')">
                <q-input
                  v-model="local.referringOrganization"
                  outlined
                  hide-bottom-space
                  :readonly="readonly"
                  :maxlength="referralOrganizationMaxLength"
                  :placeholder="t('referralReferringOrganizationPlaceholder')"
                  :data-testid="tid.field('referring-organization')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('referralSpecialty')"
                :test-id="tid.field('specialty')">
                <q-input
                  v-model="local.specialty"
                  outlined
                  hide-bottom-space
                  :readonly="readonly"
                  :maxlength="referralSpecialtyMaxLength"
                  :placeholder="t('referralSpecialtyPlaceholder')"
                  :data-testid="tid.field('specialty')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('referralPhone')"
                :test-id="tid.field('phone')">
                <q-input
                  :model-value="local.phone"
                  outlined
                  hide-bottom-space
                  maxlength="14"
                  :readonly="readonly"
                  :placeholder="t('phoneNumberPlaceholder')"
                  :error="Boolean(errors.phone)"
                  :error-message="errors.phone"
                  :data-testid="tid.field('phone')"
                  @keydown="onPhoneKeydown"
                  @update:model-value="onPhoneInput"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('referralEmail')"
                :test-id="tid.field('email')">
                <q-input
                  v-model="local.email"
                  outlined
                  hide-bottom-space
                  :readonly="readonly"
                  :placeholder="t('referralEmailPlaceholder')"
                  :error="Boolean(errors.email)"
                  :error-message="errors.email"
                  :data-testid="tid.field('email')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div
          v-if="isOutgoing"
          class="referral-dialog__section q-mt-lg">
          <SubsectionHeading
            icon="call_made"
            :title="t('referralSectionDestinationOutgoing')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('referralReferredToProvider')"
                :test-id="tid.field('referred-to-provider')">
                <q-select
                  :model-value="local.referredToProvider"
                  outlined
                  hide-bottom-space
                  use-input
                  fill-input
                  hide-selected
                  input-debounce="0"
                  :readonly="readonly"
                  :options="filteredProviderOptions"
                  :placeholder="t('referralReferredToProviderPlaceholder')"
                  :error="Boolean(errors.referredToProvider)"
                  :error-message="errors.referredToProvider"
                  :data-testid="tid.field('referred-to-provider')"
                  @filter="onProviderFilter"
                  @input-value="onReferredToProviderInput"
                  @update:model-value="onReferredToProviderSelect"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('referralReferredToOrganization')"
                :test-id="tid.field('referred-to-organization')">
                <q-input
                  v-model="local.referredToOrganization"
                  outlined
                  hide-bottom-space
                  :readonly="readonly"
                  :maxlength="referralOrganizationMaxLength"
                  :placeholder="t('referralReferredToOrganizationPlaceholder')"
                  :data-testid="tid.field('referred-to-organization')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('referralSpecialty')"
                :test-id="tid.field('specialty')">
                <q-input
                  v-model="local.specialty"
                  outlined
                  hide-bottom-space
                  :readonly="readonly"
                  :maxlength="referralSpecialtyMaxLength"
                  :placeholder="t('referralSpecialtyPlaceholder')"
                  :data-testid="tid.field('specialty')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div class="referral-dialog__section q-mt-lg">
          <SubsectionHeading
            icon="medical_services"
            :title="t('referralSectionClinicalContext')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12">
              <AddClientLabeledField
                :label="t('referralReasonFor')"
                required
                :test-id="tid.field('reason')">
                <q-input
                  v-model="local.reason"
                  outlined
                  hide-bottom-space
                  type="textarea"
                  autogrow
                  :readonly="readonly"
                  :maxlength="referralReasonMaxLength"
                  :placeholder="t('referralReasonPlaceholder')"
                  :error="Boolean(errors.reason)"
                  :error-message="errors.reason"
                  :data-testid="tid.field('reason')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12">
              <AddClientLabeledField
                :label="t('referralDiagnosisProblem')"
                :test-id="tid.field('diagnosis')">
                <ReferralDiagnosesField
                  v-model="local.diagnoses"
                  :readonly="readonly"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div class="referral-dialog__section q-mt-lg">
          <SubsectionHeading
            icon="groups"
            :title="t('referralSectionCoordination')"
          />
          <div class="referral-coordination-grid q-mt-md">
            <FormFieldLabel
              class="referral-coordination-grid__label"
              :label="t('referralAssignedClinician')"
            />
            <div class="referral-coordination-grid__control">
                <ClinicianFormSelect
                  v-model="local.assignedClinicianId"
                  clearable
                  :readonly="readonly"
                  :options="clinicianOptions"
                  :placeholder="t('referralClinicianPlaceholder')"
                  :error="Boolean(errors.assignedClinicianId)"
                  :error-message="errors.assignedClinicianId"
                  :test-id="tid.field('clinician')"
                />
            </div>
            <div class="toggle-field referral-coordination-grid__toggle">
              <FormToggle
                v-model="local.followUpRequired"
                :label="t('referralFollowUpRequired')"
                :disable="readonly"
                :test-id="tid.field('follow-up')"
              />
            </div>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="attach_file"
            :title="t('labAttachmentsTitle')"
          />
          <p
            v-if="!canUploadYet"
            class="text-caption text-grey-7 q-mb-none q-mt-sm">
            {{ t('referralDocumentsAfterSave') }}
          </p>
          <LabAttachmentUploadField
            class="q-mt-md"
            :attachments="documentRows"
            :readonly="attachmentsReadonly"
            :test-id="tid.field('documents')"
            @upload="onUploadDocument"
            @remove="emit('delete-document', $event)"
            @preview="onPreviewDocument"
            @download="emit('download-document', $event)"
          />
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          type="button"
          color="primary"
          class="app-btn-outline"
          :label="t('close')"
          :data-testid="tid.btn('close')"
          @click="onCancel"
        />
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          type="button"
          color="primary"
          class="app-btn-primary"
          :loading="saving"
          :label="t('referralSave')"
          :data-testid="tid.btn('save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>

    <ClientAttachmentPreviewDialog
      v-model="previewOpen"
      :file="previewFile"
    />
  </q-dialog>

  <CarePlanReasonDialog
    v-model="reasonOpen"
    :title="reasonTitle"
    :message="reasonMessage"
    :reason-label="reasonLabel"
    :confirm-label="t('save')"
    reason-field="status-reason"
    @confirm="onStatusReasonConfirm"
  />
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormFieldLabel from 'components/FormFieldLabel.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import ClinicianFormSelect from 'components/ClinicianFormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import ClientAttachmentPreviewDialog from
  'components/ClientAttachmentPreviewDialog.vue'
import LabAttachmentUploadField from
  'components/LabAttachmentUploadField.vue'
import ReferralDiagnosesField from
  'components/ReferralDiagnosesField.vue'
import ReferralPrioritySelect from 'components/ReferralPrioritySelect.vue'
import CarePlanReasonDialog from 'components/CarePlanReasonDialog.vue'
import {
  quasarNotifyTypes,
  referralOrganizationMaxLength,
  referralPriorities,
  referralReasonMaxLength,
  referralSpecialtyMaxLength,
  referralStatuses,
  referralTypes,
} from 'components/constants.js'
import { referralI18nKey } from 'src/utils/referral-i18n.js'
import {
  cloneReferral,
  createEmptyReferral,
} from 'src/utils/referral-orders.js'
import { formatPhoneUs } from 'src/utils/client-contact-form.js'
import {
  firstReferralFormErrorKey,
  referralFormHasErrors,
  validateReferralForm,
} from 'src/utils/referral-validation.js'
import { referralTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'add',
    validator: value => ['add', 'edit', 'view'].includes(value),
  },
  referral: {
    type: Object,
    default: null,
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
    default: true,
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
const $q = useQuasar()
const local = ref(createEmptyReferral())
const errors = ref({})
const dialogBodyRef = ref(null)
const filteredProviderOptions = ref([])
const reasonOpen = ref(false)
const pendingStatus = ref(null)
const previewOpen = ref(false)
const previewFile = ref(null)

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const readonly = computed(() => props.mode === 'view')
const isAddMode = computed(() => props.mode === 'add')
const isIncoming = computed(() => local.value.type === referralTypes.incoming)
const isOutgoing = computed(() => local.value.type === referralTypes.outgoing)
const statusReadonly = computed(() =>
  local.value.status === referralStatuses.closed
  || local.value.status === referralStatuses.declined,
)
const canUploadYet = computed(() => Boolean(local.value.id))
const attachmentsReadonly = computed(() =>
  readonly.value
  || !props.canUploadDocuments
  || !canUploadYet.value,
)

const dialogTitle = computed(() => {
  if (props.mode === 'view') {
    return t('referralViewTitle')
  }
  if (props.mode === 'edit') {
    return t('referralEditTitle')
  }

  return t('referralAddTitle')
})

const referralHeaderInfo = computed(() => {
  if (props.mode === 'add') {
    return t('referralAddSubtitle')
  }

  return ''
})

const referralNumberLabel = computed(() => {
  if (props.mode === 'view' && local.value.referralNumber) {
    return local.value.referralNumber
  }

  return ''
})

const typeOptions = computed(() => [
  { label: t('referralTypeIncoming'), value: referralTypes.incoming },
  { label: t('referralTypeOutgoing'), value: referralTypes.outgoing },
])

const statusOptions = computed(() =>
  Object.values(referralStatuses).map(value => ({
    label: enumLabel('referralStatus', value),
    value,
  })),
)

const providerOptions = computed(() =>
  (props.clinicianOptions ?? [])
    .map(option => String(option.label ?? option.name ?? '').trim())
    .filter(Boolean),
)

const reasonTitle = computed(() => (
  pendingStatus.value === referralStatuses.declined
    ? t('referralDeclineReasonTitle')
    : t('referralCloseReasonTitle')
))

const reasonMessage = computed(() => (
  pendingStatus.value === referralStatuses.declined
    ? t('referralDeclineReasonMessage')
    : t('referralCloseReasonMessage')
))

const reasonLabel = computed(() => (
  pendingStatus.value === referralStatuses.declined
    ? t('referralDeclineReasonLabel')
    : t('referralCloseReasonLabel')
))

const documentRows = computed(() =>
  (local.value.files ?? local.value.documents ?? []).map(doc => ({
    ...doc,
    id: doc.id,
    name: doc.originalFilename ?? doc.fileName ?? doc.name,
    originalFilename: doc.originalFilename ?? doc.fileName ?? doc.name,
    contentType: doc.contentType
      ?? doc.mimeType
      ?? doc.mediaType
      ?? '',
  })),
)

watch(
  () => [props.modelValue, props.referral, props.mode],
  () => {
    if (!props.modelValue) {
      previewOpen.value = false
      previewFile.value = null

      return
    }
    local.value = cloneReferral(props.referral ?? createEmptyReferral())
    if (!Array.isArray(local.value.diagnoses)) {
      local.value.diagnoses = []
    }
    if (!local.value.priority) {
      local.value.priority = referralPriorities.routine
    }
    filteredProviderOptions.value = [...providerOptions.value]
    errors.value = {}
  },
  { immediate: true },
)

watch(
  reasonOpen,
  open => {
    if (!open && pendingStatus.value) {
      pendingStatus.value = null
    }
  },
)

function enumLabel(prefix, token) {
  const key = referralI18nKey(prefix, token)
  const translated = t(key)
  if (translated !== key) {
    return translated
  }

  return token
}

function onProviderFilter(val, update) {
  update(() => {
    const needle = String(val ?? '').trim().toLowerCase()
    const list = providerOptions.value
    filteredProviderOptions.value = needle
      ? list.filter(label => label.toLowerCase().includes(needle))
      : [...list]
  })
}

function onReferringProviderInput(value) {
  local.value.referringProvider = String(value ?? '')
}

function onReferringProviderSelect(value) {
  local.value.referringProvider = String(value ?? '')
}

function onReferredToProviderInput(value) {
  local.value.referredToProvider = String(value ?? '')
}

function onReferredToProviderSelect(value) {
  local.value.referredToProvider = String(value ?? '')
}

function onStatusChange(next) {
  const status = String(next ?? '').toUpperCase()
  const current = String(local.value.status ?? '').toUpperCase()
  if (status === current) {
    return
  }
  if (
    status === referralStatuses.declined
    || status === referralStatuses.closed
  ) {
    pendingStatus.value = status
    reasonOpen.value = true

    return
  }
  local.value.status = status
  local.value.statusReason = ''
}

function onStatusReasonConfirm(reason) {
  if (!pendingStatus.value) {
    return
  }
  local.value.status = pendingStatus.value
  local.value.statusReason = String(reason ?? '').trim()
  pendingStatus.value = null
}

function onUploadDocument(file) {
  if (!canUploadYet.value || !file) {
    return
  }
  emit('upload-document', file)
}

function onPreviewDocument(file) {
  previewFile.value = file
  previewOpen.value = true
}

function onPhoneInput(value) {
  local.value.phone = formatPhoneUs(value)
}

function onPhoneKeydown(evt) {
  const controlKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
  ]
  if (controlKeys.includes(evt.key) || evt.ctrlKey || evt.metaKey) {
    return
  }
  if (!/^\d$/.test(evt.key)) {
    evt.preventDefault()
  }
}

function onCancel() {
  emit('cancel')
  open.value = false
}

function dialogBodyEl() {
  const node = dialogBodyRef.value
  if (!node) {
    return null
  }
  if (node instanceof Element) {
    return node
  }

  return node.$el ?? null
}

const REFERRAL_ERROR_FIELD_IDS = {
  type: 'type',
  referralDate: 'date',
  status: 'status',
  referringProvider: 'referring-provider',
  referredToProvider: 'referred-to-provider',
  phone: 'phone',
  email: 'email',
  reason: 'reason',
  assignedClinicianId: 'clinician',
}

function nativeControl(field) {
  return field?.querySelector?.(
    'input:not([type="hidden"]), textarea, select, .q-field__native',
  ) ?? null
}

function focusFirstInvalidField(nextErrors) {
  const errorKey = firstReferralFormErrorKey(nextErrors)
  const fieldName = REFERRAL_ERROR_FIELD_IDS[errorKey]
  const root = dialogBodyEl()
  if (!fieldName || !root?.querySelector) {
    return
  }
  const field = root.querySelector(
    `[data-testid="${tid.field(fieldName)}"]`,
  )
  if (!field) {
    return
  }
  field.scrollIntoView({
    block: 'center',
    behavior: 'smooth',
  })
  const control = nativeControl(field)
  if (control && typeof control.focus === 'function') {
    control.focus({ preventScroll: true })
  }
}

function onSave() {
  const nextErrors = validateReferralForm(local.value, t)
  errors.value = nextErrors
  if (referralFormHasErrors(nextErrors)) {
    const errorKey = firstReferralFormErrorKey(nextErrors)
    const firstError = errorKey ? nextErrors[errorKey] : null
    if (firstError) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: firstError,
        position: 'top',
      })
    }
    void nextTick(() => {
      focusFirstInvalidField(nextErrors)
    })

    return
  }
  emit('save', cloneReferral(local.value))
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.referral-coordination-grid {
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 16px;

  &__label {
    grid-column: 1;
    grid-row: 1;
  }

  &__control {
    grid-column: 1;
    grid-row: 2;
    width: 100%;

    :deep(.q-field) {
      width: 100%;
    }
  }

  &__toggle {
    grid-column: 1;
    grid-row: 3;
    margin-top: 16px;
  }

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;

    &__toggle {
      grid-column: 2;
      grid-row: 2;
      align-self: center;
      margin-top: 0;
      height: $app-input-height;
    }
  }
}
</style>
