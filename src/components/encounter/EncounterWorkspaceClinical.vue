<template>
  <div
    class="encounter-workspace-clinical"
    :data-testid="tid.clinical">
    <div class="subtabs-row encounter-workspace-clinical__subtabs-row">
      <q-tabs
        :model-value="modelValue"
        dense
        no-caps
        outside-arrows
        mobile-arrows
        class="add-client-subtabs"
        active-color="primary"
        indicator-color="primary"
        align="left"
        @update:model-value="emit('update:modelValue', $event)">
        <q-tab
          v-for="tab in subTabs"
          :key="tab.key"
          :name="tab.key"
          :icon="tab.icon"
          :label="tab.label"
        />
      </q-tabs>
    </div>

    <section
      v-if="isVitalsTab"
      class="encounter-workspace-card">
      <div class="encounter-workspace-card__head">
        <div>
          <h2>{{ t('encounterClinicalVitals') }}</h2>
          <p class="text-body2 text-grey-7 q-mb-none">
            {{ t('encounterClinicalVitalsHint') }}
          </p>
        </div>
        <div class="row q-gutter-sm items-center no-wrap">
          <q-btn
            v-if="canAddVitals"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :disable="saving"
            :label="t('vitalsAdd')"
            :data-testid="clientTid.vitalsBtnAdd"
            @click="openAddVitals"
          />
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :label="t('encounterClinicalAllVitals')"
            :loading="allVitalsLoading"
            data-testid="encounter-clinical-all-vitals"
            @click="openAllVitals"
          />
        </div>
      </div>

      <AdminTablePanel
        class="admin-table-panel--wide"
        :show-column-settings="false">
        <VitalsHistoryTable
          :entries="vitalsEntries"
          :can-edit="canEditVitals"
          :empty-label="t('encounterClinicalVitalsEmpty')"
          :clinician-options="clinicianOptions"
          :patient-dob="patientDob"
          :patient-age="patientAge"
          :patient-age-unit="patientAgeUnit"
          :patient-gender="patientGender"
          @edit="openEditVitals"
          @delete="openDeleteVitals"
        />
      </AdminTablePanel>
    </section>

    <EncounterClinicalAssessmentsPanel
      v-else-if="isAssessmentsTab"
      :client-id="clientId"
      :screenings="screenings"
      :can-add="canAddScreenings"
      :can-edit="canEditScreenings"
      :clinician-options="clinicianOptions"
      @changed="emit('changed')"
    />

    <EncounterClinicalMedicationsPanel
      v-else-if="isMedicationsTab"
      :client-id="clientId"
      :medications="medications"
      :clinician-options="clinicianOptions"
      :encounter-open="encounterOpen"
      @changed="emit('changed')"
    />

    <EncounterClinicalCarePlansPanel
      v-else-if="isCarePlansTab"
      :client-id="clientId"
      :care-plans="carePlans"
      :clinician-options="clinicianOptions"
      :encounter-open="encounterOpen"
      @changed="emit('changed')"
    />

    <EncounterClinicalLabsPanel
      v-else-if="isLabsTab"
      :client-id="clientId"
      :labs="labs"
      :can-add="canAddLabs"
      :can-edit="canEditLabs"
      :clinician-options="clinicianOptions"
      @changed="emit('changed')"
    />

    <VitalsRecordDialog
      v-model="recordDialogOpen"
      :entry="editingEntry"
      :clinician-options="clinicianOptions"
      :patient-dob="patientDob"
      :patient-age="patientAge"
      :patient-age-unit="patientAgeUnit"
      :patient-gender="patientGender"
      :readonly="vitalsDialogReadonly"
      :saving="saving"
      @save="onVitalsSave"
    />

    <EncounterClinicalAllRecordsDialog
      v-model="allVitalsOpen"
      :title="t('encounterClinicalAllVitalsTitle')"
      :hint="t('encounterClinicalAllRecordsHint')"
      :loading="allVitalsLoading"
      :error="allVitalsError">
      <VitalsHistoryTable
        :entries="allVitalsEntries"
        :can-edit="false"
        :empty-label="t('encounterClinicalAllRecordsEmpty')"
        :clinician-options="clinicianOptions"
        :patient-dob="patientDob"
        :patient-age="patientAge"
        :patient-age-unit="patientAgeUnit"
        :patient-gender="patientGender"
      />
    </EncounterClinicalAllRecordsDialog>

    <ModalComponent
      v-model="deleteDialogOpen"
      test-id="encounter-vitals-delete"
      :title="t('vitalsDeleteTitle')"
      :message="t('vitalsDeleteMessage')"
      :confirm-text="t('remove')"
      :cancel-text="t('cancel')"
      @confirm="confirmDeleteVitals"
      @cancel="deleteDialogOpen = false"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  encounterClinicalSubTabs,
  quasarNotifyTypes,
} from 'components/constants.js'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import ModalComponent from 'components/ModalComponent.vue'
import VitalsHistoryTable from 'components/VitalsHistoryTable.vue'
import VitalsRecordDialog from 'components/VitalsRecordDialog.vue'
import EncounterClinicalAllRecordsDialog from
  'components/encounter/EncounterClinicalAllRecordsDialog.vue'
