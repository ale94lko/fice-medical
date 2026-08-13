<template>
  <section class="encounter-workspace-card">
    <div class="encounter-workspace-card__head">
      <div>
        <h2>{{ t('encounterClinicalMedications') }}</h2>
        <p class="text-body2 text-grey-7 q-mb-none">
          {{ t('encounterClinicalMedicationsHint') }}
        </p>
      </div>
      <div class="row q-gutter-sm items-center no-wrap">
        <q-btn
          v-if="canAddMedications"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="add"
          :disable="saving"
          :data-testid="tid.btn('add')"
          :label="t('medicationAdd')"
          @click="openAddMedication"
        />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('encounterClinicalAllMedications')"
          :loading="allLoading"
          data-testid="encounter-clinical-all-medications"
          @click="openAllRecords"
        />
      </div>
    </div>

    <AdminTablePanel
      class="admin-table-panel--wide"
      :show-column-settings="false">
      <MedicationsTable
        :rows="medicationRows"
        :empty-label="t('encounterClinicalMedicationsEmpty')"
        :can-edit="canEditMedications"
        :can-delete="canDeleteMedications"
        @view="openViewMedication"
        @edit="openEditMedication"
        @change-status="openStatusChange"
        @delete="openDeleteMedication"
      />
    </AdminTablePanel>

    <MedicationDialog
      v-model="medicationDialogOpen"
      :mode="medicationDialogMode"
      :medication="activeMedication"
      :clinician-options="resolvedClinicianOptions"
      :pharmacy-options="pharmacyRows"
      :preferred-pharmacy="preferredPharmacy"
      :dosage-unit-options="dosageUnitOptions"
      :route-options="routeOptions"
      :frequency-options="frequencyOptions"
      :can-add-pharmacy="canAddPharmacies"
      :saving="saving"
      @save="onSaveMedication"
      @cancel="medicationDialogOpen = false"
      @add-pharmacy="openAddPharmacy"
    />

    <PharmacyDialog
      v-model="pharmacyDialogOpen"
      :mode="pharmacyDialogMode"
      :pharmacy="activePharmacy"
      :saving="saving"
      @save="onSavePharmacy"
      @cancel="pharmacyDialogOpen = false"
    />

    <q-dialog
      v-model="statusDialogOpen"
      persistent
      transition-show="scale"
      transition-hide="scale">
      <q-card class="insurance-dialog app-dialog-card">
        <AppDialogHeader
          :close-label="t('close')"
          @close="statusDialogOpen = false">
          {{ t('medicationChangeStatusTitle') }}
        </AppDialogHeader>
        <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
          <p class="text-body2 text-grey-7 q-mt-none q-mb-md">
            {{ t('medicationChangeStatusSubtitle') }}
          </p>
          <AddClientLabeledField
            :label="t('status')"
            required
            :test-id="tid.field('status-change')">
            <FormSelect
              v-model="statusDraft"
              outlined
              hide-bottom-space
              emit-value
              map-options
              :options="statusOptions"
              :test-id="tid.field('status-change')"
            />
          </AddClientLabeledField>
        </q-card-section>
        <q-card-actions align="right" class="app-dialog-card__actions">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :label="t('cancel')"
            @click="statusDialogOpen = false"
          />
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :loading="saving"
            :label="t('medicationChangeStatusSave')"
            @click="onConfirmStatusChange"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <ModalComponent
      v-model="deleteDialogOpen"
      :title="t('medicationDeleteTitle')"
      :message="t('medicationDeleteMessage')"
      :confirm-text="t('delete')"
      :cancel-text="t('cancel')"
      @confirm="onConfirmDelete"
      @cancel="deleteDialogOpen = false"
    />

    <EncounterClinicalAllRecordsDialog
      v-model="allOpen"
      :title="t('encounterClinicalAllMedicationsTitle')"
      :hint="t('encounterClinicalAllRecordsHint')"
      :loading="allLoading"
      :error="allError">
      <MedicationsTable
        :rows="allRows"
        :empty-label="t('encounterClinicalAllRecordsEmpty')"
        :can-edit="false"
        :can-delete="false"
        @view="openViewMedication"
      />
    </EncounterClinicalAllRecordsDialog>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormSelect from 'components/FormSelect.vue'
