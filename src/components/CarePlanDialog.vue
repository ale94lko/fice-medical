<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        test-id="care-plan"
        :close-label="t('close')"
        :info="dialogSubtitle"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
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
                  :readonly="generalReadonly"
                  :maxlength="carePlanNameMaxLength"
                  :placeholder="t('carePlanNamePlaceholder')"
                  :error="Boolean(errors.name)"
                  :error-message="errors.name"
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
                  :readonly="generalReadonly"
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
                  :readonly="generalReadonly"
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
                <ClinicianFormSelect
                  v-model="local.clinicianId"
                  :readonly="generalReadonly"
                  :options="clinicianOptions"
                  :placeholder="t('carePlanClinicianPlaceholder')"
                  :error="Boolean(errors.clinicianId)"
                  :error-message="errors.clinicianId"
                  :test-id="tid.field('clinician')"
                  @update:model-value="onClinicianChange"
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
                  :readonly="generalReadonly"
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
                  :readonly="generalReadonly"
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
                  :readonly="generalReadonly"
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
            :plan="local"
            :mode="mode"
            @add="openGoalDialog('add')"
            @view="row => openGoalDialog('view', row)"
            @edit="row => openGoalDialog('edit', row)"
            @delete="removeGoal"
            @discontinue="openDiscontinueGoal"
            @replace="openReplaceGoal"
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
            :key="signatureCanvasKey"
            ref="signatureCanvasRef"
            v-model="local.signature"
            :readonly="signatureReadonly"
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
          v-if="isActive && local.signed && measureRows.length"
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
                :data-testid="tid.btn('record-measurement')"
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
          :label="closeActionLabel"
          :data-testid="showSaveActions ? tid.btn('cancel') : tid.btn('close')"
          @click="onCancel"
        />
        <template v-if="showSaveActions">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :loading="saving"
            :label="t('save')"
            :data-testid="tid.btn('save')"
            @click="onSave(false)"
          />
          <q-btn
            v-if="canActivatePlan"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :loading="saving"
            :label="t('carePlanSaveActivate')"
            :data-testid="tid.btn('sign')"
            @click="onSave(true)"
          />
        </template>
      </q-card-actions>
    </q-card>

    <CarePlanGoalDialog
      v-model="goalDialogOpen"
      :goal="activeGoal"
      :mode="goalDialogMode"
      :clinician-options="clinicianOptions"
      :can-record-measurement="goalCanRecordMeasurement"
      :can-add-intervention="goalCanAddIntervention"
      @save="onGoalSaved"
      @record-progress="onGoalRecordProgress"
      @add-intervention="onGoalAddIntervention"
    />
    <CarePlanReasonDialog
      v-model="reasonDialogOpen"
      :title="reasonDialogTitle"
      :message="reasonDialogMessage"
      :reason-label="reasonDialogLabel"
      :confirm-label="reasonDialogConfirm"
      :reason-field="reasonDialogField"
      @confirm="onGoalReasonConfirm"
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
import ClinicianFormSelect from 'components/ClinicianFormSelect.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import SignatureCanvas from 'components/SignatureCanvas.vue'
import CarePlanGoalsTable from 'components/CarePlanGoalsTable.vue'
import CarePlanGoalDialog from 'components/CarePlanGoalDialog.vue'
import CarePlanReasonDialog from 'components/CarePlanReasonDialog.vue'
import GenerateDocumentAction from
  'components/documents/GenerateDocumentAction.vue'
import {
  carePlanDescriptionMaxLength,
  carePlanGoalStatuses,
  carePlanNameMaxLength,
  carePlanProblemMaxLength,
  carePlanPriorities,
  quasarNotifyTypes,
} from 'components/constants.js'
import {
  cloneCarePlan,
  cloneGoalForReplace,
  createEmptyCarePlan,
  createEmptyCarePlanGoal,
  isServerNumericId,
  nextCarePlanLocalId,
  refreshCarePlanProgress,
  resolveClinicianOptionLabel,
  resolveDefaultResponsibleClinicianOption,
} from 'src/utils/care-plan-orders.js'
import {
  canAddCarePlanGoals,
  canRecordGoalMeasurement,
  isCarePlanActive,
  isCarePlanDraft,
  isCarePlanTerminal,
  isGoalInProgress,
} from 'src/utils/care-plan-lifecycle.js'
import { formatDateTime } from 'src/utils/app-datetime.js'
import { carePlanI18nKey } from 'src/utils/care-plan-i18n.js'
import { carePlanTestIds as tid } from 'src/test-ids/index.js'
import { documentTypes } from 'src/utils/document-generation-constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'

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
  'save-goal',
  'discontinue-goal',
  'replace-goal',
  'add-intervention',
])

const { t } = useI18n()
const $q = useQuasar()
const authStore = useAuthStore()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const local = ref(createEmptyCarePlan())
const errors = reactive({})

