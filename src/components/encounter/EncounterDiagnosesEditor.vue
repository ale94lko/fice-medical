<template>
  <div class="encounter-diagnoses-editor appointment-service-lines">
    <div class="encounter-workspace-card__head">
      <h2>{{ t('encounterDiagnoses') }}</h2>
      <q-btn
        v-if="canEdit && canUseCodingAssistant"
        flat
        dense
        round
        class="app-btn-ai-icon"
        icon="auto_awesome"
        :disable="saving"
        :aria-label="t('aiAssistantName')"
        @click="aiDialogOpen = true">
        <q-tooltip>{{ t('aiAssistantName') }}</q-tooltip>
      </q-btn>
    </div>

    <template v-if="canEdit">
      <div class="q-mb-md">
        <AppointmentServiceSearchRow
          v-model="pendingIcdId"
          :options="icdOptions"
          :disable="saving"
          :loading="searchLoading"
          :add-disable="pendingIcdId == null || saving"
          :placeholder="activeSearchPlaceholder"
          :empty-label="t('encounterDiagnosisSearchEmpty')"
          test-id-prefix="encounter-diagnoses"
          @filter="onIcdFilter"
          @input-value="onSearchInput"
          @add="addFromCatalog"
        />
      </div>
    </template>

    <div
      v-if="!rows.length"
      class="admin-data-table__empty full-width row flex-center
        text-grey-7 q-gutter-sm q-pa-md"
      :class="{ 'q-mt-sm': canEdit }">
      <q-icon name="inbox" size="md" />
      <span>{{ t('encounterDiagnosesEmpty') }}</span>
    </div>

    <AdminTablePanel
      v-else
      class="admin-table-panel--wide"
      :class="{ 'q-mt-md': canEdit }"
      :show-column-settings="false">
      <div class="admin-data-table__scroll">
        <AdminQTable
          class="table admin-data-table admin-data-table--embedded
            admin-data-table--inline-column-settings"
          flat
          hide-bottom
          row-key="_key"
          :rows="rows"
          :columns="columns"
          :pagination="tablePagination">
          <template #body-cell-code="scope">
            <q-td
              :props="scope"
              class="admin-data-table__primary-cell">
              <q-badge color="grey-4" text-color="grey-9">
                {{ scope.row.icd10Code || '—' }}
              </q-badge>
            </q-td>
          </template>
          <template #body-cell-description="scope">
            <q-td
              :props="scope"
              class="admin-data-table__secondary-cell">
              {{ scope.row.description || '—' }}
            </q-td>
          </template>
          <template #body-cell-primary="scope">
            <q-td :props="scope">
              <q-radio
                v-if="canEdit"
                :model-value="primaryIndex"
                :val="rowIndex(scope.row)"
                dense
                :disable="saving"
                :aria-label="t('encounterPrimaryDiagnosis')"
                @update:model-value="onPrimaryChange"
              />
              <template v-else>
                {{ scope.row.isPrimary ? t('yes') : t('no') }}
              </template>
            </q-td>
          </template>
          <template
            v-if="canEdit"
            #row-actions="{ row }">
            <div class="admin-table-row-actions">
              <q-btn
                flat
                round
                dense
                class="app-btn-icon-action"
                icon="delete"
                :disable="saving"
                :size="siteBreakpoints.SM"
                :aria-label="t('delete')"
                @click="removeRowByKey(row._key)"
              >
                <q-tooltip
                  class="app-info-tooltip"
                  anchor="top middle"
                  self="bottom middle"
                  :offset="[0, 6]">
                  {{ t('delete') }}
                </q-tooltip>
              </q-btn>
            </div>
          </template>
        </AdminQTable>
      </div>
    </AdminTablePanel>

    <EncounterDiagnosesAiSuggestDialog
      v-model="aiDialogOpen"
      :encounter-id="encounter?.id"
      :chief-complaint="chiefComplaintText"
      :existing-codes="existingCodes"
      @insert="insertFromAi"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { quasarNotifyTypes, siteBreakpoints } from
  'components/constants.js'
import AdminQTable from 'components/AdminQTable.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AppointmentServiceSearchRow from
  'components/appointment/AppointmentServiceSearchRow.vue'
import EncounterDiagnosesAiSuggestDialog from
  'components/encounter/EncounterDiagnosesAiSuggestDialog.vue'
import { useAiPermissions } from 'src/composables/useAiPermissions.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  encounterApiErrorMessage,
  patchEncounter,
} from 'src/utils/encounter-api.js'
import { searchIcd10Cm, normalizeIcd10CodeKey } from
  'src/utils/icd10-api.js'
