<template>
  <section
    class="client-overview-modules"
    :data-testid="clientOverviewTestIds.modules">
    <div class="client-overview-modules__grid">
      <ClientOverviewModuleCard
        v-for="module in modules"
        :key="module.id"
        :module-id="module.id"
        :icon="module.icon"
        :tone="module.tone"
        :title="t(module.labelKey)"
        :count="module.summary?.count ?? 0"
        :items="module.summary?.items ?? []"
        :card-severity-modifier="module.summary?.cardSeverityModifier ?? ''"
        :coming-soon="module.comingSoon"
        @view-all="emit('view-module', module)"
      />
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import ClientOverviewModuleCard from
  'components/client-overview/ClientOverviewModuleCard.vue'
import { clientOverviewTestIds } from 'src/test-ids/index.js'

defineProps({
  modules: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['view-module'])

const { t } = useI18n()
</script>