import ModalComponent from 'components/ModalComponent.vue'
import MedicationsTable from 'components/MedicationsTable.vue'
import MedicationDialog from 'components/MedicationDialog.vue'
import PharmacyDialog from 'components/PharmacyDialog.vue'
import EncounterClinicalAllRecordsDialog from
  'components/encounter/EncounterClinicalAllRecordsDialog.vue'
import {
  catalogNames,
  medicationStatuses,
  pharmacyModeValues,
  quasarNotifyTypes,
} from 'components/constants.js'
import { useClientMedicationPermissions } from
  'src/composables/useClientMedicationPermissions.js'
import {
  apiErrorMessage,
  changeClientMedicationStatus,
  createClientMedication,
  createClientPharmacy,
  deleteClientMedication,
  listClientMedications,
  listClientPharmacies,
  updateClientMedication,
  updateClientPharmacy,
} from 'src/utils/medication-api.js'
import {
  createEmptyMedicationForm,
  createEmptyPharmacyForm,
  mapMedicationsListFromApi,
} from 'src/utils/medication-normalize.js'
import {
  catalogItemsFromCatalog,
  fetchCatalogsByNames,
  mapCatalogItemsToSelectOptions,
} from 'src/utils/catalogs.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { medicationTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
  medications: {
    type: Array,
    default: () => [],
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['changed'])

const { t } = useI18n()
const $q = useQuasar()
const {
  canAddMedications,
  canEditMedications,
  canDeleteMedications,
  canAddPharmacies,
} = useClientMedicationPermissions()

const saving = ref(false)
const catalogsByName = ref({})
const pharmacyRows = ref([])

const medicationDialogOpen = ref(false)
const medicationDialogMode = ref('add')
const activeMedication = ref(null)

const pharmacyDialogOpen = ref(false)
const pharmacyDialogMode = ref('add')
const activePharmacy = ref(null)

const statusDialogOpen = ref(false)
const statusDraft = ref(medicationStatuses.active)
const statusTarget = ref(null)

const deleteDialogOpen = ref(false)
const deleteTarget = ref(null)

const allOpen = ref(false)
const allLoading = ref(false)
const allError = ref('')
const allRows = ref([])

const clientKey = computed(() => String(props.clientId ?? '').trim())
const hasClientId = computed(() => Boolean(clientKey.value))

const resolvedClinicianOptions = computed(() =>
  props.clinicianOptions?.length ? props.clinicianOptions : [],
)

const medicationRows = computed(() =>
  mapMedicationsListFromApi(
    Array.isArray(props.medications) ? props.medications : [],
  ),
)

const preferredPharmacy = computed(
  () => pharmacyRows.value.find(row => row.preferred) ?? null,
)

const dosageUnitOptions = computed(() =>
  catalogOptions(catalogNames.dosageUnit),
)
const routeOptions = computed(() =>
  catalogOptions(catalogNames.medicationRoute),
)
const frequencyOptions = computed(() =>
  catalogOptions(catalogNames.medicationFrequency),
)

const statusOptions = computed(() => [
  {
    label: t('medicationStatusActive'),
    value: medicationStatuses.active,
  },
  {
    label: t('medicationStatusCompleted'),
    value: medicationStatuses.completed,
  },
  {
    label: t('medicationStatusDiscontinued'),
    value: medicationStatuses.discontinued,
  },
])

function catalogOptions(name) {
  const catalog = catalogsByName.value[name]
  if (!catalog) {
    return []
  }

  return mapCatalogItemsToSelectOptions(catalogItemsFromCatalog(catalog))
}

async function loadMedicationCatalogs() {
  try {
    catalogsByName.value = await fetchCatalogsByNames([
      catalogNames.dosageUnit,
      catalogNames.medicationRoute,
      catalogNames.medicationFrequency,
    ])
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('medicationCatalogsError'),
        position: 'top',
      })
    }
  }
}

async function loadPharmacies() {
  if (!hasClientId.value) {
    pharmacyRows.value = []

    return
  }
  try {
    pharmacyRows.value = await listClientPharmacies(clientKey.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      pharmacyRows.value = []
    }
  }
}

function notifyError(error, fallbackKey) {
  if (isAuthSessionEndUIError(error)) {
    return
  }
  $q.notify({
    type: quasarNotifyTypes.negative,
    message: apiErrorMessage(error, t(fallbackKey)),
    position: 'top',
  })
}

