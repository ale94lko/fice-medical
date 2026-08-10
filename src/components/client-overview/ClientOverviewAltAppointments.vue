<template>
  <section
    class="client-overview-alt-panel client-overview-alt-appointments"
    :data-testid="clientOverviewAltTestIds.appointments">
    <AddClientAppointmentsTab
      :client-id="clientId"
      :appointments="appointments"
    />
  </section>
</template>

<script setup>
import AddClientAppointmentsTab from
  'components/AddClientAppointmentsTab.vue'
import { clientOverviewAltTestIds } from 'src/test-ids/index.js'

defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
  appointments: {
    type: Array,
    default: () => [],
  },
})
</script>
