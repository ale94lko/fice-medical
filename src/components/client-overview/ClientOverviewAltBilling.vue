<template>
  <section
    class="client-overview-alt-panel client-overview-alt-billing"
    :data-testid="clientOverviewAltTestIds.billing">
    <AddClientBillingTab :client-id="clientId" />
  </section>
</template>

<script setup>
import AddClientBillingTab from 'components/AddClientBillingTab.vue'
import { clientOverviewAltTestIds } from 'src/test-ids/index.js'

defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
})
</script>
