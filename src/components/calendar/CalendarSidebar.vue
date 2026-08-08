<template>
  <aside
    class="calendar-sidebar"
    :class="{ 'calendar-sidebar--collapsed': collapsed }">
    <template v-if="!collapsed">
      <CalendarMiniMonth
        :month-key="sidebarMonthKey"
        :selected-day-key="focusDayKey"
        :time-zone="timeZone"
        :event-day-keys="eventDayKeys"
        @select-day="emit('select-day', $event)"
        @prev-month="emit('prev-month')"
        @next-month="emit('next-month')"
      />

      <q-separator class="q-my-md" />
    </template>

    <CalendarSourcePanel
      :collapsed="collapsed"
      :sources="sources"
      :enabled-source-ids="enabledSourceIds"
      :enabled-clinician-ids="enabledClinicianIds"
      :clinicians="clinicians"
      :clinicians-loading="cliniciansLoading"
      :can-select-clinicians="canSelectClinicians"
      @toggle-source="(...args) => emit('toggle-source', ...args)"
      @toggle-clinician="(...args) => emit('toggle-clinician', ...args)"
    />
  </aside>
</template>

<script setup>
import CalendarMiniMonth from 'components/calendar/CalendarMiniMonth.vue'
import CalendarSourcePanel from 'components/calendar/CalendarSourcePanel.vue'

defineProps({
  collapsed: { type: Boolean, default: false },
  sidebarMonthKey: { type: String, default: '' },
  focusDayKey: { type: String, default: '' },
  timeZone: { type: String, default: '' },
  eventDayKeys: { type: Array, default: () => [] },
  sources: { type: Array, default: () => [] },
  enabledSourceIds: { type: Array, default: () => [] },
  enabledClinicianIds: { type: Array, default: () => [] },
  clinicians: { type: Array, default: () => [] },
  cliniciansLoading: { type: Boolean, default: false },
  canSelectClinicians: { type: Boolean, default: false },
})

const emit = defineEmits([
  'select-day',
  'prev-month',
  'next-month',
  'toggle-source',
  'toggle-clinician',
])
</script>
