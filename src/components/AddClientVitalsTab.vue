<template>
  <div class="add-client-vitals-tab">
    <div
      v-if="!canView"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('vitalsNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div class="vitals-header row items-start">
        <div class="col">
          <h2 class="vitals-title">
            {{ t('vitalsHistoryTitle') }}
          </h2>
          <p class="vitals-subtitle text-body2">
            {{ t('vitalsHistorySubtitle') }}
          </p>
        </div>
        <div class="col-auto">
          <q-btn
            v-if="allowAdd"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :disable="saving"
            :data-testid="tid.vitalsBtnAdd"
            :label="t('vitalsAdd')"
            @click="openAddDialog"
          />
        </div>
      </div>

      <div
        v-if="loading"
        class="fmh-list-card q-pa-xl flex flex-center q-mt-md">
        <AppBrandLoading inline />
      </div>

      <AdminTablePanel
        v-else
        class="vitals-table-panel admin-table-panel--wide q-mt-md"
        :show-column-settings="false">
        <VitalsHistoryTable
          :entries="sortedEntries"
          :can-edit="allowEdit"
          :empty-label="t('vitalsHistoryEmpty')"
          :clinician-options="clinicianOptions"
          :patient-dob="patientDob"
          :patient-age="patientAge"
          :patient-age-unit="patientAgeUnit"
          :patient-gender="patientGender"
          @edit="openEditDialog"
          @delete="openDelete"
        />
      </AdminTablePanel>

      <VitalsRecordDialog
        v-model="recordDialogOpen"
        :entry="editingEntry"
        :clinician-options="clinicianOptions"
        :patient-dob="patientDob"
        :patient-age="patientAge"
        :patient-age-unit="patientAgeUnit"
        :patient-gender="patientGender"
        :readonly="readonly"
        :saving="saving"
        @save="onRecordSave"
      />

      <CarePlanReasonDialog
        v-model="deleteDialogOpen"
        :title="t('vitalsDeleteTitle')"
        :message="t('vitalsDeleteMessage')"
        :hint="t('vitalsDeleteReasonHint')"
        :reason-label="t('vitalsDeleteReasonLabel')"
        :confirm-label="t('delete')"
        reason-field="vitals-delete-reason"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AppBrandLoading from 'components/AppBrandLoading.vue'
import VitalsHistoryTable from 'components/VitalsHistoryTable.vue'
import VitalsRecordDialog from 'components/VitalsRecordDialog.vue'
import CarePlanReasonDialog from 'components/CarePlanReasonDialog.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import {
  createEmptyVitalsDraft,
  nextVitalsId,
  normalizeVitalsEntry,
  sortVitalsEntriesDesc,
} from 'src/utils/client-vitals.js'
import {
  createVital,
  deleteVital,
  updateVital,
} from 'src/utils/vitals-api.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  isEncounterConflictError,
  isEncounterInvalidError,
} from 'src/utils/encounter-api.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'
import { useClientPermissions } from
  'src/composables/useClientPermissions.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  patientId: {
    type: [String, Number],
    default: null,
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  canView: {
    type: Boolean,
    default: true,
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
    default: '',
  },
  patientGender: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const $q = useQuasar()
const { canAddVitals, canEditVitals } = useClientPermissions()

const allowAdd = computed(
  () => !props.readonly && canAddVitals.value,
)
const allowEdit = computed(
  () => !props.readonly && canEditVitals.value,
)

const loading = ref(false)
const saving = ref(false)
const recordDialogOpen = ref(false)
const editingEntry = ref(null)
const deleteDialogOpen = ref(false)
const deletingEntry = ref(null)

const section = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const hasPatientId = computed(() =>
  Boolean(String(props.patientId ?? '').trim()),
)

const patientId = computed(() => String(props.patientId ?? '').trim())

const sortedEntries = computed(() =>
  sortVitalsEntriesDesc(section.value.entries),
)

function openAddDialog() {
  if (!allowAdd.value) {
    return
  }
  editingEntry.value = null
  recordDialogOpen.value = true
}

