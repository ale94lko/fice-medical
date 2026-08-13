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

defineProps({
  modelValue: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const tabs = computed(() => [
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
  {
    key: encounterWorkspaceTabs.note,
    label: t('encounterTabNote'),
    icon: 'description',
  },
  {
    key: encounterWorkspaceTabs.followUp,
    label: t('encounterTabFollowUp'),
    icon: 'event_available',
  },
])
</script>
