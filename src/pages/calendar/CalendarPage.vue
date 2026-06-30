<template>
  <q-page
    class="admin-page calendar-page fit"
    :data-testid="calendarTestIds.page">
    <AppLoadingOverlay
      scope="content"
      :showing="loading"
      :message="t('appLoading')"
    />

    <div class="calendar-page__shell">
      <header class="calendar-page__header row no-wrap items-start">
        <div class="calendar-page__intro">
          <h1 class="calendar-page__title">{{ t('calendarPageTitle') }}</h1>
          <p class="calendar-page__subtitle">{{ t('calendarPageSubtitle') }}</p>
        </div>

        <div class="calendar-page__toolbar-wrap col">
          <CalendarToolbar
            :title="toolbarTitle"
            :view-mode="viewMode"
            :can-book-appointment="canBookAppointment"
            @today="goToToday"
            @prev="shiftVisibleRange(-1)"
            @next="shiftVisibleRange(1)"
            @update:view-mode="onViewModeChange"
            @add-appointment="openBookDialog"
          />
        </div>
      </header>

      <div class="calendar-page__body row no-wrap">
        <CalendarSidebar
          class="calendar-page__sidebar"
          :sidebar-month-key="sidebarMonthKey"
          :focus-day-key="focusDayKey"
          :time-zone="timeZone"
          :event-day-keys="eventDayKeys"
          :sources="activeSourceDefinitions"
          :enabled-source-ids="enabledSourceIds"
          :enabled-clinician-ids="enabledClinicianIds"
          :clinicians="clinicians"
          :clinicians-loading="cliniciansLoading"
          :can-select-clinicians="canSelectClinicianSources"
          @select-day="onSidebarSelectDay"
          @prev-month="shiftSidebarMonth(-1)"
          @next-month="shiftSidebarMonth(1)"
          @toggle-source="onToggleSource"
          @toggle-clinician="onToggleClinician"
        />

        <section class="calendar-page__main col">
          <q-banner
            v-if="loadError"
            dense
            rounded
            class="bg-negative text-white q-mb-md">
            {{ loadErrorLabel }}
          </q-banner>

          <CalendarMonthView
            v-if="viewMode === calendarViewModes.month"
            :focus-day-key="focusDayKey"
            :time-zone="timeZone"
            :events-by-day="eventsByDay"
            @select-day="onSelectDay"
            @select-event="openEventDetail"
          />
          <CalendarWeekView
            v-else-if="viewMode === calendarViewModes.week"
            :week-day-keys="weekDayKeys"
            :time-zone="timeZone"
            :events-by-day="eventsByDay"
            :scroll-to-now-key="scrollToNowKey"
            :can-book-appointment="canBookAppointment"
            @select-day="onSelectDay"
            @select-event="openEventDetail"
            @book-time="onBookTime"
          />
          <CalendarDayView
            v-else-if="viewMode === calendarViewModes.day"
            :focus-day-key="focusDayKey"
            :time-zone="timeZone"
            :events-by-day="eventsByDay"
            :scroll-to-now-key="scrollToNowKey"
            :can-book-appointment="canBookAppointment"
            @select-day="onSelectDay"
            @select-event="openEventDetail"
            @book-time="onBookTime"
          />
          <CalendarAgendaView
            v-else
            :start-day-key="visibleRange.startDayKey"
            :end-day-key="visibleRange.endDayKey"
            :time-zone="timeZone"
            :events-by-day="eventsByDay"
            @select-day="onSelectDay"
            @select-event="openEventDetail"
          />
        </section>
      </div>
    </div>

    <AppointmentDetailDialog
      v-model="detailOpen"
      :record="selectedEvent?.appointment ?? null"
    />

    <AppointmentBookDialog
      v-model="bookDialogOpen"
      mode="book"
      :saving="bookSaving"
      :booking-hint="bookHint"
      @booked="onBookAppointment"
      @cancel="onBookDialogCancel"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import AppointmentBookDialog from 'components/AppointmentBookDialog.vue'
