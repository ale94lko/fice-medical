<template>
  <q-page
    class="admin-page client-overview-page client-overview-alt-page"
    :data-testid="clientOverviewAltTestIds.page">
    <AppLoadingOverlay
      scope="content"
      :showing="loading"
    />

    <template v-if="header">
      <ClientOverviewAltHeader
        class="client-overview-page__header"
        :client-id="clientId"
        :header="header"
        :missing-items="missingItems"
        :loading="loading"
        :show-start-encounter="canManageEncounter && !hasActiveEncounter"
        :start-encounter-busy="actionBusy"
        @review-missing="goToEdit(addClientTabKeys.insurance)"
        @edit="goToEdit()"
        @start-encounter="startDialogOpen = true"
      />

      <div
        class="client-overview-page__main client-overview-alt-page__main">
        <ClientOverviewAltTabs
          v-model="activeTab"
          :insurance-alert="hasInsuranceAlert"
          :allergies-severity-modifier="allergiesSeverityModifier"
        />

        <div class="client-overview-page__body client-overview-alt-page__body">
          <div class="client-overview-alt-page__content">
            <ClientOverviewAltAppointments
              v-if="activeTab === addClientTabKeys.appointments"
              :client-id="clientId"
              :appointments="clientAppointments"
              @checked-in="onAppointmentCheckedIn"
            />
            <ClientOverviewAltBasicInfo
              v-else-if="activeTab === addClientTabKeys.basic"
              :basic-info="basicInfo"
            />
            <ClientOverviewAltContact
              v-else-if="activeTab === addClientTabKeys.contact"
              :contact-info="contactInfo"
            />
            <ClientOverviewAltAllergies
              v-else-if="activeTab === addClientTabKeys.allergies"
              :allergy-detail="allergyDetail"
            />
            <ClientOverviewAltInsurance
              v-else-if="activeTab === addClientTabKeys.insurance"
              :insurance-info="insuranceInfo"
            />
            <ClientOverviewAltModulesTab
              v-else-if="activeTab === addClientTabKeys.clinical"
              :tab-key="addClientTabKeys.clinical"
              :title="t('tabClinical')"
              icon="medical_services"
              :module-cards="moduleCards"
              @open-record="onOpenModuleRecord"
            />
            <ClientOverviewAltModulesTab
              v-else-if="activeTab === addClientTabKeys.careCoordination"
              :tab-key="addClientTabKeys.careCoordination"
              :title="t('tabCareCoordination')"
              icon="groups"
              :module-cards="moduleCards"
              @open-record="onOpenModuleRecord"
            />
            <ClientOverviewAltModulesTab
              v-else-if="activeTab === addClientTabKeys.financials"
              :tab-key="addClientTabKeys.financials"
              :title="t('tabFinancial')"
              icon="payments"
              :module-cards="moduleCards"
              @open-record="onOpenModuleRecord"
            />
            <ClientOverviewAltModulesTab
              v-else-if="activeTab === addClientTabKeys.documents"
              :tab-key="addClientTabKeys.documents"
              :title="t('tabDocuments')"
              icon="folder"
              :module-cards="moduleCards"
              @open-record="onOpenModuleRecord"
            />
          </div>
        </div>
      </div>
    </template>

    <div
      v-else
      class="client-overview-loading-underlay"
      aria-hidden="true">
      <div class="client-overview-loading-underlay__header" />
      <div class="client-overview-loading-underlay__main" />
    </div>

    <AiAssistantFab
      :visible="Boolean(header) && canUseClinicalSummary"
      :disable="loading"
      :client-id="clientId"
    />

    <StartEncounterDialog
      v-model="startDialogOpen"
      :client-id="clientId"
      :saving="actionBusy"
      @submit="onStartEncounter"
    />
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  addClientTabKeys,
  clientFormSections,
  quasarNotifyTypes,
} from 'components/constants.js'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import AiAssistantFab from 'components/ai/AiAssistantFab.vue'
import StartEncounterDialog from 'components/StartEncounterDialog.vue'
import ClientOverviewAltAppointments from
  'components/client-overview/ClientOverviewAltAppointments.vue'
import ClientOverviewAltHeader from
  'components/client-overview/ClientOverviewAltHeader.vue'
import ClientOverviewAltTabs from
  'components/client-overview/ClientOverviewAltTabs.vue'
import ClientOverviewAltBasicInfo from
  'components/client-overview/ClientOverviewAltBasicInfo.vue'
