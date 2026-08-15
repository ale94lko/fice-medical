<template>
  <template v-if="asOverflowItem">
    <q-item
      v-if="show && hasActiveEncounter"
      v-close-popup
      clickable
      :disable="loading || busy"
      :data-testid="encounterTestIds.openActive"
      @click="emit('open-active')">
      <q-item-section avatar>
        <q-icon
          name="medical_services"
          size="20px"
          color="primary"
        />
      </q-item-section>
      <q-item-section>
        <q-item-label>
          {{ t('startEncounterButton') }}
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item
      v-else-if="show"
      clickable
      :disable="loading || busy"
      :data-testid="encounterTestIds.startButton">
      <q-item-section avatar>
        <q-icon
          name="medical_services"
          size="20px"
          color="primary"
        />
      </q-item-section>
      <q-item-section>
        <q-item-label>
          {{ t('startEncounterButton') }}
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-icon name="chevron_right" size="18px" />
      </q-item-section>
      <q-menu
        anchor="top end"
        self="top start"
        :offset="[8, 0]"
        class="app-light-menu"
        @before-show="onBeforeShow">
        <StartEncounterMenuList
          :static-type-options="staticTypeOptions"
          :loading-appointments="loadingAppointments"
          :appointments-error="appointmentsError"
          :today-appointments="todayAppointments"
          @select="onMenuSelect"
        />
      </q-menu>
    </q-item>
  </template>
  <q-btn
    v-else-if="show && hasActiveEncounter"
    no-caps
    unelevated
    class="app-btn-primary client-overview-alt-header__start-encounter"
    icon="medical_services"
    :label="t('startEncounterButton')"
    :disable="loading || busy"
    :data-testid="encounterTestIds.openActive"
    @click="emit('open-active')"
  />
  <q-btn-dropdown
    v-else-if="show"
    no-caps
    unelevated
    class="app-btn-primary client-overview-alt-header__start-encounter"
    icon="medical_services"
    :label="t('startEncounterButton')"
    :disable="loading || busy"
    :loading="busy"
    :data-testid="encounterTestIds.startButton"
    menu-anchor="bottom end"
    menu-self="top end"
    @before-show="onBeforeShow">
    <StartEncounterMenuList
      :static-type-options="staticTypeOptions"
      :loading-appointments="loadingAppointments"
      :appointments-error="appointmentsError"
      :today-appointments="todayAppointments"
      @select="onMenuSelect"
    />
  </q-btn-dropdown>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  appointmentStatuses,
  appointmentTerminalStatuses,
  encounterTypes,
} from 'components/constants.js'
import StartEncounterMenuList from
  'components/StartEncounterMenuList.vue'
import { encounterTestIds } from 'src/test-ids/index.js'
import { listClientAppointments } from 'src/utils/appointment-api.js'
import {
  formatUtcTimeRange,
  localDayKeyFromUtc,
  resolveTenantTimeZone,
  todayLocalDayKey,
  utcRangeForLocalDay,
} from 'src/utils/appointment-datetime.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'

const props = defineProps({
  show: { type: Boolean, default: false },
  hasActiveEncounter: { type: Boolean, default: false },
  clientId: { type: [String, Number], default: null },
  loading: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  asOverflowItem: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'open-active'])
const { t } = useI18n()

const loadingAppointments = ref(false)
const appointmentsError = ref(false)
const todayAppointments = ref([])

const staticTypeOptions = computed(() => [
  {
    label: t('encounterTypeWalkIn'),
    hint: t('encounterTypeWalkInHint'),
    value: encounterTypes.walkIn,
    icon: 'directions_walk',
    toneClass: 'start-encounter-menu__icon--walk-in',
  },
  {
    label: t('encounterTypePhone'),
    hint: t('encounterTypePhoneHint'),
    value: encounterTypes.phone,
    icon: 'phone_in_talk',
    toneClass: 'start-encounter-menu__icon--phone',
  },
  {
    label: t('encounterTypeTelehealth'),
    hint: t('encounterTypeTelehealthHint'),
    value: encounterTypes.telehealth,
    icon: 'videocam',
    toneClass: 'start-encounter-menu__icon--telehealth',
  },
])

function appointmentTimeLabel(appt) {
  return formatUtcTimeRange(
    appt.startAtUtc,
    appt.endAtUtc,
    resolveTenantTimeZone(),
  ) || '—'
}

function appointmentMetaLabel(appt) {
  const parts = [
    appt.servicesLabel || appt.appointmentTypeName,
    appt.clinicianDisplayName,
  ].map(part => String(part ?? '').trim()).filter(Boolean)

  return parts.join(' · ')
    || t('encounterTypeScheduledHint')
}

function isSelectableTodayAppointment(appt) {
  const status = String(appt?.status ?? '').toUpperCase()
  if (!appt?.appointmentId || !appt?.startAtUtc) {
    return false
  }
  if (appointmentTerminalStatuses.has(status)) {
    return false
  }
  if (status === appointmentStatuses.rescheduled) {
    return false
  }

  return true
}

async function loadTodayAppointments() {
  const id = String(props.clientId ?? '').trim()
  todayAppointments.value = []
  appointmentsError.value = false
  if (!id) {
    return
  }
  loadingAppointments.value = true
  try {
    const timeZone = resolveTenantTimeZone()
    const dayKey = todayLocalDayKey(timeZone)
    const { fromUtc, toUtc } = utcRangeForLocalDay(dayKey, timeZone)
    const items = await listClientAppointments(id, {
      // eslint-disable-next-line camelcase -- API query params
      from_utc: fromUtc,
      // eslint-disable-next-line camelcase -- API query params
      to_utc: toUtc,
      limit: 50,
    })
    todayAppointments.value = (items ?? [])
      .filter(appt =>
        isSelectableTodayAppointment(appt)
        && localDayKeyFromUtc(appt.startAtUtc, timeZone) === dayKey,
      )
      .map(appt => ({
        ...appt,
        timeLabel: appointmentTimeLabel(appt),
        metaLabel: appointmentMetaLabel(appt),
      }))
      .sort((a, b) =>
        String(a.startAtUtc).localeCompare(String(b.startAtUtc)),
      )
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      appointmentsError.value = true
      todayAppointments.value = []
    }
  } finally {
    loadingAppointments.value = false
  }
}

function onBeforeShow() {
  void loadTodayAppointments()
}

function onMenuSelect(payload) {
  emit('select', payload)
}
</script>