function openEditDialog(row) {
  if (!allowEdit.value) {
    return
  }
  editingEntry.value = { ...row }
  recordDialogOpen.value = true
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

function upsertEntry(entry) {
  const entries = [...(section.value.entries ?? [])]
  const idx = entries.findIndex(item => String(item.id) === String(entry.id))
  if (idx >= 0) {
    entries[idx] = { ...entries[idx], ...entry }
  } else {
    entries.push(entry)
  }
  section.value = {
    ...section.value,
    entries,
    editingId: null,
    draft: createEmptyVitalsDraft(),
  }
}

async function persistViaApi(normalized, existing) {
  const apiId = existing?.apiId
  if (apiId != null && String(apiId).trim()) {
    const saved = await updateVital(patientId.value, apiId, {
      ...normalized,
      apiId,
    })

    return {
      ...existing,
      ...normalized,
      ...(saved || {}),
      apiId: saved?.apiId ?? apiId,
      id: existing.id || saved?.id || `vitals-api-${apiId}`,
    }
  }
  const created = await createVital(patientId.value, normalized)
  const vital = created.vital
  const newApiId = created.vitalId ?? vital?.apiId

  return {
    id: vital?.id || (newApiId != null
      ? `vitals-api-${newApiId}`
      : nextVitalsId()),
    apiId: newApiId ?? null,
    ...normalized,
    ...(vital || {}),
  }
}

async function onRecordSave({ id, draft }) {
  const normalized = normalizeVitalsEntry(draft)
  saving.value = true
  try {
    if (!hasPatientId.value) {
      await saveLocalOnly(id, normalized)
    } else {
      const existing = id
        ? section.value.entries.find(e => e.id === id)
        : null
      const saved = await persistViaApi(normalized, existing)
      upsertEntry(saved)
      notifySuccess(
        existing?.apiId
          ? t('vitalsUpdatedSuccess')
          : t('vitalsSavedSuccess'),
      )
    }
    editingEntry.value = null
    recordDialogOpen.value = false
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error)
    }
  } finally {
    saving.value = false
  }
}

function saveLocalOnly(id, normalized) {
  if (id) {
    const entries = [...section.value.entries]
    const idx = entries.findIndex(e => e.id === id)
    if (idx >= 0) {
      entries[idx] = {
        ...entries[idx],
        ...normalized,
      }
    }
    section.value = {
      ...section.value,
      entries,
      editingId: null,
      draft: createEmptyVitalsDraft(),
    }
    notifySuccess(t('vitalsUpdatedSuccess'))

    return
  }
  upsertEntry({
    id: nextVitalsId(),
    ...normalized,
  })
  notifySuccess(t('vitalsSavedSuccess'))
}

function openDelete(row) {
  if (!allowEdit.value) {
    return
  }
  deletingEntry.value = row
  deleteDialogOpen.value = true
}

function removeLocalEntry(id) {
  section.value = {
    ...section.value,
    entries: section.value.entries.filter(e => e.id !== id),
    editingId:
      section.value.editingId === id ? null : section.value.editingId,
    draft: createEmptyVitalsDraft(),
  }
  if (editingEntry.value?.id === id) {
    editingEntry.value = null
    recordDialogOpen.value = false
  }
}

async function confirmDelete(reason) {
  const row = deletingEntry.value
  deletingEntry.value = null
  const trimmedReason = String(reason ?? '').trim()
  if (!row || !trimmedReason) {
    return
  }
  const apiId = row.apiId
  try {
    if (
      hasPatientId.value
      && apiId != null
      && String(apiId).trim()
    ) {
      await deleteVital(patientId.value, apiId, trimmedReason)
    }
    removeLocalEntry(row.id)
    notifySuccess(t('vitalsDeletedSuccess'))
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, 'vitalsDeleteError')
    }
  }
}

function applySaveValidation() {
  clearSaveValidation()
}

function clearSaveValidation() {
  section.value = {
    ...section.value,
    draft: createEmptyVitalsDraft(),
    editingId: null,
  }
}

defineExpose({
  applySaveValidation,
  clearSaveValidation,
})
</script>
