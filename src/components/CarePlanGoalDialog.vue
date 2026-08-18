<template>
  <q-dialog
    v-model="open"
    persistent
    class="app-nested-dialog"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        test-id="care-plan-goal"
        :close-label="t('close')"
        :info="t('carePlanGoalSubtitle')"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div class="insurance-dialog__card-section">
          <SubsectionHeading
            icon="track_changes"
            :title="t('carePlanGoalSectionInfo')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12">
              <AddClientLabeledField
                :label="t('carePlanGoalTitle')"
                required
                :test-id="tid.field('goal-title')">
                <q-input
                  v-model="local.title"
                  outlined
                  hide-bottom-space
                  counter
                  :readonly="readonly"
                  :maxlength="carePlanGoalTitleMaxLength"
                  :placeholder="t('carePlanGoalTitlePlaceholder')"
                  :error="Boolean(errors.title)"
                  :error-message="errors.title"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12">
              <AddClientLabeledField
                :label="t('description')"
                :test-id="tid.field('goal-description')">
                <q-input
                  v-model="local.description"
                  outlined
                  hide-bottom-space
                  type="textarea"
                  autogrow
                  counter
                  :readonly="readonly"
                  :maxlength="carePlanDescriptionMaxLength"
                  :placeholder="t('carePlanGoalDescriptionPlaceholder')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-4">
              <AddClientLabeledField
                :label="t('carePlanGoalTargetDate')"
                required
                :test-id="tid.field('goal-target-date')">
                <ClientDateField
                  v-model="local.targetDate"
                  :readonly="readonly"
                  :error="Boolean(errors.targetDate)"
                  :error-message="errors.targetDate"
                  :close-label="t('close')"
                  :test-id="tid.field('goal-target-date')"
                />
              </AddClientLabeledField>
            </div>
            <div
              v-if="showStatusField"
              class="col-12 col-md-4">
              <AddClientLabeledField
                :label="t('status')"
                :test-id="tid.field('goal-status')">
                <FormSelect
                  v-model="local.status"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  readonly
                  :options="statusOptions"
                  :test-id="tid.field('goal-status')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-4">
              <AddClientLabeledField
                :label="t('carePlanPriority')"
                :test-id="tid.field('goal-priority')">
                <FormSelect
                  v-model="local.priority"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly"
                  :options="priorityOptions"
                  :test-id="tid.field('goal-priority')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12">
              <AddClientLabeledField
                :label="t('carePlanGoalSuccessCriteria')"
                :test-id="tid.field('goal-success-criteria')">
                <q-input
                  v-model="local.successCriteria"
                  outlined
                  hide-bottom-space
                  type="textarea"
                  autogrow
                  counter
                  :readonly="readonly"
                  :maxlength="carePlanDescriptionMaxLength"
                  :placeholder="t('carePlanGoalSuccessCriteriaPlaceholder')"
                />
              </AddClientLabeledField>
            </div>
          </div>
          <div v-if="!readonly" class="insurance-info-banner q-mt-md">
            <q-icon name="info_outline" size="18px" class="q-mr-sm" />
            {{ t('carePlanGoalInfoBanner') }}
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <div class="row items-center justify-between q-mb-sm">
            <SubsectionHeading
              icon="analytics"
              :title="t('carePlanGoalSectionMeasures')"
            />
            <q-btn
              v-if="!structureReadonly"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              icon="add"
              :label="t('carePlanAddMeasure')"
              :data-testid="tid.btn('add-measure')"
              @click="openMeasureDialog('add')"
            />
          </div>
          <AdminTablePanel
            class="care-plan-measures-table-panel admin-table-panel--wide"
            :show-column-settings="false">
            <MeasureTable
              :rows="local.outcomeMeasures"
              :readonly="structureReadonly"
              :can-add-measurement="canAddMeasurement"
              :empty-label="t('carePlanMeasuresEmpty')"
              @edit="row => openMeasureDialog('edit', row)"
              @view="row => openMeasureDialog('view', row)"
              @add-measurement="openAddMeasurementDialog"
              @measurement-history="openMeasurementHistoryDialog"
              @delete="removeMeasure"
            />
          </AdminTablePanel>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <div class="row items-center justify-between q-mb-sm">
            <SubsectionHeading
              icon="list_alt"
              :title="t('carePlanGoalSectionInterventions')"
            />
            <q-btn
              v-if="canShowAddIntervention"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              icon="add"
              :label="t('carePlanAddIntervention')"
              :data-testid="tid.btn('add-intervention')"
              @click="openInterventionDialog('add')"
            />
          </div>
          <AdminTablePanel
            class="care-plan-interventions-table-panel
              admin-table-panel--wide"
            :show-column-settings="false">
            <InterventionTable
              :rows="local.interventions"
              :readonly="structureReadonly"
              :clinician-options="clinicianOptions"
              :empty-label="t('carePlanInterventionsEmpty')"
              @edit="row => openInterventionDialog('edit', row)"
              @view="row => openInterventionDialog('view', row)"
              @delete="removeIntervention"
            />
          </AdminTablePanel>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="readonly ? t('close') : t('cancel')"
          :data-testid="readonly ? tid.btn('close') : tid.btn('cancel')"
          @click="onCancel"
        />
        <template v-if="!readonly">
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :label="t('carePlanSaveGoal')"
            :data-testid="tid.btn('save-goal')"
            @click="onSave"
          />
        </template>
      </q-card-actions>
    </q-card>

    <CarePlanOutcomeMeasureDialog
      v-model="measureDialogOpen"
      :measure="activeMeasure"
      :mode="measureDialogMode"
      :existing-measures="local.outcomeMeasures"
      @save="onMeasureSaved"
    />
    <CarePlanAddMeasurementDialog
      v-model="measurementDialogOpen"
      :measure="activeMeasure"
      @save="onMeasurementSaved"
    />
    <CarePlanMeasurementHistoryDialog
      v-model="historyDialogOpen"
      :measure="activeMeasure"
    />
    <CarePlanInterventionDialog
      v-model="interventionDialogOpen"
      :intervention="activeIntervention"
      :mode="interventionDialogMode"
      :clinician-options="clinicianOptions"
      @save="onInterventionSaved"
    />
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import CarePlanOutcomeMeasureDialog from
  'components/CarePlanOutcomeMeasureDialog.vue'
