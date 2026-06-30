<template>
  <div class="calendar-toolbar row items-center q-col-gutter-sm">
    <div class="col-auto row items-center q-gutter-sm">
      <div class="row items-center no-wrap">
        <q-btn
          flat
          round
          dense
          icon="chevron_left"
          :data-testid="calendarTestIds.btnPrev"
          @click="emit('prev')"
        />
        <q-btn
          flat
          round
          dense
          icon="chevron_right"
          :data-testid="calendarTestIds.btnNext"
          @click="emit('next')"
        />
      </div>
      <p class="calendar-toolbar__title q-my-none">
        {{ title }}
      </p>
    </div>

    <div class="col row justify-end items-center q-gutter-sm">
      <q-btn
        v-if="canBookAppointment"
        no-caps
        outline
        color="primary"
        class="app-btn-outline"
        icon="add"
        :label="t('appointmentAddButton')"
        :data-testid="calendarTestIds.btnAddAppointment"
        @click="emit('add-appointment')"
      />
      <q-btn
        no-caps
        outline
        color="primary"
        class="app-btn-outline calendar-toolbar__today"
        :data-testid="calendarTestIds.btnToday"
        :label="t('calendarToday')"
        @click="emit('today')"
      />
      <q-btn-toggle
        :model-value="viewMode"
        no-caps
        unelevated
        toggle-color="primary"
        color="white"
        text-color="primary"
        class="calendar-toolbar__view-toggle"
        :data-testid="calendarTestIds.viewToggle"
        :options="viewOptions"
        @update:model-value="emit('update:viewMode', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { calendarViewModes } from 'src/constants/calendar.js'
import { calendarTestIds } from 'src/test-ids/index.js'

defineProps({
  title: { type: String, default: '' },
  viewMode: { type: String, default: calendarViewModes.week },
  canBookAppointment: { type: Boolean, default: false },
})

const emit = defineEmits([
  'today',
  'prev',
  'next',
  'update:viewMode',
  'add-appointment',
])

const { t } = useI18n()

const viewOptions = computed(() => [
  { label: t('calendarViewMonth'), value: calendarViewModes.month },
  { label: t('calendarViewWeek'), value: calendarViewModes.week },
  { label: t('calendarViewDay'), value: calendarViewModes.day },
  { label: t('calendarViewAgenda'), value: calendarViewModes.agenda },
])
</script>
