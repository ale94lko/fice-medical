<template>
  <q-page>
    <q-table
      class="table"
      selection="multiple"
      row-key="id"
      v-model:selected="selected"
      :rows-per-page-options="[20, 50, 100, t('all')]"
      :grid="showGrid"
      :title="t('clients')"
      :rows="rows"
      :columns="columns"
      :rows-per-page-label="t('rows_per_page')">
      <template v-slot:top>
        <q-btn
          no-caps
          color="primary"
          icon="add"
          :disable="loading"
          :label="t('add_client')"
          @click="addClient" />
        <q-btn
          no-caps
          class="q-ml-sm"
          color="primary"
          icon="assignment_ind"
          :disable="selected.length === 0 || loading"
          :label="t('assign_clinicians')"
          @click="assignClinicians(selected)" />
        <q-btn
          no-caps
          class="q-ml-sm"
          color="primary"
          icon="note_alt"
          :disable="selected.length === 0 || loading"
          :label="t('change_status')"
          @click="changeStatus(selected)" />
        <q-space />
        <q-btn
          color="secondary"
          class="text-teal-10"
          icon="filter_alt"
          :disable="loading"
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
            :size="siteBreakpoints.SM"
            @click="editRow(props.row)"
          />
          <q-btn
            flat
            round
            icon="assignment_ind"
            color="primary"
            :size="siteBreakpoints.SM"
            @click="assignClinicians([props.row])"
          />
          <q-btn
            flat
            round
            icon="note_alt"
            color="primary"
            :size="siteBreakpoints.SM"
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
import { siteBreakpoints, siteBreakpointsPx } from 'components/constants.js'

const $q = useQuasar()
const loading = ref(false)
const selected = ref([])

const siteStore = useSiteStore()
const { t } = useI18n()

// Load data when component is mounted
onMounted(async() => {
  await siteStore.getClientList(t)
})

// Computed properties
const columns = computed(() => [
  {
    name: 'client_number',
    required: true,
    label: t('client_number'),
    align: 'left',
    field: row => row.client_number,
    sortable: true,
  },
  {
    name: 'name',
    required: true,
    label: t('name'),
    align: 'left',
    field: row => row.name,
    sortable: true,
  },
  {
    name: 'email',
    required: true,
    label: t('email'),
    align: 'left',
    field: row => row.email,
    sortable: true,
  },
  {
    name: 'dob',
    required: true,
    label: t('dob'),
    align: 'left',
    field: row => row.dob,
    sortable: true,
  },
  {
    name: 'clinicians',
    required: true,
    label: t('clinicians'),
    align: 'left',
    field: row => row.clinicians,
    sortable: false,
  },
  {
    name: 'admission_date',
    required: true,
    label: t('admission_date'),
    align: 'left',
    field: row => row.admission_date,
    sortable: false,
  },
  {
    name: 'status',
    required: true,
    label: t('status'),
    align: 'left',
    field: row => row.status,
    sortable: false,
  },
  {
    name: 'actions',
    required: true,
    label: t('actions'),
    align: 'center',
    field: row => row.actions,
    sortable: false,
  },
])
const rows = computed(() => siteStore.clientList)

// Responsive logic
const windowWidth = computed(() => $q.screen.width)
// TODO: take into account drawer width
const showGrid = computed(() => windowWidth.value <= siteBreakpointsPx.XXS)

// Methods
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
