<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="family-medical-history-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        :info="t('staffLicenseDialogSubtitle')"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('staffLicenseTypeLabel')"
              required>
              <FormSelect
                v-model="local.licenseTypeId"
                outlined
                hide-bottom-space
                emit-value
                map-options
                use-input
                input-debounce="0"
                :readonly="readonly"
                :options="filteredLicenseTypes"
                :placeholder="t('staffLicenseTypeSearchPlaceholder')"
                :error="Boolean(errors.type)"
                :error-message="errors.type"
                :test-id="staffLicenseTestIds.typeField"
                @filter="filterLicenseTypes"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('staffLicenseStateLabel')"
              required>
              <FormSelect
                v-model="local.state"
                outlined
                hide-bottom-space
                emit-value
                map-options
                use-input
                input-debounce="0"
                :readonly="readonly"
                :options="filteredStates"
                :placeholder="t('staffLicenseStateSearchPlaceholder')"
                :error="Boolean(errors.state)"
                :error-message="errors.state"
                :test-id="staffLicenseTestIds.stateField"
                @filter="filterStates"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('staffLicenseIdentifierLabel')"
              required>
              <TextInput
                v-model="local.identifier"
                :external-label="true"
                :disable="readonly"
                :error="Boolean(errors.identifier)"
                :error-message="errors.identifier"
                :test-id="staffLicenseTestIds.numberField"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('staffLicenseExpirationLabel')"
              required>
              <ClientDateField
                v-model="local.expirationDate"
                :readonly="readonly"
                :close-label="t('close')"
                :error="Boolean(errors.expirationDate)"
                :error-message="errors.expirationDate"
                :test-id="staffLicenseTestIds.expirationField"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('staffLicenseStatusLabel')"
              required>
              <FormSelect
                v-model="local.status"
                outlined
                hide-bottom-space
                emit-value
                map-options
                :readonly="readonly"
                :options="statusOptions"
                :error="Boolean(errors.status)"
                :error-message="errors.status"
                :test-id="staffLicenseTestIds.statusField"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('staffLicenseValidFromLabel')">
              <ClientDateField
                v-model="local.validFrom"
                :readonly="readonly"
                :close-label="t('close')"
                :test-id="staffLicenseTestIds.validFromField"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12">
            <FormToggle
              v-model="local.isPrimary"
              :disable="readonly"
              :label="t('staffLicensePrimaryLabel')"
              :test-id="staffLicenseTestIds.primaryToggle"
            />
          </div>
          <div class="col-12">
            <InsuranceCardUploadField
              v-model="attachmentFile"
              :label="t('staffLicenseAttachmentLabel')"
              :readonly="readonly"
              :test-id="staffLicenseTestIds.attachmentField"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('cancel')"
          :data-testid="staffLicenseTestIds.cancelButton"
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
          :data-testid="staffLicenseTestIds.saveButton"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import InsuranceCardUploadField from 'components/InsuranceCardUploadField.vue'
import TextInput from 'components/TextInput.vue'
import { storedFileCategories } from 'components/constants.js'
import { staffLicenseTestIds } from 'src/test-ids/index.js'
import { createEmptyStaffLicense } from 'src/utils/staff-form.js'
import { uploadStoredFile } from 'src/utils/stored-file-api.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  license: {
    type: Object,
    default: null,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  licenseTypeOptions: {
    type: Array,
    default: () => [],
  },
  stateOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const local = ref(createEmptyStaffLicense())
const attachmentFile = ref(null)
const errors = ref({})
const saving = ref(false)
const filteredLicenseTypes = ref([])
const filteredStates = ref([])

const dialogTitle = computed(() =>
  props.license?.id ? t('staffLicenseEditTitle') : t('staffLicenseAddTitle'),
)

const statusOptions = computed(() => [
  { label: t('active'), value: 'Active' },
  { label: t('staffLicenseStatusExpired'), value: 'Expired' },
  { label: t('staffLicenseStatusSuspended'), value: 'Suspended' },
  { label: t('pending'), value: 'Pending' },
  { label: t('staffLicenseStatusInactive'), value: 'Inactive' },
])

const licenseTypeChoices = computed(() => {
  const options = [...(props.licenseTypeOptions ?? [])]
  const currentId = local.value?.licenseTypeId
  if (currentId == null || currentId === '') {
    return options
  }
  const exists = options.some(option =>
    String(option?.value) === String(currentId))
  if (exists) {
    return options
  }

  return [
    {
      label: local.value.licenseTypeName
        || local.value.type
        || String(currentId),
      value: currentId,
      code: local.value.licenseTypeCode || '',
    },
    ...options,
  ]
})

watch(open, visible => {
  if (!visible) {
    return
  }
  local.value = {
    ...createEmptyStaffLicense(),
    ...(props.license ?? {}),
  }
  attachmentFile.value = null
  errors.value = {}
  filteredLicenseTypes.value = licenseTypeChoices.value
  filteredStates.value = props.stateOptions ?? []
})

watch(licenseTypeChoices, options => {
  filteredLicenseTypes.value = options
})

function filterSelectOptions(options, needle) {
  const query = String(needle ?? '').trim().toLowerCase()
  if (!query) {
    return options
  }

  return options.filter(option => {
    const label = String(option?.label ?? '').toLowerCase()
    const code = String(option?.code ?? option?.value ?? '').toLowerCase()

    return label.includes(query) || code.includes(query)
  })
}

function filterLicenseTypes(val, update) {
  update(() => {
    filteredLicenseTypes.value = filterSelectOptions(
      licenseTypeChoices.value,
      val,
    )
  })
}

function filterStates(val, update) {
  update(() => {
    filteredStates.value = filterSelectOptions(
      props.stateOptions ?? [],
      val,
    )
  })
}

function onCancel() {
  open.value = false
}

function validate() {
  const next = {}
  const typeId = local.value.licenseTypeId
  if (typeId == null || typeId === '') {
    next.type = t('staffLicenseTypeRequired')
  }
  if (!String(local.value.identifier ?? '').trim()) {
    next.identifier = t('staffLicenseIdentifierRequired')
  }
  if (!String(local.value.state ?? '').trim()) {
    next.state = t('staffLicenseStateRequired')
  }
  if (!String(local.value.expirationDate ?? '').trim()) {
    next.expirationDate = t('staffLicenseExpirationRequired')
  }
  if (!String(local.value.status ?? '').trim()) {
    next.status = t('staffLicenseStatusRequired')
  }
  errors.value = next

  return Object.keys(next).length === 0
}

async function onSave() {
  if (!validate()) {
    return
  }
  saving.value = true
  try {
    let attachmentFileId = local.value.attachmentFileId ?? null
    if (attachmentFile.value?.file) {
      const uploaded = await uploadStoredFile(
        attachmentFile.value.file,
        storedFileCategories.clinicianProfile,
      )
      attachmentFileId = uploaded?.id ?? attachmentFileId
    }
    const selectedType = (props.licenseTypeOptions ?? []).find(option =>
      String(option?.value) === String(local.value.licenseTypeId))
    emit('save', {
      ...local.value,
      licenseTypeId: local.value.licenseTypeId,
      type: selectedType?.label
        || selectedType?.code
        || local.value.type
        || '',
      licenseTypeName: selectedType?.label || local.value.licenseTypeName || '',
      licenseTypeCode: selectedType?.code || local.value.licenseTypeCode || '',
      attachmentFileId,
    })
    open.value = false
  } finally {
    saving.value = false
  }
}
</script>
