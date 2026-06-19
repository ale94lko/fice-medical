<template>
  <q-page class="admin-page" :data-testid="clientListTestIds.page">
    <AppLoadingOverlay
      scope="content"
      :showing="loading"
    />
    <AdminQTable
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
      :loading="false"
      :rows-per-page-label="t('rowsPerPage')"
      @request="onTableRequest">
      <template v-slot:top>
        <q-btn
          v-if="canAddClient"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="add"
          :data-testid="clientListTestIds.addClient"
          :disable="loading"
          :title="t('addClient')"
          :label="t('addClient')"
          @click="addClient" />
        <q-btn
          v-if="canChangeStatus"
          no-caps
          unelevated
          class="q-ml-sm app-btn-primary"
          color="primary"
          icon="note_alt"
          :data-testid="clientListTestIds.changeStatus"
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
          :data-testid="clientListTestIds.filters"
          :disable="loading"
          :title="t('filters')"
          :label="t('filters')"
          @click="showFilters" />
      </template>
      <template #body-cell-status="scope">
        <q-td :props="scope">
          <span
            v-if="scope.row.statusVariant && scope.row[ck.status]"
            class="client-list-status-badge"
            :class="`client-list-status-badge--${scope.row.statusVariant}`">
            {{ scope.row[ck.status] }}
          </span>
          <span v-else class="text-grey-7">—</span>
        </q-td>
      </template>
      <template #row-actions="{ row }">
        <q-btn
          v-if="canViewClient"
          flat
          round
          icon="edit"
          color="primary"
          class="app-btn-icon-action"
          :data-testid="clientListTestIds.rowEdit(row.id)"
          :size="siteBreakpoints.SM"
          :title="t('edit')"
          :aria-label="t('edit')"
          @click="editRow(row)"
        />
        <q-btn
          v-if="canChangeStatus"
          flat
          round
          icon="note_alt"
          color="primary"
          class="app-btn-icon-action"
          :data-testid="clientListTestIds.rowStatus(row.id)"
          :size="siteBreakpoints.SM"
          :title="t('changeStatus')"
          :aria-label="t('changeStatus')"
          @click="changeStatus([row])"
        />
      </template>
      <template v-slot:no-data>
        <div class="full-width row flex-center text-grey-7 q-gutter-sm q-pa-lg">
          <q-icon name="inbox" size="md" />
          <span>{{ t('clientListEmpty') }}</span>
        </div>
      </template>
    </AdminQTable>
  </q-page>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
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
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import { clientListTestIds } from 'src/test-ids/index.js'
import { useClientPermissions } from
  'src/composables/useClientPermissions.js'

const {
  canAddClient,
  canViewClient,
  canChangeStatus,
} = useClientPermissions()

const router = useRouter()
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
  router.push('/clients/add')
}

const changeStatus = () => {
  console.log('Change Status')
}
const showFilters = () => {
  console.log('Show Filters')
}
function editRow(row) {
  const id = row?.id
  if (id == null || id === '') {
    return
  }
  router.push({ name: 'EditClient', params: { id: String(id) } })
}

</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.client-list-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;

  &--open {
    background: #dcfce7;
    color: #166534;
  }

  &--closed {
    background: #f1f5f9;
    color: $text-muted;
  }

  &--other {
    background: $surface-muted;
    color: $text-muted;
  }
}
</style>