import {
  resolveEncounterChiefComplaint,
} from 'src/utils/encounter-completion-chief-complaint.js'

const props = defineProps({
  encounter: {
    type: Object,
    default: null,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['saved'])
const { t } = useI18n()
const $q = useQuasar()
const { canUseCodingAssistant } = useAiPermissions()

const tablePagination = { rowsPerPage: 0 }
const saving = ref(false)
const searchLoading = ref(false)
const aiDialogOpen = ref(false)
const rows = ref([])
const primaryIndex = ref(0)
const pendingIcdId = ref(null)
const pendingIcdOption = ref(null)
const icdOptions = ref([])
let keySeq = 0

const existingCodes = computed(() =>
  rows.value.map(row => row.icd10Code),
)

const chiefComplaintText = computed(() =>
  resolveEncounterChiefComplaint(props.encounter),
)

const columns = computed(() => {
  const cols = [
    {
      name: 'code',
      label: t('encounterDiagnosisCode'),
      align: 'left',
      field: row => row.icd10Code,
      sortable: false,
    },
    {
      name: 'description',
      label: t('encounterDiagnosisDescription'),
      align: 'left',
      field: row => row.description,
      sortable: false,
    },
    {
      name: 'primary',
      label: t('encounterPrimaryDiagnosis'),
      align: 'left',
      field: row => row.isPrimary,
      sortable: false,
    },
  ]
  if (props.canEdit) {
    cols.push({
      name: 'actions',
      label: t('actions'),
      align: 'right',
      field: () => '',
      sortable: false,
    })
  }

  return cols
})

const activeSearchPlaceholder = computed(() => {
  if (pendingIcdId.value) {
    return undefined
  }

  return rows.value.length
    ? t('encounterDiagnosisSearchAdd')
    : t('encounterDiagnosisSearchPlaceholder')
})

watch(
  () => props.encounter?.diagnoses,
  () => {
    syncRowsFromEncounter()
  },
  { immediate: true, deep: true },
)

watch(pendingIcdId, (id) => {
  if (id == null || id === '') {
    pendingIcdOption.value = null

    return
  }
  const found = findOptionById(id)
  if (found) {
    pendingIcdOption.value = { ...found }
  }
})

function nextKey() {
  keySeq += 1

  return `dx-${keySeq}`
}

function syncRowsFromEncounter() {
  if (saving.value) {
    return
  }
  const list = Array.isArray(props.encounter?.diagnoses)
    ? [...props.encounter.diagnoses]
    : []
  list.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary)
    || Number(a.sequenceNo ?? 0) - Number(b.sequenceNo ?? 0))
  rows.value = list.map(row => ({
    _key: nextKey(),
    icd10Code: row.icd10Code || '',
    description: row.description || '',
    isPrimary: row.isPrimary === true,
    sequenceNo: row.sequenceNo ?? 0,
  }))
  const primary = rows.value.findIndex(row => row.isPrimary)
  primaryIndex.value = primary >= 0 ? primary : 0
}

function hasCode(code) {
  const normalized = normalizeIcd10CodeKey(code)
  if (!normalized) {
    return false
  }

  return rows.value.some(
    row => normalizeIcd10CodeKey(row.icd10Code) === normalized,
  )
}

async function onIcdFilter(val, update) {
  const query = String(val ?? '').trim()
  searchLoading.value = true
  try {
    const results = query.length >= 2
      ? await searchIcd10Cm(query, {
        billable: true,
        active: true,
        limit: 25,
      })
      : []
    update(() => {
      const mapped = results
        .filter(item => !hasCode(item.codeDotted || item.code))
        .map(item => ({
          label: item.label,
          value: item.id,
          name: item.codeDotted || item.code || item.label,
          caption: item.description || '',
          code: item.codeDotted || item.code || '',
          codeDotted: item.codeDotted || item.code || '',
          description: item.description || '',
        }))
      const pending = pendingIcdOption.value
      if (
        pending
        && !mapped.some(
          option => String(option.value) === String(pending.value),
        )
      ) {
        icdOptions.value = [pending, ...mapped]
      } else {
        icdOptions.value = mapped
      }
    })
  } catch (error) {
    update(() => {
      icdOptions.value = pendingIcdOption.value
        ? [pendingIcdOption.value]
        : []
    })
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('encounterDiagnosesCatalogError'),
      })
    }
  } finally {
    searchLoading.value = false
  }
}

