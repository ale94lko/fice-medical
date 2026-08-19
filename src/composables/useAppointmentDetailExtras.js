import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from 'src/stores/auth-store.js'
import {
  appointmentLocationFromSubtenant,
  buildAppointmentClientHeader,
  buildAppointmentInsuranceView,
} from 'src/utils/appointment-detail-display.js'
import { clientChartKey } from 'components/helpers.js'

export function useAppointmentDetailExtras(openRef, recordRef) {
  const { t } = useI18n()
  const authStore = useAuthStore()

  const detailRecord = computed(() =>
    openRef.value ? recordRef.value : null,
  )

  const clientChartId = computed(() =>
    clientChartKey({
      id: detailRecord.value?.clientId,
      clientNumber: detailRecord.value?.clientNumber,
    }),
  )

  const clientHeader = computed(() =>
    buildAppointmentClientHeader(detailRecord.value, t),
  )

  const insuranceView = computed(() =>
    buildAppointmentInsuranceView(detailRecord.value?.insurance),
  )

  const showInsuranceSection = computed(() =>
    detailRecord.value?.insurance != null,
  )

  const location = computed(() =>
    appointmentLocationFromSubtenant(authStore.activeSubtenant),
  )

  return {
    detailRecord,
    clientChartId,
    clientHeader,
    insuranceView,
    showInsuranceSection,
    location,
  }
}
