import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { calendarSourceIds } from 'src/constants/calendar.js'
import { listAppointmentClinicians } from 'src/utils/appointment-api.js'
import {
  getClinicianCheckboxColor,
} from 'src/utils/calendar-clinician-colors.js'
import { useCalendarPermissions } from
  'src/composables/useCalendarPermissions.js'

export function useCalendarEventSources() {
  const { t } = useI18n()
  const { canSelectClinicianSources } = useCalendarPermissions()
  const cliniciansLoading = ref(false)
  const clinicianOptions = ref([])
  const enabledSourceIds = ref([
    calendarSourceIds.myAppointments,
  ])
  const enabledClinicianIds = ref([])

  const sourceDefinitions = computed(() => [
    {
      id: calendarSourceIds.myAppointments,
      label: t('calendarSourceMyAppointments'),
      description: t('calendarSourceMyAppointmentsHint'),
      icon: 'event',
      available: true,
      toggleColor: 'positive',
    },
    {
      id: calendarSourceIds.followUps,
      label: t('calendarSourceFollowUps'),
      description: t('calendarSourceComingSoon'),
      icon: 'follow_the_signs',
      available: false,
    },
    {
      id: calendarSourceIds.tasks,
      label: t('calendarSourceTasks'),
      description: t('calendarSourceComingSoon'),
      icon: 'task_alt',
      available: false,
    },
  ])

  const activeSourceDefinitions = computed(() =>
    sourceDefinitions.value.filter(source => source.available),
  )

  const clinicians = computed(() =>
    clinicianOptions.value.map(option => ({
      ...option,
      checkboxColor: getClinicianCheckboxColor(option.value),
    })),
  )

  function isSourceEnabled(sourceId) {
    return enabledSourceIds.value.includes(sourceId)
  }

  function setSourceEnabled(sourceId, enabled) {
    const current = new Set(enabledSourceIds.value)
    if (enabled) {
      current.add(sourceId)
    } else {
      current.delete(sourceId)
    }
    enabledSourceIds.value = [...current]
  }

  function toggleSource(sourceId) {
    setSourceEnabled(sourceId, !isSourceEnabled(sourceId))
  }

  async function loadClinicianOptions() {
    if (!canSelectClinicianSources.value) {
      clinicianOptions.value = []
      enabledClinicianIds.value = []

      return
    }

    cliniciansLoading.value = true
    try {
      const options = await listAppointmentClinicians()
      clinicianOptions.value = options
      const knownIds = new Set(
        options.map(option => option.value).filter(value => value != null),
      )
      const retained = enabledClinicianIds.value.filter(id => knownIds.has(id))
      enabledClinicianIds.value = retained.length
        ? retained
        : [...knownIds]
    } finally {
      cliniciansLoading.value = false
    }
  }

  function setEnabledClinicianIds(ids) {
    enabledClinicianIds.value = [...(ids ?? [])]
  }

  function toggleClinicianEnabled(clinicianId, enabled) {
    const current = new Set(enabledClinicianIds.value)
    if (enabled) {
      current.add(clinicianId)
    } else {
      current.delete(clinicianId)
    }
    enabledClinicianIds.value = [...current]
  }

  return {
    sourceDefinitions,
    activeSourceDefinitions,
    enabledSourceIds,
    enabledClinicianIds,
    clinicians,
    cliniciansLoading,
    isSourceEnabled,
    setSourceEnabled,
    toggleSource,
    loadClinicianOptions,
    setEnabledClinicianIds,
    toggleClinicianEnabled,
  }
}
