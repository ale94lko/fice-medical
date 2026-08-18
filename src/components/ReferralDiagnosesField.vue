<template>
  <div class="referral-diagnoses-field appointment-service-lines">
    <AppointmentServiceSearchRow
      v-if="!readonly"
      v-model="pendingIcdId"
      :options="icdOptions"
      :disable="disable"
      :loading="searchLoading"
      :add-disable="pendingIcdId == null || disable"
      :placeholder="activeSearchPlaceholder"
      :empty-label="t('encounterDiagnosisSearchEmpty')"
      test-id-prefix="referral-diagnoses"
      @filter="onIcdFilter"
      @input-value="onSearchInput"
      @add="addFromCatalog"
    />

    <div
      v-if="!rows.length"
      class="admin-data-table__empty full-width row flex-center
        text-grey-7 q-gutter-sm q-pa-md"
      :class="{ 'q-mt-sm': !readonly }">
      <q-icon name="inbox" size="md" />
      <span>{{ t('referralDiagnosesEmpty') }}</span>
    </div>

    <AdminTablePanel
      v-else
      class="admin-table-panel--wide"
      :class="{ 'q-mt-md': !readonly }"
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
                {{ scope.row.code || '—' }}
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
          <template
            v-if="!readonly"
            #row-actions="{ row }">
            <div class="admin-table-row-actions">
              <q-btn
                flat
                round
                dense
                class="app-btn-icon-action"
                icon="delete"
                :disable="disable"
                :size="siteBreakpoints.SM"
                :aria-label="t('delete')"
                :data-testid="tid.diagnosesRemove(row._key)"
                @click="removeRow(row._key)"
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
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminQTable from 'components/AdminQTable.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AppointmentServiceSearchRow from
  'components/appointment/AppointmentServiceSearchRow.vue'
import { quasarNotifyTypes, siteBreakpoints } from
  'components/constants.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { searchIcd10Cm, normalizeIcd10CodeKey } from
  'src/utils/icd10-api.js'
import { referralTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  disable: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()
const $q = useQuasar()

const tablePagination = { rowsPerPage: 0 }
const rows = ref([])
const pendingIcdId = ref(null)
const pendingIcdOption = ref(null)
const icdOptions = ref([])
const searchLoading = ref(false)
let keySeq = 0

const columns = computed(() => {
  const cols = [
    {
      name: 'code',
      label: t('encounterDiagnosisCode'),
      align: 'left',
      field: row => row.code,
      sortable: false,
    },
    {
      name: 'description',
      label: t('encounterDiagnosisDescription'),
      align: 'left',
      field: row => row.description,
      sortable: false,
    },
  ]
  if (!props.readonly) {
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
  () => props.modelValue,
  value => {
    syncRows(value)
  },
  { immediate: true, deep: true },
)

function nextKey() {
  keySeq += 1

  return `dx-${keySeq}`
}

function syncRows(list) {
  const source = Array.isArray(list) ? list : []
  rows.value = source.map(item => ({
    _key: item._key || nextKey(),
    code: String(item.code ?? item.icd10Code ?? '').trim(),
    description: String(item.description ?? '').trim(),
    label: String(item.label ?? '').trim(),
  }))
}

function emitRows() {
  emit('update:modelValue', rows.value.map(row => ({
    code: row.code,
    description: row.description,
    label: row.label || (
      row.code
        ? `${row.code} — ${row.description}`
        : row.description
    ),
  })))
}

function hasCode(code) {
  const normalized = normalizeIcd10CodeKey(code)
  if (!normalized) {
    return false
  }

  return rows.value.some(
    row => normalizeIcd10CodeKey(row.code) === normalized,
  )
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

watch(pendingIcdId, id => {
  if (id == null || id === '') {
    pendingIcdOption.value = null

    return
  }
  const found = findOptionById(id)
  if (found) {
    pendingIcdOption.value = { ...found }
  }
})

function mapIcdOptions(results) {
  return results
    .filter(item => !hasCode(item.codeDotted || item.code))
    .map(item => ({
      label: item.label,
      value: item.id,
      name: item.codeDotted || item.code || item.label,
      caption: item.description || '',
      code: item.codeDotted || item.code || '',
      description: item.description || '',
    }))
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
      icdOptions.value = mapIcdOptions(results)
    })
  } catch (error) {
    update(() => {
      icdOptions.value = []
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

function onSearchInput() {
  if (pendingIcdId.value == null) {
    return
  }
  pendingIcdId.value = null
  pendingIcdOption.value = null
}

function addFromCatalog() {
  const option = findOptionById(pendingIcdId.value) || pendingIcdOption.value
  const code = String(option?.code ?? '').trim()
  if (!option || !code || hasCode(code)) {
    return
  }
  rows.value = [
    ...rows.value,
    {
      _key: nextKey(),
      code,
      description: String(option.description ?? '').trim(),
      label: option.label,
    },
  ]
  pendingIcdId.value = null
  pendingIcdOption.value = null
  icdOptions.value = []
  emitRows()
}

function removeRow(key) {
  rows.value = rows.value.filter(row => row._key !== key)
  emitRows()
}
</script>
