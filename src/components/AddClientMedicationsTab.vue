<template>
  <div class="add-client-medications-tab">
    <div
      v-if="!hasClientId"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('medicationSaveClientFirst') }}
      </p>
    </div>

    <div
      v-else-if="!canViewMedications"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('medicationNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div class="medications-header row items-start">
        <div class="col">
          <h2 class="medications-title">
            {{ t('medicationsTitle') }}
          </h2>
          <p class="medications-subtitle text-body2">
            {{ t('medicationsSubtitle') }}
          </p>
        </div>
        <div class="col-auto row items-center no-wrap q-gutter-md">
          <div class="insurance-show-inactive row items-center no-wrap">
            <span class="insurance-show-inactive__label text-body2">
              {{ t('medicationShowDiscontinued') }}
            </span>
            <q-icon
              name="info_outline"
              size="16px"
              class="insurance-show-inactive__info cursor-pointer"
              :aria-label="t('medicationShowDiscontinuedHint')">
              <q-tooltip
                class="app-info-tooltip"
                anchor="top middle"
                self="bottom middle"
                :offset="[0, 6]">
                {{ t('medicationShowDiscontinuedHint') }}
              </q-tooltip>
            </q-icon>
            <FormToggle
              v-model="showDiscontinued"
              :test-id="tid.showDiscontinued"
            />
          </div>
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
        </div>
      </div>

      <div class="medications-summary-cards q-mt-md">
        <div
          v-if="canViewPharmacies"
          class="medication-summary-card">
            <div class="row items-start justify-between">
              <div class="col">
                <div class="text-subtitle2 text-weight-bold">
                  {{ t('medicationPreferredPharmacyTitle') }}
                </div>
                <template v-if="preferredPharmacy">
                  <div class="row items-center q-gutter-xs q-mt-sm">
                    <span class="text-body1 text-weight-medium">
                      {{ preferredPharmacy.name }}
                    </span>
                    <span class="medication-preferred-badge">
                      {{ t('medicationPreferredBadge') }}
                    </span>
                  </div>
                  <p class="text-body2 text-grey-8 q-mb-xs q-mt-sm">
                    {{ preferredPharmacyAddress }}
                  </p>
                  <p
                    v-if="preferredPharmacy.phone"
                    class="text-body2 text-grey-8 q-mb-xs">
                    {{ preferredPharmacy.phone }}
                  </p>
                  <p
                    v-if="preferredPharmacy.fax"
                    class="text-body2 text-grey-8 q-mb-none">
                    {{ t('pharmacyFax') }}: {{ preferredPharmacy.fax }}
                  </p>
                </template>
                <p
                  v-else
                  class="text-body2 text-grey-7 q-mt-sm q-mb-none">
                  {{ t('medicationNoPreferredPharmacy') }}
                </p>
              </div>
            </div>
            <div class="q-mt-md">
              <q-btn
                v-if="preferredPharmacy
                  && (canEditPharmacies || canViewPharmacies)"
                flat
                dense
                no-caps
                color="primary"
                class="q-px-none"
                :label="canEditPharmacies
                  ? t('medicationPharmacyViewEdit')
                  : t('medicationActionView')"
                :data-testid="tid.btn('pharmacy-view-edit')"
                @click="openPreferredPharmacy"
              />
              <q-btn
                v-else-if="canAddPharmacies"
                flat
                dense
                no-caps
                color="primary"
                class="q-px-none"
                :label="t('medicationAddPharmacy')"
                :data-testid="tid.btn('pharmacy-add')"
                @click="openAddPharmacy"
              />
            </div>
        </div>

        <div class="medication-summary-card">
            <div class="text-subtitle2 text-weight-bold">
              {{ t('medicationConsentCardTitle') }}
            </div>
            <div class="q-mt-sm">
              <span
                class="medication-consent-badge"
                :class="consentGiven
                  ? 'medication-consent-badge--yes'
                  : 'medication-consent-badge--no'">
                {{ consentGiven
                  ? t('medicationConsentGivenBadge')
                  : t('medicationConsentNotGivenBadge') }}
              </span>
            </div>
            <p class="text-body2 text-grey-8 q-mt-sm q-mb-none">
              {{ consentGiven
                ? t('medicationConsentGivenText')
                : t('medicationConsentNotGivenText') }}
            </p>
            <div class="q-mt-md">
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                class="q-px-none"
                :label="canEditConsent
                  ? t('medicationConsentViewDetails')
                  : t('medicationActionView')"
                :data-testid="tid.btn('consent-details')"
                @click="openConsent"
              />
            </div>
        </div>
      </div>

      <AdminTablePanel
        class="medications-table-panel admin-table-panel--wide q-mt-md"
        :show-column-settings="false">
        <MedicationsTable
          :rows="displayMedicationRows"
          :empty-label="t('medicationListEmpty')"
          :can-edit="canEditMedications"
          :can-delete="canDeleteMedications"
          :clinician-options="resolvedClinicianOptions"
          @view="openViewMedication"
          @edit="openEditMedication"
          @discontinue="openDiscontinueMedication"
          @delete="openDeleteMedication"
        />
      </AdminTablePanel>
    </template>

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

    <PrescriptionConsentDialog
      v-model="consentDialogOpen"
      :mode="consentDialogMode"
      :consent="consentRecord"
      :can-edit="canEditConsent"
      :saving="saving"
      @save="onSaveConsent"
      @cancel="consentDialogOpen = false"
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
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import FormToggle from 'components/FormToggle.vue'
import ModalComponent from 'components/ModalComponent.vue'
import MedicationsTable from 'components/MedicationsTable.vue'
import MedicationDialog from 'components/MedicationDialog.vue'
import PharmacyDialog from 'components/PharmacyDialog.vue'
import PrescriptionConsentDialog from
  'components/PrescriptionConsentDialog.vue'
import CarePlanReasonDialog from 'components/CarePlanReasonDialog.vue'
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
  updateClientMedication,
  updateClientPharmacy,
  upsertPrescriptionConsent,
} from 'src/utils/medication-api.js'
import {
  createEmptyMedicationForm,
  createEmptyPharmacyForm,
  filterMedicationsForList,
  formatPharmacyAddress,
  mapMedicationsListFromApi,
  mapPharmaciesListFromApi,
  normalizePrescriptionConsent,
} from 'src/utils/medication-normalize.js'
import {
  MEDICATION_DOSAGE_UNIT_OPTIONS,
  MEDICATION_FREQUENCY_OPTIONS,
  MEDICATION_ROUTE_OPTIONS,
} from 'src/utils/medication-catalogs.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { useSiteStore } from 'src/stores/site-store.js'
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
  pharmacies: {
    type: Array,
    default: () => [],
  },
  prescriptionConsent: {
    type: Object,
    default: null,
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
})

