<template>
  <div class="service-procedure-requirements">
    <div class="row items-center justify-between q-mb-md">
      <SubsectionHeading
        icon="checklist"
        :title="t('serviceProcedureSectionRequirements')"
      />
      <q-btn
        v-if="canManage && !readonly"
        no-caps
        unelevated
        color="primary"
        class="app-btn-primary"
        icon="add"
        :label="t('serviceProcedureRequirementAdd')"
        :disable="!serviceProcedureId"
        :data-testid="
          serviceProcedureDialogTestIds.btn('add-requirement')"
        @click="openCreate"
      />
    </div>

    <p
      v-if="!serviceProcedureId"
      class="text-body2 text-grey-7">
      {{ t('serviceProcedureRequirementSaveFirst') }}
    </p>
    <AppLoadingOverlay
      v-else
      scope="local"
      :showing="loading"
      compact
    />

    <AdminTablePanel
      v-if="serviceProcedureId && !loading"
      class="service-procedure-requirements-table-panel
        admin-table-panel--wide"
      :show-column-settings="false">
      <ServiceProcedureRequirementsTable
        :rows="tableRows"
        :can-edit="canManage && !readonly"
        :can-delete="canManage && !readonly"
        :empty-label="t('serviceProcedureRequirementEmpty')"
        @edit="openEdit"
        @delete="onDelete"
      />
    </AdminTablePanel>

    <q-dialog
      v-model="formOpen"
      persistent
      transition-show="scale"
      transition-hide="scale">
      <q-card
        class="family-medical-history-dialog app-dialog-card"
        :data-testid="serviceProcedureDialogTestIds.requirementDialog">
        <AppDialogHeader
          :close-label="t('close')"
          :test-id="serviceProcedureDialogTestIds.requirementDialog"
          @close="formOpen = false">
          {{ formTitle }}
        </AppDialogHeader>
        <q-card-section
          class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <FormField
                :label="t('serviceProcedureRequirementType')"
                required>
                <FormSelect
                  v-model="form.requirementType"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :options="typeOptions"
                  :test-id="serviceProcedureDialogTestIds
                    .requirementField('type')"
                />
              </FormField>
            </div>
            <div class="col-12 col-md-6">
              <FormField
                :label="t('serviceProcedureRequirementPurpose')"
                required>
                <FormSelect
                  v-model="form.purpose"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :options="purposeOptions"
                  :test-id="serviceProcedureDialogTestIds
                    .requirementField('purpose')"
                />
              </FormField>
            </div>
            <div class="col-12 col-md-6">
              <FormField
                :label="t('serviceProcedureRequirementSeverity')"
                required>
                <FormSelect
                  v-model="form.severity"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :options="severityOptions"
                  :test-id="serviceProcedureDialogTestIds
                    .requirementField('severity')"
                />
              </FormField>
            </div>
            <div class="col-12 col-md-6">
              <FormField
                :label="t('serviceProcedureRequirementScope')">
                <FormSelect
                  v-model="form.scope"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :options="scopeOptions"
                  :test-id="serviceProcedureDialogTestIds
                    .requirementField('scope')"
                />
              </FormField>
            </div>
            <div
              v-if="needsReference"
              class="col-12 col-md-6">
              <FormField
                :label="t('serviceProcedureRequirementReferenceId')"
                required>
                <TextInput
                  v-model="form.referenceId"
                  type="number"
                  :external-label="true"
                  :test-id="serviceProcedureDialogTestIds
                    .requirementField('reference-id')"
                  :error="Boolean(formErrors.referenceId)"
                  :error-message="formErrors.referenceId"
                />
              </FormField>
            </div>
            <div class="col-12 col-md-6">
              <FormField
                :label="t('serviceProcedureRequirementOrder')">
                <TextInput
                  v-model="form.displayOrder"
                  type="number"
                  :external-label="true"
                  :test-id="serviceProcedureDialogTestIds
                    .requirementField('display-order')"
                />
              </FormField>
            </div>
            <div class="col-12">
              <FormField
                :label="t('serviceProcedureRequirementNameOverride')">
                <TextInput
                  v-model="form.nameOverride"
                  :external-label="true"
                  :test-id="serviceProcedureDialogTestIds
                    .requirementField('name-override')"
                />
              </FormField>
            </div>
            <div class="col-12 col-md-4">
              <FormToggle
                v-model="form.required"
                :label="t('serviceProcedureRequirementRequired')"
              />
            </div>
            <div class="col-12 col-md-4">
              <FormToggle
                v-model="form.waivable"
                :label="t('serviceProcedureRequirementWaivable')"
              />
            </div>
            <div class="col-12 col-md-4">
              <FormToggle
                v-model="form.active"
                :label="t('serviceProcedureRequirementActive')"
              />
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="app-dialog-card__actions">
          <q-btn
            no-caps
            flat
            class="app-btn-outline"
            :data-testid="serviceProcedureDialogTestIds
              .btn('requirement-cancel')"
            :label="t('cancel')"
            @click="formOpen = false"
          />
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :loading="saving"
            :data-testid="serviceProcedureDialogTestIds
              .btn('requirement-save')"
            :label="t('save')"
            @click="onSaveForm"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  encounterRequirementPurposes,
  encounterRequirementScopes,
  encounterRequirementSeverities,
  encounterRequirementTypes,
  permissionNames,
  quasarNotifyTypes,
} from 'components/constants.js'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import FormField from 'components/FormField.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import TextInput from 'components/TextInput.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import ServiceProcedureRequirementsTable from
  'components/admin/ServiceProcedureRequirementsTable.vue'
