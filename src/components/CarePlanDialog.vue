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
          {{ dialogSubtitle }}
        </p>

        <div class="insurance-dialog__card-section">
          <SubsectionHeading
            icon="info"
            :title="t('carePlanSectionGeneral')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('carePlanName')"
                required
                :test-id="tid.field('name')">
                <q-input
                  v-model="local.name"
                  outlined
                  hide-bottom-space
                  counter
                  :readonly="readonly"
                  :maxlength="carePlanNameMaxLength"
                  :placeholder="t('carePlanNamePlaceholder')"
                  :error="Boolean(errors.name)"
                  :error-message="errors.name"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('status')"
                :test-id="tid.field('status')">
                <FormSelect
                  v-model="local.status"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly || local.signed"
                  :options="statusOptions"
                  :test-id="tid.field('status')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('carePlanStartDate')"
                required
                :test-id="tid.field('start-date')">
                <ClientDateField
                  v-model="local.startDate"
                  :readonly="readonly"
                  :error="Boolean(errors.startDate)"
                  :error-message="errors.startDate"
                  :close-label="t('close')"
                  :test-id="tid.field('start-date')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('carePlanTargetDate')"
                :test-id="tid.field('target-date')">
                <ClientDateField
                  v-model="local.targetDate"
                  :readonly="readonly"
                  :error="Boolean(errors.targetDate)"
                  :error-message="errors.targetDate"
                  :close-label="t('close')"
                  :test-id="tid.field('target-date')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('carePlanClinician')"
                required
                :test-id="tid.field('clinician')">
                <FormSelect
                  v-model="local.clinicianId"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly"
                  :options="clinicianOptions"
                  :placeholder="t('carePlanClinicianPlaceholder')"
                  :error="Boolean(errors.clinicianId)"
                  :error-message="errors.clinicianId"
                  :test-id="tid.field('clinician')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('carePlanPriority')"
                required
                :test-id="tid.field('priority')">
                <FormSelect
                  v-model="local.priority"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly"
                  :options="priorityOptions"
                  :test-id="tid.field('priority')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="medical_information"
            :title="t('carePlanSectionProblem')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12">
              <AddClientLabeledField
                :label="t('carePlanProblem')"
                required
                :test-id="tid.field('problem')">
                <q-input
                  v-model="local.problem"
                  outlined
                  hide-bottom-space
                  counter
                  :readonly="readonly"
                  :maxlength="carePlanProblemMaxLength"
                  :placeholder="t('carePlanProblemPlaceholder')"
                  :error="Boolean(errors.problem)"
                  :error-message="errors.problem"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12">
              <AddClientLabeledField
                :label="t('description')"
                :test-id="tid.field('description')">
                <q-input
                  v-model="local.description"
                  outlined
                  hide-bottom-space
                  type="textarea"
                  autogrow
                  counter
                  :readonly="readonly"
                  :maxlength="carePlanDescriptionMaxLength"
                  :placeholder="t('carePlanDescriptionPlaceholder')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <CarePlanGoalsTable
            :goals="local.goals"
            :readonly="readonly"
            @add="openGoalDialog('add')"
            @view="row => openGoalDialog('view', row)"
            @edit="row => openGoalDialog('edit', row)"
            @delete="removeGoal"
          />
        </div>

        <div
          v-if="showSignatureSection"
          class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="draw"
            :title="t('carePlanSectionSignature')"
          />
          <SignatureCanvas
            ref="signatureCanvasRef"
            v-model="local.signature"
            :readonly="readonly || local.signed"
            class="q-mt-md"
          />
          <p
            v-if="errors.signature"
            class="text-negative text-caption q-mt-xs q-mb-none">
            {{ errors.signature }}
          </p>
          <p
            v-if="local.signed && local.signedAt"
            class="text-caption text-grey-7 q-mt-sm q-mb-none">
            {{ t('carePlanSignedAt', {
              date: formatSignedDate(local.signedAt),
            }) }}
          </p>
        </div>

        <div
          v-if="local.signed && measureRows.length"
          class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="show_chart"
            :title="t('carePlanSectionRecordProgress')"
          />
          <div
            v-for="row in measureRows"
            :key="row.measure.id"
            class="row q-col-gutter-md q-mb-md items-end">
            <div class="col-grow">
              <AddClientLabeledField
                :label="row.measure.measureName"
                :test-id="tid.field(`measure-current-${row.measure.id}`)">
                <q-input
                  v-model="row.draftValue"
                  outlined
                  hide-bottom-space
                  type="number"
                  :placeholder="t('carePlanMeasureCurrentPlaceholder')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-auto">
              <q-btn
                no-caps
                unelevated
                color="primary"
                class="app-btn-primary"
                :label="t('carePlanRecordMeasurement')"
                @click="emitRecordProgress(row)"
              />
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <GenerateDocumentAction
          v-if="readonly && local.id && clientId"
          :document-type="documentTypes.carePlan"
          :context="{
            clientId,
            carePlanId: local.id,
          }"
          flat
          :label="t('generateDocumentAction')"
          button-class="app-btn-outline q-mr-sm"
        />
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="readonly ? t('close') : t('cancel')"
          @click="onCancel"
        />
        <template v-if="!readonly">
          <q-btn
            v-if="canSign && !local.signed"
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :loading="saving"
            :label="t('save')"
            @click="onSave(false)"
          />
          <q-btn
            v-if="canSign && !local.signed"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :loading="saving"
            :label="t('carePlanSaveActivate')"
            @click="onSave(true)"
          />
          <q-btn
            v-else
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :loading="saving"
            :label="t('save')"
            @click="onSave(false)"
          />
        </template>
      </q-card-actions>
    </q-card>

    <CarePlanGoalDialog
      v-model="goalDialogOpen"
      :goal="activeGoal"
      :mode="goalDialogMode"
      :clinician-options="clinicianOptions"
      @save="onGoalSaved"
    />
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import SignatureCanvas from 'components/SignatureCanvas.vue'
import CarePlanGoalsTable from 'components/CarePlanGoalsTable.vue'
import CarePlanGoalDialog from 'components/CarePlanGoalDialog.vue'
import GenerateDocumentAction from
  'components/documents/GenerateDocumentAction.vue'
