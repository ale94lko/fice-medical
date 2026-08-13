<template>
  <div
    v-if="items.length"
    class="encounter-allergy-banner"
    :data-testid="tid.allergyBanner">
    <div class="encounter-allergy-banner__content">
      <q-icon name="warning_amber" color="negative" size="20px" />
      <strong class="encounter-allergy-banner__label">
        {{ t('encounterAllergiesLabel') }}
      </strong>
      <span class="encounter-allergy-banner__list">
        {{ allergyText }}
      </span>
    </div>
    <q-btn
      flat
      dense
      no-caps
      color="primary"
      :label="t('encounterViewAllAllergies')"
      @click="emit('view-allergies')"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['view-allergies'])
const { t } = useI18n()

const allergyText = computed(() =>
  (props.items || []).map((item) => {
    const name = item.name || '—'
    if (item.severity) {
      return `${name} — ${item.severity}`
    }

    return name
  }).join(' | '),
)
</script>
