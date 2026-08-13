<template>
  <section
    class="client-overview-alt-panel client-overview-alt-encounters"
    :data-testid="clientOverviewAltTestIds.encounters">
    <div
      v-if="!hasClientId"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('appointmentSaveClientFirst') }}
      </p>
    </div>

    <div
      v-else-if="!canViewEncounter"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('encounterListNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div class="row items-center q-mb-md">
        <div class="col">
          <SectionHeading
            icon="medical_services"
            :title="t('encountersTitle')"
          />
        </div>
      </div>

      <AdminTablePanel
        class="admin-table-panel--wide"
        :show-column-settings="false">
        <div
          v-if="loading"
          class="admin-data-table__empty full-width row flex-center
            text-grey-7 q-gutter-sm q-pa-lg">
          <q-spinner color="primary" size="28px" />
          <span>{{ t('appLoading') }}</span>
        </div>
        <ClientEncountersTable
          v-else
          :rows="rows"
          :empty-label="emptyLabel"
          @open="onOpen"
        />
      </AdminTablePanel>
    </template>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { quasarNotifyTypes } from 'components/constants.js'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import ClientEncountersTable from 'components/ClientEncountersTable.vue'
import SectionHeading from 'components/SectionHeading.vue'
import { useActiveEncounter } from 'src/composables/useActiveEncounter.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  encounterApiErrorMessage,
  listClientEncounters,
} from 'src/utils/encounter-api.js'
import { clientOverviewAltTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
})

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()

const clientIdRef = computed(() => props.clientId)
const { canViewEncounter } = useActiveEncounter(clientIdRef)

const loading = ref(false)
const rows = ref([])
const loadFailed = ref(false)
const loadedClientId = ref('')

const hasClientId = computed(
  () => String(props.clientId ?? '').trim() !== '',
)

const emptyLabel = computed(() =>
  loadFailed.value
    ? t('encounterListLoadError')
    : t('encounterListEmpty'),
)

async function loadEncounters({ force = false } = {}) {
  const id = String(props.clientId ?? '').trim()
  loadFailed.value = false
  if (!id || !canViewEncounter.value) {
    rows.value = []
    loadedClientId.value = ''

    return
  }
  if (!force && loadedClientId.value === id) {
    return
  }
  loading.value = true
  try {
    const list = await listClientEncounters(id, {
      limit: 100,
      // eslint-disable-next-line camelcase -- API query params
      sort_by: 'started_at_utc',
      // eslint-disable-next-line camelcase -- API query params
      sort_dir: 'desc',
    })
    rows.value = (list ?? []).slice().sort((a, b) =>
      String(b.startedAtUtc || '').localeCompare(
        String(a.startedAtUtc || ''),
      ),
    )
    loadedClientId.value = id
  } catch (error) {
    rows.value = []
    loadFailed.value = true
    loadedClientId.value = ''
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: encounterApiErrorMessage(
          error,
          t('encounterListLoadError'),
        ),
      })
    }
  } finally {
    loading.value = false
  }
}

function onOpen(row) {
  if (row?.id == null) {
    return
  }
  router.push({
    name: 'EncounterWorkspace',
    params: { id: String(row.id) },
  })
}

watch(
  () => String(props.clientId ?? '').trim(),
  () => {
    void loadEncounters()
  },
  { immediate: true },
)

watch(canViewEncounter, (allowed) => {
  if (!allowed) {
    rows.value = []
    loadedClientId.value = ''

    return
  }
  void loadEncounters()
})
</script>
