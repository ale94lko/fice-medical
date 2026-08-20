<template>
  <div class="add-client-diagnostic-studies-tab">
    <div
      v-if="!canView"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('dsNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div
        v-if="!hideHeader"
        class="diagnostic-studies-header row"
        :class="isMobile ? 'items-center' : 'items-start'">
        <div class="col">
          <h2 class="diagnostic-studies-title">
            {{ t('dsTitle') }}
          </h2>
          <p
            v-if="!isMobile"
            class="labs-subtitle text-body2">
            {{ t('dsSubtitle') }}
          </p>
        </div>
        <div
          v-if="allowAdd"
          class="col-auto row q-gutter-sm no-wrap">
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :disable="loading || saving"
            :data-testid="tid.btn('order')"
            :label="t('dsOrder')"
            @click="openOrder"
          />
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            icon="add"
            :disable="loading || saving"
            :data-testid="tid.btn('existing')"
            :label="t('dsExisting')"
            @click="openExisting"
          />
        </div>
      </div>

      <div
        v-if="loading"
        class="fmh-list-card q-pa-xl flex flex-center"
        :class="{ 'q-mt-md': !hideHeader }">
        <AppBrandLoading inline />
      </div>

      <AdminTablePanel
        v-else
        class="labs-table-panel admin-table-panel--wide"
        :class="{ 'q-mt-md': !hideHeader }"
        :show-column-settings="false">
        <DiagnosticStudiesTable
          :rows="studies"
          :can-edit="allowEdit"
          :can-review="allowReview"
          :can-delete="canDelete"
          :empty-label="resolvedEmptyLabel"
          :empty-hint="resolvedEmptyHint"
          @view="openView"
          @complete="row => openTransition(row, modes.complete)"
          @result="row => openTransition(row, modes.result)"
          @review="row => openTransition(row, modes.review)"
          @download="onDownload"
          @cancel-study="onCancelStudy"
          @delete-study="onDeleteStudy"
        />
      </AdminTablePanel>
    </template>

    <DiagnosticStudyDialog
      v-model="dialogOpen"
      :mode="dialogMode"
      :study="activeStudy"
      :saving="saving"
      @save="onDialogSave"
      @cancel="dialogOpen = false"
    />

    <DiagnosticStudyCancelDialog
      v-model="cancelDialogOpen"
      @confirm="confirmCancel"
    />

    <ModalComponent
      v-model="deleteDialogOpen"
      test-id="diagnostic-study-delete"
      :title="t('dsDeleteTitle')"
      :message="t('dsDeleteMessage')"
      :confirm-text="t('dsActionDelete')"
      :cancel-text="t('cancel')"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminTablePanel from
  'components/admin-table/AdminTablePanel.vue'
import AppBrandLoading from 'components/AppBrandLoading.vue'
import DiagnosticStudiesTable from
  'components/DiagnosticStudiesTable.vue'
import DiagnosticStudyCancelDialog from
  'components/DiagnosticStudyCancelDialog.vue'
import DiagnosticStudyDialog from
  'components/DiagnosticStudyDialog.vue'
import ModalComponent from 'components/ModalComponent.vue'
import {
  diagnosticStudyDialogModes as modes,
  quasarNotifyTypes,
} from 'components/constants.js'
import { diagnosticStudyTestIds as tid } from
  'src/test-ids/index.js'
import { useClientPermissions } from
  'src/composables/useClientPermissions.js'
import { useViewportLayout } from
  'src/composables/useViewportLayout.js'
import { isAuthSessionEndUIError } from
  'src/utils/api-session-error.js'
import {
  addPatientDiagnosticStudyResult,
  cancelPatientDiagnosticStudy,
  completePatientDiagnosticStudy,
  deletePatientDiagnosticStudy,
  documentExistingDiagnosticStudy,
  downloadDiagnosticStudySourceDocument,
  fetchPatientDiagnosticStudy,
  listPatientDiagnosticStudies,
  orderPatientDiagnosticStudy,
  reviewPatientDiagnosticStudy,
  triggerBlobDownload,
  updatePatientDiagnosticStudy,
  uploadDiagnosticStudySourceDocument,
} from 'src/utils/diagnostic-study-api.js'
import {
  cloneDiagnosticStudy,
  sortDiagnosticStudiesDesc,
} from 'src/utils/diagnostic-study-orders.js'

const {
  canAddDiagnosticStudies,
  canEditDiagnosticStudies,
  canReviewDiagnosticStudies,
} = useClientPermissions()

const props = defineProps({
  patientId: {
    type: [String, Number],
    default: null,
  },
  canAdd: {
    type: Boolean,
    default: undefined,
  },
  canEdit: {
    type: Boolean,
    default: undefined,
  },
  canView: {
    type: Boolean,
    default: true,
  },
  canDelete: {
    type: Boolean,
    default: false,
  },
  hideHeader: {
    type: Boolean,
    default: false,
  },
  encounterId: {
    type: [String, Number],
    default: null,
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  emptyHint: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['changed'])
const studies = defineModel({
  type: Array,
  default: () => [],
})

const { t } = useI18n()
const $q = useQuasar()
const { isMobile } = useViewportLayout()

const allowAdd = computed(() => {
  if (typeof props.canAdd === 'boolean') {
    return props.canAdd
  }

  return canAddDiagnosticStudies.value
})

const allowEdit = computed(() => {
  if (typeof props.canEdit === 'boolean') {
    return props.canEdit
  }

  return canEditDiagnosticStudies.value
})

const allowReview = computed(() =>
  canReviewDiagnosticStudies.value,
)

const loading = ref(false)
const saving = ref(false)
const dialogOpen = ref(false)
const dialogMode = ref(modes.order)
const activeStudy = ref(null)
const cancelDialogOpen = ref(false)
const pendingCancel = ref(null)
const deleteDialogOpen = ref(false)
const pendingDelete = ref(null)

const hasPatientId = computed(() =>
  Boolean(String(props.patientId ?? '').trim()),
)
const patientId = computed(() =>
  String(props.patientId ?? '').trim(),
)

const resolvedEmptyLabel = computed(() =>
  String(props.emptyLabel || '').trim() || t('dsListEmpty'),
)
const resolvedEmptyHint = computed(() =>
  String(props.emptyHint || '').trim()
    || (studies.value.length ? '' : t('dsListEmptyHint')),
)

function notifySuccess(message) {
  $q.notify({
    type: quasarNotifyTypes.positive,
    message,
    position: 'top',
  })
}

function notifyError(error, fallbackKey) {
  const status = error?.response?.status
  let message = String(
    error?.response?.data?.message
    ?? error?.message
    ?? t(fallbackKey),
  )
  if (status === 409) {
    message = t('dsStaleUpdate')
  }
  $q.notify({
    type: quasarNotifyTypes.negative,
    message,
    position: 'top',
  })
}

function upsertStudy(row) {
  const copy = cloneDiagnosticStudy(row)
  const id = String(copy.id ?? '').trim()
  if (!id) {
    return
  }
  const idx = studies.value.findIndex(
    item => String(item.id) === id,
  )
  if (idx >= 0) {
    const next = [...studies.value]
    next[idx] = copy
    studies.value = sortDiagnosticStudiesDesc(next)
  } else {
    studies.value = sortDiagnosticStudiesDesc(
      [...studies.value, copy],
    )
  }
}

function removeStudy(id) {
  studies.value = studies.value.filter(
    item => String(item.id) !== String(id),
  )
}

async function loadList() {
  if (!hasPatientId.value || props.hideHeader) {
    return
  }
  loading.value = true
  try {
    studies.value = await listPatientDiagnosticStudies(
      patientId.value,
    )
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, 'dsListError')
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.patientId, props.hideHeader],
  () => {
    void loadList()
  },
  { immediate: true },
)

function requireSavedClient() {
  if (hasPatientId.value) {
    return true
  }
  $q.notify({
    type: quasarNotifyTypes.warning,
    message: t('dsSaveClientFirst'),
    position: 'top',
  })

  return false
}

function openOrder() {
  if (!allowAdd.value || !requireSavedClient()) {
    return
  }
  dialogMode.value = modes.order
  activeStudy.value = null
  dialogOpen.value = true
}

function openExisting() {
  if (!allowAdd.value || !requireSavedClient()) {
    return
  }
  dialogMode.value = modes.existing
  activeStudy.value = null
  dialogOpen.value = true
}

async function openView(row) {
  if (!row?.id || !hasPatientId.value) {
    return
  }
  try {
    activeStudy.value = await fetchPatientDiagnosticStudy(
      patientId.value,
      row.id,
    )
  } catch {
    activeStudy.value = cloneDiagnosticStudy(row)
  }
  dialogMode.value = modes.view
  dialogOpen.value = true
}

async function openTransition(row, mode) {
  if (!row?.id) {
    return
  }
  try {
    activeStudy.value = hasPatientId.value
      ? await fetchPatientDiagnosticStudy(patientId.value, row.id)
      : cloneDiagnosticStudy(row)
  } catch {
    activeStudy.value = cloneDiagnosticStudy(row)
  }
  dialogMode.value = mode
  dialogOpen.value = true
}

function onCancelStudy(row) {
  pendingCancel.value = row
  cancelDialogOpen.value = true
}

function onDeleteStudy(row) {
  pendingDelete.value = row
  deleteDialogOpen.value = true
}

async function confirmCancel() {
  const row = pendingCancel.value
  pendingCancel.value = null
  if (!row?.id || !hasPatientId.value) {
    return
  }
  saving.value = true
  try {
    const saved = await cancelPatientDiagnosticStudy(
      patientId.value,
      row.id,
      row,
    )
    upsertStudy(saved)
    notifySuccess(t('dsCancelledSuccess'))
    emit('changed')
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, 'dsSaveError')
    }
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  const row = pendingDelete.value
  pendingDelete.value = null
  deleteDialogOpen.value = false
  if (!row?.id || !hasPatientId.value) {
    return
  }
  saving.value = true
  try {
    await deletePatientDiagnosticStudy(patientId.value, row.id)
    removeStudy(row.id)
    notifySuccess(t('dsDeletedSuccess'))
    emit('changed')
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, 'dsSaveError')
    }
  } finally {
    saving.value = false
  }
}

