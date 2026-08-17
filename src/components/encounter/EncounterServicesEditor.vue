<template>
  <div class="encounter-services-editor appointment-service-lines">
    <AppointmentServiceSearchRow
      v-if="canEdit"
      v-model="pendingServiceId"
      class="q-mb-md"
      :options="filteredOptions"
      :disable="saving || !canAddMore"
      :add-disable="saving || !canAddMore || pendingServiceId == null"
      :placeholder="activeSearchPlaceholder"
      :empty-label="t('appointmentServicesSearchEmpty')"
      test-id-prefix="encounter-services"
      @filter="onFilter"
      @input-value="onSearchInput"
      @add="onAddPending"
    />

    <AdminTablePanel
      v-if="lines.length"
      class="admin-table-panel--wide"
      :show-column-settings="false">
      <div class="admin-data-table__scroll">
        <AdminQTable
          class="table admin-data-table admin-data-table--embedded
            admin-data-table--inline-column-settings"
          flat
          hide-bottom
          row-key="serviceId"
          :rows="lines"
          :columns="columns"
          :pagination="tablePagination">
          <template #body-cell-name="scope">
            <q-td
              :props="scope"
              class="admin-data-table__primary-cell">
              {{ scope.row.name || '—' }}
            </q-td>
          </template>
          <template #body-cell-code="scope">
            <q-td
              :props="scope"
              class="admin-data-table__secondary-cell">
              {{ lineCode(scope.row) }}
            </q-td>
          </template>
          <template #body-cell-duration="scope">
            <q-td
              :props="scope"
              class="admin-data-table__secondary-cell">
              {{ durationLabel(scope.row) }}
            </q-td>
          </template>
          <template #body-cell-fee="scope">
            <q-td
              :props="scope"
              class="admin-data-table__secondary-cell">
              {{ formatFeeLabel(scope.row.defaultFee, t) }}
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
                @click="onRemoveRow(row)"
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
    <div
      v-else
      class="admin-data-table__empty full-width row flex-center
        text-grey-7 q-gutter-sm q-pa-md">
      <q-icon name="inbox" size="md" />
      <span>{{ t('encounterServicesEmpty') }}</span>
    </div>
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
import {
  appointmentBookingMaxServices,
  quasarNotifyTypes,
  siteBreakpoints,
} from 'components/constants.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { listBookableServiceProcedures } from
  'src/utils/appointment-api.js'
import {
  formatFeeLabel,
  formatServiceCatalogOptionLabel,
  formatServiceDurationSummary,
} from 'src/utils/appointment-booking.js'
import {
  encounterApiErrorMessage,
  patchEncounter,
} from 'src/utils/encounter-api.js'
import { buildServiceLinesFromCatalog } from
  'src/composables/useAppointmentBooking.js'

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

const tablePagination = { rowsPerPage: 0 }
const saving = ref(false)
const catalog = ref([])
const lines = ref([])
const pendingServiceId = ref(null)
const searchNeedle = ref('')
const filteredOptions = ref([])

const selectedIds = computed(() =>
  lines.value.map(line => line.serviceId),
)

const canAddMore = computed(() =>
  lines.value.length < appointmentBookingMaxServices,
)

const activeSearchPlaceholder = computed(() => {
  if (pendingServiceId.value) {
    return undefined
  }

  return lines.value.length
    ? t('appointmentServicesSearchAdd')
    : t('appointmentServicesSearchPlaceholder')
})