import EncounterClinicalAssessmentsPanel from
  'components/encounter/EncounterClinicalAssessmentsPanel.vue'
import EncounterClinicalCarePlansPanel from
  'components/encounter/EncounterClinicalCarePlansPanel.vue'
import EncounterClinicalLabsPanel from
  'components/encounter/EncounterClinicalLabsPanel.vue'
import EncounterClinicalMedicationsPanel from
  'components/encounter/EncounterClinicalMedicationsPanel.vue'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'
import { addClientTestIds as clientTid } from 'src/test-ids/index.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { fetchAllCliniciansSelectOptions } from
  'src/utils/clinicians-api.js'
import {
  nextVitalsId,
  normalizeVitalsEntry,
  sortVitalsEntriesDesc,
} from 'src/utils/client-vitals.js'
import {
  isEncounterConflictError,
  isEncounterInvalidError,
} from 'src/utils/encounter-api.js'
import {
  createVital,
  listVitals,
  updateVital,
} from 'src/utils/vitals-api.js'

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  clientId: {
    type: [String, Number],
    default: null,
  },
  encounterId: {
    type: [String, Number],
    default: null,
  },
  encounterOpen: {
    type: Boolean,
    default: false,
  },
  canAddVitals: {
    type: Boolean,
    default: false,
  },
  canEditVitals: {
    type: Boolean,
    default: false,
  },
  canAddScreenings: {
    type: Boolean,
    default: false,
  },
  canEditScreenings: {
    type: Boolean,
    default: false,
  },
  canAddLabs: {
    type: Boolean,
    default: false,
  },
  canEditLabs: {
    type: Boolean,
    default: false,
  },
  vitals: {
    type: Array,
    default: () => [],
  },
  screenings: {
    type: Array,
    default: () => [],
  },
  medications: {
    type: Array,
    default: () => [],
  },
  carePlans: {
    type: Array,
    default: () => [],
  },
  labs: {
    type: Array,
    default: () => [],
  },
  patientDob: {
    type: String,
    default: '',
  },
  patientAge: {
    type: [String, Number],
    default: '',
  },
  patientAgeUnit: {
    type: String,
    default: 'years',
  },
  patientGender: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'update:modelValue',
  'changed',
])

const { t } = useI18n()
const $q = useQuasar()

const saving = ref(false)
const vitalsEntries = ref([])
const clinicianOptions = ref([])
const recordDialogOpen = ref(false)
const editingEntry = ref(null)
const deleteDialogOpen = ref(false)
const deletingEntry = ref(null)
const allVitalsOpen = ref(false)
const allVitalsLoading = ref(false)
const allVitalsError = ref('')
const allVitalsEntries = ref([])

const isVitalsTab = computed(
  () => props.modelValue === encounterClinicalSubTabs.vitals,
)
const isAssessmentsTab = computed(
  () => props.modelValue === encounterClinicalSubTabs.assessments,
)
const isMedicationsTab = computed(
  () => props.modelValue === encounterClinicalSubTabs.medications,
)
const isCarePlansTab = computed(
  () => props.modelValue === encounterClinicalSubTabs.carePlans,
)
const isLabsTab = computed(
  () => props.modelValue === encounterClinicalSubTabs.labs,
)

const clientKey = computed(() => String(props.clientId ?? '').trim())
const encounterKey = computed(
  () => String(props.encounterId ?? '').trim(),
)

const vitalsDialogReadonly = computed(() => {
  if (editingEntry.value) {
    return !props.canEditVitals
  }

  return !props.canAddVitals
})

const subTabs = computed(() => [
  {
    key: encounterClinicalSubTabs.vitals,
    label: t('encounterClinicalVitals'),
    icon: 'monitor_heart',
  },
  {
    key: encounterClinicalSubTabs.assessments,
    label: t('encounterClinicalAssessments'),
    icon: 'assignment',
  },
  {
    key: encounterClinicalSubTabs.medications,
    label: t('encounterClinicalMedications'),
    icon: 'medication',
  },
  {
    key: encounterClinicalSubTabs.carePlans,
    label: t('encounterClinicalCarePlans'),
    icon: 'assignment_turned_in',
  },
  {
    key: encounterClinicalSubTabs.labs,
    label: t('encounterClinicalLabs'),
    icon: 'science',
  },
])

function belongsToEncounter(entry) {
  const encounterId = encounterKey.value
  if (!encounterId) {
    return false
  }

  return String(entry?.encounterId ?? '').trim() === encounterId
}

function syncVitalsFromWorkspace() {
  const list = Array.isArray(props.vitals) ? props.vitals : []
  vitalsEntries.value = sortVitalsEntriesDesc(
    list.filter(entry => {
      const entryEncounter = String(entry?.encounterId ?? '').trim()
      if (!entryEncounter) {
        return true
      }

      return belongsToEncounter(entry)
    }),
  )
}