async function onDownload(row) {
  if (!row?.id || !hasPatientId.value) {
    return
  }
  try {
    const { blob, fileName } =
      await downloadDiagnosticStudySourceDocument(
        patientId.value,
        row.id,
      )
    triggerBlobDownload(blob, fileName || row.sourceDocumentName)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, 'dsDownloadError')
    }
  }
}

async function maybeUpload(studyId, file) {
  if (!file || !studyId) {
    return
  }
  await uploadDiagnosticStudySourceDocument(
    patientId.value,
    studyId,
    file,
  )
}

async function persist(mode, draft, file) {
  const id = draft?.id
  if (mode === modes.order) {
    const saved = await orderPatientDiagnosticStudy(
      patientId.value,
      draft,
      props.encounterId,
    )
    await maybeUpload(saved.id, file)

    return fetchLatest(saved.id, saved)
  }
  if (mode === modes.existing) {
    const saved = await documentExistingDiagnosticStudy(
      patientId.value,
      draft,
      props.encounterId,
    )
    await maybeUpload(saved.id, file)

    return fetchLatest(saved.id, saved)
  }
  if (mode === modes.complete) {
    return completePatientDiagnosticStudy(
      patientId.value,
      id,
      draft,
    )
  }
  if (mode === modes.result) {
    const saved = await addPatientDiagnosticStudyResult(
      patientId.value,
      id,
      draft,
    )
    await maybeUpload(id, file)

    return fetchLatest(id, saved)
  }
  if (mode === modes.review) {
    return reviewPatientDiagnosticStudy(
      patientId.value,
      id,
      draft,
      props.encounterId,
    )
  }

  const saved = await updatePatientDiagnosticStudy(
    patientId.value,
    id,
    draft,
  )
  await maybeUpload(id, file)

  return fetchLatest(id, saved)
}

async function fetchLatest(id, fallback) {
  try {
    return await fetchPatientDiagnosticStudy(patientId.value, id)
  } catch {
    return fallback
  }
}

function successMessage(mode) {
  if (mode === modes.order) {
    return t('dsOrderedSuccess')
  }
  if (mode === modes.existing) {
    return t('dsExistingSuccess')
  }
  if (mode === modes.complete) {
    return t('dsCompletedSuccess')
  }
  if (mode === modes.result) {
    return t('dsResultSuccess')
  }
  if (mode === modes.review) {
    return t('dsReviewedSuccess')
  }

  return t('dsSaved')
}

async function onDialogSave({ draft, addAnother, file }) {
  if (!requireSavedClient()) {
    return
  }
  saving.value = true
  try {
    const saved = await persist(dialogMode.value, draft, file)
    upsertStudy(saved)
    notifySuccess(successMessage(dialogMode.value))
    emit('changed')
    if (addAnother
      && [modes.order, modes.existing].includes(dialogMode.value)) {
      activeStudy.value = null
      return
    }
    dialogOpen.value = false
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, 'dsSaveError')
    }
  } finally {
    saving.value = false
  }
}

defineExpose({
  openOrder,
  openExisting,
})
</script>
