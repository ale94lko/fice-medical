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
        <div
          v-if="item.type === 'phones' || item.type === 'emails'"
          class="client-overview-alt-panel__contact">
          <AdminTableContactOverflow
            v-if="item.entries?.length"
            :entries="item.entries"
            :icon="item.type === 'phones' ? 'phone' : 'mail_outline'"
            variant="header"
          />
          <p
            v-else
            class="client-overview-alt-panel__value">
            —
          </p>
        </div>
        <p
          v-else
          class="client-overview-alt-panel__value">
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
import AdminTableContactOverflow from
  'components/admin-table/AdminTableContactOverflow.vue'
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