const { t } = useI18n()
const $q = useQuasar()
const siteStore = useSiteStore()
const {
  canViewMedications,
  canAddMedications,
  canEditMedications,
  canDeleteMedications,
  canViewPharmacies,
  canAddPharmacies,
  canEditPharmacies,
} = useClientMedicationPermissions()

const saving = ref(false)
const showDiscontinued = ref(false)

const medicationDialogOpen = ref(false)
const medicationDialogMode = ref('add')
const activeMedication = ref(null)

const pharmacyDialogOpen = ref(false)
const pharmacyDialogMode = ref('add')
const activePharmacy = ref(null)

const consentDialogOpen = ref(false)
const consentDialogMode = ref('view')

const discontinueDialogOpen = ref(false)
const discontinueTarget = ref(null)

const deleteDialogOpen = ref(false)
const deleteTarget = ref(null)

const hasClientId = computed(() => Boolean(String(props.clientId ?? '').trim()))
const clientId = computed(() => String(props.clientId ?? '').trim())

const canEditConsent = computed(
  () => canAddMedications.value || canEditMedications.value,
)

const resolvedClinicianOptions = computed(() =>
  props.clinicianOptions?.length ? props.clinicianOptions : [],
)

const medicationRows = computed(() =>
  mapMedicationsListFromApi(
    Array.isArray(props.medications) ? props.medications : [],
  ),
)