import ClientOverviewAltContact from
  'components/client-overview/ClientOverviewAltContact.vue'
import ClientOverviewAltAllergies from
  'components/client-overview/ClientOverviewAltAllergies.vue'
import ClientOverviewAltInsurance from
  'components/client-overview/ClientOverviewAltInsurance.vue'
import ClientOverviewAltModulesTab from
  'components/client-overview/ClientOverviewAltModulesTab.vue'
import { useActiveEncounter } from 'src/composables/useActiveEncounter.js'
import { useAiPermissions } from 'src/composables/useAiPermissions.js'
import { useClientOverview } from 'src/composables/useClientOverview.js'
import { buildClientOverviewAltBasicInfo } from
  'src/utils/client-overview-alt-basic-info.js'
import { buildClientOverviewAltContact } from
  'src/utils/client-overview-alt-contact.js'
import { buildClientOverviewAltInsurance } from
  'src/utils/client-overview-alt-insurance.js'
import {
  highestAllergySeverity,
  severityTabModifier,
} from 'src/utils/client-allergies.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { useSiteStore } from 'src/stores/site-store.js'
import { clientOverviewAltTestIds } from 'src/test-ids/index.js'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const $q = useQuasar()
const siteStore = useSiteStore()

const clientId = computed(() => route.params.id)
const activeTab = ref(addClientTabKeys.appointments)
const startDialogOpen = ref(false)
const { canUseClinicalSummary } = useAiPermissions()

const {
  loading,
  header,
  missingItems,
  moduleCards,
  form,
  rawClient,
  summaries,
} = useClientOverview(clientId)

const {
  hasActiveEncounter,
  actionBusy,
  canManageEncounter,
  refreshActiveEncounter,
  startEncounter,
  isEncounterConflictError,
  isEncounterInvalidError,
  encounterApiErrorMessage,
} = useActiveEncounter(clientId)

const clientAppointments = computed(() => {
  const id = String(clientId.value ?? '').trim()
  if (!id) {
    return []
  }
  const fromStore = siteStore.clientListSourceById[id]?.appointments
  if (Array.isArray(fromStore)) {
    return fromStore
  }
  const fromSummaries = summaries.value?.appointmentsRaw

  return Array.isArray(fromSummaries) ? fromSummaries : []
})

const basicInfo = computed(() => {
  if (!header.value) {
    return null
  }

  return buildClientOverviewAltBasicInfo(
    form.value,
    header.value,
    rawClient.value,
    t,
  )
})

const contactInfo = computed(() => {
  if (!form.value) {
    return null
  }

  return buildClientOverviewAltContact(form.value, t)
})

const insuranceInfo = computed(() => {
  if (!form.value) {
    return null
  }

  return buildClientOverviewAltInsurance(form.value, t)
})

const allergyDetail = computed(() =>
  summaries.value?.allergies?.dialogDetail ?? null,
)

const allergiesSeverityModifier = computed(() => {
  const entries = form.value?.[clientFormSections.allergies]?.entries
  if (form.value?.[clientFormSections.allergies]?.noKnownAllergies) {
    return ''
  }

  return severityTabModifier(highestAllergySeverity(entries))
})

const hasInsuranceAlert = computed(() =>
  (missingItems.value ?? []).includes(t('clientOverviewMissingInsurance')),
)

function notifyError(error, fallbackKey = 'activeEncounterActionError') {
  let message = encounterApiErrorMessage(error, t(fallbackKey))
  if (isEncounterConflictError(error)) {
    message = t('activeEncounterConflict')
  } else if (isEncounterInvalidError(error)) {
    message = t('activeEncounterInvalid')
  }
  $q.notify({
    type: quasarNotifyTypes.negative,
    message,
  })
}

function notifySuccess(message) {
  $q.notify({
    type: quasarNotifyTypes.positive,
    message,
  })
}

async function onAppointmentCheckedIn() {
  try {
    await refreshActiveEncounter()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error, 'activeEncounterLoadError')
    }
  }
}

async function onStartEncounter(payload) {
  try {
    await startEncounter(payload)
    startDialogOpen.value = false
    notifySuccess(t('startEncounterSuccess'))
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error)
    }
  }
}

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

function onOpenModuleRecord(module) {
  if (!module) {
    return
  }

  goToEdit(module.tabKey, module.subTabKey ?? '')
}
</script>
