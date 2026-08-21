<template>
  <aside
    class="clinic-messages-client"
    :data-testid="clinicMessagesTestIds.clientPanel"
  >
    <div class="clinic-messages-client__intro">
      <ClinicMessageAvatar
        size="lg"
        :name="header?.fullName || fallbackName"
        :initials="header?.clientInitials"
        :file-id="clientPhotoFileId"
        previewable
        :preview-label="t('photoPreviewAria')"
        :preview-test-id="
          clinicMessagesTestIds.clientPhoto
        "
      />
      <div class="clinic-messages-client__intro-main">
        <div
          class="clinic-messages-client__name ellipsis"
        >
          {{ header?.fullName || fallbackName }}
        </div>
        <div class="clinic-messages-client__chips">
          <q-badge
            v-if="header?.statusLabel"
            color="primary"
            :label="header.statusLabel"
          />
          <span
            v-if="header?.clientNumber || clientNumber"
            class="clinic-messages-client__meta ellipsis"
          >
            {{ header?.clientNumber || clientNumber }}
          </span>
        </div>
      </div>
      <q-btn
        v-if="clientNumber"
        unelevated
        no-caps
        color="primary"
        icon="person"
        class="app-btn-primary
          clinic-messages-client__open"
        :label="t('portalMessagesOpenClient')"
        :aria-label="t('portalMessagesOpenClient')"
        :data-testid="clinicMessagesTestIds.clientLink"
        @click="openClientChart"
      />
    </div>
    <div
      v-if="loading"
      class="clinic-messages-client__loading"
      :data-testid="clinicMessagesTestIds.clientLoading"
    >
      <q-spinner color="primary" size="28px" />
    </div>
    <div
      v-else-if="loadError"
      class="clinic-messages-client__empty"
    >
      {{ t('portalMessagesClientLoadError') }}
    </div>
    <template v-else-if="header">
      <q-banner
        v-if="hasActiveEncounter"
        dense
        rounded
        class="clinic-messages-client__banner"
      >
        <div class="text-weight-medium">
          {{ t('activeEncounterTitle') }}
        </div>
        <template
          v-if="canViewEncounter && activeEncounter?.id"
          #action
        >
          <q-btn
            flat
            no-caps
            color="primary"
            :label="t('encounterOpenWorkspace')"
            :data-testid="
              clinicMessagesTestIds.encounterLink
            "
            @click="openEncounter"
          />
        </template>
      </q-banner>

      <q-tabs
        v-model="activeTab"
        no-caps
        align="left"
        active-color="primary"
        indicator-color="primary"
        narrow-indicator
        class="clinic-messages-client__tabs"
        :data-testid="clinicMessagesTestIds.tabs"
      >
        <q-tab
          :name="panelTabs.info"
          :label="t('portalMessagesPatientInfo')"
          :data-testid="
            clinicMessagesTestIds.tab(panelTabs.info)
          "
        />
        <q-tab
          :name="panelTabs.appointments"
          :label="t('tabAppointments')"
          :data-testid="
            clinicMessagesTestIds.tab(
              panelTabs.appointments,
            )
          "
        />
      </q-tabs>

      <q-tab-panels
        v-model="activeTab"
        animated
        class="clinic-messages-client__panels"
      >
        <q-tab-panel :name="panelTabs.info">
          <section class="clinic-messages-client__section">
            <h3 class="clinic-messages-client__heading">
              {{ t('portalMessagesPersonalInfo') }}
            </h3>
            <dl class="clinic-messages-client__facts">
              <div
                v-for="row in snapshot.facts"
                :key="row.key"
                class="clinic-messages-client__fact"
              >
                <dt>
                  <q-icon
                    :name="factIcon(row.key)"
                    size="16px"
                  />
                  {{ row.label }}
                </dt>
                <dd class="ellipsis">{{ row.value }}</dd>
              </div>
            </dl>
          </section>

          <section class="clinic-messages-client__section">
            <h3 class="clinic-messages-client__heading">
              {{ t('portalMessagesMedicalInfo') }}
            </h3>
            <div class="clinic-messages-client__fact">
              <dt>
                <q-icon
                  name="warning_amber"
                  size="16px"
                />
                {{ t('tabAllergies') }}
              </dt>
              <dd>
                <p
                  v-if="!snapshot.allergies.items.length"
                  class="clinic-messages-client__empty-line"
                >
                  {{ t('clientOverviewNoAllergies') }}
                </p>
                <p
                  v-for="item in snapshot.allergies.items"
                  :key="item.id"
                  class="clinic-messages-client__line"
                  :class="{
                    'clinic-messages-client__line--alert':
                      item.severe,
                  }"
                >
                  {{ item.label }}
                  <span
                    v-if="item.severityLabel
                      && !snapshot.allergies.nka"
                    class="clinic-messages-client__hint"
                  >
                    · {{ item.severityLabel }}
                  </span>
                </p>
              </dd>
            </div>
            <div class="clinic-messages-client__fact">
              <dt>
                <q-icon
                  name="health_and_safety"
                  size="16px"
                />
                {{ t('tabInsurance') }}
              </dt>
              <dd>
                <p
                  v-if="snapshot.insurance"
                  class="clinic-messages-client__line"
                >
                  {{ snapshot.insurance.payerName }}
                  <span
                    v-if="snapshot.insurance.status"
                    class="clinic-messages-client__hint"
                  >
                    · {{ snapshot.insurance.status }}
                  </span>
                </p>
                <p
                  v-else
                  class="clinic-messages-client__empty-line"
                >
                  {{ t('insuranceProfilesEmpty') }}
                </p>
              </dd>
            </div>
          </section>
        </q-tab-panel>

        <q-tab-panel :name="panelTabs.appointments">
          <section
            v-if="canViewAppointments"
            class="clinic-messages-client__section"
          >
            <h3 class="clinic-messages-client__heading">
              {{ t('portalMessagesUpcomingAppointments') }}
            </h3>
            <p
              v-if="!snapshot.upcoming.length"
              class="clinic-messages-client__empty-line"
            >
              {{ t('portalMessagesNoUpcomingAppointments') }}
            </p>
            <ClinicMessageAppointmentCard
              v-for="row in snapshot.upcoming"
              :key="`up-${row.id}`"
              :row="row"
            />
          </section>
          <section
            v-if="canViewAppointments
              && snapshot.recent.length"
            class="clinic-messages-client__section"
          >
            <h3 class="clinic-messages-client__heading">
              {{ t('clientOverviewLastVisit') }}
            </h3>
            <ClinicMessageAppointmentCard
              v-for="row in snapshot.recent"
              :key="`re-${row.id}`"
              :row="row"
            />
          </section>
          <p
            v-if="!canViewAppointments"
            class="clinic-messages-client__empty-line"
          >
            {{ t('portalMessagesNoUpcomingAppointments') }}
          </p>
        </q-tab-panel>
      </q-tab-panels>
    </template>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ClinicMessageAppointmentCard from
  'src/components/messages/ClinicMessageAppointmentCard.vue'