import {
  carePlanDescriptionMaxLength,
  carePlanNameMaxLength,
  carePlanProblemMaxLength,
  carePlanPriorities,
  carePlanStatuses,
  quasarNotifyTypes,
} from 'components/constants.js'
import {
  cloneCarePlan,
  createEmptyCarePlan,
  createEmptyCarePlanGoal,
  nextCarePlanLocalId,
  refreshCarePlanProgress,
} from 'src/utils/care-plan-orders.js'
import { carePlanI18nKey } from 'src/utils/care-plan-i18n.js'
import { carePlanTestIds as tid } from 'src/test-ids/index.js'
import { documentTypes } from 'src/utils/document-generation-constants.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  clientId: {
    type: [String, Number],
    default: null,
  },
  plan: {
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
  canSign: {
    type: Boolean,
    default: true,
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'save',
  'cancel',
  'record-progress',
])

const { t } = useI18n()
const $q = useQuasar()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const local = ref(createEmptyCarePlan())
const errors = reactive({})

const readonly = computed(() => props.mode === 'view'
  || local.value.signed
  || local.value.status === carePlanStatuses.completed
  || local.value.status === carePlanStatuses.archived)

const goalDialogOpen = ref(false)
const goalDialogMode = ref('add')
const activeGoal = ref(null)
const signatureCanvasRef = ref(null)

const dialogTitle = computed(() => {
  if (props.mode === 'view') {
    return t('carePlanViewTitle')
  }
  if (props.mode === 'edit') {
    return t('carePlanEditTitle')
  }

  return t('carePlanAddTitle')
})

