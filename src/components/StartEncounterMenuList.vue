<template>
  <q-list
    class="start-encounter-menu"
    :class="{
      'start-encounter-menu--dialog': layout === 'dialog',
    }"
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
          · {{ appt.timeLabel }}
        </q-item-label>
        <q-item-label caption>
          {{ appt.metaLabel }}
        </q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { encounterTypes } from 'components/constants.js'
import { encounterTestIds } from 'src/test-ids/index.js'

defineProps({
  staticTypeOptions: {
    type: Array,
    default: () => [],
  },
  loadingAppointments: {
    type: Boolean,
    default: false,
  },
  appointmentsError: {
    type: Boolean,
    default: false,
  },
  todayAppointments: {
    type: Array,
    default: () => [],
  },
  layout: {
    type: String,
    default: 'menu',
    validator: value => ['menu', 'dialog'].includes(value),
  },
})

const emit = defineEmits(['select'])
const { t } = useI18n()

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

  &--dialog {
    min-width: 0;
    max-width: none;
    width: 100%;

    :deep(.q-item__label),
    :deep(.q-item__label--caption) {
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
  }
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