import ClinicMessageAvatar from
  'src/components/messages/ClinicMessageAvatar.vue'
import { useClinicMessageClientPanel } from
  'src/composables/useClinicMessageClientPanel.js'
import { clinicMessagesTestIds } from 'src/test-ids/index.js'

const panelTabs = {
  info: 'info',
  appointments: 'appointments',
}

const factIcons = {
  dob: 'cake',
  gender: 'wc',
  language: 'translate',
  phone: 'call',
  email: 'mail_outline',
}

const props = defineProps({
  clientNumber: { type: String, default: '' },
  fallbackName: { type: String, default: '' },
  photoFileId: { type: [Number, String], default: null },
})

const { t } = useI18n()
const router = useRouter()
const activeTab = ref(panelTabs.info)
const {
  loading,
  loadError,
  header,
  snapshot,
  canViewAppointments,
  canViewEncounter,
  hasActiveEncounter,
  activeEncounter,
} = useClinicMessageClientPanel(() => props.clientNumber)

const clientPhotoFileId = computed(() =>
  header.value?.photoFileId || props.photoFileId || null,
)

function factIcon(key) {
  return factIcons[key] || 'info'
}

function openClientChart() {
  const number = String(props.clientNumber || '').trim()
  if (!number) {
    return
  }
  void router.push({
    name: 'ClientOverview',
    params: { id: number },
  })
}

function openEncounter() {
  const id = activeEncounter.value?.id
  if (!id) {
    return
  }
  void router.push({
    name: 'EncounterWorkspace',
    params: { id: String(id) },
  })
}
</script>