const isDraft = computed(() => isCarePlanDraft(local.value.status))
const isActive = computed(() => isCarePlanActive(local.value.status))
const isTerminal = computed(() => isCarePlanTerminal(local.value.status))
const readonly = computed(() => props.mode === 'view' || isTerminal.value)
const isNewPlan = computed(() => !isServerNumericId(local.value.id))
const generalReadonly = computed(() =>
  props.mode === 'view'
    || isTerminal.value
    || (!isDraft.value && !isNewPlan.value),
)
const signatureReadonly = computed(() =>
  props.mode === 'view'
    || Boolean(local.value.signed)
    || (!isDraft.value && !isNewPlan.value)
    || isTerminal.value,
)
const persistImmediately = computed(() =>
  isActive.value && isServerNumericId(local.value.id),
)
const showSaveActions = computed(() =>
  props.mode !== 'view'
    && !isTerminal.value
    && (isDraft.value || isNewPlan.value),
)
const canActivatePlan = computed(() =>
  props.canSign && showSaveActions.value && !local.value.signed,
)
const closeActionLabel = computed(() =>
  showSaveActions.value ? t('cancel') : t('close'),
)

const goalDialogOpen = ref(false)
const goalDialogMode = ref('add')
const activeGoal = ref(null)
const signatureCanvasRef = ref(null)
const reasonDialogOpen = ref(false)
const reasonDialogKind = ref('discontinue')
const reasonTargetGoal = ref(null)
const pendingReplaceReason = ref('')

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

const priorityOptions = computed(() =>
  Object.values(carePlanPriorities).map(value => ({
    label: t(carePlanI18nKey('carePlanPriority', value)),
    value,
  })),
)

const showSignatureSection = computed(
  () => isDraft.value
    || isNewPlan.value
    || local.value.signed
    || local.value.signature,
)

const goalCanRecordMeasurement = computed(() =>
  canRecordGoalMeasurement(local.value, activeGoal.value),
)

const goalCanAddIntervention = computed(() =>
  goalDialogMode.value === 'view'
    && canAddCarePlanGoals(local.value, props.mode)
    && isGoalInProgress(activeGoal.value?.status),
)

const reasonDialogTitle = computed(() => {
  if (reasonDialogKind.value === 'replace') {
    return t('carePlanGoalReplaceTitle')
  }

  return t('carePlanGoalDiscontinueTitle')
})

const reasonDialogMessage = computed(() => {
  if (reasonDialogKind.value === 'replace') {
    return t('carePlanGoalReplaceMessage')
  }

  return t('carePlanGoalDiscontinueMessage')
})

const reasonDialogLabel = computed(() => {
  if (reasonDialogKind.value === 'replace') {
    return t('carePlanGoalReplaceReasonLabel')
  }

  return t('carePlanGoalDiscontinueReasonLabel')
})

const reasonDialogConfirm = computed(() => {
  if (reasonDialogKind.value === 'replace') {
    return t('continue')
  }

  return t('carePlanActionDiscontinueGoal')
})

const reasonDialogField = computed(() => {
  if (reasonDialogKind.value === 'replace') {
    return 'replace-reason'
  }

  return 'discontinue-reason'
})

const signatureCanvasKey = computed(() =>
  `${local.value.id ?? 'new'}-${local.value.signed ? '1' : '0'}`,
)

