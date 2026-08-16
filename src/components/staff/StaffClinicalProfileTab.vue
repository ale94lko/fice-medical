<template>
  <div class="staff-clinical-profile-tab">
    <AccordionSection
      icon="badge"
      :title="t('staffProfessionalIdentifiersTitle')">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <AddClientLabeledField :label="t('staffNpiLabel')" required>
            <TextInput
              v-model="clinical.npi"
              :external-label="true"
              :disable="npiFieldDisabled"
              :error="Boolean(fieldErrors.npi)"
              :error-message="fieldErrors.npi"
            />
          </AddClientLabeledField>
        </div>
      </div>
    </AccordionSection>

    <q-separator class="section-separator q-my-md" />

    <AccordionSection
      icon="medical_information"
      :title="t('staffProfessionalCredentialsTitle')">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <AddClientLabeledField :label="t('staffCredentialLabel')">
            <FormSelect
              v-model="clinical.credential"
              outlined
              hide-bottom-space
              emit-value
              map-options
              clearable
              :readonly="readonly"
              :options="credentialOptions"
            />
          </AddClientLabeledField>
        </div>
      </div>
    </AccordionSection>

    <q-separator class="section-separator q-my-md" />

    <StaffTaxonomiesSection
      :model-value="clinical.taxonomies"
      :readonly="readonly"
      :field-errors="fieldErrors"
      @update:model-value="onTaxonomiesUpdate"
    />

    <q-separator class="section-separator q-my-md" />

    <AccordionSection
      icon="verified"
      :title="t('staffLicensesTitle')">
      <div class="row items-center q-mb-md">
        <div class="col">
          <p class="text-body2 text-grey-7 q-mb-none">
            {{ t('staffLicensesSubtitle') }}
          </p>
        </div>
        <div v-if="!readonly" class="col-auto">
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :label="t('staffLicenseAddTitle')"
            :data-testid="staffLicenseTestIds.addButton"
            @click="openAddLicense"
          />
        </div>
      </div>

      <div class="add-client-form__fmh-list-card">
        <AdminTablePanel
          class="staff-licenses-table-panel"
          :show-column-settings="false">
          <StaffLicensesTable
            :licenses="clinical.licenses"
            :can-edit="!readonly"
            :can-delete="!readonly"
            :empty-label="t('staffLicensesEmpty')"
            @edit="openEditLicense"
            @delete="openDeleteLicense"
          />
        </AdminTablePanel>
      </div>
    </AccordionSection>

    <q-separator class="section-separator q-my-md" />

    <AccordionSection
      icon="verified_user"
      :title="t('staffClinicalEligibilityTitle')">
      <p class="text-body2 text-grey-7 q-mb-md">
        {{ t('staffClinicalEligibilitySubtitle') }}
      </p>
      <div
        :data-testid="staffLicenseTestIds.eligibility"
        class="staff-clinical-eligibility">
        <div
          v-if="!staffId"
          class="text-grey-7">
          {{ t('staffClinicalEligibilityEmpty') }}
        </div>
        <div
          v-else-if="eligibilityRows.length"
          class="q-gutter-sm">
          <div
            v-for="row in eligibilityRows"
            :key="row.code"
            class="row items-center no-wrap"
            :data-testid="staffLicenseTestIds.eligibilityRow(row.code)">
            <span class="col text-body2">{{ row.label }}</span>
            <AdminTableStatusCell
              :label="row.statusLabel"
              :variant="row.variant"
            />
          </div>
        </div>
        <div
          v-else
          class="text-grey-7">
          {{ t('staffClinicalEligibilityEmpty') }}
        </div>
      </div>
    </AccordionSection>

    <q-separator class="section-separator q-my-md" />

    <AccordionSection
      icon="supervisor_account"
      :title="t('staffClinicalSupervisionTitle')">
      <AddClientLabeledField
        :label="t('staffSupervisorLabel')"
        :required="supervisorRequired">
        <ClinicianFormSelect
          :model-value="clinical.supervisorId"
          clearable
          :readonly="readonly"
          :options="resolvedSupervisorOptions"
          :placeholder="t('staffSupervisorPlaceholder')"
          :error="Boolean(fieldErrors.supervisorId)"
          :error-message="fieldErrors.supervisorId"
          @update:model-value="onSupervisorChange"
        />
        <template #hint>
          {{ supervisorHint }}
        </template>
      </AddClientLabeledField>
    </AccordionSection>

    <StaffLicenseDialog
      v-model="licenseDialogOpen"
      :license="activeLicense"
      :readonly="readonly"
      :license-type-options="licenseTypeOptions"
      :state-options="stateOptions"
      @save="onLicenseSave"
    />

    <ModalComponent
      v-model="licenseDeleteOpen"
      test-id="staff-license-delete"
      :title="t('staffLicenseDeleteTitle')"
      :message="t('staffLicenseDeleteMessage')"
      :confirm-text="t('delete')"
      :cancel-text="t('cancel')"
      @confirm="confirmDeleteLicense"
      @cancel="dismissDeleteLicense"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AccordionSection from 'components/AccordionSection.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import FormSelect from 'components/FormSelect.vue'
