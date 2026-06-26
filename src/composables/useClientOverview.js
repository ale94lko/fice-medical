import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useSiteStore } from 'src/stores/site-store.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { storeToRefs } from 'pinia'
import { useAddClientCatalogs } from 'src/composables/useAddClientCatalogs.js'
import { filterOverviewModulesByPermissions } from
  'src/utils/client-overview-modules.js'
import {
  buildClientOverviewActivity,
  buildClientOverviewHeaderData,
  buildClientOverviewMissingItems,
  buildClientOverviewModuleSummaries,
  buildClientOverviewSidebar,
  summaryForModule,
} from 'src/utils/client-overview-data.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { quasarNotifyTypes } from 'components/constants.js'

export function useClientOverview(clientId) {
  const { t } = useI18n()
  const $q = useQuasar()
  const siteStore = useSiteStore()
  const authStore = useAuthStore()
  const { permissions } = storeToRefs(authStore)
  const catalogs = useAddClientCatalogs(t)

  const loading = ref(false)
  const form = ref(null)
  const rawClient = ref(null)
  const summaries = ref({})

  const visibleModules = computed(() =>
    filterOverviewModulesByPermissions(permissions.value),
  )

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
      resolveCatalogSelectValue: catalogs.resolveCatalogSelectValue,
      appointments: summaries.value.appointmentsRaw ?? [],
      t,
    })
  })

  const sidebar = computed(() => {
    if (!form.value) {
      return null
    }

    return buildClientOverviewSidebar(
      form.value,
      t,
      {
        nextAppointment: header.value?.nextAppointment?.dateTime ?? '',
        lastVisit: header.value?.lastVisit?.date ?? '',
      },
    )
  })

  const missingItems = computed(() => {
    if (!form.value) {
      return []
    }

    return buildClientOverviewMissingItems(form.value, t)
  })

  const activityItems = computed(() =>
    buildClientOverviewActivity(summaries.value, t),
  )

  const moduleCards = computed(() =>
    visibleModules.value.map(module => ({
      ...module,
      summary: summaryForModule(summaries.value, module),
    })),
  )

  function getClientMapOptions() {
    return {
      resolveCatalogSelectValue: catalogs.resolveCatalogSelectValue,
      prefixSelectOptions: catalogs.prefixSelectOptions.value,
      suffixSelectOptions: catalogs.suffixSelectOptions.value,
      raceSelectOptions: catalogs.raceSelectOptions.value,
      ethnicitySelectOptions: catalogs.ethnicitySelectOptions.value,
      genderSelectOptions: catalogs.genderOptions.value,
      preferredLanguageSelectOptions:
        catalogs.preferredLanguageOptions.value,
      contactTypeSelectOptions: catalogs.contactTypeSelectOptions.value,
      relationshipTypeSelectOptions:
        catalogs.relationshipTypeSelectOptions.value,
    }
  }

  async function loadOverview() {
    const id = String(clientId.value ?? '').trim()
    if (!id) {
      return
    }

    loading.value = true
    try {
      await catalogs.loadBasicInfoCatalogs()
      await catalogs.loadCliniciansForAddClient()
      form.value = await siteStore.buildEditFormForClient(
        id,
        getClientMapOptions(),
      )
      rawClient.value = siteStore.clientListSourceById[id] ?? null
      summaries.value = buildClientOverviewModuleSummaries(
        form.value,
        rawClient.value,
        t,
      )
    } catch (error) {
      if (!isAuthSessionEndUIError(error)) {
        const msg = error?.response?.data?.message
          || error?.message
          || t('clientOverviewLoadError')
        $q.notify({
          type: quasarNotifyTypes.negative,
          message: String(msg),
          position: 'top',
        })
      }
      throw error
    } finally {
      loading.value = false
    }
  }

  watch(clientId, () => {
    loadOverview().catch(() => {})
  }, { immediate: true })

  return {
    loading,
    header,
    sidebar,
    missingItems,
    activityItems,
    moduleCards,
    loadOverview,
  }
}
