<template>
  <q-page>
    <q-table
      selection="multiple"
      row-key="id"
      :grid="showGrid"
      :title="t('clients')"
      :rows="rows"
      :columns="columns"
      :selected="selected">
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
          @click="assignClinicians" />
        <q-btn
          no-caps
          class="q-ml-sm"
          color="primary"
          icon="note_alt"
          :disable="selected.length === 0 || loading"
          :label="t('change_status')"
          @click="changeStatus" />
        <q-space />
        <q-input borderless dense debounce="300" color="primary" v-model="filter">
          <template v-slot:append>
            <q-btn
              color="secondary"
              class="text-teal-10"
              icon="filter_alt"
              :disable="loading"
              :label="t('filters')"
              @click="showFilters" />
          </template>
        </q-input>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useSiteStore } from 'stores/site-store.js'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { siteBreakpointsPx } from 'components/constants.js'

const $q = useQuasar()
const loading = ref(false)
const selected = ref([])

const siteStore = useSiteStore()
const { t } = useI18n()

// Load data when component is mounted
onMounted(async () => {
  await siteStore.getClientList()
})

// Computed properties
const columns = computed(() => [
  {
    name: 'client_no',
    required: true,
    label: t('client_no'),
    align: 'left',
    field: row => row.client_no,
    format: val => `${val}`,
    sortable: true,
  },
  {
    name: 'name',
    required: true,
    label: t('name'),
    align: 'left',
    field: row => row.name,
    format: val => `${val}`,
    sortable: true,
  },
  {
    name: 'email',
    required: true,
    label: t('email'),
    align: 'left',
    field: row => row.email,
    format: val => `${val}`,
    sortable: true,
  },
  {
    name: 'dob',
    required: true,
    label: t('dob'),
    align: 'left',
    field: row => row.dob,
    format: val => `${val}`,
    sortable: true,
  },
  {
    name: 'clinicians',
    required: true,
    label: t('clinicians'),
    align: 'left',
    field: row => row.clinicians,
    format: val => `${val}`,
    sortable: false,
  },
  {
    name: 'admission_date',
    required: true,
    label: t('admission_date'),
    align: 'left',
    field: row => row.admission_date,
    format: val => `${val}`,
    sortable: false,
  },
  {
    name: 'status',
    required: true,
    label: t('status'),
    align: 'left',
    field: row => row.status,
    format: val => `${val}`,
    sortable: false,
  },
  {
    name: 'actions',
    required: true,
    label: t('actions'),
    align: 'left',
    field: row => row.actions,
    format: val => `${val}`,
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
const assignClinicians = () => {
  console.log('Assign Clinicians')
}
const changeStatus = () => {
  console.log('Change Status')
}
const showFilters = () => {
  console.log('Show Filters')
}

</script>
