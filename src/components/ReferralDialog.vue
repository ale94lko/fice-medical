<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card referral-dialog">
      <AppDialogHeader :close-label="t('close')" @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p
          v-if="dialogSubtitle"
          class="text-body2 text-grey-7 q-mt-none q-mb-md">
          {{ dialogSubtitle }}
        </p>

        <div class="referral-dialog__section">
          <SubsectionHeading
            :step="1"
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
                  v-model="local.status"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly || statusReadonly"
                  :options="statusOptions"
                  :error="Boolean(errors.status)"
                  :error-message="errors.status"
                  :test-id="tid.field('status')"
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
            :step="2"
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
                  v-model="local.referringProvider"
                  outlined
                  hide-bottom-space
                  use-input
                  fill-input
                  hide-selected
                  input-debounce="0"
                  emit-value
                  map-options
                  new-value-mode="add-unique"
                  :readonly="readonly"
                  :options="providerOptions"
                  :placeholder="t('referralReferringProviderPlaceholder')"
                  :error="Boolean(errors.referringProvider)"
                  :error-message="errors.referringProvider"
                  :data-testid="tid.field('referring-provider')"
                  @new-value="onNewProvider"
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
            :step="2"
            icon="call_made"
            :title="t('referralSectionDestinationOutgoing')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('referralReferredToProvider')"
                :test-id="tid.field('referred-to-provider')">
                <q-select
                  v-model="local.referredToProvider"
                  outlined
                  hide-bottom-space
                  use-input
                  fill-input
                  hide-selected
                  input-debounce="0"
                  emit-value
                  map-options
                  new-value-mode="add-unique"
                  :readonly="readonly"
                  :options="providerOptions"
                  :placeholder="t('referralReferredToProviderPlaceholder')"
                  :error="Boolean(errors.referredToProvider)"
                  :error-message="errors.referredToProvider"
                  :data-testid="tid.field('referred-to-provider')"
                  @new-value="onNewProvider"
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
            :step="3"
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
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('referralDiagnosisProblem')"
                :test-id="tid.field('diagnosis')">
                <q-select
                  v-model="local.diagnosisProblem"
                  outlined
                  hide-bottom-space
                  use-input
                  fill-input
                  hide-selected
                  input-debounce="0"
                  new-value-mode="add-unique"
                  :readonly="readonly"
                  :options="diagnosisOptions"
                  :placeholder="t('referralDiagnosisPlaceholder')"
                  :data-testid="tid.field('diagnosis')"
                  @new-value="onNewDiagnosis"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div class="referral-dialog__section q-mt-lg">
          <SubsectionHeading
            :step="4"
            icon="groups"
            :title="t('referralSectionCoordination')"
          />
          <div class="referral-coordination-grid q-mt-md">
            <FormFieldLabel
              class="referral-coordination-grid__label"
              :label="t('referralAssignedClinician')"
            />
            <div class="referral-coordination-grid__control">
                <FormSelect
                  v-model="local.assignedClinicianId"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
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

        <div class="referral-dialog__section q-mt-lg">
          <SubsectionHeading
            :step="5"
            icon="attach_file"
            :title="t('referralSectionDocumentsOptional')"
          />
          <div class="q-mt-md">
            <ReferralDocumentUploadField
              :attachments="documentRows"
              :readonly="readonly || !canUploadDocuments || !canUploadYet"
              :uploading="documentUploading"
              :hint="!canUploadYet ? t('referralDocumentsAfterSave') : ''"
              :test-id="tid.field('documents')"
              @upload="emit('upload-document', $event)"
              @download="emit('download-document', $event)"
              @remove="emit('delete-document', $event)"
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
          :label="t('close')"
          @click="onCancel"
        />
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="saving"
          :label="t('referralSave')"
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
import FormFieldLabel from 'components/FormFieldLabel.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import ReferralDocumentUploadField from
  'components/ReferralDocumentUploadField.vue'
import ReferralPrioritySelect from 'components/ReferralPrioritySelect.vue'
import {
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
const local = ref(createEmptyReferral())
const errors = ref({})

const diagnosisOptions = [
  'Generalized Anxiety Disorder',
  'Major Depressive Disorder',
  'PTSD',
  'ADHD',
  'Bipolar Disorder',
  'Substance Use Disorder',
]

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

const dialogTitle = computed(() => {
  if (props.mode === 'view') {
    return t('referralViewTitle')
  }
  if (props.mode === 'edit') {
    return t('referralEditTitle')
  }

  return t('referralAddTitle')
})

const dialogSubtitle = computed(() => {
  if (props.mode === 'add') {
    return t('referralAddSubtitle')
  }
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
  (props.clinicianOptions ?? []).map(option => ({
    label: option.label,
    value: option.label,
  })),
)

const documentRows = computed(() =>
  (local.value.files ?? local.value.documents ?? []).map(doc => ({
    id: doc.id,
    name: doc.originalFilename ?? doc.fileName ?? doc.name,
    size: doc.fileSize,
  })),
)

watch(
  () => [props.modelValue, props.referral, props.mode],
  () => {
    if (!props.modelValue) {
      return
    }
    local.value = cloneReferral(props.referral ?? createEmptyReferral())
    if (!local.value.priority) {
      local.value.priority = referralPriorities.routine
    }
    errors.value = {}
  },
  { immediate: true },
)

function enumLabel(prefix, token) {
  const key = referralI18nKey(prefix, token)
  const translated = t(key)
  if (translated !== key) {
    return translated
  }

  return token
}

function onNewProvider(value, done) {
  done(value, 'add-unique')
}

function onNewDiagnosis(value, done) {
  done(value, 'add-unique')
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

function onSave() {
  const nextErrors = validateReferralForm(local.value, t)
  errors.value = nextErrors
  if (referralFormHasErrors(nextErrors)) {
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