import AppointmentDetailDialog from 'components/AppointmentDetailDialog.vue'
import CalendarAgendaView from 'components/calendar/CalendarAgendaView.vue'
import CalendarDayView from 'components/calendar/CalendarDayView.vue'
import CalendarMonthView from 'components/calendar/CalendarMonthView.vue'
import CalendarSidebar from 'components/calendar/CalendarSidebar.vue'
import CalendarToolbar from 'components/calendar/CalendarToolbar.vue'
import CalendarWeekView from 'components/calendar/CalendarWeekView.vue'
import { calendarViewModes } from 'src/constants/calendar.js'
import { useAppointmentCalendar } from
  'src/composables/useAppointmentCalendar.js'
import { useCalendarPermissions } from
  'src/composables/useCalendarPermissions.js'
import {
  bookAppointment,
  extractBookingConflicts,
} from 'src/utils/appointment-api.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { calendarTestIds } from 'src/test-ids/index.js'

const { t } = useI18n()
const $q = useQuasar()
const { canSelectClinicianSources, canBookAppointment } =
  useCalendarPermissions()

const bookDialogOpen = ref(false)
const bookSaving = ref(false)
const bookHint = ref(null)

const {
  timeZone,
  viewMode,
  focusDayKey,
  sidebarMonthKey,
  loading,
  loadError,
  eventsByDay,
  eventDayKeys,
  weekDayKeys,
  toolbarTitle,
  visibleRange,
  sources: calendarSources,
  selectedEvent,
  detailOpen,
  goToToday,
  shiftVisibleRange,
  setViewMode,
  setFocusDay,
  shiftSidebarMonth,
  openEventDetail,
  reloadEvents,
  scrollToNowKey,
} = useAppointmentCalendar()

const {
  activeSourceDefinitions,
  enabledSourceIds,
  enabledClinicianIds,
  clinicians,
  cliniciansLoading,
  setSourceEnabled,
  toggleClinicianEnabled,
  loadClinicianOptions,
} = calendarSources

const loadErrorLabel = computed(() => {
  if (!loadError.value) {
    return ''
  }
  if (loadError.value === 'calendarLoadError') {
    return t('calendarLoadError')
  }

  return String(loadError.value)
})

function onViewModeChange(mode) {
  setViewMode(mode)
}

function onSelectDay(dayKey) {
  setFocusDay(dayKey)
  if (viewMode.value === calendarViewModes.month) {
    setViewMode(calendarViewModes.day)
  }
}

function onSidebarSelectDay(dayKey) {
  setFocusDay(dayKey)
}

function onToggleSource(sourceId, enabled) {
  setSourceEnabled(sourceId, enabled)
}

function onToggleClinician(clinicianId, enabled) {
  toggleClinicianEnabled(clinicianId, enabled)
}

function openBookDialog(hint = null) {
  bookHint.value = hint
  bookDialogOpen.value = true
}

function onBookTime(hint) {
  openBookDialog(hint)
}

function onBookDialogCancel() {
  bookDialogOpen.value = false
  bookHint.value = null
}

async function onBookAppointment(body) {
  bookSaving.value = true
  try {
    const result = await bookAppointment(body)
    bookDialogOpen.value = false
    bookHint.value = null
    const message = result.appointments?.length
      ? t('appointmentBookSeriesSuccess', {
        count: result.appointments.length,
      })
      : t('appointmentBookSuccess')
    $q.notify({ type: 'positive', message })
    await reloadEvents()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      const conflicts = extractBookingConflicts(error)
      $q.notify({
        type: 'negative',
        message: conflicts.length
          ? t('appointmentBookingConflict')
          : t('appointmentBookError'),
      })
    }
  } finally {
    bookSaving.value = false
  }
}

onMounted(() => {
  void loadClinicianOptions()
})
</script>
