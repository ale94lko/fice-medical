<template>
  <div class="calendar-agenda-view">
    <div
      v-if="!agendaDays.length"
      class="calendar-agenda-view__empty text-body1 text-grey-7">
      {{ t('calendarAgendaEmpty') }}
    </div>

    <section
      v-for="day in agendaDays"
      :key="day.dayKey"
      class="calendar-agenda-view__day">
      <header class="calendar-agenda-view__day-header">
        <button
          type="button"
          class="calendar-agenda-view__day-title"
          @click="emit('select-day', day.dayKey)">
          {{ day.label }}
        </button>
      </header>

      <div class="calendar-agenda-view__events">
        <button
          v-for="event in day.events"
          :key="event.id"
          type="button"
          class="calendar-agenda-view__event"
          :class="event.statusClass"
          :style="event.colorStyle"
          @click="emit('select-event', event)">
          <span class="calendar-agenda-view__event-time">
            {{ event.timeLabel }}
          </span>
          <span class="calendar-agenda-view__event-body">
            <span class="calendar-agenda-view__event-title">
              {{ event.title }}
            </span>
            <span
              v-if="event.appointment?.clinicianDisplayName"
              class="calendar-agenda-view__event-meta text-grey-7">
              {{ event.appointment.clinicianDisplayName }}
            </span>
          </span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatUtcDateLong } from 'src/utils/appointment-datetime.js'
import { addDaysToDayKey } from 'src/utils/appointment-datetime.js'

const props = defineProps({
  startDayKey: { type: String, default: '' },
  endDayKey: { type: String, default: '' },
  timeZone: { type: String, default: '' },
  eventsByDay: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['select-day', 'select-event'])

const { t } = useI18n()

const agendaDays = computed(() => {
  const days = []
  let cursor = props.startDayKey
  let guard = 0

  while (cursor && cursor <= props.endDayKey && guard < 40) {
    const events = props.eventsByDay?.[cursor] ?? []
    if (events.length) {
      days.push({
        dayKey: cursor,
        label: formatUtcDateLong(`${cursor}T12:00:00.000Z`, props.timeZone),
        events,
      })
    }
    cursor = addDaysToDayKey(cursor, 1)
    guard += 1
  }

  return days
})
</script>
