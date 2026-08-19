import { computed, ref, unref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAddClientCatalogs } from
  'src/composables/useAddClientCatalogs.js'
import { useActiveEncounter } from
  'src/composables/useActiveEncounter.js'
import { useClientAppointmentPermissions } from
  'src/composables/useClientAppointmentPermissions.js'
import { isAuthSessionEndUIError } from
  'src/utils/api-session-error.js'
import { listClientAppointments } from
  'src/utils/appointment-api.js'
import { buildClientOverviewHeaderData } from
  'src/utils/client-overview-header-data.js'
import { buildClinicMessageClientSnapshot } from
  'src/utils/clinic-message-client-context.js'
import { useSiteStore } from 'src/stores/site-store.js'

function clientKey(value) {
  return String(unref(value) ?? '').trim()
}

export function useClinicMessageClientPanel(clientNumberRef) {
  const { t } = useI18n()
  const siteStore = useSiteStore()
  const catalogs = useAddClientCatalogs(t)
  const { canViewAppointments } = useClientAppointmentPermissions()
  const loading = ref(false)
  const loadError = ref(false)
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
      clinicianOptions: catalogs.assignedClinicianSelectOptions.value,
      raceSelectOptions: catalogs.raceSelectOptions.value,
      ethnicitySelectOptions: catalogs.ethnicitySelectOptions.value,
      preferredLanguageSelectOptions:
        catalogs.preferredLanguageOptions.value,
      prefixSelectOptions: catalogs.prefixSelectOptions.value,
      suffixSelectOptions: catalogs.suffixSelectOptions.value,
      genderSelectOptions: catalogs.genderOptions.value,
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

  function mapOptions() {
    return {
      resolveCatalogSelectValue: catalogs.resolveCatalogSelectValue,
      prefixSelectOptions: catalogs.prefixSelectOptions.value,
      suffixSelectOptions: catalogs.suffixSelectOptions.value,
      raceSelectOptions: catalogs.raceSelectOptions.value,
      ethnicitySelectOptions: catalogs.ethnicitySelectOptions.value,
      genderSelectOptions: catalogs.genderOptions.value,
      preferredLanguageSelectOptions:
        catalogs.preferredLanguageOptions.value,
      contactTypeSelectOptions:
        catalogs.contactTypeSelectOptions.value,
      relationshipTypeSelectOptions:
        catalogs.relationshipTypeSelectOptions.value,
    }
  }

  async function ensureCatalogs() {
    if (!catalogs.loaded.value) {
      await catalogs.loadBasicInfoCatalogs()
    }
    if (!catalogs.cliniciansLoaded.value) {
      await catalogs.loadCliniciansForAddClient()
    }
  }

  async function loadAppointments(id) {
    if (!canViewAppointments.value) {
      appointments.value = []

      return
    }
    try {
      appointments.value = await listClientAppointments(id)
    } catch (error) {
      if (!isAuthSessionEndUIError(error)) {
        appointments.value = []
      }
    }
  }

  function reset() {
    form.value = null
    rawClient.value = null
    appointments.value = []
    loadError.value = false
  }

  async function loadClient(id) {
    if (!id) {
      reset()

      return
    }
    loading.value = true
    loadError.value = false
    try {
      await ensureCatalogs()
      form.value = await siteStore.buildEditFormForClient(
        id,
        mapOptions(),
      )
      rawClient.value = siteStore.clientListSourceById[id] ?? null
      await loadAppointments(id)
    } catch (error) {
      if (!isAuthSessionEndUIError(error)) {
        reset()
        loadError.value = true
      }
    } finally {
      loading.value = false
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
