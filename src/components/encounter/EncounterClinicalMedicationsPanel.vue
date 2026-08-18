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
        <div class="insurance-show-inactive row items-center no-wrap">
          <span class="insurance-show-inactive__label text-body2">
            {{ t('medicationShowDiscontinued') }}
          </span>
          <FormToggle
            v-model="showDiscontinued"
            :test-id="tid.showDiscontinued"
          />
        </div>
        <q-btn
          v-if="canAddHere"
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
          :data-testid="ewtid.clinicalAllMedications"
          @click="openAllRecords"
        />
      </div>
    </div>

    <AdminTablePanel
      class="admin-table-panel--wide"
      :show-column-settings="false">
        <MedicationsTable
          :rows="displayMedicationRows"
          :empty-label="t('encounterClinicalMedicationsEmpty')"
          :can-edit="canEditHere"
          :can-delete="canDeleteHere"
          :clinician-options="resolvedClinicianOptions"
          @view="openViewMedication"
          @edit="openEditMedication"
          @discontinue="openDiscontinueMedication"
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
      :can-add-pharmacy="canAddPharmacyHere"
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

    <CarePlanReasonDialog
      v-model="discontinueDialogOpen"
      :title="t('medicationDiscontinueTitle')"
      :message="t('medicationDiscontinueMessage')"
      :reason-label="t('medicationDiscontinueReasonLabel')"
      :confirm-label="t('medicationActionDiscontinue')"
      reason-field="discontinue-reason"
      @confirm="onConfirmDiscontinue"
    />

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
        :rows="displayAllRows"
        :empty-label="t('encounterClinicalAllRecordsEmpty')"
        :can-edit="false"
        :can-delete="false"
        :clinician-options="resolvedClinicianOptions"
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
import FormToggle from 'components/FormToggle.vue'
import ModalComponent from 'components/ModalComponent.vue'
import MedicationsTable from 'components/MedicationsTable.vue'
import MedicationDialog from 'components/MedicationDialog.vue'
import PharmacyDialog from 'components/PharmacyDialog.vue'
import CarePlanReasonDialog from 'components/CarePlanReasonDialog.vue'
import EncounterClinicalAllRecordsDialog from
  'components/encounter/EncounterClinicalAllRecordsDialog.vue'
import {
  medicationStatuses,
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
  filterMedicationsForList,
  mapMedicationsListFromApi,
} from 'src/utils/medication-normalize.js'
import {
  MEDICATION_DOSAGE_UNIT_OPTIONS,
  MEDICATION_FREQUENCY_OPTIONS,
  MEDICATION_ROUTE_OPTIONS,
} from 'src/utils/medication-catalogs.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  encounterWorkspaceTestIds as ewtid,
  medicationTestIds as tid,
} from 'src/test-ids/index.js'

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
  encounterOpen: {
    type: Boolean,
    default: false,
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

const canAddHere = computed(() =>
  props.encounterOpen && canAddMedications.value,
)
const canEditHere = computed(() =>
  props.encounterOpen && canEditMedications.value,
)
const canDeleteHere = computed(() =>
  props.encounterOpen && canDeleteMedications.value,
)
const canAddPharmacyHere = computed(() =>
  props.encounterOpen && canAddPharmacies.value,
)

const saving = ref(false)
const showDiscontinued = ref(false)
const pharmacyRows = ref([])

const medicationDialogOpen = ref(false)
const medicationDialogMode = ref('add')
const activeMedication = ref(null)

const pharmacyDialogOpen = ref(false)
const pharmacyDialogMode = ref('add')
const activePharmacy = ref(null)

const discontinueDialogOpen = ref(false)
const discontinueTarget = ref(null)

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

const displayMedicationRows = computed(() =>
  filterMedicationsForList(medicationRows.value, {
    showDiscontinued: showDiscontinued.value,
  }),
)

const displayAllRows = computed(() =>
  filterMedicationsForList(allRows.value, {
    showDiscontinued: showDiscontinued.value,
  }),
)

const preferredPharmacy = computed(
  () => pharmacyRows.value.find(row => row.preferred) ?? null,
)

const dosageUnitOptions = computed(() => MEDICATION_DOSAGE_UNIT_OPTIONS)
const routeOptions = computed(() => MEDICATION_ROUTE_OPTIONS)
const frequencyOptions = computed(() => MEDICATION_FREQUENCY_OPTIONS)

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
  if (!canAddHere.value) {
    return
  }
  medicationDialogMode.value = 'add'
  activeMedication.value = createEmptyMedicationForm()
  medicationDialogOpen.value = true
}

function openViewMedication(row) {
  medicationDialogMode.value = 'view'
  activeMedication.value = { ...row }
  medicationDialogOpen.value = true
}

function openEditMedication(row) {
  if (!canEditHere.value) {
    return
  }
  medicationDialogMode.value = 'edit'
  activeMedication.value = { ...row }
  medicationDialogOpen.value = true
}

function openAddPharmacy() {
  if (!canAddPharmacyHere.value) {
    return
  }
  pharmacyDialogMode.value = 'add'
  activePharmacy.value = createEmptyPharmacyForm()
  pharmacyDialogOpen.value = true
}

function openDiscontinueMedication(row) {
  if (!canEditHere.value) {
    return
  }
  discontinueTarget.value = row
  discontinueDialogOpen.value = true
}

function openDeleteMedication(row) {
  if (!canDeleteHere.value) {
    return
  }
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
  const isEdit = medicationDialogMode.value === 'edit'
    && form?.id != null
  if (isEdit && !canEditHere.value) {
    return
  }
  if (!isEdit && !canAddHere.value) {
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

async function onConfirmDiscontinue(reason) {
  const row = discontinueTarget.value
  if (!row?.id || !hasClientId.value || saving.value) {
    return
  }
  saving.value = true
  try {
    await changeClientMedicationStatus(
      clientKey.value,
      row.id,
      medicationStatuses.discontinued,
      reason,
    )
    notifySuccess('medicationDiscontinued')
    showDiscontinued.value = true
    emit('changed')
    discontinueDialogOpen.value = false
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
  void loadPharmacies()
})

watch(
  () => props.clientId,
  () => {
    void loadPharmacies()
  },
)
</script>
