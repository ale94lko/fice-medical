<template>
  <section
    class="client-overview-alt-panel"
    :data-testid="clientOverviewAltTestIds.modulesTab(tabKey)">
    <SectionHeading
      :icon="icon"
      :title="title"
    />

    <ClientOverviewModules
      class="client-overview-alt-panel__modules"
      :modules="modules"
      @view-module="onViewModule"
    />

    <ClientOverviewModuleDialog
      v-model="moduleDialogOpen"
      :module="selectedModule"
      @open-record="onOpenRecord"
    />
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import SectionHeading from 'components/SectionHeading.vue'
import ClientOverviewModules from
  'components/client-overview/ClientOverviewModules.vue'
import ClientOverviewModuleDialog from
  'components/client-overview/ClientOverviewModuleDialog.vue'
import { clientOverviewAltTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  tabKey: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: 'folder',
  },
  moduleCards: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['open-record'])

const modules = computed(() =>
  (props.moduleCards ?? []).filter(module => module.tabKey === props.tabKey),
)

const moduleDialogOpen = ref(false)
const selectedModule = ref(null)

watch(() => props.tabKey, () => {
  moduleDialogOpen.value = false
  selectedModule.value = null
})

function onViewModule(module) {
  if (module?.comingSoon) {
    return
  }

  selectedModule.value = module
  moduleDialogOpen.value = true
}

function onOpenRecord() {
  emit('open-record', selectedModule.value)
  moduleDialogOpen.value = false
}
</script>
