<template>
  <q-page class="admin-page add-client-page fit">
    <StaffPageHeader
      :title="pageTitle"
      :subtitle="pageSubtitle"
      :breadcrumb-current="breadcrumbCurrent"
      :active-tab-label="activeTabLabel"
      :photo-file-id="photoFileId"
      :photo-disabled="photoDisabled"
      @update:photo-file-id="photoFileId = $event"
    >
      <template #actions>
        <q-btn
          v-if="canSave"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="saving"
          :disable="saving"
          :label="t('save')"
          @click="onSave"
        />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :disable="saving"
          :label="t('close')"
          @click="onClose"
        />
      </template>
    </StaffPageHeader>

    <q-card flat bordered class="add-client-page__card">
      <q-card-section class="add-client-page__card-body q-pa-md">
        <StaffForm
          ref="staffFormRef"
          v-model="form"
          :entry-point="entryPoint"
          :is-edit-mode="isEditMode"
          :readonly="readonly"
          :can-create-system-user="canCreateSystemUser"
          :prefix-options="prefixOptions"
          :suffix-options="suffixOptions"
          :state-options="stateOptions"
          :phone-type-options="phoneTypeOptions"
          :email-type-options="emailTypeOptions"
          :position-options="positionOptions"
          :role-options="roleOptions"
          :credential-options="credentialOptions"
          :specialty-options="specialtyOptions"
          :supervisor-options="supervisorOptions"
          :field-errors="fieldErrors"
          @update:active-tab-label="activeTabLabel = $event"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import StaffForm from 'components/staff/StaffForm.vue'
import StaffPageHeader from 'components/staff/StaffPageHeader.vue'
import {
  quasarNotifyTypes,
  staffEntryPoints,
} from 'components/constants.js'
import { useStaffPermissions } from 'src/composables/useStaffPermissions.js'
import {
  createStaff,
  fetchRolesList,
  fetchStaffById,
  patchStaff,
} from 'src/utils/staff-api.js'
import { createEmptyStaffForm } from 'src/utils/staff-form.js'
import { buildStaffRegisterBody } from 'src/utils/build-staff-register-body.js'
import {
  resolveStaffApiErrorMessage,
  validateStaffForm,
} from 'src/utils/staff-form-validation.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  catalogItemsFromCatalog,
  fetchCatalogsByNames,
  mapCatalogItemsToSelectOptions,
} from 'src/utils/catalogs.js'
import { fetchAllCliniciansSelectOptions } from 'src/utils/clinicians-api.js'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const $q = useQuasar()
const { canEditStaff, canCreateSystemUser } = useStaffPermissions()

const form = ref(createEmptyStaffForm())
const staffFormRef = ref(null)
const activeTabLabel = ref('')
const saving = ref(false)
const photoFileId = ref(null)
const fieldErrors = ref({})
const roleOptions = ref([])
const positionOptions = ref([])
const prefixOptions = ref([])
const suffixOptions = ref([])
const stateOptions = ref([])
const phoneTypeOptions = ref([])
const emailTypeOptions = ref([])
const credentialOptions = ref([])
const specialtyOptions = ref([])
const supervisorOptions = ref([])

const staffId = computed(() => {
  const raw = route.params.id
  if (!raw || route.name === 'AddStaff' || route.name === 'AddClinician') {
    return null
  }

  return String(raw)
})

const entryPoint = computed(() => {
  if (route.meta.staffEntryPoint) {
    return route.meta.staffEntryPoint
  }
  if (route.name === 'AddClinician') {
    return staffEntryPoints.addClinician
  }

  return staffEntryPoints.addStaff
})

const isEditMode = computed(() => Boolean(staffId.value))
const isClinicianEntry = computed(() =>
  entryPoint.value === staffEntryPoints.addClinician,
)
const readonly = computed(() => isEditMode.value && !canEditStaff.value)
const canSave = computed(() => !readonly.value && canEditStaff.value)
const photoDisabled = computed(() => saving.value || readonly.value)

const pageTitle = computed(() => {
  if (isEditMode.value) {
    return t('editStaff')
  }
  if (isClinicianEntry.value) {
    return t('addNewClinician')
  }

  return t('addNewStaff')
})

