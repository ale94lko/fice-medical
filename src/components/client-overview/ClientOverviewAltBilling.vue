<template>
  <section
    class="client-overview-alt-panel client-overview-alt-billing"
    :data-testid="clientOverviewAltTestIds.billing">
    <q-tabs
      v-if="visibleSubTabs.length > 1"
      v-model="activeSubTab"
      dense
      no-caps
      active-color="primary"
      indicator-color="primary"
      align="left"
      class="add-client-subtabs"
      :data-testid="clientFinancialTestIds.overviewTabs">
      <q-tab
        v-for="tab in visibleSubTabs"
        :key="tab.key"
        :name="tab.key"
        :icon="tab.icon"
        :label="t(tab.labelKey)"
      />
    </q-tabs>

    <AddClientFinancialOverviewTab
      v-if="activeSubTab === FINANCIALS_OVERVIEW_SUB_TAB"
      :client-id="clientId"
    />
    <AddClientLedgerTab
      v-else-if="activeSubTab === FINANCIALS_LEDGER_SUB_TAB"
      :client-id="clientId"
    />
    <AddClientBillingTab
      v-else-if="activeSubTab === FINANCIALS_BILLING_SUB_TAB"
      :client-id="clientId"
    />
    <AddClientPaymentsTab
      v-else-if="activeSubTab === FINANCIALS_PAYMENTS_SUB_TAB"
      :client-id="clientId"
    />
    <div
      v-else
      class="text-body1 text-grey-7 q-py-xl text-center">
      {{ t('tabComingSoon') }}
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AddClientBillingTab from 'components/AddClientBillingTab.vue'
import AddClientFinancialOverviewTab from
  'components/AddClientFinancialOverviewTab.vue'
import AddClientLedgerTab from 'components/AddClientLedgerTab.vue'
import AddClientPaymentsTab from
  'components/AddClientPaymentsTab.vue'
import { addClientTabKeys } from 'components/constants.js'
import {
  FINANCIALS_BILLING_SUB_TAB,
  FINANCIALS_LEDGER_SUB_TAB,
  FINANCIALS_OVERVIEW_SUB_TAB,
  FINANCIALS_PAYMENTS_SUB_TAB,
} from 'src/composables/useAddClientSubTabs.js'
import { useAddClientTabPermissions } from
  'src/composables/useAddClientTabPermissions.js'
import {
  clientFinancialTestIds,
  clientOverviewAltTestIds,
} from 'src/test-ids/index.js'

defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
})

const { t } = useI18n()
const { visibleSubTabsFor } = useAddClientTabPermissions(
  computed(() => false),
)
const visibleSubTabs = visibleSubTabsFor(addClientTabKeys.financials)
const activeSubTab = ref('')

watch(
  visibleSubTabs,
  tabs => {
    const keys = (tabs ?? []).map(tab => tab.key)
    if (!keys.length) {
      activeSubTab.value = ''

      return
    }
    if (!keys.includes(activeSubTab.value)) {
      activeSubTab.value = keys[0]
    }
  },
  { immediate: true },
)
</script>
