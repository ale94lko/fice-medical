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
              :disable="readonly"
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
        <div class="col-12 col-md-6">
          <AddClientLabeledField :label="t('staffPrimarySpecialtyLabel')">
            <FormSelect
              v-model="clinical.primarySpecialty"
              outlined
              hide-bottom-space
              emit-value
              map-options
              clearable
              :readonly="readonly"
              :options="specialtyOptions"
            />
          </AddClientLabeledField>
        </div>
      </div>

      <div v-if="clinical.taxonomies?.length" class="q-mt-md">
        <p class="text-body2 text-weight-medium q-mb-sm">
          {{ t('staffTaxonomiesTitle') }}
        </p>
        <div class="row q-gutter-sm">
          <q-chip
            v-for="(tax, index) in clinical.taxonomies"
            :key="`tax-${index}`"
            dense
            :color="tax.isPrimary ? 'primary' : 'grey-3'"
            :text-color="tax.isPrimary ? 'white' : 'dark'"
            :icon="tax.isPrimary ? 'star' : undefined">
            {{ taxonomyLabel(tax) }}
          </q-chip>
        </div>
        <p class="text-caption text-grey-7 q-mt-sm q-mb-none">
          {{ t('staffTaxonomiesHint') }}
        </p>
      </div>
    </AccordionSection>

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
      icon="supervisor_account"
      :title="t('staffClinicalSupervisionTitle')">
      <AddClientLabeledField :label="t('staffSupervisorLabel')">
        <FormSelect
          v-model="clinical.supervisorId"
          outlined
          hide-bottom-space
          emit-value
          map-options
          clearable
          :readonly="readonly"
          :options="supervisorOptions"
          :placeholder="t('staffSupervisorPlaceholder')"
        />
        <template #hint>
          {{ t('staffSupervisorHint') }}
        </template>
      </AddClientLabeledField>
    </AccordionSection>

    <StaffLicenseDialog
      v-model="licenseDialogOpen"
      :license="activeLicense"
      :readonly="readonly"
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
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AccordionSection from 'components/AccordionSection.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import FormSelect from 'components/FormSelect.vue'
import ModalComponent from 'components/ModalComponent.vue'
import StaffLicenseDialog from 'components/staff/StaffLicenseDialog.vue'
import StaffLicensesTable from 'components/staff/StaffLicensesTable.vue'
import TextInput from 'components/TextInput.vue'
import {
  createEmptyStaffLicense,
  nextStaffLicenseId,
} from 'src/utils/staff-form.js'

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
  specialtyOptions: {
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
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const licenseDialogOpen = ref(false)
const licenseDeleteOpen = ref(false)
const activeLicense = ref(null)
const pendingDeleteLicenseId = ref(null)

const clinical = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

function taxonomyLabel(tax) {
  const name = tax.displayName ?? tax.display_name ?? tax.code ?? ''
  const code = tax.code ? ` (${tax.code})` : ''

  return `${name}${code}`.trim() || '—'
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

function onLicenseSave(license) {
  const licenses = [...(clinical.value.licenses ?? [])]
  const index = licenses.findIndex(row => row.id === license.id)
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

function confirmDeleteLicense() {
  if (pendingDeleteLicenseId.value != null) {
    removeLicense(pendingDeleteLicenseId.value)
  }
  dismissDeleteLicense()
}

function removeLicense(id) {
  clinical.value = {
    ...clinical.value,
    licenses: (clinical.value.licenses ?? []).filter(row => row.id !== id),
  }
}
</script>
