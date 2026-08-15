<template>
  <section
    class="client-overview-alt-panel client-overview-alt-insurance"
    :data-testid="clientOverviewAltTestIds.insurance">
    <SectionHeading
      icon="health_and_safety"
      :title="t('tabInsurance')"
    />

    <AdminTablePanel
      class="admin-table-panel--wide"
      :show-column-settings="false">
      <InsuranceProfilesTable
        :profiles="profiles"
        :empty-label="emptyLabel"
        :can-edit="false"
        :show-actions="false"
      />
    </AdminTablePanel>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import InsuranceProfilesTable from 'components/InsuranceProfilesTable.vue'
import SectionHeading from 'components/SectionHeading.vue'
import { clientOverviewAltTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  insuranceInfo: {
    type: Object,
    default: null,
  },
})

const { t } = useI18n()
const profiles = computed(() => props.insuranceInfo?.profiles ?? [])
const emptyLabel = computed(() =>
  props.insuranceInfo?.emptyLabel || t('insuranceProfilesEmpty'),
)
</script>
