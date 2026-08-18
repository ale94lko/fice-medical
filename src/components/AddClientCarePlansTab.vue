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
          <div class="row q-gutter-sm items-center">
            <q-btn
              v-if="canUseCarePlanDraft"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              icon="auto_awesome"
              :disable="saving"
              :data-testid="aiTestIds.featureBtn('care-plan')"
              :label="t('aiBtnCarePlanDraft')"
              @click="aiDialogOpen = true"
            />
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
      </div>

      <AdminTablePanel
        class="care-plans-table-panel admin-table-panel--wide q-mt-md"
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
      @save-goal="onSaveGoal"
      @discontinue-goal="onDiscontinueGoal"
      @replace-goal="onReplaceGoal"
      @add-intervention="onAddIntervention"
    />

    <AiGenerateDialog
      v-model="aiDialogOpen"
      :feature="aiFeatures.carePlanDraft"
      :client-id="clientId"
      :care-plan-options="carePlanSelectOptions"
      @committed="refreshClientCarePlans"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AiGenerateDialog from 'components/ai/AiGenerateDialog.vue'
import CarePlanDialog from 'components/CarePlanDialog.vue'
import CarePlansTable from 'components/CarePlansTable.vue'
import {
  aiFeatures,
  quasarNotifyTypes,
} from 'components/constants.js'
import { useAiPermissions } from 'src/composables/useAiPermissions.js'
import { useClientCarePlanPermissions } from
  'src/composables/useClientCarePlanPermissions.js'
import {
  apiErrorMessage,
  changeCarePlanStatus,
  createClientCarePlan,
  createClientCarePlanIntervention,
  discontinueClientCarePlanGoal,
  fetchClientCarePlan,
  prepareCarePlanForSave,
  saveClientCarePlanGoalTree,
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
import { aiTestIds } from 'src/test-ids/ai.js'
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
const { canUseCarePlanDraft } = useAiPermissions()

const saving = ref(false)

const dialogOpen = ref(false)
const dialogMode = ref('add')
const activePlan = ref(null)
const aiDialogOpen = ref(false)

const hasClientId = computed(() => {
  const id = String(props.clientId ?? '').trim()

  return Boolean(id)
})

const clientId = computed(() => String(props.clientId ?? '').trim())

const resolvedClinicianOptions = computed(() =>
  props.clinicianOptions?.length ? props.clinicianOptions : [],
)

const carePlansRaw = computed(() =>
  Array.isArray(props.carePlans) ? props.carePlans : [],
)

const planRows = computed(() =>
  mapCarePlansListFromApi(carePlansRaw.value),
)

const carePlanSelectOptions = computed(() =>
  planRows.value.map(row => ({
    label: row.name || row.problem || String(row.id),
    value: row.id,
  })),
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

async function loadPlanForDialog(row) {
  if (isServerNumericId(row?.id) && clientId.value) {
    try {
      return await fetchClientCarePlan(clientId.value, row.id)
    } catch (error) {
      if (!isAuthSessionEndUIError(error)) {
        $q.notify({
          type: quasarNotifyTypes.negative,
          message: apiErrorMessage(error) || t('carePlanListError'),
          position: 'top',
        })
      }
    }
  }

  return planDetailFromRecord(row?.id) || cloneCarePlan(row)
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

async function openView(row) {
  activePlan.value = await loadPlanForDialog(row)
  dialogMode.value = 'view'
  dialogOpen.value = true
}

async function openEdit(row) {
  if (!canEditCarePlans.value) {
    return
  }
  activePlan.value = await loadPlanForDialog(row)
  dialogMode.value = 'edit'
  dialogOpen.value = true
}

async function openSign(row) {
  if (!canSignCarePlans.value) {
    return
  }
  activePlan.value = await loadPlanForDialog(row)
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

async function onChangeStatus(row, status, reason = '') {
  if (!canEditCarePlans.value) {
    return
  }
  try {
    await changeCarePlanStatus(clientId.value, row.id, status, reason)
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

async function reloadActivePlan() {
  if (!activePlan.value?.id || !clientId.value) {
    return
  }
  activePlan.value = await fetchClientCarePlan(
    clientId.value,
    activePlan.value.id,
  )
  await refreshClientCarePlans()
}

async function onSaveGoal(goal) {
  if (!activePlan.value?.id) {
    return
  }
  saving.value = true
  try {
    activePlan.value = await saveClientCarePlanGoalTree(
      clientId.value,
      activePlan.value.id,
      goal,
    )
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('carePlanSaved'),
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

async function onDiscontinueGoal({ goal, reason }) {
  if (!activePlan.value?.id || !goal?.id) {
    return
  }
  saving.value = true
  try {
    await discontinueClientCarePlanGoal(
      clientId.value,
      activePlan.value.id,
      goal,
      reason,
    )
    await reloadActivePlan()
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('carePlanStatusUpdated'),
    })
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

async function onReplaceGoal({ goal, replaceReason }) {
  if (!activePlan.value?.id) {
    return
  }
  saving.value = true
  try {
    activePlan.value = await saveClientCarePlanGoalTree(
      clientId.value,
      activePlan.value.id,
      { ...goal, replaceReason },
    )
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('carePlanSaved'),
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

async function onAddIntervention({ goalId, intervention }) {
  if (!activePlan.value?.id || !goalId) {
    return
  }
  saving.value = true
  try {
    await createClientCarePlanIntervention(
      clientId.value,
      activePlan.value.id,
      goalId,
      intervention,
    )
    await reloadActivePlan()
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('carePlanSaved'),
    })
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

async function onRecordProgress({
  goalId,
  measureId,
  currentValue,
  measuredDate,
  notes,
}) {
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
      { measuredDate, notes },
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