const measureRows = computed(() => {
  const rows = []
  for (const goal of local.value.goals ?? []) {
    if (!isGoalInProgress(goal.status)) {
      continue
    }
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

function applyDefaultClinician() {
  if (props.mode !== 'add' || local.value.clinicianId) {
    return
  }
  const option = resolveDefaultResponsibleClinicianOption(
    props.clinicianOptions,
    { staffMember: authStore.userInfo?.staffMember ?? null },
  )
  if (!option) {
    return
  }
  local.value.clinicianId = option.value
  local.value.clinicianName = option.label || option.name || ''
}

function onClinicianChange(id) {
  local.value.clinicianName = resolveClinicianOptionLabel(
    props.clinicianOptions,
    id,
  )
}

watch(
  () => [props.modelValue, props.plan, props.mode],
  () => {
    if (props.modelValue) {
      local.value = cloneCarePlan(props.plan ?? createEmptyCarePlan())
      applyDefaultClinician()
      if (
        local.value.clinicianId
        && !String(local.value.clinicianName ?? '').trim()
      ) {
        onClinicianChange(local.value.clinicianId)
      }
      Object.keys(errors).forEach(key => delete errors[key])
      syncActiveGoalFromPlan()
      void nextTick(() => {
        signatureCanvasRef.value?.resize?.()
      })
    }
  },
  { immediate: true },
)

watch(
  () => props.clinicianOptions,
  () => {
    if (!open.value) {
      return
    }
    applyDefaultClinician()
    if (
      local.value.clinicianId
      && !String(local.value.clinicianName ?? '').trim()
    ) {
      onClinicianChange(local.value.clinicianId)
    }
  },
)

function formatSignedDate(value) {
  if (!value) {
    return '—'
  }

  return formatDateTime(value) || value
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
  const clinicianName = String(local.value.clinicianName ?? '').trim()
    || resolveClinicianOptionLabel(
      props.clinicianOptions,
      local.value.clinicianId,
    )
  const payload = refreshCarePlanProgress({
    ...local.value,
    clinicianName,
  })
  emit('save', { plan: payload, activate })
}

function onCancel() {
  emit('cancel')
  open.value = false
}

function openGoalDialog(mode, row = null, options = {}) {
  if (!options.keepReplaceReason) {
    pendingReplaceReason.value = ''
  }
  goalDialogMode.value = mode
  if (row) {
    activeGoal.value = { ...row }
  } else {
    activeGoal.value = {
      ...createEmptyCarePlanGoal(),
      targetDate: String(local.value.targetDate ?? '').trim(),
    }
  }
  goalDialogOpen.value = true
}

function syncActiveGoalFromPlan() {
  if (!goalDialogOpen.value || activeGoal.value?.id == null) {
    return
  }
  const next = (local.value.goals ?? []).find(
    item => String(item.id) === String(activeGoal.value.id),
  )
  if (next) {
    activeGoal.value = { ...next }
  }
}

function upsertLocalGoal(goal) {
  const list = [...(local.value.goals ?? [])]
  const index = list.findIndex(item => item.id === goal.id)
  if (index >= 0) {
    list[index] = goal
  } else {
    list.push({ ...goal, id: goal.id || nextCarePlanLocalId('goal') })
  }
  local.value.goals = list
  local.value = refreshCarePlanProgress(local.value)
}

function applyLocalReplace(previous, nextGoal, reason) {
  const newGoal = {
    ...nextGoal,
    id: nextGoal.id || nextCarePlanLocalId('goal'),
    status: carePlanGoalStatuses.inProgress,
    replacesGoalId: previous.id,
    replacesGoalTitle: previous.title || '',
    replaceReason: reason,
  }
  const updatedPrevious = {
    ...previous,
    status: carePlanGoalStatuses.discontinued,
    discontinueReason: reason,
    replacedByGoalId: newGoal.id,
  }
  local.value.goals = (local.value.goals ?? []).map(item =>
    (item.id === previous.id ? updatedPrevious : item),
  )
  upsertLocalGoal(newGoal)
}

function onGoalSaved(goal) {
  const replaceReason = String(
    goal.replaceReason || pendingReplaceReason.value || '',
  ).trim()
  pendingReplaceReason.value = ''
  if (goal.replacesGoalId && replaceReason) {
    if (persistImmediately.value) {
      emit('replace-goal', {
        previousGoal: reasonTargetGoal.value,
        goal: { ...goal, replaceReason },
        replaceReason,
      })
    } else {
      const previous = (local.value.goals ?? []).find(
        item => String(item.id) === String(goal.replacesGoalId),
      )
      if (previous) {
        applyLocalReplace(previous, goal, replaceReason)
      } else {
        upsertLocalGoal(goal)
      }
    }
    goalDialogOpen.value = false
    return
  }
  if (persistImmediately.value && !isServerNumericId(goal.id)) {
    emit('save-goal', goal)
    goalDialogOpen.value = false
    return
  }
  upsertLocalGoal(goal)
  goalDialogOpen.value = false
}

function removeGoal(row) {
  local.value.goals = (local.value.goals ?? []).filter(
    item => item.id !== row.id,
  )
  local.value = refreshCarePlanProgress(local.value)
}

function openDiscontinueGoal(row) {
  reasonDialogKind.value = 'discontinue'
  reasonTargetGoal.value = row
  reasonDialogOpen.value = true
}

function openReplaceGoal(row) {
  reasonDialogKind.value = 'replace'
  reasonTargetGoal.value = row
  reasonDialogOpen.value = true
}

function onGoalReasonConfirm(reason) {
  const row = reasonTargetGoal.value
  if (!row) {
    return
  }
  if (reasonDialogKind.value === 'discontinue') {
    if (persistImmediately.value) {
      emit('discontinue-goal', { goal: row, reason })
      return
    }
    upsertLocalGoal({
      ...row,
      status: carePlanGoalStatuses.discontinued,
      discontinueReason: reason,
    })
    return
  }
  pendingReplaceReason.value = reason
  openGoalDialog('add', {
    ...cloneGoalForReplace(row),
    replaceReason: reason,
  }, { keepReplaceReason: true })
}

function onGoalRecordProgress(payload) {
  emit('record-progress', payload)
}

function onGoalAddIntervention(payload) {
  emit('add-intervention', payload)
}

function emitRecordProgress(row) {
  emit('record-progress', {
    goalId: row.goal.id,
    measureId: row.measure.id,
    currentValue: row.draftValue,
  })
}
</script>
