<template>
  <div class="add-client-clinical-notes-tab">
    <div
      v-if="!hasClientId"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('clinicalNoteSaveClientFirst') }}
      </p>
    </div>

    <div
      v-else-if="!canViewClinicalNotes"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('clinicalNoteNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div class="clinical-notes-header row items-start">
        <div class="col">
          <h2 class="clinical-notes-title">
            {{ t('clinicalNotesTitle') }}
          </h2>
          <p class="clinical-notes-subtitle text-body2">
            {{ t('clinicalNotesSubtitle') }}
          </p>
        </div>
        <div class="col-auto">
          <q-btn
            v-if="canAddClinicalNotes"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :disable="saving"
            :data-testid="tid.btn('add')"
            :label="t('clinicalNoteAdd')"
            @click="openAdd"
          />
        </div>
      </div>

      <AdminTablePanel
        class="clinical-notes-table-panel q-mt-md"
        :show-column-settings="false">
        <ClinicalNotesTable
          :rows="noteRows"
          :empty-label="t('clinicalNoteListEmpty')"
          :can-edit="canEditClinicalNotes"
          :can-delete="canDeleteClinicalNotes"
          :can-download="canViewClinicalNotes"
          @view="openView"
          @edit="openEdit"
          @delete="confirmDelete"
          @download="onDownload"
        />
      </AdminTablePanel>
    </template>

    <ClinicalNoteDialog
      v-model="dialogOpen"
      :mode="dialogMode"
      :note="activeNote"
      :clinician-options="resolvedClinicianOptions"
      :admission-date="admissionDate"
      :can-sign="canSignClinicalNotes"
      :saving="saving"
      @save-draft="onSaveDraft"
      @sign="onSign"
      @cancel="dialogOpen = false"
    />

    <ModalComponent
      v-model="deleteDialogOpen"
      :title="t('clinicalNoteDeleteConfirmTitle')"
      :message="t('clinicalNoteDeleteConfirmMessage')"
      :confirm-text="t('delete')"
      :cancel-text="t('cancel')"
      test-id="clinical-note-delete"
      @confirm="onDeleteConfirmed"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import ClinicalNoteDialog from 'components/ClinicalNoteDialog.vue'
import ClinicalNotesTable from 'components/ClinicalNotesTable.vue'
import ModalComponent from 'components/ModalComponent.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { useClientClinicalNotePermissions } from
  'src/composables/useClientClinicalNotePermissions.js'
import {
  apiErrorMessage,
  createClinicalNote,
  deleteClinicalNote,
  downloadClinicalNote,
  signClinicalNote,
  updateClinicalNote,
} from 'src/utils/clinical-note-api.js'
import {
  mapClinicalNotesListFromApi,
  normalizeClinicalNoteDetail,
} from 'src/utils/clinical-note-normalize.js'
import {
  cloneClinicalNote,
  createEmptyClinicalNote,
  isServerClinicalNoteId,
} from 'src/utils/clinical-note-orders.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { useSiteStore } from 'src/stores/site-store.js'
import { clinicalNoteTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
  clinicalNotes: {
    type: Array,
    default: () => [],
  },
  admissionDate: {
    type: String,
    default: '',
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
  canViewClinicalNotes,
  canAddClinicalNotes,
  canEditClinicalNotes,
  canDeleteClinicalNotes,
  canSignClinicalNotes,
} = useClientClinicalNotePermissions()

const saving = ref(false)

const dialogOpen = ref(false)
const dialogMode = ref('add')
const activeNote = ref(null)
const deleteDialogOpen = ref(false)
const pendingDeleteNote = ref(null)

const hasClientId = computed(() =>
  Boolean(String(props.clientId ?? '').trim()),
)
const clientId = computed(() => String(props.clientId ?? '').trim())
const resolvedClinicianOptions = computed(
  () => props.clinicianOptions ?? [],
)

const clinicalNotesRaw = computed(() =>
  Array.isArray(props.clinicalNotes) ? props.clinicalNotes : [],
)

const noteRows = computed(() =>
  mapClinicalNotesListFromApi(
    clinicalNotesRaw.value,
    resolvedClinicianOptions.value,
  ),
)

function findRawClinicalNote(noteId) {
  return clinicalNotesRaw.value.find(
    row => String(row?.id) === String(noteId),
  )
}

function noteDetailFromRecord(noteId) {
  const raw = findRawClinicalNote(noteId)
  if (!raw) {
    return null
  }

  return normalizeClinicalNoteDetail(
    raw,
    resolvedClinicianOptions.value,
  )
}

async function refreshClientClinicalNotes() {
  if (!hasClientId.value) {
    return
  }
  try {
    await siteStore.fetchClientById(clientId.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('clinicalNoteListError'),
        position: 'top',
      })
    }
  }
}

