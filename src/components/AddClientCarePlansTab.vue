<template>
  <div class="add-client-care-plans-tab">
    <div v-if="!hasClientId" class="care-plans-panel q-pa-lg text-center">
      <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('carePlanSaveClientFirst') }}
      </p>
    </div>

    <div
      v-else-if="!canViewCarePlans"
      class="care-plans-panel q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('carePlanNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div class="row items-center justify-between q-mb-md">
        <div>
          <h2 class="care-plans-panel__title q-mb-xs">
            {{ t('carePlansTitle') }}
          </h2>
          <p class="care-plans-panel__subtitle text-body2 text-grey-7">
            {{ t('carePlansSubtitle') }}
          </p>
        </div>
        <q-btn
          v-if="canAddCarePlans"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="add"
          :disable="loading"
          :data-testid="tid.btn('add')"
          :label="t('carePlanAdd')"
          @click="openAdd"
        />
      </div>

      <div v-if="loading" class="care-plans-panel q-pa-xl flex flex-center">
        <AppBrandLoading inline />
      </div>

      <div v-else class="care-plans-panel q-pa-md">
        <CarePlansTable
          :rows="paginatedPlans"
          :empty-label="t('carePlanListEmpty')"
          :can-edit="canEditCarePlans"
          :can-sign="canSignCarePlans"
          @view="openView"
          @edit="openEdit"
          @sign="openSign"
          @status="onChangeStatus"
        />

        <div
          v-if="plans.length"
          class="row items-center justify-between q-mt-md">
          <p class="text-body2 text-grey-7 q-mb-none">
            {{
              t('carePlanPaginationSummary', {
                from: pageFrom,
                to: pageTo,
                total: plans.length,
              })
            }}
          </p>
          <q-pagination
            v-model="page"
            :max="pageCount"
            max-pages="6"
            direction-links
            boundary-links
            color="primary"
            size="sm"
          />
        </div>
      </div>
    </template>

    <CarePlanDialog
      v-model="dialogOpen"
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
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import CarePlanDialog from 'components/CarePlanDialog.vue'
import AppBrandLoading from 'components/AppBrandLoading.vue'
import CarePlansTable from 'components/CarePlansTable.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { useClientCarePlanPermissions } from
  'src/composables/useClientCarePlanPermissions.js'
import {
  apiErrorMessage,
  changeCarePlanStatus,
  createClientCarePlan,
  fetchClientCarePlan,
  listClientCarePlans,
  prepareCarePlanForSave,
  signClientCarePlan,
  updateClientCarePlan,
  updateOutcomeMeasureCurrentValue,
} from 'src/utils/care-plan-api.js'
import {
  cloneCarePlan,
  createEmptyCarePlan,
  isServerNumericId,
} from 'src/utils/care-plan-orders.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { carePlanTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
})

const { t } = useI18n()
const $q = useQuasar()
const {
  canViewCarePlans,
  canAddCarePlans,
  canEditCarePlans,
  canSignCarePlans,
} = useClientCarePlanPermissions()

const loading = ref(false)
const saving = ref(false)
const plans = ref([])
const page = ref(1)
const pageSize = 10

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

const pageCount = computed(() =>
  Math.max(1, Math.ceil(plans.value.length / pageSize)),
)

const paginatedPlans = computed(() => {
  const start = (page.value - 1) * pageSize

  return plans.value.slice(start, start + pageSize)
})

const pageFrom = computed(() => {
  if (!plans.value.length) {
    return 0
  }

  return (page.value - 1) * pageSize + 1
})

const pageTo = computed(() =>
  Math.min(page.value * pageSize, plans.value.length),
)

watch(pageCount, maxPage => {
  if (page.value > maxPage) {
    page.value = 1
  }
})

watch(clientId, () => {
  if (hasClientId.value && canViewCarePlans.value) {
    loadPlans()
  }
})

onMounted(() => {
  if (hasClientId.value && canViewCarePlans.value) {
    loadPlans()
  }
})

async function loadPlans() {
  loading.value = true
  try {
    const result = await listClientCarePlans(clientId.value, { limit: 100 })
    plans.value = result.items ?? []
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('carePlanListError'),
      })
    }
  } finally {
    loading.value = false
  }
}

async function loadPlanDetail(planId, mode) {
  loading.value = true
  try {
    activePlan.value = await fetchClientCarePlan(clientId.value, planId)
    dialogMode.value = mode
    dialogOpen.value = true
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('carePlanLoadError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function openAdd() {
  dialogMode.value = 'add'
  activePlan.value = createEmptyCarePlan()
  dialogOpen.value = true
}

async function openView(row) {
  if (isServerNumericId(row.id)) {
    await loadPlanDetail(row.id, 'view')

    return
  }
  activePlan.value = cloneCarePlan(row)
  dialogMode.value = 'view'
  dialogOpen.value = true
}

async function openEdit(row) {
  if (!canEditCarePlans.value) {
    return
  }
  if (isServerNumericId(row.id)) {
    await loadPlanDetail(row.id, 'edit')

    return
  }
  activePlan.value = cloneCarePlan(row)
  dialogMode.value = 'edit'
  dialogOpen.value = true
}

async function openSign(row) {
  if (!canSignCarePlans.value) {
    return
  }
  await loadPlanDetail(row.id, 'edit')
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
    await loadPlans()
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
    await loadPlans()
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
    await loadPlans()
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

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.add-client-care-plans-tab {
  width: 100%;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
}

.care-plans-panel {
  background: #fff;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
}

.care-plans-panel__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: $text-strong;
}

.care-plans-panel__subtitle {
  margin: 0;
}
</style>
