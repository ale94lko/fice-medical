<template>
  <div class="add-client-screenings-tab">
    <div
      v-if="!hasPatientId"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('screeningSaveClientFirst') }}
      </p>
    </div>

    <div
      v-else-if="!canView"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('screeningsNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div class="screenings-header row items-start">
        <div class="col">
          <h2 class="screenings-title">
            {{ t('screeningsTitle') }}
          </h2>
          <p class="screenings-subtitle text-body2">
            {{ t('screeningsSubtitle') }}
          </p>
        </div>
        <div class="col-auto">
          <q-btn
            v-if="!readonly"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :data-testid="tid.btn('new')"
            :label="t('screeningNew')"
            @click="openCreateDialog"
          />
        </div>
      </div>

      <AdminTablePanel
        class="screenings-table-panel q-mt-md"
        :show-column-settings="false">
        <ScreeningsTable
          :rows="screeningRows"
          :empty-label="t('screeningListEmpty')"
          :can-edit="!readonly"
          @view="openView"
          @edit="openEdit"
        />
      </AdminTablePanel>
    </template>

    <ScreeningDialog
      v-model="dialogOpen"
      :patient-id="patientId"
      :screening-id="dialogScreeningId"
      :client-screenings="clientScreeningsRaw"
      :mode="dialogMode"
      :readonly="dialogReadonly"
      :clinician-options="clinicianOptions"
      @saved="onDialogSaved"
      @closed="onDialogClosed"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import ScreeningDialog from 'components/ScreeningDialog.vue'
import ScreeningsTable from 'components/ScreeningsTable.vue'
import { screeningStatuses, quasarNotifyTypes } from 'components/constants.js'
import { mapScreeningsListFromApi } from 'src/utils/screening-normalize.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { useSiteStore } from 'src/stores/site-store.js'
import { screeningTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  patientId: {
    type: [String, Number],
    default: null,
  },
  screenings: {
    type: Array,
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  canView: {
    type: Boolean,
    default: true,
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
})

const { t } = useI18n()
const $q = useQuasar()
const siteStore = useSiteStore()

const dialogOpen = ref(false)
const dialogScreeningId = ref(null)
const dialogMode = ref('create')
const dialogReadonly = ref(false)

const hasPatientId = computed(() =>
  Boolean(String(props.patientId ?? '').trim()),
)
const patientId = computed(() => String(props.patientId ?? '').trim())

const clientScreeningsRaw = computed(() =>
  Array.isArray(props.screenings) ? props.screenings : [],
)

const screeningRows = computed(() =>
  mapScreeningsListFromApi(
    clientScreeningsRaw.value,
    props.clinicianOptions ?? [],
  ),
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
  if (!row?.id || props.readonly) {
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

async function refreshClientScreenings() {
  if (!hasPatientId.value) {
    return
  }
  try {
    await siteStore.fetchClientById(patientId.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('screeningListError'),
        position: 'top',
      })
    }
  }
}

async function onDialogSaved() {
  await refreshClientScreenings()
}

function onDialogClosed() {
  dialogScreeningId.value = null
  refreshClientScreenings()
}
</script>
