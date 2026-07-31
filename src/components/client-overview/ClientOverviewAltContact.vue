<template>
  <section
    class="client-overview-alt-panel"
    :data-testid="clientOverviewAltTestIds.contact">
    <SectionHeading
      icon="contact_mail"
      :title="t('tabContact')"
    />
    <div class="row q-col-gutter-md">
      <div
        v-for="item in fields"
        :key="item.key"
        class="col-12 col-md-6">
        <p class="client-overview-alt-panel__label">
          {{ item.label }}
        </p>
        <p class="client-overview-alt-panel__value">
          {{ item.value }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionHeading from 'components/SectionHeading.vue'
import { clientOverviewAltTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  contactInfo: {
    type: Object,
    default: null,
  },
})

const { t } = useI18n()
const fields = computed(() => props.contactInfo?.fields ?? [])
</script>
