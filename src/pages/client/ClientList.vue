<template>
  <q-page class="admin-page">
    <q-table
      class="table admin-data-table"
      selection="multiple"
      row-key="id"
      binary-state-sort
      v-model:selected="selected"
      v-model:pagination="tablePagination"
      :rows-per-page-options="[20, 50, 100]"
      :grid="showGrid"
      :title="t('clients')"
      :rows="rows"
      :columns="columns"
      :loading="loading"
      :rows-per-page-label="t('rowsPerPage')"
      @request="onTableRequest">
      <template v-slot:top>
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="add"
          :disable="loading"
          :title="t('addClient')"
          :label="t('addClient')"
          @click="addClient" />
        <q-btn
          no-caps
          unelevated
          class="q-ml-sm app-btn-primary"
          color="primary"
          icon="assignment_ind"
          :disable="selected.length === 0 || loading"
          :title="t('assignClinicians')"
          :label="t('assignClinicians')"
          @click="assignClinicians(selected)" />
        <q-btn
          no-caps
          unelevated
          class="q-ml-sm app-btn-primary"
          color="primary"
          icon="note_alt"
          :disable="selected.length === 0 || loading"
          :title="t('changeStatus')"
          :label="t('changeStatus')"
          @click="changeStatus(selected)" />
        <q-space />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          icon="filter_alt"
          :disable="loading"
          :title="t('filters')"
          :label="t('filters')"
          @click="showFilters" />
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            round
            icon="edit"
            color="primary"
            class="app-btn-icon-action"
            :size="siteBreakpoints.SM"
            :title="t('edit')"
            :aria-label="t('edit')"
            @click="editRow(props.row)"
          />
          <q-btn
            flat
            round
            icon="assignment_ind"
            color="primary"
            class="app-btn-icon-action"
            :size="siteBreakpoints.SM"
            :title="t('assignClinicians')"
            :aria-label="t('assignClinicians')"
            @click="assignClinicians([props.row])"
          />
          <q-btn
            flat
            round
            icon="note_alt"
            color="primary"
            class="app-btn-icon-action"
            :size="siteBreakpoints.SM"
            :title="t('changeStatus')"
            :aria-label="t('changeStatus')"
            @click="changeStatus([props.row])"
          />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useSiteStore } from 'stores/site-store.js'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  clientFieldKeys,
  clientListColumnKeys,
  quasarNotifyTypes,
  siteBreakpoints,
  siteBreakpointsPx,
} from 'components/constants.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'

const $q = useQuasar()
const loading = ref(false)
const selected = ref([])

const siteStore = useSiteStore()
const { t } = useI18n()
const ck = clientFieldKeys
const col = clientListColumnKeys

const tablePagination = ref({
  sortBy: col.clientNumber,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

function clientTablePaginationFromStore(paginationPayload) {
  const meta = siteStore.clientListPagination
  const total = meta?.total != null && Number.isFinite(Number(meta.total))
    ? Number(meta.total)
    : siteStore.clientList.length
  let resolvedPage = paginationPayload.page
  if (meta && meta.limit > 0 && Number.isFinite(meta.offset)) {
    resolvedPage = Math.floor(Number(meta.offset) / Number(meta.limit)) + 1
  }

  return {
    sortBy: paginationPayload.sortBy,
    descending: paginationPayload.descending,
    page: resolvedPage,
    rowsPerPage: paginationPayload.rowsPerPage,
    rowsNumber: total,
  }
}

async function loadClients(paginationPayload) {
  loading.value = true
  try {
    await siteStore.getClientList({
      page: paginationPayload.page,
      limit: paginationPayload.rowsPerPage,
    }, t)
    tablePagination.value = clientTablePaginationFromStore(paginationPayload)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('clientListError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function onTableRequest(props) {
  return loadClients(props.pagination)
}

onMounted(() => {
  loadClients(tablePagination.value)
})

const columns = computed(() => [
  {
    name: col.clientNumber,
    required: true,
    label: t('clientNumber'),
    align: 'left',
    field: row => row[ck.clientNumber],
    sortable: true,
  },
  {
    name: col.name,
    required: true,
    label: t('name'),
    align: 'left',
    field: row => row[ck.name],
    sortable: true,
  },
  {
    name: col.email,
    required: true,
    label: t('email'),
    align: 'left',
    field: row => row[ck.email],
    sortable: true,
  },
  {
    name: col.dob,
    required: true,
    label: t('dob'),
    align: 'left',
    field: row => row[ck.dob],
    sortable: true,
  },
  {
    name: col.clinicians,
    required: true,
    label: t('clinicians'),
    align: 'left',
    field: row => row[ck.clinicians],
    sortable: false,
  },
  {
    name: col.admissionDate,
    required: true,
    label: t('admissionDate'),
    align: 'left',
    field: row => row[ck.admissionDate],
    sortable: false,
  },
  {
    name: col.status,
    required: true,
    label: t('status'),
    align: 'left',
    field: row => row[ck.status],
    sortable: false,
  },
  {
    name: col.actions,
    required: true,
    label: t('actions'),
    align: 'center',
    field: row => row.actions,
    sortable: false,
  },
])
const rows = computed(() => siteStore.clientList)

const windowWidth = computed(() => $q.screen.width)
const showGrid = computed(() => windowWidth.value <= siteBreakpointsPx.XXS)

const addClient = () => {
  console.log('Add client')
}
const assignClinicians = (rows) => {
  console.log('Assign Clinicians' + rows)
}
const changeStatus = () => {
  console.log('Change Status')
}
const showFilters = () => {
  console.log('Show Filters')
}
function editRow(row) {
  console.log('Editar:', row)
}

</script>