import CarePlanAddMeasurementDialog from
  'components/CarePlanAddMeasurementDialog.vue'
import CarePlanMeasurementHistoryDialog from
  'components/CarePlanMeasurementHistoryDialog.vue'
import CarePlanInterventionDialog from
  'components/CarePlanInterventionDialog.vue'
import MeasureTable from 'components/CarePlanMeasureTable.vue'
import InterventionTable from 'components/CarePlanInterventionTable.vue'
import {
  carePlanDescriptionMaxLength,
  carePlanGoalStatuses,
  carePlanGoalTitleMaxLength,
  carePlanPriorities,
} from 'components/constants.js'
import {
  applyOutcomeMeasureReading,
  createEmptyCarePlanGoal,
  createEmptyIntervention,
  createEmptyOutcomeMeasure,
  nextCarePlanLocalId,
  refreshGoalProgress,
} from 'src/utils/care-plan-orders.js'
import { carePlanI18nKey } from 'src/utils/care-plan-i18n.js'
import { carePlanTestIds as tid } from 'src/test-ids/index.js'
import { useAuthStore } from 'src/stores/auth-store.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  goal: {
    type: Object,
    default: null,
  },
  mode: {
    type: String,
    default: 'add',
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
  canRecordMeasurement: {
    type: Boolean,
    default: false,
  },
  canAddIntervention: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'save',
  'cancel',
  'record-progress',
  'add-intervention',
])

const { t } = useI18n()
const authStore = useAuthStore()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const readonly = computed(() => props.mode === 'view')
const structureReadonly = computed(() => readonly.value)
const showStatusField = computed(() => props.mode !== 'add')
const canAddMeasurement = computed(() =>
  props.canRecordMeasurement || !readonly.value,
)
const canShowAddIntervention = computed(() =>
  !structureReadonly.value || props.canAddIntervention,
)
const local = ref(createEmptyCarePlanGoal())
const errors = reactive({})

const measureDialogOpen = ref(false)
const measureDialogMode = ref('add')
const activeMeasure = ref(null)
const measurementDialogOpen = ref(false)
const historyDialogOpen = ref(false)

const interventionDialogOpen = ref(false)
const interventionDialogMode = ref('add')
const activeIntervention = ref(null)

const dialogTitle = computed(() => {
  if (props.mode === 'view') {
    return t('carePlanGoalViewTitle')
  }
  if (props.mode === 'edit') {
    return t('carePlanGoalEditTitle')
  }

  return t('carePlanGoalAddTitle')
})

const statusOptions = computed(() =>
  Object.values(carePlanGoalStatuses).map(value => ({
    label: t(carePlanI18nKey('carePlanGoalStatus', value)),
    value,
  })),
)

