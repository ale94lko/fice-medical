<template>
  <aside
    class="clinic-messages-client"
    :data-testid="clinicMessagesTestIds.clientPanel"
  >
    <div
      v-if="loading"
      class="clinic-messages-client__empty"
    >
      {{ t('appLoading') }}
    </div>
    <div
      v-else-if="loadError"
      class="clinic-messages-client__empty"
    >
      {{ t('portalMessagesClientLoadError') }}
    </div>
    <template v-else-if="header">
      <div class="clinic-messages-client__intro">
        <div class="clinic-messages-client__name ellipsis">
          {{ header.fullName || fallbackName }}
        </div>
        <div
          v-if="header.clientNumber"
          class="clinic-messages-client__meta ellipsis"
        >
          {{ header.clientNumber }}
        </div>
        <q-badge
          v-if="header.statusLabel"
          outline
          color="primary"
          :label="header.statusLabel"
        />
      </div>

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
            dense
            color="primary"
            :label="t('encounterOpenWorkspace')"
            :data-testid="clinicMessagesTestIds.encounterLink"
            @click="openEncounter"
          />
        </template>
      </q-banner>

      <dl class="clinic-messages-client__facts">
        <div
          v-for="row in snapshot.facts"
          :key="row.key"
          class="clinic-messages-client__fact"
        >
          <dt>{{ row.label }}</dt>
          <dd class="ellipsis">{{ row.value }}</dd>
        </div>
      </dl>

      <section
        v-if="snapshot.clinicians.length"
        class="clinic-messages-client__section"
      >
        <h3 class="clinic-messages-client__heading">
          {{ t('assignedClinicians') }}
        </h3>
        <p
          v-for="card in snapshot.clinicians"
          :key="card.id || card.name"
          class="clinic-messages-client__line"
        >
          {{ card.name }}
          <span
            v-if="card.isPrimary"
            class="clinic-messages-client__hint"
          >
            · {{ t('clientOverviewPrimaryClinician') }}
          </span>
        </p>
      </section>

      <section class="clinic-messages-client__section">
        <h3 class="clinic-messages-client__heading">
          {{ t('tabAllergies') }}
        </h3>
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
            'clinic-messages-client__line--alert': item.severe,
          }"
        >
          {{ item.label }}
          <span
            v-if="item.severityLabel && !snapshot.allergies.nka"
            class="clinic-messages-client__hint"
          >
            · {{ item.severityLabel }}
          </span>
        </p>
      </section>

      <section class="clinic-messages-client__section">
        <h3 class="clinic-messages-client__heading">
          {{ t('tabInsurance') }}
        </h3>
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
      </section>

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
        <article
          v-for="row in snapshot.upcoming"
          :key="`up-${row.id}`"
          class="clinic-messages-client__appt"
          :data-testid="clinicMessagesTestIds.appointment(row.id)"
        >
          <div class="clinic-messages-client__appt-when">
            {{ row.when }}
          </div>
          <div
            v-if="row.service"
            class="clinic-messages-client__line"
          >
            {{ row.service }}
          </div>
          <div
            v-if="row.clinician"
            class="clinic-messages-client__hint"
          >
            {{ row.clinician }}
          </div>
          <div class="clinic-messages-client__appt-meta">
            <q-badge
              outline
              color="primary"
              :label="row.status"
            />
            <span
              v-if="row.telehealth"
              class="clinic-messages-client__hint"
            >
              {{ t('placeOfServiceTelehealth') }}
            </span>
          </div>
        </article>
      </section>

      <section
        v-if="canViewAppointments && snapshot.recent.length"
        class="clinic-messages-client__section"
      >
        <h3 class="clinic-messages-client__heading">
          {{ t('clientOverviewLastVisit') }}
        </h3>
        <article
          v-for="row in snapshot.recent"
          :key="`re-${row.id}`"
          class="clinic-messages-client__appt"
        >
          <div class="clinic-messages-client__appt-when">
            {{ row.when }}
          </div>
          <div
            v-if="row.service"
            class="clinic-messages-client__line"
          >
            {{ row.service }}
          </div>
          <div
            v-if="row.clinician"
            class="clinic-messages-client__hint"
          >
            {{ row.clinician }}
          </div>
        </article>
      </section>
    </template>
  </aside>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useClinicMessageClientPanel } from
  'src/composables/useClinicMessageClientPanel.js'
import { clinicMessagesTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  clientNumber: { type: String, default: '' },
  fallbackName: { type: String, default: '' },
})

const { t } = useI18n()
const router = useRouter()
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
