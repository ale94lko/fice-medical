<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
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
              :label="t('staffLicenseStateLabel')"
              required>
              <FormSelect
                v-model="local.state"
                outlined
                hide-bottom-space
                emit-value
                map-options
                use-input
                fill-input
                hide-selected
                input-debounce="0"
                :readonly="readonly"
                :options="filteredStates"
                :placeholder="t('staffLicenseStateSearchPlaceholder')"
                :error="Boolean(errors.state)"
                :error-message="errors.state"
                :test-id="staffLicenseTestIds.stateField"
                @filter="filterStates"
                @update:model-value="onIssuingStateChange"
              />
            </AddClientLabeledField>
          </div>
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
                fill-input
                hide-selected
                input-debounce="0"
                :readonly="readonly"
                :disable="readonly || !hasIssuingState"
                :options="filteredLicenseTypes"
                :placeholder="licenseTypePlaceholder"
                :error="Boolean(errors.type)"
                :error-message="errors.type"
                :test-id="staffLicenseTestIds.typeField"
                @filter="filterLicenseTypes"
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
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth-store.js'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import InsuranceCardUploadField from 'components/InsuranceCardUploadField.vue'
import TextInput from 'components/TextInput.vue'
import { storedFileCategories } from 'components/constants.js'
import { usStates } from 'src/data/us-geography.js'
import { staffLicenseTestIds } from 'src/test-ids/index.js'
import { createEmptyStaffLicense } from 'src/utils/staff-form.js'
import {
  apiErrorMessage,
  fetchLicenseTypes,
} from 'src/utils/staff-license-api.js'
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
})

const emit = defineEmits(['update:modelValue', 'save'])

const { t } = useI18n()
const $q = useQuasar()
const authStore = useAuthStore()

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
const loadedLicenseTypes = ref([])

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

const hasIssuingState = computed(() =>
  Boolean(String(local.value?.state ?? '').trim()),
)

const licenseTypePlaceholder = computed(() =>
  hasIssuingState.value
    ? t('staffLicenseTypeSearchPlaceholder')
    : t('staffLicenseTypeSelectStateFirst'),
)

const licenseTypeChoices = computed(() => {
  const options = [...(loadedLicenseTypes.value ?? [])]
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

const stateChoices = computed(() => {
  const options = [...usStates]
  const current = String(local.value?.state ?? '').trim()
  if (!current) {
    return options
  }
  const exists = options.some(option =>
    option.value === current
    || option.label.toLowerCase() === current.toLowerCase())
  if (exists) {
    return options
  }

  return [{ label: current, value: current }, ...options]
})

watch(open, async visible => {
  if (!visible) {
    loadedLicenseTypes.value = []
    return
  }
  local.value = {
    ...createEmptyStaffLicense(),
    ...(props.license ?? {}),
  }
  local.value.state = resolveIssuingStateValue(local.value.state)
    || defaultIssuingState()
  attachmentFile.value = null
  errors.value = {}
  filteredStates.value = stateChoices.value
  await loadTypesForState(local.value.state)
})

watch(stateChoices, options => {
  filteredStates.value = options
})

async function onIssuingStateChange() {
  await loadTypesForState(local.value.state)
  syncTypeToLoadedState()
}

function defaultIssuingState() {
  return resolveIssuingStateValue(authStore.activeSubtenant?.state)
}

async function loadTypesForState(state) {
  const issuingState = String(state ?? '').trim().toUpperCase()
  if (!issuingState) {
    loadedLicenseTypes.value = []
    filteredLicenseTypes.value = []
    return
  }
  try {
    loadedLicenseTypes.value = await fetchLicenseTypes(issuingState)
  } catch (error) {
    loadedLicenseTypes.value = []
    $q.notify({
      type: 'negative',
      message: apiErrorMessage(error, t('failed')),
    })
  }
  filteredLicenseTypes.value = licenseTypeChoices.value
}

function syncTypeToLoadedState() {
  const currentId = local.value?.licenseTypeId
  if (currentId == null || currentId === '') {
    return
  }
  const exists = (loadedLicenseTypes.value ?? []).some(option =>
    String(option?.value) === String(currentId))
  if (exists) {
    return
  }
  local.value.licenseTypeId = null
  local.value.licenseTypeCode = ''
  local.value.licenseTypeName = ''
  local.value.type = ''
}

function resolveIssuingStateValue(raw) {
  const current = String(raw ?? '').trim()
  if (!current) {
    return ''
  }
  const upper = current.toUpperCase()
  const byValue = usStates.find(item => item.value === upper)
  if (byValue) {
    return byValue.value
  }
  const lower = current.toLowerCase()
  const byLabel = usStates.find(
    item => item.label.toLowerCase() === lower,
  )

  return byLabel?.value ?? current
}

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
    filteredStates.value = filterSelectOptions(stateChoices.value, val)
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
    const selectedType = (loadedLicenseTypes.value ?? []).find(option =>
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
