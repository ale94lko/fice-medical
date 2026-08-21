import { computed, ref, toValue, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useActiveEncounter } from
  'src/composables/useActiveEncounter.js'
import { useClientAppointmentPermissions } from
  'src/composables/useClientAppointmentPermissions.js'
import { isAuthSessionEndUIError } from
  'src/utils/api-session-error.js'
import { mapAppointmentsList } from
  'src/utils/appointment-normalize.js'
import { buildClientOverviewHeaderData } from
  'src/utils/client-overview-header-data.js'
import { buildClinicMessageClientSnapshot } from
  'src/utils/clinic-message-client-context.js'
import { useSiteStore } from 'src/stores/site-store.js'

function clientKey(value) {
  return String(toValue(value) ?? '').trim()
}

function appointmentsFromClient(raw) {
  if (!raw || typeof raw !== 'object') {
    return []
  }

  return mapAppointmentsList(
    raw.appointments ?? raw.client_appointments ?? [],
  )
}

export function useClinicMessageClientPanel(clientNumberRef) {
  const { t } = useI18n()
  const siteStore = useSiteStore()
  const { canViewAppointments } = useClientAppointmentPermissions()
  const loadError = ref(false)
  const loading = ref(false)
  const form = ref(null)
  const rawClient = ref(null)
  const appointments = ref([])
  const clientId = computed(() => clientKey(clientNumberRef))
  const {
    activeEncounter,
    hasActiveEncounter,
    canViewEncounter,
  } = useActiveEncounter(clientId)

  const header = computed(() => {
    if (!form.value) {
      return null
    }

    return buildClientOverviewHeaderData(form.value, {
      rawClient: rawClient.value,
      appointments: appointments.value,
      t,
    })
  })

  const snapshot = computed(() =>
    buildClinicMessageClientSnapshot({
      form: form.value,
      header: header.value,
      appointments: appointments.value,
      t,
    }),
  )

  function reset() {
    form.value = null
    rawClient.value = null
    appointments.value = []
    loadError.value = false
  }

  async function loadClient(id) {
    if (!id) {
      reset()
      loading.value = false

      return
    }
    reset()
    loading.value = true
    loadError.value = false
    try {
      const mapped = await siteStore.buildEditFormForClient(id)
      if (clientKey(clientNumberRef) !== id) {
        return
      }
      form.value = mapped
      rawClient.value = siteStore.clientListSourceById[id] ?? null
      appointments.value = canViewAppointments.value
        ? appointmentsFromClient(rawClient.value)
        : []
    } catch (error) {
      if (clientKey(clientNumberRef) !== id) {
        return
      }
      if (!isAuthSessionEndUIError(error)) {
        reset()
        loadError.value = true
      }
    } finally {
      if (clientKey(clientNumberRef) === id) {
        loading.value = false
      }
    }
  }

  watch(
    clientId,
    (id) => {
      void loadClient(id)
    },
    { immediate: true },
  )

  return {
    loading,
    loadError,
    header,
    snapshot,
    canViewAppointments,
    canViewEncounter,
    hasActiveEncounter,
    activeEncounter,
  }
}
