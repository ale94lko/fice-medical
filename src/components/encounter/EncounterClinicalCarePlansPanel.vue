<template>
  <section class="encounter-workspace-card">
    <div class="encounter-workspace-card__head">
      <div>
        <div class="encounter-clinical-care-plans__title-row">
          <h2>{{ t('encounterClinicalCarePlans') }}</h2>
          <q-btn
            v-if="canDraftHere"
            no-caps
            outline
            dense
            size="sm"
            class="app-btn-ai-outline"
            icon="auto_awesome"
            :disable="saving"
            :data-testid="aiTestIds.featureBtn('care-plan')"
            :label="t('aiBtnFiceAi')"
            :aria-label="t('aiAssistantName')"
            @click="aiDialogOpen = true"
          />
        </div>
        <p class="text-body2 text-grey-7 q-mb-none">
          {{ t('encounterClinicalCarePlansHint') }}
        </p>
      </div>
      <div class="row q-gutter-sm items-center no-wrap">
        <q-btn
          v-if="canAddHere"
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
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('encounterClinicalAllCarePlans')"
          :loading="allLoading"
          data-testid="encounter-clinical-all-care-plans"
          @click="openAllRecords"
        />
      </div>
    </div>

    <AdminTablePanel
      class="admin-table-panel--wide"
      :show-column-settings="false">
      <CarePlansTable
        :rows="planRows"
        :empty-label="t('encounterClinicalCarePlansEmpty')"
        :can-edit="canEditHere"
        :can-sign="canSignHere"
        @view="openView"
        @edit="openEdit"
        @sign="openSign"
        @status="onChangeStatus"
      />
    </AdminTablePanel>

    <CarePlanDialog
      v-model="dialogOpen"
      :client-id="clientKey"
      :mode="dialogMode"
      :plan="activePlan"
      :clinician-options="resolvedClinicianOptions"
      :can-sign="canSignHere"
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
      :client-id="clientKey"
      :care-plan-options="carePlanSelectOptions"
      @committed="emit('changed')"
    />

    <EncounterClinicalAllRecordsDialog
      v-model="allOpen"
      :title="t('encounterClinicalAllCarePlansTitle')"
      :hint="t('encounterClinicalAllRecordsHint')"
      :loading="allLoading"
      :error="allError">
      <CarePlansTable
        :rows="allRows"
        :empty-label="t('encounterClinicalAllRecordsEmpty')"
        :can-edit="false"
        :can-sign="false"
        @view="openViewFromAll"
      />
    </EncounterClinicalAllRecordsDialog>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AiGenerateDialog from 'components/ai/AiGenerateDialog.vue'
import CarePlanDialog from 'components/CarePlanDialog.vue'
import CarePlansTable from 'components/CarePlansTable.vue'
import EncounterClinicalAllRecordsDialog from
  'components/encounter/EncounterClinicalAllRecordsDialog.vue'
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
  listClientCarePlans,
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
  encounterOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['changed'])

const { t } = useI18n()
const $q = useQuasar()
const {
  canAddCarePlans,
  canEditCarePlans,
  canSignCarePlans,
} = useClientCarePlanPermissions()
const { canUseCarePlanDraft } = useAiPermissions()

const canAddHere = computed(() =>
  props.encounterOpen && canAddCarePlans.value,
)
const canEditHere = computed(() =>
  props.encounterOpen && canEditCarePlans.value,
)
const canSignHere = computed(() =>
  props.encounterOpen && canSignCarePlans.value,
)
const canDraftHere = computed(() =>
  props.encounterOpen && canUseCarePlanDraft.value,
)

const saving = ref(false)
const dialogOpen = ref(false)
const dialogMode = ref('add')
const activePlan = ref(null)
const aiDialogOpen = ref(false)
const allOpen = ref(false)
const allLoading = ref(false)
const allError = ref('')
const allRows = ref([])
const allRawById = ref({})

