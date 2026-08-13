<template>
  <q-btn-dropdown
    v-if="show"
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
    <q-list
      class="start-encounter-menu"
      :data-testid="encounterTestIds.startMenu">
      <q-item
        v-for="opt in staticTypeOptions"
        :key="opt.value"
        v-close-popup
        clickable
        :data-testid="encounterTestIds.field(`menu-type-${opt.value}`)"
        @click="emitSelect(opt.value)">
        <q-item-section avatar>
          <div
            class="start-encounter-menu__icon"
            :class="opt.toneClass">
            <q-icon :name="opt.icon" size="20px" />
          </div>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ opt.label }}</q-item-label>
          <q-item-label caption>
            {{ opt.hint }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-separator class="q-my-xs" />

      <q-item-label
        header
        class="start-encounter-menu__section">
        {{ t('encounterTypeScheduled') }}
      </q-item-label>

      <q-item v-if="loadingAppointments">
        <q-item-section class="text-grey-7">
          {{ t('startEncounterAppointmentsLoading') }}
        </q-item-section>
      </q-item>
      <q-item v-else-if="appointmentsError">
        <q-item-section class="text-negative">
          {{ t('startEncounterAppointmentsError') }}
        </q-item-section>
      </q-item>
      <q-item v-else-if="!todayAppointments.length" disable>
        <q-item-section avatar>
          <div
            class="start-encounter-menu__icon
              start-encounter-menu__icon--scheduled">
            <q-icon name="event_available" size="20px" />
          </div>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ t('encounterTypeScheduled') }}</q-item-label>
          <q-item-label caption>
            {{ t('startEncounterAppointmentsEmpty') }}
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item
        v-for="appt in todayAppointments"
        :key="appt.appointmentId"
        v-close-popup
        clickable
        :data-testid="encounterTestIds.field(
          `menu-appointment-${appt.appointmentId}`,
        )"
        @click="emitSelect(
          encounterTypes.scheduled,
          appt.appointmentId,
        )">
        <q-item-section avatar>
          <div
            class="start-encounter-menu__icon
              start-encounter-menu__icon--scheduled">
            <q-icon name="event_available" size="20px" />
          </div>
        </q-item-section>
        <q-item-section>
          <q-item-label>
            {{ t('encounterTypeScheduled') }}
            · {{ appointmentTimeLabel(appt) }}
          </q-item-label>
          <q-item-label caption>
            {{ appointmentMetaLabel(appt) }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
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
  clientId: { type: [String, Number], default: null },
  loading: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])
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

function emitSelect(encounterType, appointmentId = null) {
  emit('select', {
    encounterType,
    appointmentId,
  })
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables.scss';

.start-encounter-menu {
  min-width: 320px;
  max-width: 380px;
}

.start-encounter-menu__section {
  padding-top: 4px;
  padding-bottom: 0;
  color: $text-muted;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.start-encounter-menu__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;

  &--walk-in {
    background: rgba($primary, 0.12);
    color: $primary;
  }

  &--phone {
    background: rgba($info, 0.12);
    color: $info;
  }

  &--telehealth {
    background: rgba($accent, 0.14);
    color: $fice-teal-dark;
  }

  &--scheduled {
    background: rgba($positive, 0.14);
    color: $positive;
  }
}
</style>
