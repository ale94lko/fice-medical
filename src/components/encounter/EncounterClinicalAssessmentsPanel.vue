<template>
  <section class="encounter-workspace-card">
    <div class="encounter-workspace-card__head">
      <div>
        <h2>{{ t('encounterClinicalAssessments') }}</h2>
        <p class="text-body2 text-grey-7 q-mb-none">
          {{ t('encounterClinicalAssessmentsHint') }}
        </p>
      </div>
      <div class="row q-gutter-sm items-center no-wrap">
        <q-btn
          v-if="canEdit"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="add"
          :label="t('screeningNew')"
          :data-testid="tid.btn('new')"
          @click="openCreateDialog"
        />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('encounterClinicalAllAssessments')"
          :loading="allLoading"
          data-testid="encounter-clinical-all-assessments"
          @click="openAllRecords"
        />
      </div>
    </div>

    <AdminTablePanel
      class="admin-table-panel--wide"
      :show-column-settings="false">
      <ScreeningsTable
        :rows="screeningRows"
        :empty-label="t('encounterClinicalAssessmentsEmpty')"
        :can-edit="canEdit"
        @view="openView"
        @edit="openEdit"
      />
    </AdminTablePanel>

    <ScreeningDialog
      v-model="dialogOpen"
      :patient-id="patientId"
      :screening-id="dialogScreeningId"
      :client-screenings="dialogClientScreenings"
      :mode="dialogMode"
      :readonly="dialogReadonly"
      :clinician-options="clinicianOptions"
      @saved="onDialogSaved"
      @closed="onDialogClosed"
    />

    <EncounterClinicalAllRecordsDialog
      v-model="allOpen"
      :title="t('encounterClinicalAllAssessmentsTitle')"
      :hint="t('encounterClinicalAllRecordsHint')"
      :loading="allLoading"
      :error="allError">
      <ScreeningsTable
        :rows="allRows"
        :empty-label="t('encounterClinicalAllRecordsEmpty')"
        :can-edit="false"
        @view="openView"
      />
    </EncounterClinicalAllRecordsDialog>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import EncounterClinicalAllRecordsDialog from
  'components/encounter/EncounterClinicalAllRecordsDialog.vue'
import ScreeningDialog from 'components/ScreeningDialog.vue'
import ScreeningsTable from 'components/ScreeningsTable.vue'
import { screeningStatuses } from 'components/constants.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { listClientScreenings } from 'src/utils/screening-api.js'
import { mapScreeningsListFromApi } from 'src/utils/screening-normalize.js'
import { screeningTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
  screenings: {
    type: Array,
    default: () => [],
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['changed'])

const { t } = useI18n()

const dialogOpen = ref(false)
const dialogScreeningId = ref(null)
const dialogMode = ref('create')
const dialogReadonly = ref(false)

const allOpen = ref(false)
const allLoading = ref(false)
const allError = ref('')
const allRaw = ref([])

const patientId = computed(() => String(props.clientId ?? '').trim())

const screeningsRaw = computed(() =>
  Array.isArray(props.screenings) ? props.screenings : [],
)

const screeningRows = computed(() =>
  mapScreeningsListFromApi(
    screeningsRaw.value,
    props.clinicianOptions ?? [],
  ),
)

const allRows = computed(() =>
  mapScreeningsListFromApi(
    allRaw.value,
    props.clinicianOptions ?? [],
  ),
)

const dialogClientScreenings = computed(() =>
  allRaw.value.length ? allRaw.value : screeningsRaw.value,
)

function openCreateDialog() {
  dialogMode.value = 'create'
  dialogScreeningId.value = null
  dialogReadonly.value = false
  dialogOpen.value = true
}

function openView(row) {
  if (!row?.id) {
    return
  }
  dialogMode.value = 'edit'
  dialogScreeningId.value = row.id
  dialogReadonly.value = true
  dialogOpen.value = true
}

function openEdit(row) {
  if (!row?.id || !props.canEdit) {
    return
  }
  if (row.status !== screeningStatuses.draft) {
    openView(row)

    return
  }
  dialogMode.value = 'edit'
  dialogScreeningId.value = row.id
  dialogReadonly.value = false
  dialogOpen.value = true
}

async function openAllRecords() {
  if (!patientId.value) {
    return
  }
  allOpen.value = true
  allLoading.value = true
  allError.value = ''
  try {
    allRaw.value = await listClientScreenings(patientId.value, {
      limit: 200,
    })
  } catch (error) {
    allRaw.value = []
    if (!isAuthSessionEndUIError(error)) {
      allError.value = t('encounterClinicalAllRecordsLoadError')
    }
  } finally {
    allLoading.value = false
  }
}

function onDialogSaved() {
  emit('changed')
}

function onDialogClosed() {
  dialogScreeningId.value = null
  emit('changed')
}
</script>
