<template>
  <div class="tabs-row encounter-workspace-tabs-row">
    <nav
      class="client-overview-alt-tabs encounter-workspace-tabs"
      role="tablist"
      :data-testid="tid.tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        role="tab"
        class="client-overview-alt-tabs__tab"
        :class="{
          'client-overview-alt-tabs__tab--active':
            modelValue === tab.key,
        }"
        :aria-selected="modelValue === tab.key"
        :data-testid="tid.tab(tab.key)"
        @click="emit('update:modelValue', tab.key)">
        <q-icon :name="tab.icon" size="18px" />
        <span>{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { encounterWorkspaceTabs } from 'components/constants.js'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  showNarrative: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const tabs = computed(() => {
  const items = [
    {
      key: encounterWorkspaceTabs.overview,
      label: t('encounterTabOverview'),
      icon: 'home',
    },
    {
      key: encounterWorkspaceTabs.visit,
      label: t('encounterTabVisit'),
      icon: 'event',
    },
    {
      key: encounterWorkspaceTabs.clinical,
      label: t('encounterTabClinical'),
      icon: 'favorite',
    },
  ]
  if (props.showNarrative) {
    items.push({
      key: encounterWorkspaceTabs.narrative,
      label: t('encounterTabNarrative'),
      icon: 'notes',
    })
  }
  items.push({
    key: encounterWorkspaceTabs.followUp,
    label: t('encounterTabFollowUp'),
    icon: 'event_available',
  })

  return items
})
</script>
