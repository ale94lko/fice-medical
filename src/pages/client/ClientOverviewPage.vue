<template>
  <q-page
    class="admin-page client-overview-page"
    :data-testid="clientOverviewTestIds.page">
    <AppLoadingOverlay
      scope="content"
      :showing="loading"
    />

    <template v-if="header">
      <ClientOverviewHeader
        class="client-overview-page__header"
        :client-id="clientId"
        :header="header"
        :billing="sidebar?.billing"
        :insurance="sidebar?.insurance"
        :missing-items="missingItems"
        :loading="loading"
        @review-missing="goToEdit(addClientTabKeys.insurance)"
        @edit="goToEdit()"
      />

      <div class="client-overview-page__main">
        <div class="client-overview-page__body">
          <ClientOverviewModules
            class="client-overview-page__modules"
            :modules="moduleCards"
            @view-module="onViewModule"
          />
          <ClientOverviewSidebar
            class="client-overview-page__sidebar"
            :activity-items="activityItems"
          />
        </div>
      </div>
    </template>

    <div
      v-else
      class="client-overview-loading-underlay"
      aria-hidden="true">
      <div class="client-overview-loading-underlay__header" />
      <div class="client-overview-loading-underlay__body">
        <div class="client-overview-loading-underlay__modules" />
        <div class="client-overview-loading-underlay__sidebar" />
      </div>
    </div>

    <ClientOverviewModuleDialog
      v-model="moduleDialogOpen"
      :module="selectedModule"
      @open-record="onOpenModuleRecord"
    />

    <AiAssistantFab
      :visible="Boolean(header) && canUseClinicalSummary"
      :disable="loading"
      :client-id="clientId"
    />
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { addClientTabKeys } from 'components/constants.js'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import AiAssistantFab from 'components/ai/AiAssistantFab.vue'
import ClientOverviewHeader from
  'components/client-overview/ClientOverviewHeader.vue'
import ClientOverviewModules from
  'components/client-overview/ClientOverviewModules.vue'
import ClientOverviewSidebar from
  'components/client-overview/ClientOverviewSidebar.vue'
import ClientOverviewModuleDialog from
  'components/client-overview/ClientOverviewModuleDialog.vue'
import { useAiPermissions } from 'src/composables/useAiPermissions.js'
import { useClientOverview } from 'src/composables/useClientOverview.js'
import { clientOverviewTestIds } from 'src/test-ids/index.js'

const route = useRoute()
const router = useRouter()

const clientId = computed(() => route.params.id)
const { canUseClinicalSummary } = useAiPermissions()

const {
  loading,
  header,
  sidebar,
  missingItems,
  activityItems,
  moduleCards,
} = useClientOverview(clientId)

const moduleDialogOpen = ref(false)
const selectedModule = ref(null)

function goToEdit(tab = addClientTabKeys.basic, subTab = '') {
  const id = String(clientId.value ?? '').trim()
  if (!id) {
    return
  }

  router.push({
    name: 'EditClient',
    params: { id },
    query: {
      ...(tab ? { tab } : {}),
      ...(subTab ? { subTab } : {}),
    },
  })
}

function onViewModule(module) {
  if (module.comingSoon || loading.value) {
    return
  }

  selectedModule.value = module
  moduleDialogOpen.value = true
}

function onOpenModuleRecord() {
  const module = selectedModule.value
  moduleDialogOpen.value = false
  if (!module) {
    return
  }

  goToEdit(module.tabKey, module.subTabKey ?? '')
}
</script>
