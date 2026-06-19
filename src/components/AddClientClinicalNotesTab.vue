<template>
  <div class="add-client-clinical-notes-tab">
    <div v-if="!hasClientId" class="clinical-notes-panel q-pa-lg text-center">
      <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('clinicalNoteSaveClientFirst') }}
      </p>
    </div>

    <div
      v-else-if="!canViewClinicalNotes"
      class="clinical-notes-panel q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('clinicalNoteNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div class="row items-center justify-between q-mb-md">
        <div>
          <h2 class="clinical-notes-panel__title q-mb-xs">
            {{ t('clinicalNotesTitle') }}
          </h2>
          <p class="clinical-notes-panel__subtitle text-body2 text-grey-7">
            {{ t('clinicalNotesSubtitle') }}
          </p>
        </div>
        <q-btn
          v-if="canAddClinicalNotes"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="add"
          :disable="loading"
          :data-testid="tid.btn('add')"
          :label="t('clinicalNoteAdd')"
          @click="openAdd"
        />
      </div>

      <div v-if="loading" class="clinical-notes-panel q-pa-xl flex flex-center">
        <AppBrandLoading inline />
      </div>

      <div v-else class="clinical-notes-panel q-pa-md">
        <ClinicalNotesTable
          :rows="paginatedNotes"
          :empty-label="t('clinicalNoteListEmpty')"
          :can-edit="canEditClinicalNotes"
          :can-delete="canDeleteClinicalNotes"
          :can-download="canViewClinicalNotes"
          @view="openView"
          @edit="openEdit"
          @delete="confirmDelete"
          @download="onDownload"
        />

        <div
          v-if="notes.length"
          class="row items-center justify-between q-mt-md">
          <p class="text-body2 text-grey-7 q-mb-none">
            {{
              t('clinicalNotePaginationSummary', {
                from: pageFrom,
                to: pageTo,
                total: notes.length,
              })
            }}
          </p>
          <q-pagination
            v-model="page"
            :max="pageCount"
            max-pages="6"
            direction-links
            boundary-links
            color="primary"
            size="sm"
          />
        </div>
      </div>
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
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AppBrandLoading from 'components/AppBrandLoading.vue'
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
  fetchClinicalNote,
  listClinicalNotes,
  signClinicalNote,
  updateClinicalNote,
} from 'src/utils/clinical-note-api.js'
import {
  cloneClinicalNote,
  createEmptyClinicalNote,
  isServerClinicalNoteId,
} from 'src/utils/clinical-note-orders.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { clinicalNoteTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
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
const {
  canViewClinicalNotes,
  canAddClinicalNotes,
  canEditClinicalNotes,
  canDeleteClinicalNotes,
  canSignClinicalNotes,
} = useClientClinicalNotePermissions()

const loading = ref(false)
const saving = ref(false)
const notes = ref([])
const page = ref(1)
const pageSize = 10

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

const pageCount = computed(() =>
  Math.max(1, Math.ceil(notes.value.length / pageSize)),
)

const paginatedNotes = computed(() => {
  const start = (page.value - 1) * pageSize

  return notes.value.slice(start, start + pageSize)
})

const pageFrom = computed(() => {
  if (!notes.value.length) {
    return 0
  }

  return (page.value - 1) * pageSize + 1
})

const pageTo = computed(() =>
  Math.min(page.value * pageSize, notes.value.length),
)

watch(pageCount, maxPage => {
  if (page.value > maxPage) {
    page.value = 1
  }
})

watch(clientId, () => {
  if (hasClientId.value && canViewClinicalNotes.value) {
    loadNotes()
  }
})

onMounted(() => {
  if (hasClientId.value && canViewClinicalNotes.value) {
    loadNotes()
  }
})

async function loadNotes() {
  loading.value = true
  try {
    const result = await listClinicalNotes(
      clientId.value,
      { limit: 100, page: 0 },
      resolvedClinicianOptions.value,
    )
    notes.value = result.items ?? []
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('clinicalNoteListError'),
      })
    }
  } finally {
    loading.value = false
  }
}

async function loadNoteDetail(noteId, mode) {
  loading.value = true
  try {
    activeNote.value = await fetchClinicalNote(
      clientId.value,
      noteId,
      resolvedClinicianOptions.value,
    )
    dialogMode.value = mode
    dialogOpen.value = true
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('clinicalNoteLoadError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function openAdd() {
  dialogMode.value = 'add'
  activeNote.value = createEmptyClinicalNote()
  dialogOpen.value = true
}

async function openView(row) {
  if (isServerClinicalNoteId(row.id)) {
    await loadNoteDetail(row.id, 'view')

    return
  }
  activeNote.value = cloneClinicalNote(row)
  dialogMode.value = 'view'
  dialogOpen.value = true
}

async function openEdit(row) {
  if (!canEditClinicalNotes.value) {
    return
  }
  if (isServerClinicalNoteId(row.id)) {
    await loadNoteDetail(row.id, 'edit')

    return
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
    await loadNotes()
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
    await loadNotes()
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
    await loadNotes()
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

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.add-client-clinical-notes-tab {
  width: 100%;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
}

.clinical-notes-panel {
  background: #fff;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
}

.clinical-notes-panel__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: $text-strong;
}

.clinical-notes-panel__subtitle {
  margin: 0;
}
</style>