function findOptionById(id) {
  if (id == null || id === '') {
    return null
  }

  return icdOptions.value.find(
    option => String(option.value) === String(id),
  ) ?? (
    pendingIcdOption.value
    && String(pendingIcdOption.value.value) === String(id)
      ? pendingIcdOption.value
      : null
  )
}

function onSearchInput(value) {
  if (pendingIcdId.value == null) {
    return
  }
  const selected = findOptionById(pendingIcdId.value)
  if (!selected) {
    return
  }
  const next = String(value ?? '')
  if (!next || next === selected.label) {
    return
  }
  pendingIcdId.value = null
  pendingIcdOption.value = null
}

async function addFromCatalog() {
  const id = pendingIcdId.value
  if (id == null) {
    return
  }
  const option = findOptionById(id) || pendingIcdOption.value
  const code = String(
    option?.codeDotted || option?.code || '',
  ).trim()
  if (!option || !code) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('encounterDiagnosisSelectRequired'),
    })

    return
  }
  if (hasCode(code)) {
    pendingIcdId.value = null
    pendingIcdOption.value = null
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('encounterDiagnosisDuplicate', { code }),
    })

    return
  }
  rows.value = [
    ...rows.value,
    {
      _key: nextKey(),
      icd10Code: code,
      description: String(option.description ?? '').trim(),
      isPrimary: rows.value.length === 0,
      sequenceNo: rows.value.length,
    },
  ]
  if (rows.value.length === 1) {
    primaryIndex.value = 0
  }
  pendingIcdId.value = null
  pendingIcdOption.value = null
  icdOptions.value = icdOptions.value.filter(
    optionRow => String(optionRow.value) !== String(id),
  )
  await saveRows()
}

async function insertFromAi(items) {
  const list = Array.isArray(items) ? items : []
  let added = 0
  let skipped = 0
  list.forEach((item) => {
    const code = String(
      item.codeDotted || item.icd10Code || '',
    ).trim()
    if (!code) {
      return
    }
    if (hasCode(code)) {
      skipped += 1

      return
    }
    rows.value = [
      ...rows.value,
      {
        _key: nextKey(),
        icd10Code: code,
        description: String(item.description ?? '').trim(),
        isPrimary: rows.value.length === 0,
        sequenceNo: rows.value.length,
      },
    ]
    added += 1
  })
  if (rows.value.length === 1) {
    primaryIndex.value = 0
  }
  if (!added) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: skipped
        ? t('encounterDiagnosesAiAllDuplicates')
        : t('encounterDiagnosesAiEmpty'),
    })

    return
  }
  if (skipped) {
    $q.notify({
      type: quasarNotifyTypes.info,
      message: t('encounterDiagnosesAiSkippedDuplicates', {
        count: skipped,
      }),
    })
  }
  await saveRows()
}

function rowIndex(row) {
  return rows.value.findIndex(item => item._key === row._key)
}

async function removeRowByKey(key) {
  const index = rows.value.findIndex(row => row._key === key)
  if (index < 0) {
    return
  }
  await removeRow(index)
}

async function removeRow(index) {
  rows.value = rows.value.filter((_, i) => i !== index)
  if (!rows.value.length) {
    primaryIndex.value = 0
    await saveRows()

    return
  }
  if (primaryIndex.value >= rows.value.length) {
    primaryIndex.value = 0
  }
  await saveRows()
}

async function onPrimaryChange(value) {
  primaryIndex.value = Number(value)
  await saveRows()
}

async function saveRows() {
  const encounterId = props.encounter?.id
  if (encounterId == null || !props.canEdit) {
    return
  }
  saving.value = true
  try {
    const diagnoses = rows.value.map((row, index) => ({
      icd10Code: String(row.icd10Code).trim(),
      description: String(row.description).trim(),
      sequenceNo: index,
      isPrimary: index === Number(primaryIndex.value),
    }))
    if (diagnoses.length && !diagnoses.some(row => row.isPrimary)) {
      diagnoses[0].isPrimary = true
    }
    const updated = await patchEncounter(encounterId, { diagnoses })
    emit('saved', updated)
  } catch (error) {
    saving.value = false
    pendingIcdId.value = null
    pendingIcdOption.value = null
    icdOptions.value = []
    syncRowsFromEncounter()
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: encounterApiErrorMessage(
          error,
          t('encounterDiagnosesSaveError'),
        ),
      })
    }
  } finally {
    saving.value = false
  }
}
</script>