const dialogSubtitle = computed(() => {
  if (props.mode === 'view') {
    return t('carePlanViewSubtitle')
  }

  return t('carePlanAddSubtitle')
})

const statusOptions = computed(() =>
  Object.values(carePlanStatuses).map(value => ({
    label: t(carePlanI18nKey('carePlanStatus', value)),
    value,
  })),
)

const priorityOptions = computed(() =>
  Object.values(carePlanPriorities).map(value => ({
    label: t(carePlanI18nKey('carePlanPriority', value)),
    value,
  })),
)

const showSignatureSection = computed(
  () => props.mode !== 'view' || local.value.signed || local.value.signature,
)

const measureRows = computed(() => {
  const rows = []
  for (const goal of local.value.goals ?? []) {
    for (const measure of goal.outcomeMeasures ?? []) {
      rows.push({
        goal,
        measure,
        draftValue: measure.currentValue ?? '',
      })
    }
  }

  return rows
})

watch(
  () => [props.modelValue, props.plan],
  () => {
    if (props.modelValue) {
      local.value = cloneCarePlan(props.plan ?? createEmptyCarePlan())
      Object.keys(errors).forEach(key => delete errors[key])
      void nextTick(() => {
        signatureCanvasRef.value?.resize?.()
      })
    }
  },
  { immediate: true },
)

function formatSignedDate(value) {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

function validate(activate) {
  Object.keys(errors).forEach(key => delete errors[key])
  if (!String(local.value.name ?? '').trim()) {
    errors.name = t('carePlanNameRequired')
  }
  if (!local.value.startDate) {
    errors.startDate = t('carePlanStartDateRequired')
  }
  if (!local.value.clinicianId) {
    errors.clinicianId = t('carePlanClinicianRequired')
  }
  if (!local.value.priority) {
    errors.priority = t('carePlanPriorityRequired')
  }
  if (!String(local.value.problem ?? '').trim()) {
    errors.problem = t('carePlanProblemRequired')
  }
  if (local.value.startDate && local.value.targetDate) {
    const start = new Date(local.value.startDate)
    const target = new Date(local.value.targetDate)
    if (target < start) {
      errors.targetDate = t('carePlanTargetDateInvalid')
    }
  }
  if (activate && !local.value.signature) {
    errors.signature = t('carePlanSignatureRequired')
  }

  return !Object.keys(errors).length
}

async function onSave(activate) {
  signatureCanvasRef.value?.flush?.()
  await nextTick()
  if (!validate(activate)) {
    const firstError = Object.values(errors).find(Boolean)
    if (firstError) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: firstError,
        position: 'top',
      })
    }

    return
  }
  const payload = refreshCarePlanProgress({ ...local.value })
  emit('save', { plan: payload, activate })
}

function onCancel() {
  emit('cancel')
  open.value = false
}

function openGoalDialog(mode, row = null) {
  goalDialogMode.value = mode
  activeGoal.value = row ? { ...row } : createEmptyCarePlanGoal()
  goalDialogOpen.value = true
}

function onGoalSaved(goal) {
  const list = [...(local.value.goals ?? [])]
  const index = list.findIndex(item => item.id === goal.id)
  if (index >= 0) {
    list[index] = goal
  } else {
    list.push({ ...goal, id: goal.id || nextCarePlanLocalId('goal') })
  }
  local.value.goals = list
  local.value = refreshCarePlanProgress(local.value)
  goalDialogOpen.value = false
}

function removeGoal(row) {
  local.value.goals = (local.value.goals ?? []).filter(
    item => item.id !== row.id,
  )
  local.value = refreshCarePlanProgress(local.value)
}

function emitRecordProgress(row) {
  emit('record-progress', {
    goalId: row.goal.id,
    measureId: row.measure.id,
    currentValue: row.draftValue,
  })
}
</script>