function notifySuccess(key) {
  $q.notify({
    type: quasarNotifyTypes.positive,
    message: t(key),
    position: 'top',
  })
}

function openAddMedication() {
  medicationDialogMode.value = 'add'
  activeMedication.value = createEmptyMedicationForm()
  if (!preferredPharmacy.value) {
    activeMedication.value.pharmacyMode = pharmacyModeValues.none
  }
  medicationDialogOpen.value = true
}

function openViewMedication(row) {
  medicationDialogMode.value = 'view'
  activeMedication.value = { ...row }
  medicationDialogOpen.value = true
}

function openEditMedication(row) {
  medicationDialogMode.value = 'edit'
  activeMedication.value = { ...row }
  medicationDialogOpen.value = true
}

function openAddPharmacy() {
  pharmacyDialogMode.value = 'add'
  activePharmacy.value = createEmptyPharmacyForm()
  pharmacyDialogOpen.value = true
}

function openStatusChange(row) {
  statusTarget.value = row
  statusDraft.value = row.status || medicationStatuses.active
  statusDialogOpen.value = true
}

function openDeleteMedication(row) {
  deleteTarget.value = row
  deleteDialogOpen.value = true
}

async function openAllRecords() {
  if (!hasClientId.value) {
    return
  }
  allOpen.value = true
  allLoading.value = true
  allError.value = ''
  try {
    allRows.value = await listClientMedications(clientKey.value)
  } catch (error) {
    allRows.value = []
    if (!isAuthSessionEndUIError(error)) {
      allError.value = t('encounterClinicalAllRecordsLoadError')
    }
  } finally {
    allLoading.value = false
  }
}

async function onSaveMedication({ form, addAnother }) {
  if (!hasClientId.value || saving.value) {
    return
  }
  saving.value = true
  try {
    if (medicationDialogMode.value === 'edit' && form?.id != null) {
      await updateClientMedication(clientKey.value, form.id, form)
    } else {
      await createClientMedication(clientKey.value, form)
    }
    notifySuccess('medicationSaved')
    emit('changed')
    if (addAnother && medicationDialogMode.value === 'add') {
      activeMedication.value = createEmptyMedicationForm()
      if (!preferredPharmacy.value) {
        activeMedication.value.pharmacyMode = pharmacyModeValues.none
      }
    } else {
      medicationDialogOpen.value = false
    }
  } catch (error) {
    notifyError(error, 'medicationSaveError')
  } finally {
    saving.value = false
  }
}

async function onSavePharmacy(form) {
  if (!hasClientId.value || saving.value) {
    return
  }
  saving.value = true
  try {
    if (pharmacyDialogMode.value === 'edit' && form?.id != null) {
      await updateClientPharmacy(clientKey.value, form.id, form)
    } else {
      await createClientPharmacy(clientKey.value, form)
    }
    notifySuccess('pharmacySaved')
    await loadPharmacies()
    pharmacyDialogOpen.value = false
  } catch (error) {
    notifyError(error, 'pharmacySaveError')
  } finally {
    saving.value = false
  }
}

async function onConfirmStatusChange() {
  const row = statusTarget.value
  if (!row?.id || !hasClientId.value || saving.value) {
    return
  }
  saving.value = true
  try {
    await changeClientMedicationStatus(
      clientKey.value,
      row.id,
      statusDraft.value,
    )
    notifySuccess('medicationStatusUpdated')
    emit('changed')
    statusDialogOpen.value = false
  } catch (error) {
    notifyError(error, 'medicationStatusError')
  } finally {
    saving.value = false
  }
}

async function onConfirmDelete() {
  const row = deleteTarget.value
  if (!row?.id || !hasClientId.value || saving.value) {
    return
  }
  saving.value = true
  try {
    await deleteClientMedication(clientKey.value, row.id)
    notifySuccess('medicationDeleted')
    emit('changed')
    deleteDialogOpen.value = false
  } catch (error) {
    notifyError(error, 'medicationDeleteError')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadMedicationCatalogs()
  void loadPharmacies()
})

watch(
  () => props.clientId,
  () => {
    void loadMedicationCatalogs()
    void loadPharmacies()
  },
)
</script>
