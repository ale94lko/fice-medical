<template>
  <q-tabs
    :model-value="modelValue"
    dense
    no-caps
    outside-arrows
    mobile-arrows
    class="add-client-tabs"
    active-color="white"
    indicator-color="transparent"
    align="left"
    :data-testid="tid.tabs"
    @update:model-value="emit('update:modelValue', $event)">
    <q-tab
      v-for="tab in tabs"
      :key="tab.key"
      :name="tab.key"
      :data-testid="tid.tab(tab.key)"
      :aria-selected="tab.key === modelValue">
      <span class="label row items-center no-wrap">
        <q-icon
          :name="tab.icon"
          size="18px"
          class="icon"
        />
        <span class="text">{{ tab.label }}</span>
      </span>
    </q-tab>
  </q-tabs>
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