import { serviceProcedureDialogTestIds } from 'src/test-ids/index.js'
import { useAuthStore } from 'stores/auth-store.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { hasPermission } from 'src/utils/auth-permissions.js'
import {
  createServiceProcedureRequirement,
  deleteServiceProcedureRequirement,
  listServiceProcedureRequirements,
  serviceProcedureApiErrorMessage,
  updateServiceProcedureRequirement,
} from 'src/utils/service-procedure-api.js'

const props = defineProps({
  serviceProcedureId: {
    type: [Number, String],
    default: null,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()
const $q = useQuasar()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const items = ref([])
const formOpen = ref(false)
const editingId = ref(null)
const formErrors = ref({})
const form = ref(emptyForm())

const canManage = computed(() =>
  hasPermission(
    authStore.permissions,
    permissionNames.manageServiceRequirements,
  )
  || hasPermission(
    authStore.permissions,
    permissionNames.editCatalog,
  ),
)

const needsReference = computed(() => {
  const type = String(form.value.requirementType || '').toUpperCase()

  return type === encounterRequirementTypes.assessment
    || type === encounterRequirementTypes.form
    || type === encounterRequirementTypes.safetyAssessment
})

const formTitle = computed(() =>
  editingId.value
    ? t('serviceProcedureRequirementEdit')
    : t('serviceProcedureRequirementAdd'),
)

const tableRows = computed(() => items.value.map(item => ({
  ...item,
  typeLabel: typeLabel(item.requirementType),
  purposeLabel: purposeLabel(item.purpose),
  severityLabel: severityLabel(item.severity),
})))

const typeOptions = computed(() => [
  {
    label: t('serviceProcedureRequirementTypeVitals'),
    value: encounterRequirementTypes.vitals,
  },
  {
    label: t('serviceProcedureRequirementTypeNote'),
    value: encounterRequirementTypes.note,
  },
  {
    label: t('serviceProcedureRequirementTypeAssessment'),
    value: encounterRequirementTypes.assessment,
  },
  {
    label: t('serviceProcedureRequirementTypeForm'),
    value: encounterRequirementTypes.form,
  },
  {
    label: t('serviceProcedureRequirementTypeSafety'),
    value: encounterRequirementTypes.safetyAssessment,
  },
  {
    label: t('serviceProcedureRequirementTypeMedReview'),
    value: encounterRequirementTypes.medicationReview,
  },
  {
    label: t('serviceProcedureRequirementTypeCarePlan'),
    value: encounterRequirementTypes.carePlanReview,
  },
  {
    label: t('serviceProcedureRequirementTypeDiagnosis'),
    value: encounterRequirementTypes.diagnosis,
  },
])

const purposeOptions = computed(() => [
  {
    label: t('serviceProcedureRequirementPurposeCompletion'),
    value: encounterRequirementPurposes.encounterCompletion,
  },
  {
    label: t('serviceProcedureRequirementPurposeBilling'),
    value: encounterRequirementPurposes.billingReadiness,
  },
])

const severityOptions = computed(() => [
  {
    label: t('serviceProcedureRequirementSeverityBlocking'),
    value: encounterRequirementSeverities.blocking,
  },
  {
    label: t('serviceProcedureRequirementSeverityWarning'),
    value: encounterRequirementSeverities.warning,
  },
])

const scopeOptions = computed(() => [
  {
    label: t('serviceProcedureRequirementScopeService'),
    value: encounterRequirementScopes.service,
  },
  {
    label: t('serviceProcedureRequirementScopeEncounter'),
    value: encounterRequirementScopes.encounter,
  },
])

watch(
  () => props.serviceProcedureId,
  () => {
    void loadItems()
  },
  { immediate: true },
)

function emptyForm() {
  return {
    requirementType: encounterRequirementTypes.vitals,
    purpose: encounterRequirementPurposes.encounterCompletion,
    scope: encounterRequirementScopes.service,
    severity: encounterRequirementSeverities.blocking,
    referenceType: 'SCREENING_TEMPLATE',
    referenceId: '',
    requiredState: '',
    required: true,
    displayOrder: 0,
    waivable: false,
    nameOverride: '',
    active: true,
  }
}

function typeLabel(value) {
  const found = typeOptions.value.find(option => option.value === value)

  return found?.label || value || '—'
}

function purposeLabel(value) {
  const found = purposeOptions.value.find(option => option.value === value)

  return found?.label || value || '—'
}

function severityLabel(value) {
  const found = severityOptions.value.find(option => option.value === value)

  return found?.label || value || '—'
}

async function loadItems() {
  const id = props.serviceProcedureId
  if (id == null || id === '') {
    items.value = []

    return
  }
  loading.value = true
  try {
    items.value = await listServiceProcedureRequirements(id)
  } catch (error) {
    items.value = []
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: serviceProcedureApiErrorMessage(
          error,
          t('serviceProcedureRequirementLoadError'),
        ),
      })
    }
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  formErrors.value = {}
  formOpen.value = true
}

function openEdit(item) {
  editingId.value = item.id
  form.value = {
    requirementType: item.requirementType,
    purpose: item.purpose,
    scope: item.scope,
    severity: item.severity,
    referenceType: item.referenceType || 'SCREENING_TEMPLATE',
    referenceId: item.referenceId ?? '',
    requiredState: item.requiredState || '',
    required: item.required !== false,
    displayOrder: item.displayOrder ?? 0,
    waivable: item.waivable === true,
    nameOverride: item.nameOverride || '',
    active: item.active !== false,
  }
  formErrors.value = {}
  formOpen.value = true
}

function validateForm() {
  const errors = {}
  if (needsReference.value) {
    const refId = Number(form.value.referenceId)
    if (!Number.isFinite(refId) || refId <= 0) {
      errors.referenceId = t('serviceProcedureRequirementReferenceRequired')
    }
  }
  formErrors.value = errors

  return Object.keys(errors).length === 0
}

async function onSaveForm() {
  if (!validateForm() || props.serviceProcedureId == null) {
    return
  }
  saving.value = true
  try {
    const payload = {
      ...form.value,
      referenceId: form.value.referenceId === ''
        ? null
        : Number(form.value.referenceId),
      displayOrder: Number(form.value.displayOrder) || 0,
    }
    if (editingId.value != null) {
      await updateServiceProcedureRequirement(
        props.serviceProcedureId,
        editingId.value,
        payload,
      )
    } else {
      await createServiceProcedureRequirement(
        props.serviceProcedureId,
        payload,
      )
    }
    formOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('serviceProcedureRequirementSaved'),
    })
    await loadItems()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: serviceProcedureApiErrorMessage(
          error,
          t('serviceProcedureRequirementSaveError'),
        ),
      })
    }
  } finally {
    saving.value = false
  }
}

async function onDelete(item) {
  if (props.serviceProcedureId == null || item?.id == null) {
    return
  }
  saving.value = true
  try {
    await deleteServiceProcedureRequirement(
      props.serviceProcedureId,
      item.id,
    )
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('serviceProcedureRequirementDeleted'),
    })
    await loadItems()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: serviceProcedureApiErrorMessage(
          error,
          t('serviceProcedureRequirementDeleteError'),
        ),
      })
    }
  } finally {
    saving.value = false
  }
}
</script>
