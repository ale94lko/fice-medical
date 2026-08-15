<template>
  <!-- Dialog host: stays mounted outside q-menu -->
  <q-dialog
    v-if="dialogHost"
    v-model="dialogOpenModel"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog app-dialog-card
        start-encounter-dialog"
      :data-testid="encounterTestIds.startDialog">
      <AppDialogHeader @close="closeDialog">
        {{ t('startEncounterButton') }}
      </AppDialogHeader>
      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <StartEncounterMenuList
          layout="dialog"
          :static-type-options="staticTypeOptions"
          :loading-appointments="loadingAppointments"
          :appointments-error="appointmentsError"
          :today-appointments="todayAppointments"
          @select="onDialogSelect"
        />
      </q-card-section>
    </q-card>
  </q-dialog>

  <template v-else-if="asOverflowItem">
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
      v-close-popup
      clickable
      :disable="loading || busy"
      :data-testid="encounterTestIds.startButton"
      @click="emit('request-dialog')">
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
  <q-btn
    v-else-if="show && isMobile"
    no-caps
    unelevated
    class="app-btn-primary client-overview-alt-header__start-encounter"
    icon="medical_services"
    :label="t('startEncounterButton')"
    :disable="loading || busy"
    :loading="busy"
    :data-testid="encounterTestIds.startButton"
    @click="openSelfDialog"
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

  <!-- Standalone mobile button owns its dialog -->
  <q-dialog
    v-if="!dialogHost && !asOverflowItem"
    v-model="selfDialogOpen"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog app-dialog-card
        start-encounter-dialog"
      :data-testid="encounterTestIds.startDialog">
      <AppDialogHeader @close="selfDialogOpen = false">
        {{ t('startEncounterButton') }}
      </AppDialogHeader>
      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <StartEncounterMenuList
          layout="dialog"
          :static-type-options="staticTypeOptions"
          :loading-appointments="loadingAppointments"
          :appointments-error="appointmentsError"
          :today-appointments="todayAppointments"
          @select="onSelfDialogSelect"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  appointmentStatuses,
  appointmentTerminalStatuses,
  encounterTypes,
} from 'components/constants.js'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import StartEncounterMenuList from
  'components/StartEncounterMenuList.vue'
import { useViewportLayout } from 'src/composables/useViewportLayout.js'
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
  /** Renders only the dialog; keep mounted outside q-menu. */
  dialogHost: { type: Boolean, default: false },
  dialogOpen: { type: Boolean, default: false },
})

const emit = defineEmits([
  'select',
  'open-active',
  'request-dialog',
  'update:dialogOpen',
])
const { t } = useI18n()
const { isMobile } = useViewportLayout()

const selfDialogOpen = ref(false)
const loadingAppointments = ref(false)
const appointmentsError = ref(false)
const todayAppointments = ref([])

const dialogOpenModel = computed({
  get: () => props.dialogOpen,
  set: value => emit('update:dialogOpen', value),
})

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

watch(
  () => props.dialogOpen,
  open => {
    if (props.dialogHost && open) {
      onBeforeShow()
    }
  },
)

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

function openSelfDialog() {
  selfDialogOpen.value = true
  onBeforeShow()
}

function closeDialog() {
  dialogOpenModel.value = false
}

function onMenuSelect(payload) {
  emit('select', payload)
}

function onDialogSelect(payload) {
  closeDialog()
  emit('select', payload)
}

function onSelfDialogSelect(payload) {
  selfDialogOpen.value = false
  emit('select', payload)
}
</script>
