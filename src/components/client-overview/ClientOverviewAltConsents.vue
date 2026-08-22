<template>
  <section
    class="client-overview-alt-panel client-overview-alt-consents"
    :data-testid="clientOverviewAltTestIds.consents">
    <AddClientConsentsTab
      :client-id="clientId"
      :client-display-name="clientDisplayName"
      :contact-section="contactSection"
      :can-view="canView"
    />
  </section>
</template>

<script setup>
import AddClientConsentsTab from
  'components/AddClientConsentsTab.vue'
import { clientOverviewAltTestIds } from 'src/test-ids/index.js'

defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
  clientDisplayName: {
    type: String,
    default: '',
  },
  contactSection: {
    type: Object,
    default: null,
  },
  canView: {
    type: Boolean,
    default: true,
  },
})
</script>
