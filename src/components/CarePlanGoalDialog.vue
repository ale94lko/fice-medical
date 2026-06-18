<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader :close-label="t('close')" @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mt-none q-mb-md">
          {{ t('carePlanGoalSubtitle') }}
        </p>

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
            <div class="col-12 col-md-4">
              <AddClientLabeledField
                :label="t('status')"
                required
                :test-id="tid.field('goal-status')">
                <FormSelect
                  v-model="local.status"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly"
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
          <SubsectionHeading
            icon="show_chart"
            :title="t('carePlanGoalSectionProgress')"
          />
          <p class="text-body2 text-grey-7 q-mb-md">
            {{ t('carePlanGoalProgressHint') }}
          </p>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <AddClientLabeledField
                :label="t('carePlanGoalBaseline')"
                :test-id="tid.field('goal-baseline')">
                <q-input
                  v-model="local.baseline"
                  outlined
                  hide-bottom-space
                  type="number"
                  :readonly="readonly"
                  :placeholder="t('carePlanGoalBaselinePlaceholder')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-4">
              <AddClientLabeledField
                :label="t('carePlanGoalTarget')"
                :test-id="tid.field('goal-target')">
                <q-input
                  v-model="local.target"
                  outlined
                  hide-bottom-space
                  type="number"
                  :readonly="readonly"
                  :placeholder="t('carePlanGoalTargetPlaceholder')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-4">
              <AddClientLabeledField
                :label="t('carePlanMeasureDirection')"
                :test-id="tid.field('goal-direction')">
                <FormSelect
                  v-model="local.direction"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly"
                  :options="directionOptions"
                  :test-id="tid.field('goal-direction')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <div class="row items-center justify-between q-mb-sm">
            <SubsectionHeading
              icon="analytics"
              :title="t('carePlanGoalSectionMeasures')"
            />
            <q-btn
              v-if="!readonly"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              icon="add"
              :label="t('carePlanAddMeasure')"
              @click="openMeasureDialog('add')"
            />
          </div>
          <MeasureTable
            :rows="local.outcomeMeasures"
            :readonly="readonly"
            @edit="row => openMeasureDialog('edit', row)"
            @view="row => openMeasureDialog('view', row)"
            @delete="removeMeasure"
          />
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <div class="row items-center justify-between q-mb-sm">
            <SubsectionHeading
              icon="list_alt"
              :title="t('carePlanGoalSectionInterventions')"
            />
            <q-btn
              v-if="!readonly"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              icon="add"
              :label="t('carePlanAddIntervention')"
              @click="openInterventionDialog('add')"
            />
          </div>
          <InterventionTable
            :rows="local.interventions"
            :readonly="readonly"
            @edit="row => openInterventionDialog('edit', row)"
            @view="row => openInterventionDialog('view', row)"
            @delete="removeIntervention"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="readonly ? t('close') : t('cancel')"
          @click="onCancel"
        />
        <template v-if="!readonly">
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :label="t('carePlanSaveGoal')"
            @click="onSave"
          />
        </template>
      </q-card-actions>
    </q-card>

    <CarePlanOutcomeMeasureDialog
      v-model="measureDialogOpen"
      :measure="activeMeasure"
      :mode="measureDialogMode"
      @save="onMeasureSaved"
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
import CarePlanOutcomeMeasureDialog from
  'components/CarePlanOutcomeMeasureDialog.vue'
import CarePlanInterventionDialog from
  'components/CarePlanInterventionDialog.vue'
import MeasureTable from 'components/CarePlanMeasureTable.vue'
import InterventionTable from 'components/CarePlanInterventionTable.vue'
import {
  carePlanDescriptionMaxLength,
  carePlanGoalStatuses,
  carePlanGoalTitleMaxLength,
  carePlanPriorities,
  carePlanProgressDirections,
} from 'components/constants.js'
import {
  createEmptyCarePlanGoal,
  createEmptyIntervention,
  createEmptyOutcomeMeasure,
  nextCarePlanLocalId,
  refreshGoalProgress,
} from 'src/utils/care-plan-orders.js'
import { carePlanI18nKey } from 'src/utils/care-plan-i18n.js'
import { carePlanTestIds as tid } from 'src/test-ids/index.js'

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
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const readonly = computed(() => props.mode === 'view')
const local = ref(createEmptyCarePlanGoal())
const errors = reactive({})

const measureDialogOpen = ref(false)
const measureDialogMode = ref('add')
const activeMeasure = ref(null)

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

const directionOptions = computed(() => [
  {
    label: t('carePlanDirectionLower'),
    value: carePlanProgressDirections.lowerIsBetter,
  },
  {
    label: t('carePlanDirectionHigher'),
    value: carePlanProgressDirections.higherIsBetter,
  },
])

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
  if (index >= 0) {
    list[index] = intervention
  } else {
    list.push({
      ...intervention,
      id: intervention.id || nextCarePlanLocalId('intervention'),
    })
  }
  local.value.interventions = list
  interventionDialogOpen.value = false
}

function removeIntervention(row) {
  local.value.interventions = (local.value.interventions ?? [])
    .filter(item => item.id !== row.id)
}
</script>