const clientKey = computed(() => String(props.clientId ?? '').trim())

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
  if (isServerNumericId(row?.id) && clientKey.value) {
    try {
      return await fetchClientCarePlan(clientKey.value, row.id)
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

function openAdd() {
  if (!canAddHere.value) {
    return
  }
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
  if (!canEditHere.value) {
    return
  }
  activePlan.value = await loadPlanForDialog(row)
  dialogMode.value = 'edit'
  dialogOpen.value = true
}

async function openSign(row) {
  if (!canSignHere.value) {
    return
  }
  activePlan.value = await loadPlanForDialog(row)
  dialogMode.value = 'edit'
  dialogOpen.value = true
}

async function openAllRecords() {
  if (!clientKey.value) {
    return
  }
  allOpen.value = true
  allLoading.value = true
  allError.value = ''
  try {
    const result = await listClientCarePlans(clientKey.value, {
      page: 0,
      limit: 200,
    })
    allRows.value = result.items ?? []
    const map = {}
    allRows.value.forEach(row => {
      if (row?.id != null) {
        map[String(row.id)] = row
      }
    })
    allRawById.value = map
  } catch (error) {
    allRows.value = []
    allRawById.value = {}
    if (!isAuthSessionEndUIError(error)) {
      allError.value = t('encounterClinicalAllRecordsLoadError')
    }
  } finally {
    allLoading.value = false
  }
}

async function openViewFromAll(row) {
  if (!row?.id || !clientKey.value) {
    return
  }
  try {
    const detail = await fetchClientCarePlan(clientKey.value, row.id)
    activePlan.value = detail || cloneCarePlan(
      allRawById.value[String(row.id)] || row,
    )
    dialogMode.value = 'view'
    dialogOpen.value = true
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      openView(row)
    }
  }
}

async function onSave({ plan, activate }) {
  if (!clientKey.value) {
    return
  }
  const isEdit = isServerNumericId(plan?.id)
  if (isEdit && !canEditHere.value) {
    return
  }
  if (!isEdit && !canAddHere.value) {
    return
  }
  saving.value = true
  try {
    const payload = prepareCarePlanForSave(plan)
    let savedId = payload.id
    if (isServerNumericId(payload.id)) {
      const saved = await updateClientCarePlan(clientKey.value, payload)
      savedId = saved.id
    } else {
      const saved = await createClientCarePlan(clientKey.value, payload)
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
      if (!canSignHere.value) {
        $q.notify({
          type: quasarNotifyTypes.negative,
          message: t('carePlanNoSignPermission'),
          position: 'top',
        })

        return
      }
      await signClientCarePlan(
        clientKey.value,
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
    emit('changed')
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('carePlanSaveError'),
        position: 'top',
      })
    }
  } finally {
    saving.value = false
  }
}

async function onChangeStatus(row, status, reason = '') {
  if (!canEditHere.value || !clientKey.value) {
    return
  }
  try {
    await changeCarePlanStatus(
      clientKey.value,
      row.id,
      status,
      reason,
    )
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('carePlanStatusUpdated'),
      position: 'top',
    })
    emit('changed')
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('carePlanSaveError'),
        position: 'top',
      })
    }
  }
}

async function reloadActivePlan() {
  if (!activePlan.value?.id || !clientKey.value) {
    return
  }
  activePlan.value = await fetchClientCarePlan(
    clientKey.value,
    activePlan.value.id,
  )
  emit('changed')
}

async function onSaveGoal(goal) {
  if (!activePlan.value?.id || !clientKey.value) {
    return
  }
  saving.value = true
  try {
    activePlan.value = await saveClientCarePlanGoalTree(
      clientKey.value,
      activePlan.value.id,
      goal,
    )
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('carePlanSaved'),
      position: 'top',
    })
    emit('changed')
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('carePlanSaveError'),
        position: 'top',
      })
    }
  } finally {
    saving.value = false
  }
}

async function onDiscontinueGoal({ goal, reason }) {
  if (!activePlan.value?.id || !goal?.id || !clientKey.value) {
    return
  }
  saving.value = true
  try {
    await discontinueClientCarePlanGoal(
      clientKey.value,
      activePlan.value.id,
      goal,
      reason,
    )
    await reloadActivePlan()
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('carePlanStatusUpdated'),
      position: 'top',
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('carePlanSaveError'),
        position: 'top',
      })
    }
  } finally {
    saving.value = false
  }
}

async function onReplaceGoal({ goal, replaceReason }) {
  if (!activePlan.value?.id || !clientKey.value) {
    return
  }
  saving.value = true
  try {
    activePlan.value = await saveClientCarePlanGoalTree(
      clientKey.value,
      activePlan.value.id,
      { ...goal, replaceReason },
    )
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('carePlanSaved'),
      position: 'top',
    })
    emit('changed')
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('carePlanSaveError'),
        position: 'top',
      })
    }
  } finally {
    saving.value = false
  }
}

async function onAddIntervention({ goalId, intervention }) {
  if (!activePlan.value?.id || !goalId || !clientKey.value) {
    return
  }
  saving.value = true
  try {
    await createClientCarePlanIntervention(
      clientKey.value,
      activePlan.value.id,
      goalId,
      intervention,
    )
    await reloadActivePlan()
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('carePlanSaved'),
      position: 'top',
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('carePlanSaveError'),
        position: 'top',
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
  if (!activePlan.value?.id || !clientKey.value) {
    return
  }
  saving.value = true
  try {
    const updated = await updateOutcomeMeasureCurrentValue(
      clientKey.value,
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
      position: 'top',
    })
    emit('changed')
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('carePlanSaveError'),
        position: 'top',
      })
    }
  } finally {
    saving.value = false
  }
}
</script>
