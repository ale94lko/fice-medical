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
      v-else-if="!entries.length"
      class="client-overview-alt-panel__empty">
      {{ t('clientOverviewNoAllergies') }}
    </p>
    <AdminTablePanel
      v-else
      class="admin-table-panel--wide"
      :show-column-settings="false">
      <AllergiesTable
        :entries="entries"
        :empty-label="t('clientOverviewNoAllergies')"
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
import AllergiesTable from 'components/AllergiesTable.vue'
import SectionHeading from 'components/SectionHeading.vue'
import { clientOverviewAltTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  allergyDetail: {
    type: Object,
    default: null,
  },
})

const { t } = useI18n()

const noKnownAllergies = computed(() =>
  Boolean(props.allergyDetail?.noKnownAllergies),
)

const entries = computed(() => {
  const rows = Array.isArray(props.allergyDetail?.rows)
    ? props.allergyDetail.rows
    : []

  return rows.map((item, index) => ({
    id: `overview-allergy-${index}`,
    allergy: item?.label || '',
    severity: item?.severityModifier || item?.severityLabel || '',
    startYear: normalizeYear(item?.year),
  }))
})

function normalizeYear(year) {
  const text = String(year ?? '').trim()
  if (!text || text === '—') {
    return ''
  }

  return text
}
</script>
