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
      <div
        class="clinical-notes-header row"
        :class="isMobile ? 'items-center' : 'items-start'">
        <div class="col">
          <h2 class="clinical-notes-title">
            {{ t('clinicalNotesTitle') }}
          </h2>
          <p
            v-if="!isMobile"
            class="clinical-notes-subtitle text-body2">
            {{ t('clinicalNotesSubtitle') }}
          </p>
        </div>
        <div
          v-if="!isMobile"
          class="col-auto">
          <div class="row q-gutter-sm items-center">
            <q-btn
              v-if="canUseScribe"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              icon="auto_awesome"
              :disable="saving"
              :data-testid="aiTestIds.featureBtn('soap-draft')"
              :label="t('aiBtnSoapDraft')"
              @click="openAiFeature(aiFeatures.soapDraft)"
            />
            <q-btn
              v-if="canUseCodingAssistant"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              icon="auto_awesome"
              :disable="saving"
              :data-testid="aiTestIds.featureBtn('icd10')"
              :label="t('aiBtnIcd10')"
              @click="openAiFeature(aiFeatures.icd10Suggest)"
            />
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
        <AdminListPageActions
          v-if="isMobile"
          :compact="true"
          :actions="mobilePageActions"
          :menu-test-id="tid.btn('actions-menu')"
        />
      </div>

      <AdminTablePanel
        class="clinical-notes-table-panel admin-table-panel--wide q-mt-md"
        :show-column-settings="false">
        <ClinicalNotesTable
          :rows="noteRows"
          :empty-label="t('clinicalNoteListEmpty')"
          :can-edit="canEditClinicalNotes"
          :can-delete="canDeleteClinicalNotes"
          :can-download="canGenerateDocuments"
          @view="openView"
          @edit="openEdit"
          @delete="confirmDelete"
          @download="onExport"
        />
      </AdminTablePanel>
    </template>

    <GenerateDocumentDialog
      v-model="exportDialogOpen"
      :document-type="documentTypes.clinicalNote"
      :context="exportContext"
    />

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
      @add-addendum="openAddendumFromNote"
      @cancel="dialogOpen = false"
    />

    <ClinicalNoteAddendumDialog
      v-model="addendumDialogOpen"
      :clinician-options="resolvedClinicianOptions"
      :saving="saving"
      @sign="onAddendumSign"
      @cancel="addendumDialogOpen = false"
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

    <EncounterGeneratedNoteDialog
      v-model="generatedOpen"
      :note="generatedNote"
      :busy="saving"
      :can-sign="canSignClinicalNotes"
      :can-regenerate="canRegenerateGenerated"
      :can-correct-sources="canCorrectGeneratedSources"
      @sign="onSignGenerated"
      @regenerate="onRegenerateGenerated"
      @add-addendum="openAddendumFromGenerated"
      @edit-source="onEditGeneratedSource"
    />

    <AiGenerateDialog
      v-model="aiDialogOpen"
      :feature="aiFeature"
      :client-id="clientId"
      @committed="onAiCommitted"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import AdminListPageActions from
  'components/admin-table/AdminListPageActions.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AiGenerateDialog from 'components/ai/AiGenerateDialog.vue'
import ClinicalNoteDialog from 'components/ClinicalNoteDialog.vue'
import ClinicalNoteAddendumDialog from
  'components/ClinicalNoteAddendumDialog.vue'
import ClinicalNotesTable from 'components/ClinicalNotesTable.vue'
import EncounterGeneratedNoteDialog from
  'components/encounter/EncounterGeneratedNoteDialog.vue'
import ModalComponent from 'components/ModalComponent.vue'
import {
  aiFeatures,
  clinicalNoteStatuses,
  permissionNames,
  quasarNotifyTypes,
} from 'components/constants.js'
import { useAiPermissions } from 'src/composables/useAiPermissions.js'
import { useClientClinicalNotePermissions } from
  'src/composables/useClientClinicalNotePermissions.js'
import { useViewportLayout } from
  'src/composables/useViewportLayout.js'
import { useDocumentGenerationPermissions } from
  'src/composables/useDocumentGenerationPermissions.js'
import {
  addClinicalNoteAddendum,
  apiErrorMessage,
  createClinicalNote,
  deleteClinicalNote,
  signClinicalNote,
  updateClinicalNote,
} from 'src/utils/clinical-note-api.js'
import GenerateDocumentDialog from
  'components/documents/GenerateDocumentDialog.vue'
import { documentTypes } from 'src/utils/document-generation-constants.js'
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
import { aiTestIds } from 'src/test-ids/ai.js'
import { clinicalNoteTestIds as tid } from 'src/test-ids/index.js'
import { hasPermission } from 'src/utils/auth-permissions.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import {
  fetchGeneratedClinicalNote,
  regenerateClinicalNote,
} from 'src/utils/encounter-narrative-api.js'

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
const router = useRouter()
const { isMobile } = useViewportLayout()
const siteStore = useSiteStore()
const authStore = useAuthStore()
const {
  canViewClinicalNotes,
  canAddClinicalNotes,
  canEditClinicalNotes,
  canDeleteClinicalNotes,
  canSignClinicalNotes,
} = useClientClinicalNotePermissions()
const { canGenerateDocuments } = useDocumentGenerationPermissions()
const { canUseScribe, canUseCodingAssistant } = useAiPermissions()

const saving = ref(false)

