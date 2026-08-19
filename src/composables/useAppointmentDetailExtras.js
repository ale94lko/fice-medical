import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  clientFieldKeys as ck,
  clientFormSections,
  clientGenderValues,
} from 'components/constants.js'
import { useAddClientCatalogs } from
  'src/composables/useAddClientCatalogs.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { useSiteStore } from 'src/stores/site-store.js'
import { fetchAppointment } from 'src/utils/appointment-api.js'
import {
  appointmentClientInitials,
  appointmentLocationFromSubtenant,
  formatAppointmentDobAge,
  formatInsurancePayer,
  insuranceServiceId,
  isInsuranceSubscriberOther,
  pickAppointmentInsurance,
} from 'src/utils/appointment-detail-display.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { clientChartKey } from 'components/helpers.js'
import { buildClientOverviewHeaderData } from
  'src/utils/client-overview-header-data.js'

export function useAppointmentDetailExtras(openRef, recordRef) {
  const { t } = useI18n()
  const siteStore = useSiteStore()
  const authStore = useAuthStore()
  const catalogs = useAddClientCatalogs(t)
  const detailRecord = ref(null)
  const clientForm = ref(null)
  const loading = ref(false)
  let requestId = 0

  const clientChartId = computed(() =>
    clientChartKey({
      id: detailRecord.value?.clientId,
      clientNumber: detailRecord.value?.clientNumber,
    }),
  )

  const clientHeader = computed(() =>
    buildClientHeader(
      clientForm.value,
      detailRecord.value,
      catalogs,
      t,
    ),
  )

  const insuranceProfile = computed(() =>
    pickAppointmentInsurance(
      clientForm.value?.[clientFormSections.insurance],
      detailRecord.value?.insuranceProfileId,
    ),
  )

  const insuranceView = computed(() =>
    buildInsuranceView(insuranceProfile.value),
  )

  const location = computed(() =>
    appointmentLocationFromSubtenant(authStore.activeSubtenant),
  )

  watch(
    () => [
      openRef.value,
      recordRef.value?.appointmentId,
      recordRef.value?.clientId,
    ],
    () => {
      void loadExtras()
    },
    { immediate: true },
  )

  async function loadExtras() {
    const current = ++requestId
    detailRecord.value = recordRef.value
    clientForm.value = null
    if (!openRef.value || !recordRef.value) {
      return
    }
    loading.value = true
    try {
      await catalogs.loadBasicInfoCatalogs()
      const nextRecord = await loadFullAppointment(recordRef.value)
      if (current !== requestId) {
        return
      }
      detailRecord.value = nextRecord
      const form = await loadClientForm(
        nextRecord,
        catalogs,
        siteStore,
      )
      if (current !== requestId) {
        return
      }
      clientForm.value = form
    } catch (error) {
      if (!isAuthSessionEndUIError(error) && current === requestId) {
        clientForm.value = null
      }
    } finally {
      if (current === requestId) {
        loading.value = false
      }
    }
  }

  return {
    detailRecord,
    clientChartId,
    clientHeader,
    insuranceView,
    location,
    loading,
  }
}

function buildClientHeader(form, record, catalogs, t) {
  if (form) {
    const header = buildClientOverviewHeaderData(form, {
      genderSelectOptions: catalogs.genderOptions.value,
      prefixSelectOptions: catalogs.prefixSelectOptions.value,
      suffixSelectOptions: catalogs.suffixSelectOptions.value,
      t,
    })

    return {
      ...header,
      dobAgeLine: formatAppointmentDobAge(header, t),
      genderIcon: genderIconName(header.gender, form?.[ck.gender]),
    }
  }
  const name = String(record?.clientDisplayName ?? '').trim()
  if (!name) {
    return null
  }

  return {
    fullName: name,
    clientInitials: appointmentClientInitials(name),
    photoFileId: null,
    dobAgeLine: '',
    gender: '',
    phone: '',
    addressLine: '',
    genderIcon: '',
  }
}

function buildInsuranceView(profile) {
  if (!profile) {
    return null
  }
  const payer = formatInsurancePayer(profile)
  const memberId = String(profile.memberId ?? '').trim()
  const serviceId = insuranceServiceId(profile)
  const subscriberName = String(profile.subscriberName ?? '').trim()
  const relationship = String(
    profile.relationshipToSubscriber ?? '',
  ).trim()

  return {
    payer,
    memberId,
    serviceId,
    subscriberName,
    relationship,
    showSubscriber: isInsuranceSubscriberOther(profile),
  }
}

async function loadFullAppointment(record) {
  const id = record?.appointmentId ?? record?.id
  if (id == null) {
    return record
  }
  try {
    const full = await fetchAppointment(id)

    return { ...record, ...full }
  } catch {
    return record
  }
}

async function loadClientForm(record, catalogs, siteStore) {
  const id = clientChartKey({
    id: record?.clientId,
    clientNumber: record?.clientNumber,
  })
  if (!id) {
    return null
  }

  return siteStore.buildEditFormForClient(id, {
    genderSelectOptions: catalogs.genderOptions.value,
    prefixSelectOptions: catalogs.prefixSelectOptions.value,
    suffixSelectOptions: catalogs.suffixSelectOptions.value,
    resolveCatalogSelectValue: catalogs.resolveCatalogSelectValue,
    resolveAgeUnitCode: catalogs.resolveAgeUnitCode,
    defaultAgeUnitValue: catalogs.defaultAgeUnitValue,
  })
}

export function genderIconName(genderLabel, formGender) {
  const code = String(formGender ?? '').trim().toLowerCase()
  if (code === String(clientGenderValues.female).toLowerCase()) {
    return 'female'
  }
  if (code === String(clientGenderValues.male).toLowerCase()) {
    return 'male'
  }
  const label = String(genderLabel ?? '').toLowerCase()
  if (label.includes('female') || label.includes('mujer')) {
    return 'female'
  }
  if (label.includes('male') || label.includes('hombre')) {
    return 'male'
  }

  return ''
}