function openAdd() {
  dialogMode.value = 'add'
  activeNote.value = createEmptyClinicalNote()
  dialogOpen.value = true
}

function openView(row) {
  if (isServerClinicalNoteId(row.id)) {
    const detail = noteDetailFromRecord(row.id)
    if (detail) {
      activeNote.value = detail
      dialogMode.value = 'view'
      dialogOpen.value = true

      return
    }
  }
  activeNote.value = cloneClinicalNote(row)
  dialogMode.value = 'view'
  dialogOpen.value = true
}

function openEdit(row) {
  if (!canEditClinicalNotes.value) {
    return
  }
  if (isServerClinicalNoteId(row.id)) {
    const detail = noteDetailFromRecord(row.id)
    if (detail) {
      activeNote.value = detail
      dialogMode.value = 'edit'
      dialogOpen.value = true

      return
    }
  }
  activeNote.value = cloneClinicalNote(row)
  dialogMode.value = 'edit'
  dialogOpen.value = true
}

function confirmDelete(row) {
  pendingDeleteNote.value = row
  deleteDialogOpen.value = true
}

async function onDeleteConfirmed() {
  const row = pendingDeleteNote.value
  pendingDeleteNote.value = null
  if (!row?.id) {
    return
  }
  try {
    await deleteClinicalNote(clientId.value, row.id)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('clinicalNoteDeleted'),
      position: 'top',
    })
    await refreshClientClinicalNotes()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('clinicalNoteDeleteError'),
      })
    }
  }
}

async function onDownload(row) {
  if (!row?.id) {
    return
  }
  try {
    const response = await downloadClinicalNote(clientId.value, row.id)
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `clinical-note-${row.id}.txt`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('clinicalNoteDownloadError'),
      })
    }
  }
}

async function persistNote(note) {
  if (isServerClinicalNoteId(note.id)) {
    return updateClinicalNote(
      clientId.value,
      note,
      resolvedClinicianOptions.value,
    )
  }

  return createClinicalNote(
    clientId.value,
    note,
    resolvedClinicianOptions.value,
  )
}

async function onSaveDraft(note) {
  saving.value = true
  try {
    await persistNote(note)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('clinicalNoteSaved'),
      position: 'top',
    })
    dialogOpen.value = false
    await refreshClientClinicalNotes()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('clinicalNoteSaveError'),
      })
    }
  } finally {
    saving.value = false
  }
}

async function onSign(note) {
  if (!canSignClinicalNotes.value) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('clinicalNoteNoSignPermission'),
      position: 'top',
    })

    return
  }
  saving.value = true
  try {
    const saved = await persistNote(note)
    await signClinicalNote(
      clientId.value,
      saved.id,
      note.signatureData,
      resolvedClinicianOptions.value,
    )
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('clinicalNoteSigned'),
      position: 'top',
    })
    dialogOpen.value = false
    await refreshClientClinicalNotes()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('clinicalNoteSignError'),
      })
    }
  } finally {
    saving.value = false
  }
}
</script>
