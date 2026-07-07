<template>
  <div class="add-client-care-plans-tab">
    <div
      v-if="!hasClientId"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('carePlanSaveClientFirst') }}
      </p>
    </div>

    <div
      v-else-if="!canViewCarePlans"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('carePlanNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div class="care-plans-header row items-start">
        <div class="col">
          <h2 class="care-plans-title">
            {{ t('carePlansTitle') }}
          </h2>
          <p class="care-plans-subtitle text-body2">
            {{ t('carePlansSubtitle') }}
          </p>
        </div>
        <div class="col-auto">
          <q-btn
            v-if="canAddCarePlans"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :disable="saving"
            :data-testid="tid.btn('add')"
            :label="t('carePlanAdd')"
            @click="openAdd"
          />
        </div>
      </div>

      <AdminTablePanel
        class="care-plans-table-panel q-mt-md"
        :show-column-settings="false">
        <CarePlansTable
          :rows="planRows"
          :empty-label="t('carePlanListEmpty')"
          :can-edit="canEditCarePlans"
          :can-sign="canSignCarePlans"
          @view="openView"
          @edit="openEdit"
          @sign="openSign"
          @status="onChangeStatus"
        />
      </AdminTablePanel>
    </template>

    <CarePlanDialog
      v-model="dialogOpen"
      :client-id="clientId"
      :mode="dialogMode"
      :plan="activePlan"
      :clinician-options="resolvedClinicianOptions"
      :can-sign="canSignCarePlans"
      :saving="saving"
      @save="onSave"
      @cancel="dialogOpen = false"
      @record-progress="onRecordProgress"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import CarePlanDialog from 'components/CarePlanDialog.vue'
import CarePlansTable from 'components/CarePlansTable.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { useClientCarePlanPermissions } from
  'src/composables/useClientCarePlanPermissions.js'
import {
  apiErrorMessage,
  changeCarePlanStatus,
  createClientCarePlan,
  prepareCarePlanForSave,
  signClientCarePlan,
  updateClientCarePlan,
  updateOutcomeMeasureCurrentValue,
} from 'src/utils/care-plan-api.js'
import {
  mapCarePlansListFromApi,
  normalizeCarePlanDetail,
} from 'src/utils/care-plan-normalize.js'
import {
  cloneCarePlan,
  createEmptyCarePlan,
  isServerNumericId,
} from 'src/utils/care-plan-orders.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { useSiteStore } from 'src/stores/site-store.js'
import { carePlanTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
  carePlans: {
    type: Array,
    default: () => [],
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
})

const { t } = useI18n()
const $q = useQuasar()
const siteStore = useSiteStore()
const {
  canViewCarePlans,
  canAddCarePlans,
  canEditCarePlans,
  canSignCarePlans,
} = useClientCarePlanPermissions()

const saving = ref(false)

const dialogOpen = ref(false)
const dialogMode = ref('add')
const activePlan = ref(null)

const hasClientId = computed(() => {
  const id = String(props.clientId ?? '').trim()

  return Boolean(id)
})

const clientId = computed(() => String(props.clientId ?? '').trim())

const resolvedClinicianOptions = computed(() => {
  if (props.clinicianOptions?.length) {
    return props.clinicianOptions
  }

  return [{ label: 'Dr. John Smith', value: 5 }]
})

const carePlansRaw = computed(() =>
  Array.isArray(props.carePlans) ? props.carePlans : [],
)

const planRows = computed(() =>
  mapCarePlansListFromApi(carePlansRaw.value),
)

function findRawCarePlan(planId) {
  return carePlansRaw.value.find(
    row => String(row?.id) === String(planId),
  )
}

function planDetailFromRecord(planId) {
  const raw = findRawCarePlan(planId)
  if (!raw) {
    return null
  }

  return normalizeCarePlanDetail(raw)
}

async function refreshClientCarePlans() {
  if (!hasClientId.value) {
    return
  }
  try {
    await siteStore.fetchClientById(clientId.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('carePlanListError'),
        position: 'top',
      })
    }
  }
}

function openAdd() {
  dialogMode.value = 'add'
  activePlan.value = createEmptyCarePlan()
  dialogOpen.value = true
}

function openView(row) {
  if (isServerNumericId(row.id)) {
    const detail = planDetailFromRecord(row.id)
    if (detail) {
      activePlan.value = detail
      dialogMode.value = 'view'
      dialogOpen.value = true

      return
    }
  }
  activePlan.value = cloneCarePlan(row)
  dialogMode.value = 'view'
  dialogOpen.value = true
}

function openEdit(row) {
  if (!canEditCarePlans.value) {
    return
  }
  if (isServerNumericId(row.id)) {
    const detail = planDetailFromRecord(row.id)
    if (detail) {
      activePlan.value = detail
      dialogMode.value = 'edit'
      dialogOpen.value = true

      return
    }
  }
  activePlan.value = cloneCarePlan(row)
  dialogMode.value = 'edit'
  dialogOpen.value = true
}

function openSign(row) {
  if (!canSignCarePlans.value) {
    return
  }
  const detail = planDetailFromRecord(row.id)
  if (detail) {
    activePlan.value = detail
    dialogMode.value = 'edit'
    dialogOpen.value = true

    return
  }
  activePlan.value = cloneCarePlan(row)
  dialogMode.value = 'edit'
  dialogOpen.value = true
}

async function onSave({ plan, activate }) {
  saving.value = true
  try {
    const payload = prepareCarePlanForSave(plan)
    let savedId = payload.id
    if (isServerNumericId(payload.id)) {
      const saved = await updateClientCarePlan(clientId.value, payload)
      savedId = saved.id
    } else {
      const saved = await createClientCarePlan(clientId.value, payload)
      savedId = saved.id
    }
    let successMessage = t('carePlanSaved')
    if (activate) {
      if (!payload.signature) {
        $q.notify({
          type: quasarNotifyTypes.negative,
          message: t('carePlanSignatureRequired'),
          position: 'top',
        })

        return
      }
      if (!canSignCarePlans.value) {
        $q.notify({
          type: quasarNotifyTypes.negative,
          message: t('carePlanNoSignPermission'),
          position: 'top',
        })

        return
      }
      await signClientCarePlan(
        clientId.value,
        savedId,
        payload.signature,
      )
      successMessage = t('carePlanActivated')
    }
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: successMessage,
      position: 'top',
    })
    dialogOpen.value = false
    await refreshClientCarePlans()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('carePlanSaveError'),
      })
    }
  } finally {
    saving.value = false
  }
}

async function onChangeStatus(row, status) {
  if (!canEditCarePlans.value) {
    return
  }
  try {
    await changeCarePlanStatus(clientId.value, row.id, status)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('carePlanStatusUpdated'),
    })
    await refreshClientCarePlans()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('carePlanSaveError'),
      })
    }
  }
}

async function onRecordProgress({ goalId, measureId, currentValue }) {
  if (!activePlan.value?.id) {
    return
  }
  saving.value = true
  try {
    const updated = await updateOutcomeMeasureCurrentValue(
      clientId.value,
      activePlan.value.id,
      goalId,
      measureId,
      currentValue,
    )
    activePlan.value = updated
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('carePlanMeasurementSaved'),
    })
    await refreshClientCarePlans()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('carePlanSaveError'),
      })
    }
  } finally {
    saving.value = false
  }
}
</script>