const dialogOpen = ref(false)
const dialogMode = ref('add')
const activeNote = ref(null)
const deleteDialogOpen = ref(false)
const pendingDeleteNote = ref(null)
const exportDialogOpen = ref(false)
const exportContext = ref({})
const aiDialogOpen = ref(false)
const aiFeature = ref(aiFeatures.soapDraft)
const generatedOpen = ref(false)
const generatedNote = ref(null)
const addendumDialogOpen = ref(false)
const addendumNoteId = ref(null)

const canRegenerateGenerated = computed(() =>
  hasPermission(
    authStore.permissions,
    permissionNames.clinicalNoteRegenerate,
  )
  && String(generatedNote.value?.status ?? '').toUpperCase() !== 'SIGNED',
)

const canCorrectGeneratedSources = computed(() => {
  const status = String(generatedNote.value?.status ?? '').toUpperCase()

  return status === clinicalNoteStatuses.generated
    && Boolean(generatedNote.value?.encounterId)
    && (canEditClinicalNotes.value || canSignClinicalNotes.value)
})

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

function openAiFeature(feature) {
  aiFeature.value = feature
  aiDialogOpen.value = true
}

async function onAiCommitted() {
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

const mobilePageActions = computed(() => [
  {
    key: 'soapDraft',
    label: t('aiBtnSoapDraft'),
    icon: 'auto_awesome',
    testId: aiTestIds.featureBtn('soap-draft'),
    disable: saving.value,
    visible: canUseScribe.value,
    onClick: () => openAiFeature(aiFeatures.soapDraft),
  },
  {
    key: 'icd10',
    label: t('aiBtnIcd10'),
    icon: 'auto_awesome',
    testId: aiTestIds.featureBtn('icd10'),
    disable: saving.value,
    visible: canUseCodingAssistant.value,
    onClick: () => openAiFeature(aiFeatures.icd10Suggest),
  },
  {
    key: 'add',
    label: t('clinicalNoteAdd'),
    icon: 'add',
    variant: 'primary',
    testId: tid.btn('add'),
    disable: saving.value,
    visible: canAddClinicalNotes.value,
    onClick: openAdd,
  },
])

function openView(row) {
  if (row.generated || row.isGenerated) {
    void openGenerated(row)

    return
  }
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

async function openGenerated(row) {
  const encounterId = row.encounterId
  if (encounterId == null) {
    return
  }
  saving.value = true
  try {
    generatedNote.value = await fetchGeneratedClinicalNote(encounterId)
    generatedOpen.value = true
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('clinicalNoteLoadError'),
      })
    }
  } finally {
    saving.value = false
  }
}

async function onSignGenerated(signatureData) {
  if (!canSignClinicalNotes.value || generatedNote.value?.id == null) {
    return
  }
  saving.value = true
  try {
    await signClinicalNote(
      clientId.value,
      generatedNote.value.id,
      signatureData,
      resolvedClinicianOptions.value,
    )
    generatedOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('encounterGeneratedNoteSignSuccess'),
      position: 'top',
    })
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

async function onRegenerateGenerated() {
  const encounterId = generatedNote.value?.encounterId
  if (encounterId == null) {
    return
  }
  saving.value = true
  try {
    generatedNote.value = await regenerateClinicalNote(encounterId)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('encounterGeneratedNoteRegenerateSuccess'),
      position: 'top',
    })
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

function onEditGeneratedSource(target) {
  generatedOpen.value = false
  const encounterId = generatedNote.value?.encounterId
  if (!target || encounterId == null) {
    return
  }
  if (target.workspaceTab) {
    void router.push({
      name: 'EncounterWorkspace',
      params: { id: String(encounterId) },
      query: {
        tab: target.workspaceTab,
        ...(target.clinicalSubTab
          ? { clinicalSubTab: target.clinicalSubTab }
          : {}),
      },
    })

    return
  }
  if (target.tab) {
    void router.push({
      name: 'EditClient',
      params: { id: clientId.value },
      query: {
        tab: target.tab,
        ...(target.subTab ? { subTab: target.subTab } : {}),
        encounterId: String(encounterId),
      },
    })
  }
}

function openEdit(row) {
  if (!canEditClinicalNotes.value) {
    return
  }
  if (row.generated || row.isGenerated) {
    void openGenerated(row)

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

async function onExport(row) {
  if (!row?.id || !canGenerateDocuments.value) {
    return
  }

  exportContext.value = {
    clientNumber: clientId.value,
    clinicalNoteId: row.id,
  }
  exportDialogOpen.value = true
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

function openAddendumFromNote() {
  if (!canSignClinicalNotes.value || !activeNote.value?.id) {
    return
  }
  addendumNoteId.value = activeNote.value.id
  addendumDialogOpen.value = true
}

function openAddendumFromGenerated() {
  if (!canSignClinicalNotes.value || !generatedNote.value?.id) {
    return
  }
  addendumNoteId.value = generatedNote.value.id
  addendumDialogOpen.value = true
}

async function onAddendumSign(payload) {
  if (!canSignClinicalNotes.value || addendumNoteId.value == null) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('clinicalNoteNoSignPermission'),
      position: 'top',
    })

    return
  }
  saving.value = true
  try {
    const updated = await addClinicalNoteAddendum(
      clientId.value,
      addendumNoteId.value,
      payload,
      resolvedClinicianOptions.value,
    )
    addendumDialogOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('clinicalNoteAddendumSigned'),
      position: 'top',
    })
    if (dialogOpen.value && activeNote.value) {
      activeNote.value = updated
    }
    if (generatedOpen.value && generatedNote.value?.encounterId != null) {
      generatedNote.value = await fetchGeneratedClinicalNote(
        generatedNote.value.encounterId,
      )
    }
    await refreshClientClinicalNotes()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error)
          || t('clinicalNoteAddendumSignError'),
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
