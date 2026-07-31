<template>
  <section
    class="client-overview-alt-panel"
    :data-testid="clientOverviewAltTestIds.allergies">
    <SectionHeading
      icon="warning_amber"
      :title="t('tabAllergies')"
    />

    <p
      v-if="noKnownAllergies"
      class="client-overview-alt-panel__empty">
      {{ t('clientOverviewNoKnownAllergies') }}
    </p>
    <p
      v-else-if="!items.length"
      class="client-overview-alt-panel__empty">
      {{ t('clientOverviewNoAllergies') }}
    </p>
    <ClientOverviewAllergiesDialogList
      v-else
      :items="items"
    />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionHeading from 'components/SectionHeading.vue'
import ClientOverviewAllergiesDialogList from
  'components/client-overview/ClientOverviewAllergiesDialogList.vue'
import { clientOverviewAltTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  allergyDetail: {
    type: Object,
    default: null,
  },
})

const { t } = useI18n()

const items = computed(() => props.allergyDetail?.rows ?? [])
const noKnownAllergies = computed(() =>
  Boolean(props.allergyDetail?.noKnownAllergies),
)
</script>