import ClinicianFormSelect from 'components/ClinicianFormSelect.vue'
import ModalComponent from 'components/ModalComponent.vue'
import StaffLicenseDialog from 'components/staff/StaffLicenseDialog.vue'
import StaffLicensesTable from 'components/staff/StaffLicensesTable.vue'
import StaffTaxonomiesSection from 'components/staff/StaffTaxonomiesSection.vue'
import TextInput from 'components/TextInput.vue'
import { staffLicenseTestIds } from 'src/test-ids/index.js'
import {
  createEmptyStaffLicense,
  nextStaffLicenseId,
  normalizeStaffLicenseRow,
} from 'src/utils/staff-form.js'
import {
  buildSupervisorSelectOptions,
  isClinicianSupervisorRequired,
} from 'src/utils/clinician-supervisor.js'
import {
  apiErrorMessage,
  createStaffLicense,
  deleteStaffLicense,
  fetchClinicalEligibility,
  fetchLicenseTypes,
  isPersistedStaffLicenseId,
  staffLicenseApiBody,
  updateStaffLicense,
} from 'src/utils/staff-license-api.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  credentialOptions: {
    type: Array,
    default: () => [],
  },
  supervisorOptions: {
    type: Array,
    default: () => [],
  },
  fieldErrors: {
    type: Object,
    default: () => ({}),
  },
  npiReadonly: {
    type: Boolean,
    default: false,
  },
  staffId: {
    type: [Number, String],
    default: null,
  },
  stateOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const $q = useQuasar()

const licenseDialogOpen = ref(false)
const licenseDeleteOpen = ref(false)
const activeLicense = ref(null)
const pendingDeleteLicenseId = ref(null)
const licenseTypeOptions = ref([])
const eligibility = ref([])

const clinical = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const npiFieldDisabled = computed(() =>
  props.readonly || props.npiReadonly,
)

const supervisorRequired = computed(() =>
  isClinicianSupervisorRequired(clinical.value),
)

const supervisorHint = computed(() =>
  supervisorRequired.value
    ? t('staffSupervisorRequiredHint')
    : t('staffSupervisorHint'),
)

const resolvedSupervisorOptions = computed(() =>
  buildSupervisorSelectOptions({
    options: props.supervisorOptions,
    excludeClinicianId: clinical.value?.clinicianId ?? null,
    supervisorId: clinical.value?.supervisorId ?? null,
    supervisorDisplayName: clinical.value?.supervisorDisplayName ?? '',
  }),
)

const eligibilityRows = computed(() =>
  (eligibility.value ?? []).map(row => ({
    code: row.code,
    label: row.name || row.code,
    statusLabel: eligibilityStatusLabel(row.status),
    variant: eligibilityStatusVariant(row.status),
  })),
)

onMounted(() => {
  loadLicenseTypes()
  loadEligibility()
})

watch(() => props.staffId, () => {
  loadEligibility()
})

async function loadLicenseTypes() {
  try {
    licenseTypeOptions.value = await fetchLicenseTypes()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: apiErrorMessage(error, t('failed')),
    })
  }
}

async function loadEligibility() {
  if (!props.staffId) {
    eligibility.value = []
    return
  }
  try {
    const data = await fetchClinicalEligibility(props.staffId)
    eligibility.value = data?.capabilities ?? []
  } catch (error) {
    eligibility.value = []
    $q.notify({
      type: 'negative',
      message: apiErrorMessage(error, t('failed')),
    })
  }
}

