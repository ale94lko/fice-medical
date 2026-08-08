<template>
  <div
    class="calendar-clinician-list"
    :class="{ 'calendar-clinician-list--compact': compact }">
    <p
      v-if="!compact"
      class="calendar-clinician-list__title text-subtitle2 q-mb-sm">
      {{ t('calendarCliniciansTitle') }}
    </p>

    <q-inner-loading :showing="loading" />

    <p
      v-if="!compact && !loading && !clinicians.length"
      class="text-caption text-grey-7 q-mb-none">
      {{ t('calendarCliniciansEmpty') }}
    </p>

    <label
      v-for="clinician in clinicians"
      :key="clinician.value"
      class="calendar-clinician-list__row"
      :style="checkboxStyle(clinician.checkboxColor)">
      <q-checkbox
        :model-value="isEnabled(clinician.value)"
        dense
        class="calendar-clinician-list__checkbox"
        :aria-label="clinician.label"
        :data-testid="calendarTestIds.clinicianToggle(clinician.value)"
        @update:model-value="emit('toggle', clinician.value, $event)"
      />
      <span
        v-if="!compact"
        class="calendar-clinician-list__label">
        {{ clinician.label }}
      </span>
      <q-tooltip
        v-if="compact"
        class="app-info-tooltip"
        anchor="center right"
        self="center left"
        :offset="[8, 0]">
        {{ clinician.label }}
      </q-tooltip>
    </label>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { calendarTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  clinicians: { type: Array, default: () => [] },
  enabledIds: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle'])

const { t } = useI18n()

function isEnabled(clinicianId) {
  return props.enabledIds.includes(clinicianId)
}

function checkboxStyle(color) {
  return {
    '--calendar-clinician-color': color,
  }
}
</script>
