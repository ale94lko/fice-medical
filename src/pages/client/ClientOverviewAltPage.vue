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
        :show-start-encounter="showEncounterHeaderButton"
        :has-active-encounter="hasActiveEncounter"
        :start-encounter-busy="actionBusy"
        @review-missing="goToEdit(addClientTabKeys.insurance)"
        @edit="goToEdit()"
        @start-encounter="onStartEncounterSelect"
        @open-active-encounter="onOpenActiveEncounter"
      />

      <q-card
        flat
        bordered
        class="client-overview-alt-page__card">
        <q-card-section class="client-overview-alt-page__card-body q-pa-md">
          <div class="client-overview-alt-page__shell">
            <div class="chrome">
              <div class="tabs-row">
                <ClientOverviewAltTabs
                  v-model="activeTab"
                  :insurance-alert="hasInsuranceAlert"
                  :allergies-severity-modifier="allergiesSeverityModifier"
                />
              </div>
            </div>

            <div class="client-overview-alt-page__body">
              <div class="client-overview-alt-page__content">
                <ClientOverviewAltAppointments
                  v-if="activeTab === addClientTabKeys.appointments"
                  :client-id="clientId"
                  :appointments="clientAppointments"
                  @checked-in="onAppointmentCheckedIn"
                />
                <KeepAlive>
                  <ClientOverviewAltEncounters
                    v-if="activeTab === addClientTabKeys.encounters"
                    :key="String(clientId ?? '')"
                    :client-id="clientId"
                  />
                </KeepAlive>
                <ClientOverviewAltBasicInfo
                  v-if="activeTab === addClientTabKeys.basic"
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
                <ClientOverviewAltBilling
                  v-else-if="activeTab === addClientTabKeys.financials"
                  :client-id="clientId"
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
        </q-card-section>
      </q-card>
    </template>

    <div
      v-else
      class="client-overview-loading-underlay"
      aria-hidden="true">
      <div class="client-overview-loading-underlay__header" />
      <div class="client-overview-loading-underlay__main" />
    </div>

    <AiAssistantFab
      :visible="Boolean(header)"
      :disable="loading"
      :client-id="clientId"
      @open-chart-section="onOpenChartSection"
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
import ClientOverviewAltAppointments from
  'components/client-overview/ClientOverviewAltAppointments.vue'
import ClientOverviewAltEncounters from
  'components/client-overview/ClientOverviewAltEncounters.vue'
import ClientOverviewAltBilling from
  'components/client-overview/ClientOverviewAltBilling.vue'
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
import { buildQuickStartEncounterPayload } from
  'src/utils/start-encounter-quick.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { useSiteStore } from 'src/stores/site-store.js'
import { clientOverviewAltTestIds } from 'src/test-ids/index.js'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const $q = useQuasar()
const siteStore = useSiteStore()
const authStore = useAuthStore()

const clientId = computed(() => route.params.id)
const activeTab = ref(addClientTabKeys.appointments)

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
  activeEncounterId,
  actionBusy,
  canStartEncounter,
  canViewEncounter,
  refreshActiveEncounter,
  startEncounter,
  isEncounterConflictError,
  isEncounterInvalidError,
  encounterApiErrorMessage,
} = useActiveEncounter(clientId)

const showEncounterHeaderButton = computed(() => {
  if (hasActiveEncounter.value) {
    return canViewEncounter.value
  }

  return canStartEncounter.value
})

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

function onOpenActiveEncounter() {
  const id = activeEncounterId.value
  if (id == null) {
    return
  }
  router.push({
    name: 'EncounterWorkspace',
    params: { id: String(id) },
  })
}

async function onStartEncounterSelect(selection = {}) {
  try {
    const payload = await buildQuickStartEncounterPayload({
      encounterType: selection.encounterType,
      appointmentId: selection.appointmentId,
      staffMember: authStore.linkedStaffProfile,
      clinicName: authStore.activeSubtenant?.name,
    })
    if (!payload || payload.error) {
      $q.notify({
        type: quasarNotifyTypes.warning,
        message: t(payload?.error || 'activeEncounterActionError'),
      })

      return
    }
    const encounter = await startEncounter(payload)
    notifySuccess(t('startEncounterSuccess'))
    if (encounter?.id != null) {
      router.push({
        name: 'EncounterWorkspace',
        params: { id: String(encounter.id) },
      })
    }
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

function onOpenChartSection(section) {
  if (!section?.tab) {
    return
  }
  if (section.subTab) {
    goToEdit(section.tab, section.subTab)

    return
  }
  activeTab.value = section.tab
}

function onOpenModuleRecord(module) {
  if (!module) {
    return
  }

  goToEdit(module.tabKey, module.subTabKey ?? '')
}
</script>