const pharmacyRows = computed(() =>
  mapPharmaciesListFromApi(
    Array.isArray(props.pharmacies) ? props.pharmacies : [],
  ),
)

const displayMedicationRows = computed(() =>
  filterMedicationsForList(medicationRows.value, {
    showDiscontinued: showDiscontinued.value,
  }),
)

const preferredPharmacy = computed(
  () => pharmacyRows.value.find(row => row.preferred) ?? null,
)

const preferredPharmacyAddress = computed(() =>
  formatPharmacyAddress(preferredPharmacy.value),
)

const consentRecord = computed(() =>
  normalizePrescriptionConsent(props.prescriptionConsent)
  ?? {
    consentGiven: false,
    notes: '',
    consentedAt: '',
    updatedAt: '',
  },
)

const consentGiven = computed(() => Boolean(consentRecord.value?.consentGiven))

const dosageUnitOptions = computed(() => MEDICATION_DOSAGE_UNIT_OPTIONS)
const routeOptions = computed(() => MEDICATION_ROUTE_OPTIONS)
const frequencyOptions = computed(() => MEDICATION_FREQUENCY_OPTIONS)

async function refreshClientMedications() {
  if (!hasClientId.value) {
    return
  }
  try {
    await siteStore.fetchClientById(clientId.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('medicationListError'),
        position: 'top',
      })
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

function openPreferredPharmacy() {
  if (!preferredPharmacy.value) {
    return
  }
  pharmacyDialogMode.value = canEditPharmacies.value ? 'edit' : 'view'
  activePharmacy.value = { ...preferredPharmacy.value }
  pharmacyDialogOpen.value = true
}

function openConsent() {
  consentDialogMode.value = canEditConsent.value ? 'edit' : 'view'
  consentDialogOpen.value = true
}

function openDiscontinueMedication(row) {
  discontinueTarget.value = row
  discontinueDialogOpen.value = true
}

function openDeleteMedication(row) {
  deleteTarget.value = row
  deleteDialogOpen.value = true
}

async function onSaveMedication({ form, addAnother }) {
  if (!hasClientId.value || saving.value) {
    return
  }
  saving.value = true
  try {
    if (medicationDialogMode.value === 'edit' && form?.id != null) {
      await updateClientMedication(clientId.value, form.id, form)
      notifySuccess('medicationSaved')
    } else {
      await createClientMedication(clientId.value, form)
      notifySuccess('medicationSaved')
    }
    await refreshClientMedications()
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
      await updateClientPharmacy(clientId.value, form.id, form)
    } else {
      await createClientPharmacy(clientId.value, form)
    }
    notifySuccess('pharmacySaved')
    await refreshClientMedications()
    pharmacyDialogOpen.value = false
  } catch (error) {
    notifyError(error, 'pharmacySaveError')
  } finally {
    saving.value = false
  }
}

async function onSaveConsent(payload) {
  if (!hasClientId.value || saving.value) {
    return
  }
  saving.value = true
  try {
    await upsertPrescriptionConsent(clientId.value, payload)
    notifySuccess('medicationConsentSaved')
    await refreshClientMedications()
    consentDialogOpen.value = false
  } catch (error) {
    notifyError(error, 'medicationConsentSaveError')
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
      clientId.value,
      row.id,
      medicationStatuses.discontinued,
      reason,
    )
    notifySuccess('medicationDiscontinued')
    showDiscontinued.value = true
    await refreshClientMedications()
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
    await deleteClientMedication(clientId.value, row.id)
    notifySuccess('medicationDeleted')
    await refreshClientMedications()
    deleteDialogOpen.value = false
  } catch (error) {
    notifyError(error, 'medicationDeleteError')
  } finally {
    saving.value = false
  }
}

</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.medication-summary-card {
  height: 100%;
  padding: 16px 18px;
  border: 1px solid $border-subtle;
  border-radius: 12px;
  background: #fff;
}

.medication-preferred-badge,
.medication-consent-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.2;
}

.medication-preferred-badge,
.medication-consent-badge--yes {
  background: #dcfce7;
  color: #166534;
}

.medication-consent-badge--no {
  background: #f1f5f9;
  color: $text-muted;
}
</style>