const columns = computed(() => {
  const cols = [
    {
      name: 'name',
      label: t('encounterServices'),
      align: 'left',
      field: row => row.name,
      sortable: false,
    },
    {
      name: 'code',
      label: t('encounterServiceCode'),
      align: 'left',
      field: row => lineCode(row),
      sortable: false,
    },
    {
      name: 'duration',
      label: t('appointmentDuration'),
      align: 'left',
      field: row => durationLabel(row),
      sortable: false,
    },
    {
      name: 'fee',
      label: t('serviceProcedureDefaultFeeLabel'),
      align: 'left',
      field: row => formatFeeLabel(row.defaultFee, t),
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

const availableOptions = computed(() =>
  catalog.value
    .filter(row => !selectedIds.value.includes(row.id))
    .map((row) => {
      const cptCode = String(row.cptCode ?? '').trim()
      const durationSummary = formatServiceDurationSummary(row, t)

      return {
        label: formatServiceCatalogOptionLabel(row, t),
        value: row.id,
        name: row.name,
        cptCode,
        durationSummary,
        searchText: [
          row.name,
          cptCode,
          cptCode ? `CPT ${cptCode}` : '',
          durationSummary,
        ].join(' ').toLowerCase(),
      }
    }),
)

watch(
  () => props.encounter?.serviceProcedures,
  () => {
    syncLinesFromEncounter()
  },
  { immediate: true, deep: true },
)

watch(
  () => props.canEdit,
  async(canEdit) => {
    if (canEdit || !catalog.value.length) {
      await loadCatalog()
    }
  },
  { immediate: true },
)

watch(
  availableOptions,
  () => {
    applyServiceFilter(searchNeedle.value)
    if (
      pendingServiceId.value != null
      && !findOptionById(pendingServiceId.value)
    ) {
      pendingServiceId.value = null
    }
  },
  { immediate: true, deep: true },
)

function lineCode(line) {
  return [line.cptCode, line.hcpcsCode].filter(Boolean).join(' · ') || '—'
}

function durationLabel(line) {
  if (line?.durationMin != null && line.durationMin !== '') {
    return t('appointmentDurationMinutes', {
      count: line.durationMin,
    })
  }

  return formatServiceDurationSummary(line, t) || '—'
}

function syncLinesFromEncounter() {
  if (saving.value) {
    return
  }
  const list = Array.isArray(props.encounter?.serviceProcedures)
    ? props.encounter.serviceProcedures
    : []
  lines.value = list.map(row => {
    const duration = row.durationMinutes ?? null

    return {
      id: row.id,
      serviceId: row.serviceProcedureId,
      name: row.name || '',
      cptCode: row.cptCode || '',
      hcpcsCode: row.hcpcsCode || '',
      defaultFee: row.suggestedFee ?? null,
      units: row.units ?? null,
      minDurationMin: duration,
      maxDurationMin: duration,
      fixedDuration: true,
      durationMin: duration,
    }
  })
}

async function loadCatalog() {
  try {
    catalog.value = await listBookableServiceProcedures()
    syncLinesFromEncounter()
  } catch (error) {
    catalog.value = []
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('encounterServicesCatalogError'),
      })
    }
  }
}

function applyServiceFilter(needle = '') {
  const q = String(needle ?? '').trim().toLowerCase()
  const base = availableOptions.value
  filteredOptions.value = q
    ? base.filter(option => option.searchText.includes(q))
    : [...base]
}

function findOptionById(id) {
  if (id == null || id === '') {
    return null
  }

  return availableOptions.value.find(
    option => String(option.value) === String(id),
  ) ?? null
}

function onFilter(value, update) {
  update(() => {
    searchNeedle.value = String(value ?? '')
    applyServiceFilter(searchNeedle.value)
  })
}

function onSearchInput(value) {
  if (pendingServiceId.value == null) {
    return
  }
  const selected = findOptionById(pendingServiceId.value)
  if (!selected) {
    return
  }
  const next = String(value ?? '')
  if (!next || next === selected.label) {
    return
  }
  pendingServiceId.value = null
}

async function onAddPending() {
  const serviceId = pendingServiceId.value
  if (serviceId == null) {
    return
  }
  const next = buildServiceLinesFromCatalog(catalog.value, [serviceId])
  if (!next.length) {
    return
  }
  lines.value = [...lines.value, ...next]
  pendingServiceId.value = null
  searchNeedle.value = ''
  applyServiceFilter('')
  await saveLines()
}

async function onRemoveRow(row) {
  const index = lines.value.findIndex(
    line => String(line.serviceId) === String(row.serviceId),
  )
  if (index < 0) {
    return
  }
  lines.value = lines.value.filter((_, i) => i !== index)
  await saveLines()
}

async function saveLines() {
  const encounterId = props.encounter?.id
  if (encounterId == null || !props.canEdit) {
    return
  }
  saving.value = true
  try {
    const updated = await patchEncounter(encounterId, {
      serviceProcedures: lines.value.map((line, index) => ({
        id: line.id ?? undefined,
        serviceProcedureId: line.serviceId,
        name: line.name,
        cptCode: line.cptCode,
        hcpcsCode: line.hcpcsCode,
        suggestedFee: line.defaultFee,
        durationMinutes: line.durationMin,
        units: line.units ?? undefined,
        displayOrder: index,
      })),
    })
    emit('saved', updated)
  } catch (error) {
    saving.value = false
    pendingServiceId.value = null
    searchNeedle.value = ''
    applyServiceFilter('')
    syncLinesFromEncounter()
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: encounterApiErrorMessage(
          error,
          t('encounterServicesSaveError'),
        ),
      })
    }
  } finally {
    saving.value = false
  }
}
</script>