const pageSubtitle = computed(() => {
  if (isClinicianEntry.value) {
    return t('addNewClinicianSubtitle')
  }

  return t('addNewStaffSubtitle')
})

const breadcrumbCurrent = computed(() => {
  if (isEditMode.value) {
    return t('editStaff')
  }
  if (isClinicianEntry.value) {
    return t('addClinicianBreadcrumb')
  }

  return t('addStaffBreadcrumb')
})

async function loadStaffRecord() {
  if (!staffId.value) {
    form.value = createEmptyStaffForm(entryPoint.value)
    return
  }
  try {
    const data = await fetchStaffById(staffId.value)
    form.value = createEmptyStaffForm(entryPoint.value, data)
    photoFileId.value = form.value.basic.photoFileId ?? null
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('staffListError'),
      })
    }
    router.push('/staff')
  }
}

async function loadCatalogOptions() {
  try {
    const catalogs = await fetchCatalogsByNames([
      'staff_position',
      'prefix',
      'suffix',
      'phone_type',
      'email_type',
      'credential_type',
      'specialty',
      'state',
    ])
    positionOptions.value = mapCatalogItemsToSelectOptions(
      catalogItemsFromCatalog(catalogs.staff_position),
    )
    prefixOptions.value = mapCatalogItemsToSelectOptions(
      catalogItemsFromCatalog(catalogs.prefix),
    )
    suffixOptions.value = mapCatalogItemsToSelectOptions(
      catalogItemsFromCatalog(catalogs.suffix),
    )
    phoneTypeOptions.value = mapCatalogItemsToSelectOptions(
      catalogItemsFromCatalog(catalogs.phone_type),
    )
    emailTypeOptions.value = mapCatalogItemsToSelectOptions(
      catalogItemsFromCatalog(catalogs.email_type),
    )
    credentialOptions.value = mapCatalogItemsToSelectOptions(
      catalogItemsFromCatalog(catalogs.credential_type),
    )
    specialtyOptions.value = mapCatalogItemsToSelectOptions(
      catalogItemsFromCatalog(catalogs.specialty),
    )
    stateOptions.value = mapCatalogItemsToSelectOptions(
      catalogItemsFromCatalog(catalogs.state),
    )
  } catch {
    positionOptions.value = []
  }

  try {
    supervisorOptions.value = await fetchAllCliniciansSelectOptions()
  } catch {
    supervisorOptions.value = []
  }
}

function includeClinicalOnSave() {
  if (isClinicianEntry.value) {
    return true
  }

  return staffFormRef.value?.getIncludeClinicalProfile?.() ?? false
}

async function onSave() {
  const includeClinicalProfile = includeClinicalOnSave()
  const validation = validateStaffForm(form.value, {
    includeClinicalProfile,
    isEdit: isEditMode.value,
    t,
  })
  if (!validation.ok) {
    fieldErrors.value = validation.errors
    const firstField = Object.keys(validation.errors)[0]
    staffFormRef.value?.focusTabForField?.(firstField)
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: validation.errors[firstField],
    })
    return
  }
  fieldErrors.value = {}
  saving.value = true
  try {
    const payload = buildStaffRegisterBody({
      form: form.value,
      entryPoint: entryPoint.value,
      photoFileId: photoFileId.value,
      includeClinicalProfile,
      isEdit: isEditMode.value,
    })
    if (isEditMode.value) {
      await patchStaff(staffId.value, payload)
    } else {
      await createStaff(payload)
    }
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('staffFormSaveSuccess'),
      position: 'top',
    })
    router.push('/staff')
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: resolveStaffApiErrorMessage(error, t),
      })
    }
  } finally {
    saving.value = false
  }
}

function onClose() {
  router.push('/staff')
}

onMounted(async() => {
  form.value = createEmptyStaffForm(entryPoint.value)
  await Promise.all([
    loadCatalogOptions(),
    fetchRolesList()
      .then(rows => {
        roleOptions.value = rows
      })
      .catch(() => {
        roleOptions.value = []
      }),
    loadStaffRecord(),
  ])
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.add-client-page__card {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: $surface;
  border-radius: $radius-lg;
  border-color: $border-subtle !important;
  box-shadow: $shadow-sm;
}
</style>
