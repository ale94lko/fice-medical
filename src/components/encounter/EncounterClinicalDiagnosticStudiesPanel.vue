<template>
  <section class="encounter-workspace-card">
    <div class="encounter-workspace-card__head">
      <div>
        <h2>{{ t('encounterClinicalDiagnosticStudies') }}</h2>
        <p class="text-body2 text-grey-7 q-mb-none">
          {{ t('encounterClinicalDiagnosticStudiesHint') }}
        </p>
      </div>
      <div class="row q-gutter-sm items-center no-wrap">
        <q-btn
          v-if="canAdd && encounterOpen"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="add"
          :label="t('dsOrder')"
          :data-testid="tid.btn('order')"
          @click="tabRef?.openOrder()"
        />
        <q-btn
          v-if="canAdd"
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          icon="add"
          :label="t('dsExisting')"
          :data-testid="tid.btn('existing')"
          @click="tabRef?.openExisting()"
        />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('encounterClinicalAllDiagnosticStudies')"
          :loading="allLoading"
          data-testid="encounter-clinical-all-diagnostic-studies"
          @click="openAllRecords"
        />
      </div>
    </div>

    <AddClientDiagnosticStudiesTab
      ref="tabRef"
      v-model="studiesModel"
      hide-header
      :patient-id="clientId"
      :encounter-id="encounterId"
      :can-add="canAdd"
      :can-edit="canEdit"
      :can-delete="canDelete"
      :empty-label="t('encounterClinicalDiagnosticStudiesEmpty')"
      :empty-hint="t('dsListEmptyHint')"
      @changed="emit('changed')"
    />

    <EncounterClinicalAllRecordsDialog
      v-model="allOpen"
      :title="t('encounterClinicalAllDiagnosticStudiesTitle')"
      :hint="t('encounterClinicalAllRecordsHint')"
      :loading="allLoading"
      :error="allError">
      <DiagnosticStudiesTable
        :rows="allRows"
        :can-edit="false"
        :can-review="false"
        :can-delete="false"
        :empty-label="t('dsListEmpty')"
        @view="openViewStudy"
        @download="onDownload"
      />
    </EncounterClinicalAllRecordsDialog>

    <DiagnosticStudyDialog
      v-model="viewDialogOpen"
      :mode="modes.view"
      :study="viewStudy"
      @cancel="viewDialogOpen = false"
    />
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AddClientDiagnosticStudiesTab from
  'components/AddClientDiagnosticStudiesTab.vue'
import DiagnosticStudiesTable from
  'components/DiagnosticStudiesTable.vue'
import DiagnosticStudyDialog from
  'components/DiagnosticStudyDialog.vue'
import EncounterClinicalAllRecordsDialog from
  'components/encounter/EncounterClinicalAllRecordsDialog.vue'
import {
  diagnosticStudyDialogModes as modes,
  quasarNotifyTypes,
} from 'components/constants.js'
import { diagnosticStudyTestIds as tid } from
  'src/test-ids/index.js'
import { isAuthSessionEndUIError } from
  'src/utils/api-session-error.js'
import {
  downloadDiagnosticStudySourceDocument,
  fetchPatientDiagnosticStudy,
  listPatientDiagnosticStudies,
  triggerBlobDownload,
} from 'src/utils/diagnostic-study-api.js'
import {
  cloneDiagnosticStudy,
  sortDiagnosticStudiesDesc,
} from 'src/utils/diagnostic-study-orders.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
  encounterId: {
    type: [String, Number],
    default: null,
  },
  diagnosticStudies: {
    type: Array,
    default: () => [],
  },
  canAdd: {
    type: Boolean,
    default: false,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
  canDelete: {
    type: Boolean,
    default: false,
  },
  encounterOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['changed'])
const { t } = useI18n()
const $q = useQuasar()
const tabRef = ref(null)
const studiesModel = ref([])
const allOpen = ref(false)
const allLoading = ref(false)
const allError = ref('')
const allRows = ref([])
const viewDialogOpen = ref(false)
const viewStudy = ref(null)

function syncFromProps() {
  const list = Array.isArray(props.diagnosticStudies)
    ? props.diagnosticStudies
    : []
  studiesModel.value = sortDiagnosticStudiesDesc(
    list.map(row => ({ ...row })),
  )
}

watch(
  () => props.diagnosticStudies,
  () => {
    syncFromProps()
  },
  { immediate: true, deep: true },
)

async function openAllRecords() {
  const clientId = String(props.clientId ?? '').trim()
  if (!clientId) {
    return
  }
  allOpen.value = true
  allLoading.value = true
  allError.value = ''
  try {
    allRows.value = await listPatientDiagnosticStudies(clientId)
  } catch (error) {
    allRows.value = []
    if (!isAuthSessionEndUIError(error)) {
      allError.value = t('encounterClinicalAllRecordsLoadError')
    }
  } finally {
    allLoading.value = false
  }
}

async function openViewStudy(row) {
  const clientId = String(props.clientId ?? '').trim()
  if (!row?.id || !clientId) {
    return
  }
  try {
    viewStudy.value = await fetchPatientDiagnosticStudy(
      clientId,
      row.id,
    )
  } catch {
    viewStudy.value = cloneDiagnosticStudy(row)
  }
  viewDialogOpen.value = true
}

async function onDownload(row) {
  const clientId = String(props.clientId ?? '').trim()
  if (!row?.id || !clientId) {
    return
  }
  try {
    const { blob, fileName } =
      await downloadDiagnosticStudySourceDocument(clientId, row.id)
    triggerBlobDownload(blob, fileName || row.sourceDocumentName)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('dsDownloadError'),
        position: 'top',
      })
    }
  }
}
</script>