function eligibilityStatusLabel(status) {
  const value = String(status ?? '').trim().toUpperCase()
  if (value === 'ALLOWED') {
    return t('staffEligibilityAllowed')
  }
  if (value === 'NOT_ALLOWED') {
    return t('staffEligibilityNotAllowed')
  }
  if (value === 'REQUIRES_LICENSE') {
    return t('staffEligibilityRequiresLicense')
  }
  if (value === 'LICENSE_EXPIRED') {
    return t('staffEligibilityLicenseExpired')
  }
  if (value === 'LICENSE_INACTIVE') {
    return t('staffEligibilityLicenseInactive')
  }

  return value || '—'
}

function eligibilityStatusVariant(status) {
  const value = String(status ?? '').trim().toUpperCase()
  if (value === 'ALLOWED') {
    return 'active'
  }
  if (value === 'REQUIRES_LICENSE') {
    return 'pending'
  }
  if (value === 'NOT_ALLOWED'
    || value === 'LICENSE_EXPIRED'
    || value === 'LICENSE_INACTIVE') {
    return 'cancelled'
  }

  return 'other'
}

function onSupervisorChange(id) {
  const option = resolvedSupervisorOptions.value.find(
    row => String(row?.value) === String(id ?? ''),
  )
  clinical.value = {
    ...clinical.value,
    supervisorId: id ?? null,
    supervisorDisplayName: option?.label || option?.name || '',
  }
}

function onTaxonomiesUpdate(taxonomies) {
  clinical.value = {
    ...clinical.value,
    taxonomies,
  }
}

function openAddLicense() {
  activeLicense.value = {
    ...createEmptyStaffLicense(),
    id: nextStaffLicenseId(),
  }
  licenseDialogOpen.value = true
}

function openEditLicense(row) {
  activeLicense.value = { ...row }
  licenseDialogOpen.value = true
}

async function onLicenseSave(license) {
  const previousId = license.id
  let persisted = license
  if (props.staffId) {
    try {
      persisted = await persistLicense(license)
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: apiErrorMessage(error, t('failed')),
      })
      return
    }
  }
  applyLicenseToForm(persisted, previousId)
  if (props.staffId) {
    loadEligibility()
  }
}

async function persistLicense(license) {
  const body = staffLicenseApiBody(license)
  const saved = isPersistedStaffLicenseId(license.id)
    ? await updateStaffLicense(props.staffId, license.id, body)
    : await createStaffLicense(props.staffId, body)

  return normalizeStaffLicenseRow({
    ...license,
    ...saved,
    id: saved?.id ?? license.id,
  })
}

function applyLicenseToForm(license, previousId) {
  const licenses = [...(clinical.value.licenses ?? [])]
  const licenseId = String(license.id)
  const priorId = previousId == null ? '' : String(previousId)
  const index = licenses.findIndex((row) => {
    const rowId = String(row.id)
    return rowId === licenseId || (priorId && rowId === priorId)
  })
  const normalized = {
    ...license,
    isPrimary: Boolean(license.isPrimary),
  }
  if (normalized.isPrimary) {
    licenses.forEach(row => {
      row.isPrimary = false
    })
  }
  if (index >= 0) {
    licenses[index] = normalized
  } else {
    licenses.push(normalized)
  }
  clinical.value = {
    ...clinical.value,
    licenses,
  }
}

function openDeleteLicense(row) {
  pendingDeleteLicenseId.value = row?.id ?? null
  licenseDeleteOpen.value = true
}

function dismissDeleteLicense() {
  licenseDeleteOpen.value = false
  pendingDeleteLicenseId.value = null
}

async function confirmDeleteLicense() {
  const id = pendingDeleteLicenseId.value
  if (id == null) {
    dismissDeleteLicense()
    return
  }
  if (props.staffId && isPersistedStaffLicenseId(id)) {
    try {
      await deleteStaffLicense(props.staffId, id)
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: apiErrorMessage(error, t('failed')),
      })
      return
    }
    loadEligibility()
  }
  removeLicense(id)
  dismissDeleteLicense()
}

function removeLicense(id) {
  clinical.value = {
    ...clinical.value,
    licenses: (clinical.value.licenses ?? []).filter(row => row.id !== id),
  }
}
</script>