const priorityOptions = computed(() =>
  Object.values(carePlanPriorities).map(value => ({
    label: t(carePlanI18nKey('carePlanPriority', value)),
    value,
  })),
)

watch(
  () => [props.modelValue, props.goal],
  () => {
    if (props.modelValue) {
      local.value = {
        ...createEmptyCarePlanGoal(),
        ...(props.goal ?? {}),
        outcomeMeasures: [...(props.goal?.outcomeMeasures ?? [])],
        interventions: [...(props.goal?.interventions ?? [])],
      }
      Object.keys(errors).forEach(key => delete errors[key])
    }
  },
  { immediate: true },
)

function validate() {
  Object.keys(errors).forEach(key => delete errors[key])
  if (!String(local.value.title ?? '').trim()) {
    errors.title = t('carePlanGoalTitleRequired')
  }
  if (!local.value.targetDate) {
    errors.targetDate = t('carePlanGoalTargetDateRequired')
  }

  return !Object.keys(errors).length
}

function onSave() {
  if (!validate()) {
    return
  }
  emit('save', refreshGoalProgress({ ...local.value }))
  open.value = false
}

function onCancel() {
  emit('cancel')
  open.value = false
}

function openMeasureDialog(mode, row = null) {
  measureDialogMode.value = mode
  activeMeasure.value = row
    ? { ...row }
    : createEmptyOutcomeMeasure()
  measureDialogOpen.value = true
}

function openAddMeasurementDialog(row) {
  activeMeasure.value = row ? { ...row } : null
  measurementDialogOpen.value = true
}

function openMeasurementHistoryDialog(row) {
  activeMeasure.value = row ? { ...row } : null
  historyDialogOpen.value = true
}

function resolveRecordedBy() {
  const profile = authStore.linkedStaffProfile
  const name = String(profile?.name ?? '').trim()
    || String(authStore.userInfo?.email ?? '').trim()
  const id = profile?.id ?? authStore.userInfo?.id ?? null

  return {
    recordedByName: name,
    recordedById: id,
  }
}

function onMeasurementSaved(reading) {
  const measureId = reading?.measureId
  if (!measureId) {
    return
  }
  const recordedBy = resolveRecordedBy()
  local.value.outcomeMeasures = (local.value.outcomeMeasures ?? []).map(
    item => {
      if (item.id !== measureId) {
        return item
      }

      return applyOutcomeMeasureReading(item, {
        ...reading,
        ...recordedBy,
      })
    },
  )
  local.value = refreshGoalProgress(local.value)
  measurementDialogOpen.value = false
  if (props.canRecordMeasurement) {
    emit('record-progress', {
      goalId: local.value.id,
      measureId,
      currentValue: reading.currentValue,
      measuredDate: reading.measuredDate,
      notes: reading.notes,
    })
  }
}

function onMeasureSaved(measure, keepOpen) {
  const list = [...(local.value.outcomeMeasures ?? [])]
  const index = list.findIndex(item => item.id === measure.id)
  if (index >= 0) {
    list[index] = measure
  } else {
    list.push({ ...measure, id: measure.id || nextCarePlanLocalId('measure') })
  }
  local.value.outcomeMeasures = list
  local.value = refreshGoalProgress(local.value)
  if (!keepOpen) {
    measureDialogOpen.value = false
  }
}

function removeMeasure(row) {
  local.value.outcomeMeasures = (local.value.outcomeMeasures ?? [])
    .filter(item => item.id !== row.id)
  local.value = refreshGoalProgress(local.value)
}

function openInterventionDialog(mode, row = null) {
  interventionDialogMode.value = mode
  activeIntervention.value = row
    ? { ...row }
    : createEmptyIntervention()
  interventionDialogOpen.value = true
}

function onInterventionSaved(intervention) {
  const list = [...(local.value.interventions ?? [])]
  const index = list.findIndex(item => item.id === intervention.id)
  const saved = index >= 0
    ? intervention
    : {
      ...intervention,
      id: intervention.id || nextCarePlanLocalId('intervention'),
    }
  if (index >= 0) {
    list[index] = saved
  } else {
    list.push(saved)
  }
  local.value.interventions = list
  interventionDialogOpen.value = false
  if (readonly.value && props.canAddIntervention) {
    emit('add-intervention', {
      goalId: local.value.id,
      intervention: saved,
    })
  }
}

function removeIntervention(row) {
  local.value.interventions = (local.value.interventions ?? [])
    .filter(item => item.id !== row.id)
}
</script>
