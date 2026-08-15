<template>
  <div
    class="add-client-billing-tab"
    :data-testid="clientBillingTestIds.root">
    <div
      v-if="!hasClientId"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('appointmentSaveClientFirst') }}
      </p>
    </div>

    <div
      v-else-if="!canViewSuperbills"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('clientBillingNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div class="row items-center q-mb-md">
        <div class="col">
          <SectionHeading
            icon="payments"
            :title="t('clientBillingTitle')"
          />
          <p class="text-body2 text-grey-7 q-mb-none q-mt-xs">
            {{ t('clientBillingSubtitle') }}
          </p>
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
        <ClientSuperbillsTable
          v-else
          :rows="rows"
          :empty-label="emptyLabel"
          @open="onOpen"
        />
      </AdminTablePanel>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { quasarNotifyTypes } from 'components/constants.js'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import ClientSuperbillsTable from 'components/ClientSuperbillsTable.vue'
import SectionHeading from 'components/SectionHeading.vue'
import { useSuperbillPermissions } from
  'src/composables/useSuperbillPermissions.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  listSuperbills,
  superbillApiErrorMessage,
} from 'src/utils/superbill-api.js'
import { clientBillingTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
})

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()
const { canViewSuperbills } = useSuperbillPermissions()

const loading = ref(false)
const rows = ref([])
const loadFailed = ref(false)
const loadedClientId = ref('')

const hasClientId = computed(
  () => String(props.clientId ?? '').trim() !== '',
)

const emptyLabel = computed(() =>
  loadFailed.value
    ? t('clientBillingLoadError')
    : t('clientBillingEmpty'),
)

async function loadBills({ force = false } = {}) {
  const id = String(props.clientId ?? '').trim()
  loadFailed.value = false
  if (!id || !canViewSuperbills.value) {
    rows.value = []
    loadedClientId.value = ''

    return
  }
  if (!force && loadedClientId.value === id) {
    return
  }
  loading.value = true
  try {
    const result = await listSuperbills({
      clientId: id,
      includeVoided: true,
      limit: 100,
    })
    rows.value = result.items ?? []
    loadedClientId.value = id
  } catch (error) {
    rows.value = []
    loadFailed.value = true
    loadedClientId.value = ''
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: superbillApiErrorMessage(
          error,
          t('clientBillingLoadError'),
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
    name: 'SuperbillDetail',
    params: { id: String(row.id) },
  })
}

watch(
  () => String(props.clientId ?? '').trim(),
  () => {
    void loadBills()
  },
  { immediate: true },
)

watch(canViewSuperbills, allowed => {
  if (!allowed) {
    rows.value = []
    loadedClientId.value = ''

    return
  }
  void loadBills()
})
</script>
