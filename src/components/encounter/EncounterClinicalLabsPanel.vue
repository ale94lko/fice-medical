<template>
  <section class="encounter-workspace-card">
    <div class="encounter-workspace-card__head">
      <div>
        <h2>{{ t('encounterClinicalLabs') }}</h2>
        <p class="text-body2 text-grey-7 q-mb-none">
          {{ t('encounterClinicalLabsHint') }}
        </p>
      </div>
      <div class="row q-gutter-sm items-center no-wrap">
        <q-btn
          v-if="canAdd"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="add"
          :label="t('labAdd')"
          :data-testid="labTid.btn('add')"
          @click="labsTabRef?.openAdd()"
        />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('encounterClinicalAllLabs')"
          :loading="allLoading"
          data-testid="encounter-clinical-all-labs"
          @click="openAllRecords"
        />
      </div>
    </div>

    <AddClientLabsTab
      ref="labsTabRef"
      v-model="labsModel"
      hide-header
      :patient-id="clientId"
      :clinician-options="clinicianOptions"
      :readonly="!canEdit && !canAdd"
      :empty-label="t('encounterClinicalLabsEmpty')"
      @changed="emit('changed')"
    />

    <EncounterClinicalAllRecordsDialog
      v-model="allOpen"
      :title="t('encounterClinicalAllLabsTitle')"
      :hint="t('encounterClinicalAllRecordsHint')"
      :loading="allLoading"
      :error="allError">
      <LabsTable
        :rows="allRows"
        :empty-label="t('encounterClinicalAllRecordsEmpty')"
        :can-edit="false"
        :can-delete="false"
        @view="openViewLab"
      />
    </EncounterClinicalAllRecordsDialog>

    <LabOrderDialog
      v-model="viewDialogOpen"
      mode="view"
      :lab="viewLab"
      :saving="false"
      :clinician-options="clinicianOptions"
      @cancel="viewDialogOpen = false"
    />
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AddClientLabsTab from 'components/AddClientLabsTab.vue'
import EncounterClinicalAllRecordsDialog from
  'components/encounter/EncounterClinicalAllRecordsDialog.vue'
import LabOrderDialog from 'components/LabOrderDialog.vue'
import LabsTable from 'components/LabsTable.vue'
import { labTestIds as labTid } from 'src/test-ids/index.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  fetchPatientLab,
  listPatientLabs,
} from 'src/utils/lab-api.js'
import {
  cloneLab,
  sortLabsByOrderedDateDesc,
} from 'src/utils/lab-orders.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
  labs: {
    type: Array,
    default: () => [],
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
  canAdd: {
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
const labsTabRef = ref(null)
const labsModel = ref([])

const allOpen = ref(false)
const allLoading = ref(false)
const allError = ref('')
const allRows = ref([])

const viewDialogOpen = ref(false)
const viewLab = ref(null)

function syncFromProps() {
  const list = Array.isArray(props.labs) ? props.labs : []
  labsModel.value = sortLabsByOrderedDateDesc(list.map(row => ({ ...row })))
}

async function openAllRecords() {
  const clientId = String(props.clientId ?? '').trim()
  if (!clientId) {
    return
  }
  allOpen.value = true
  allLoading.value = true
  allError.value = ''
  try {
    const list = await listPatientLabs(clientId)
    allRows.value = sortLabsByOrderedDateDesc(list)
  } catch (error) {
    allRows.value = []
    if (!isAuthSessionEndUIError(error)) {
      allError.value = t('encounterClinicalAllRecordsLoadError')
    }
  } finally {
    allLoading.value = false
  }
}

async function openViewLab(row) {
  const clientId = String(props.clientId ?? '').trim()
  if (!row?.id || !clientId) {
    return
  }
  try {
    viewLab.value = await fetchPatientLab(clientId, row.id)
    viewDialogOpen.value = true
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      viewLab.value = cloneLab(row)
      viewDialogOpen.value = true
    }
  }
}

watch(
  () => props.labs,
  () => {
    syncFromProps()
  },
  { immediate: true, deep: true },
)
</script>