function notifySuccess(message) {
  $q.notify({
    type: quasarNotifyTypes.positive,
    message,
    position: 'top',
  })
}

function notifyError(error, fallbackKey = 'vitalsSaveError') {
  let message = String(
    error?.response?.data?.message
    ?? error?.message
    ?? t(fallbackKey),
  )
  if (isEncounterConflictError(error)) {
    message = t('activeEncounterConflict')
  } else if (isEncounterInvalidError(error)) {
    message = t('activeEncounterInvalid')
  }
  $q.notify({
    type: quasarNotifyTypes.negative,
    message,
    position: 'top',
  })
}

async function loadClinicians() {
  try {
    clinicianOptions.value = await fetchAllCliniciansSelectOptions()
  } catch {
    clinicianOptions.value = []
  }
}

function resolveEncounterIdNumber() {
  const n = Number(encounterKey.value)

  return Number.isFinite(n) ? n : null
}

function openAddVitals() {
  if (!props.canAddVitals) {
    return
  }
  editingEntry.value = null
  recordDialogOpen.value = true
}

async function openAllVitals() {
  const clientId = clientKey.value
  if (!clientId) {
    return
  }
  allVitalsOpen.value = true
  allVitalsLoading.value = true
  allVitalsError.value = ''
  try {
    const list = await listVitals(clientId)
    allVitalsEntries.value = sortVitalsEntriesDesc(list)
  } catch (error) {
    allVitalsEntries.value = []
    if (!isAuthSessionEndUIError(error)) {
      allVitalsError.value = t('encounterClinicalAllRecordsLoadError')
    }
  } finally {
    allVitalsLoading.value = false
  }
}

function openEditVitals(row) {
  if (!props.canEditVitals) {
    return
  }
  editingEntry.value = { ...row }
  recordDialogOpen.value = true
}

function openDeleteVitals(row) {
  if (!props.canEditVitals) {
    return
  }
  if (row?.apiId != null && String(row.apiId).trim()) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('vitalsDeleteUnavailable'),
      position: 'top',
    })

    return
  }
  deletingEntry.value = row
  deleteDialogOpen.value = true
}

function confirmDeleteVitals() {
  const row = deletingEntry.value
  deleteDialogOpen.value = false
  if (!row) {
    return
  }
  vitalsEntries.value = vitalsEntries.value.filter(
    item => String(item.id) !== String(row.id),
  )
  if (editingEntry.value?.id === row.id) {
    editingEntry.value = null
    recordDialogOpen.value = false
  }
  deletingEntry.value = null
  emit('changed')
}

function upsertLocalEntry(entry) {
  const next = [...vitalsEntries.value]
  const idx = next.findIndex(
    item => String(item.id) === String(entry.id),
  )
  if (idx >= 0) {
    next[idx] = { ...next[idx], ...entry }
  } else {
    next.unshift(entry)
  }
  vitalsEntries.value = sortVitalsEntriesDesc(next)
}

async function onVitalsSave({ id, draft }) {
  const clientId = clientKey.value
  if (!clientId) {
    return
  }
  const isEdit = Boolean(id)
  if (isEdit && !props.canEditVitals) {
    return
  }
  if (!isEdit && !props.canAddVitals) {
    return
  }
  const normalized = normalizeVitalsEntry(draft)
  saving.value = true
  try {
    const existing = id
      ? vitalsEntries.value.find(item => String(item.id) === String(id))
      : null
    let saved
    if (existing?.apiId != null && String(existing.apiId).trim()) {
      saved = await updateVital(clientId, existing.apiId, {
        ...normalized,
        apiId: existing.apiId,
      })
      upsertLocalEntry({
        ...existing,
        ...normalized,
        ...(saved || {}),
        encounterId: existing.encounterId ?? resolveEncounterIdNumber(),
        apiId: saved?.apiId ?? existing.apiId,
        id: existing.id,
      })
      notifySuccess(t('vitalsUpdatedSuccess'))
    } else {
      const created = await createVital(clientId, normalized)
      const vital = created.vital
      const newApiId = created.vitalId ?? vital?.apiId
      upsertLocalEntry({
        id: vital?.id || (newApiId != null
          ? `vitals-api-${newApiId}`
          : nextVitalsId()),
        apiId: newApiId ?? null,
        encounterId: vital?.encounterId ?? resolveEncounterIdNumber(),
        ...normalized,
        ...(vital || {}),
      })
      notifySuccess(t('vitalsSavedSuccess'))
    }
    editingEntry.value = null
    recordDialogOpen.value = false
    emit('changed')
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error)
    }
  } finally {
    saving.value = false
  }
}

watch(
  () => props.vitals,
  () => {
    syncVitalsFromWorkspace()
  },
  { immediate: true, deep: true },
)

watch(
  () => props.modelValue,
  () => {
    void loadClinicians()
  },
  { immediate: true },
)
</script>
