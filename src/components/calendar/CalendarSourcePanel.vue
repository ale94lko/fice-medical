<template>
  <div class="calendar-source-panel">
    <p class="calendar-source-panel__title text-subtitle2 q-mb-sm">
      {{ t('calendarSourcesTitle') }}
    </p>

    <div
      v-for="source in sources"
      :key="source.id"
      class="calendar-source-panel__item q-mb-md">
      <FormToggle
        :model-value="isEnabled(source.id)"
        :disable="!source.available"
        :label="source.label"
        :color="source.toggleColor || 'primary'"
        @update:model-value="emit('toggle-source', source.id, $event)"
      />
      <p
        v-if="source.description"
        class="text-caption text-grey-7 q-mt-xs q-mb-none q-ml-xl">
        {{ source.description }}
      </p>
    </div>

    <CalendarClinicianList
      v-if="canSelectClinicians"
      class="q-mt-md"
      :clinicians="clinicians"
      :enabled-ids="enabledClinicianIds"
      :loading="cliniciansLoading"
      @toggle="(...args) => emit('toggle-clinician', ...args)"
    />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import CalendarClinicianList from
  'components/calendar/CalendarClinicianList.vue'
import FormToggle from 'components/FormToggle.vue'

const props = defineProps({
  sources: { type: Array, default: () => [] },
  enabledSourceIds: { type: Array, default: () => [] },
  enabledClinicianIds: { type: Array, default: () => [] },
  clinicians: { type: Array, default: () => [] },
  cliniciansLoading: { type: Boolean, default: false },
  canSelectClinicians: { type: Boolean, default: false },
})

const emit = defineEmits([
  'toggle-source',
  'toggle-clinician',
])

const { t } = useI18n()

function isEnabled(sourceId) {
  return props.enabledSourceIds.includes(sourceId)
}
</script>
