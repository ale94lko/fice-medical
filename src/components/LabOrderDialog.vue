<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        :info="dialogSubtitle"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section
        ref="dialogBodyScrollRef"
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div
          v-if="showInfoSection"
          class="insurance-dialog__card-section">
          <SubsectionHeading
            icon="science"
            :title="t('labSectionInfo')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('labTestName')"
                required
                :test-id="tid.field('test-name')">
                <q-select
                  v-model="local.testName"
                  outlined
                  hide-bottom-space
                  use-input
                  fill-input
                  hide-selected
                  input-debounce="200"
                  emit-value
                  map-options
                  :readonly="orderFieldsReadonly"
                  :options="testOptions"
                  :placeholder="t('labTestNamePlaceholder')"
                  :error="Boolean(errors.testName)"
                  :error-message="errorText('testName')"
                  :data-testid="tid.field('test-name')"
                  @filter="onTestFilter"
                  @update:model-value="onTestSelected"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('labCategory')"
                required
                :test-id="tid.field('category')">
                <FormSelect
                  v-model="local.category"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="orderFieldsReadonly"
                  :options="categoryOptions"
                  :error="Boolean(errors.category)"
                  :error-message="errorText('category')"
                  :test-id="tid.field('category')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('labOrderingClinician')"
                required
                :test-id="tid.field('clinician')">
                <ClinicianFormSelect
                  v-model="local.orderingClinicianId"
                  :readonly="orderFieldsReadonly"
                  :options="clinicianOptions"
                  :error="Boolean(errors.orderingClinicianId)"
                  :error-message="errorText('orderingClinicianId')"
                  :test-id="tid.field('clinician')"
                  @update:model-value="onClinicianChange"
                />
              </AddClientLabeledField>
            </div>
            <div
              v-if="!isAddMode"
              class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('status')"
                :test-id="tid.field('status')">
                <span
                  class="lab-status-badge"
                  :class="statusBadgeClass"
                  :data-testid="tid.field('status')">
                  {{ statusLabel }}
                </span>
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('labOrderedDate')"
                required
                :test-id="tid.field('ordered-date')">
                <ClientDateField
                  v-model="local.orderedDate"
                  :readonly="orderFieldsReadonly"
                  :max-today="true"
                  :error="Boolean(errors.orderedDate)"
                  :error-message="errorText('orderedDate')"
                  :test-id="tid.field('ordered-date')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('labPriority')"
                :test-id="tid.field('priority')">
                <FormSelect
                  v-model="local.priority"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  clearable
                  :readonly="orderFieldsReadonly"
                  :options="priorityOptions"
                  :test-id="tid.field('priority')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div
          v-if="showSpecimenSection"
          class="insurance-dialog__card-section"
          :class="{ 'q-mt-lg': showInfoSection }">
          <SubsectionHeading
            icon="biotech"
            :title="t('labSectionSpecimen')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('labSpecimenType')"
                :required="specimenRequired"
                :test-id="tid.field('specimen')">
                <FormSelect
                  v-model="local.specimenType"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  clearable
                  :readonly="specimenFieldsReadonly"
                  :options="specimenOptions"
                  :error="Boolean(errors.specimenType)"
                  :error-message="errorText('specimenType')"
                  :test-id="tid.field('specimen')"
                  @update:model-value="onSpecimenTypeChange"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('labCollectedDate')"
                :required="specimenRequired"
                :test-id="tid.field('collected-date')">
                <ClientDateField
                  v-model="local.collectedDate"
                  :readonly="specimenFieldsReadonly"
                  :max-today="true"
                  :error="Boolean(errors.collectedDate)"
                  :error-message="errorText('collectedDate')"
                  :test-id="tid.field('collected-date')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('labCollectionLocation')"
                :test-id="tid.field('collection-location')">
                <q-input
                  v-model="local.collectionLocation"
                  outlined
                  hide-bottom-space
                  :readonly="specimenFieldsReadonly"
                  :data-testid="tid.field('collection-location')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div
          v-if="showResultsSection"
          class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="assignment_turned_in"
            :title="t('labSectionResults')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('labResultDate')"
                :required="resultsRequired"
                :test-id="tid.field('result-date')">
                <ClientDateField
                  v-model="local.resultDate"
                  :readonly="resultsFieldsReadonly"
                  :max-today="true"
                  :error="Boolean(errors.resultDate)"
                  :error-message="errorText('resultDate')"
                  :test-id="tid.field('result-date')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('labAbnormalResult')"
                :test-id="tid.field('abnormal')">
                <FormSelect
                  v-model="local.abnormalResultManual"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  clearable
                  :readonly="resultsFieldsReadonly"
                  :options="yesNoOptions"
                  :test-id="tid.field('abnormal')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12">
              <AddClientLabeledField
                :label="t('labResultSummary')"
                :test-id="tid.field('summary')">
                <q-input
                  v-model="local.resultSummary"
                  outlined
                  hide-bottom-space
                  type="textarea"
                  autogrow
                  :readonly="resultsFieldsReadonly"
                  :maxlength="labMaxResultSummaryLength"
                  :counter="!resultsFieldsReadonly"
                  :error="Boolean(errors.resultSummary)"
                  :error-message="errorText('resultSummary')"
                  :data-testid="tid.field('summary')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div
          v-if="showReviewSection"
          class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="fact_check"
            :title="t('labSectionReview')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('labReviewedBy')"
                :required="reviewRequired"
                :test-id="tid.field('reviewed-by')">
                <ClinicianFormSelect
                  v-model="local.reviewedBy"
                  :readonly="reviewFieldsReadonly"
                  :options="clinicianOptions"
                  :error="Boolean(errors.reviewedBy)"
                  :error-message="errorText('reviewedBy')"
                  :test-id="tid.field('reviewed-by')"
                  @update:model-value="onReviewedByChange"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('labReviewedDate')"
                :required="reviewRequired"
                :test-id="tid.field('reviewed-date')">
                <ClientDateField
                  v-model="local.reviewedDate"
                  :readonly="reviewFieldsReadonly"
                  :max-today="true"
                  :error="Boolean(errors.reviewedDate)"
                  :error-message="errorText('reviewedDate')"
                  :test-id="tid.field('reviewed-date')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div
          v-if="showComponentsSection"
          class="insurance-dialog__card-section q-mt-lg">
          <div class="row items-center justify-between q-mb-md">
            <SubsectionHeading
              icon="format_list_bulleted"
              :title="t('labSectionComponents')"
            />
            <q-btn
              v-if="canEditComponents"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              icon="add"
              :label="t('labAddComponent')"
              :data-testid="tid.btn('add-component')"
              @click="openComponentDialog()"
            />
          </div>

          <AdminTablePanel
            class="lab-components-table-panel admin-table-panel--wide"
            :show-column-settings="false">
            <LabComponentsTable
              :rows="visibleComponents"
              :can-edit="canEditComponents"
              :can-delete="canEditComponents"
              :empty-label="t('labComponentsEmpty')"
              @edit="openComponentDialog"
              @delete="onDeleteComponent"
            />
          </AdminTablePanel>
        </div>

        <div
          v-if="showAttachmentsSection"
          class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="attach_file"
            :title="t('labAttachmentsTitle')"
          />
          <LabAttachmentUploadField
            class="q-mt-md"
            :attachments="local.files ?? local.attachments"
            :readonly="attachmentsReadonly"
            :test-id="tid.field('attachments')"
            @upload="onAttachmentUpload"
            @remove="onAttachmentRemove"
            @download="onAttachmentDownload"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <template v-if="showCloseOnlyFooter">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :label="t('close')"
            @click="onCancel"
          />
        </template>
        <template v-else-if="isTransitionMode">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :label="t('cancel')"
            :disable="saving"
            @click="onCancel"
          />
          <q-btn
            v-if="showPrimaryAction"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :label="primaryActionLabel"
            :disable="saving"
            :data-testid="tid.btn('advance')"
            @click="emitAction(primaryAction)"
          />
        </template>
        <template v-else-if="isAddMode">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :label="t('cancel')"
            :disable="saving"
            @click="onCancel"
          />
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :label="t('labOrderLab')"
            :disable="saving"
            :data-testid="tid.btn('save')"
            @click="emitAction('order')"
          />
        </template>
        <template v-else>
          <q-btn
            v-if="showCancelLabButton"
            no-caps
            outline
            color="negative"
            class="app-btn-outline"
            :label="t('labCancelLab')"
            :disable="saving"
            :data-testid="tid.btn('cancel-lab')"
            @click="onCancelLabClick"
          />
          <q-btn
            v-if="showPrimaryAction"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :label="primaryActionLabel"
            :disable="saving"
            :data-testid="tid.btn('advance')"
            @click="emitAction(primaryAction)"
          />
        </template>
      </q-card-actions>
    </q-card>

    <LabComponentDialog
      v-model="componentDialogOpen"
      :component="editingComponent"
      :edit-mode="Boolean(editingComponent?.id)"
      @save="onComponentSaved"
    />

    <ModalComponent
      v-model="componentDeleteOpen"
      test-id="lab-component-delete"
      :title="t('labComponentDeleteTitle')"
      :message="t('labComponentDeleteMessage')"
      :confirm-text="t('delete')"
      :cancel-text="t('cancel')"
      @confirm="onConfirmDeleteComponent"
      @cancel="onCancelDeleteComponent"
    />

    <ModalComponent
      v-model="labCancelOpen"
      test-id="lab-cancel"
      :title="t('labCancelTitle')"
      :message="t('labCancelMessage')"
      :confirm-text="t('labCancelLab')"
      :cancel-text="t('cancel')"
      @confirm="onConfirmCancelLab"
      @cancel="onDismissCancelLab"
    />
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import SubsectionHeading from './SubsectionHeading.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import ClinicianFormSelect from 'components/ClinicianFormSelect.vue'
import LabAttachmentUploadField from 'components/LabAttachmentUploadField.vue'
import LabComponentDialog from 'components/LabComponentDialog.vue'
import LabComponentsTable from 'components/LabComponentsTable.vue'
import ModalComponent from 'components/ModalComponent.vue'
import {
  labAbnormalValues,
  labCategories,
  labMaxResultSummaryLength,
  labPriorities,
  labStatuses,
} from 'components/constants.js'
import {
  LAB_TEST_OPTIONS,
  canAdvanceLabToCollect,
  canAdvanceLabToResults,
  canAdvanceLabToReview,
  canCancelLab,
  canEditLabComponents,
  canEditLabOrderFields,
  canEditLabResults,
  canEditLabReview,
  canEditLabSpecimen,
  canShowLabComponents,
  canShowLabResults,
  canShowLabReview,
  canShowLabSpecimen,
  categoryForTestName,
  cloneLab,
  computeLabAbnormalResult,
  createEmptyLabOrder,
  isLabTerminal,
  labStatusToken,
  nextLabTransitionAction,
  nextLocalId,
  resolveDefaultOrderingClinicianOption,
  validateLabCollect,
  validateLabOrder,
  validateLabPatch,
  validateLabResults,
  validateLabReview,
  visibleComponents as filterVisibleComponents,
} from 'src/utils/lab-orders.js'
import { todayDateUs } from 'src/utils/client-form.js'
import { labTestIds as tid } from 'src/test-ids/index.js'
import { labI18nKey } from 'src/utils/lab-i18n.js'
import {
  useValidationSaveFeedback,
} from 'src/composables/useValidationSaveFeedback.js'
import { useClientPermissions } from
  'src/composables/useClientPermissions.js'
import { useAuthStore } from 'src/stores/auth-store.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'add',
  },
  lab: {
    type: Object,
    default: null,
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
  intent: {
    type: String,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'save',
  'cancel',
  'upload-attachment',
  'download-attachment',
  'remove-attachment',
])

const open = defineModel({ type: Boolean, default: false })

const { t } = useI18n()
const { notifyAndScrollToValidationErrors } = useValidationSaveFeedback()
const authStore = useAuthStore()
const { canAddLabs, canEditLabs } = useClientPermissions()

const dialogBodyScrollRef = ref(null)
const local = ref(createEmptyLabOrder())
const errors = ref({})
const testFilter = ref('')
const componentDialogOpen = ref(false)
const editingComponent = ref(null)
const componentDeleteOpen = ref(false)
const pendingDeleteComponentId = ref(null)
const labCancelOpen = ref(false)

const isViewMode = computed(() => props.mode === 'view')
const isAddMode = computed(() => props.mode === 'add')

const transitionIntent = computed(() => {
  const intent = String(props.intent ?? '').trim()
  if (
    intent === 'collect'
    || intent === 'results'
    || intent === 'review'
  ) {
    return intent
  }

  return null
})

const isTransitionMode = computed(() => Boolean(transitionIntent.value))

const currentStatus = computed(() => {
  if (isAddMode.value) {
    return labStatuses.ordered
  }

  return local.value.status
})

const showCloseOnlyFooter = computed(() =>
  isViewMode.value || isLabTerminal(currentStatus.value),
)

const showInfoSection = computed(() => !isTransitionMode.value)

const showSpecimenSection = computed(() => {
  if (transitionIntent.value === 'collect') {
    return true
  }
  if (isTransitionMode.value) {
    return false
  }

  return !isAddMode.value && canShowLabSpecimen(currentStatus.value)
})

const showResultsSection = computed(() => {
  if (transitionIntent.value === 'results') {
    return true
  }
  if (isTransitionMode.value) {
    return false
  }

  return canShowLabResults(currentStatus.value)
})

const showReviewSection = computed(() => {
  if (transitionIntent.value === 'review') {
    return true
  }
  if (isTransitionMode.value) {
    return false
  }

  return canShowLabReview(currentStatus.value)
})

const showComponentsSection = computed(() => {
  if (transitionIntent.value === 'results') {
    return true
  }
  if (isTransitionMode.value) {
    return false
  }

  return canShowLabComponents(currentStatus.value)
})

const showAttachmentsSection = computed(() =>
  !isTransitionMode.value
  || transitionIntent.value === 'collect'
  || transitionIntent.value === 'results',
)

const orderFieldsReadonly = computed(() =>
  isViewMode.value || !canEditLabOrderFields(currentStatus.value),
)

const specimenFieldsReadonly = computed(() =>
  isViewMode.value || !canEditLabSpecimen(currentStatus.value),
)

const resultsFieldsReadonly = computed(() =>
  isViewMode.value || !canEditLabResults(currentStatus.value),
)

const reviewFieldsReadonly = computed(() =>
  isViewMode.value || !canEditLabReview(currentStatus.value),
)

const attachmentsReadonly = computed(() => isViewMode.value)

const canEditComponents = computed(() =>
  canEditLabComponents(currentStatus.value) && !isViewMode.value,
)

const specimenRequired = computed(() =>
  transitionIntent.value === 'collect'
  || canAdvanceLabToCollect(currentStatus.value),
)

const resultsRequired = computed(() =>
  transitionIntent.value === 'results'
  || canAdvanceLabToResults(currentStatus.value),
)

const reviewRequired = computed(() =>
  transitionIntent.value === 'review'
  || canAdvanceLabToReview(currentStatus.value),
)

const showCancelLabButton = computed(() =>
  !isAddMode.value
  && !isViewMode.value
  && !isTransitionMode.value
  && canCancelLab(currentStatus.value)
  && !isLabTerminal(currentStatus.value),
)

const primaryAction = computed(() => {
  if (isAddMode.value) {
    return 'order'
  }

  const intentAction = transitionIntent.value
  if (
    intentAction === 'collect'
    && canAdvanceLabToCollect(currentStatus.value)
  ) {
    return 'collect'
  }
  if (
    intentAction === 'results'
    && canAdvanceLabToResults(currentStatus.value)
  ) {
    return 'results'
  }
  if (
    intentAction === 'review'
    && canAdvanceLabToReview(currentStatus.value)
  ) {
    return 'review'
  }
  if (isTransitionMode.value) {
    return intentAction
  }

  return nextLabTransitionAction(currentStatus.value)
})

const showPrimaryAction = computed(() =>
  Boolean(primaryAction.value) && !showCloseOnlyFooter.value,
)

const primaryActionLabel = computed(() => {
  const action = primaryAction.value
  if (action === 'order') {
    return t('labOrderLab')
  }
  if (action === 'collect') {
    return t('labCollectLab')
  }
  if (action === 'results') {
    return t('labEnterResults')
  }
  if (action === 'review') {
    return t('labMarkReviewed')
  }

  return t('save')
})

const statusBadgeClass = computed(() =>
  `lab-status-badge--${labStatusToken(currentStatus.value).toLowerCase()}`,
)

const statusLabel = computed(() =>
  t(labI18nKey('labStatus', currentStatus.value)),
)

function applyDefaultOrderingClinician() {
  if (props.mode !== 'add' || local.value.orderingClinicianId) {
    return
  }
  const option = resolveDefaultOrderingClinicianOption(
    props.clinicianOptions,
    {
      staffMember: authStore.userInfo?.staffMember ?? null,
      canAddLabs: canAddLabs.value,
    },
  )
  if (!option) {
    return
  }
  local.value.orderingClinicianId = option.value
  local.value.orderingClinicianName = option.label
}

function applyDefaultReviewedBy() {
  if (String(props.intent ?? '').trim() !== 'review') {
    return
  }
  if (local.value.reviewedBy) {
    return
  }
  const option = resolveDefaultOrderingClinicianOption(
    props.clinicianOptions,
    {
      staffMember: authStore.userInfo?.staffMember ?? null,
      canAddLabs: canAddLabs.value || canEditLabs.value,
    },
  )
  if (!option) {
    return
  }
  local.value.reviewedBy = option.value
}

const dialogTitle = computed(() => {
  const intent = transitionIntent.value
  if (intent === 'collect') {
    return t('labCollectLab')
  }
  if (intent === 'results') {
    return t('labEnterResults')
  }
  if (intent === 'review') {
    return t('labMarkReviewed')
  }
  if (props.mode === 'view') {
    return t('labViewTitle')
  }
  if (props.mode === 'edit') {
    return t('labEditTitle')
  }

  return t('labAddTitle')
})

const dialogSubtitle = computed(() => {
  const intent = transitionIntent.value
  if (intent === 'collect') {
    return t('labCollectSubtitle')
  }
  if (intent === 'results') {
    return t('labResultsSubtitle')
  }
  if (intent === 'review') {
    return t('labReviewSubtitle')
  }
  if (props.mode === 'view') {
    return t('labViewSubtitle')
  }

  return t('labAddSubtitle')
})

const visibleComponents = computed(() =>
  filterVisibleComponents(local.value.components),
)

const categoryOptions = computed(() =>
  Object.values(labCategories).map(value => ({
    label: t(labI18nKey('labCategory', value)),
    value,
  })),
)

const priorityOptions = computed(() =>
  Object.values(labPriorities).map(value => ({
    label: t(labI18nKey('labPriority', value)),
    value,
  })),
)

const yesNoOptions = computed(() => [
  { label: t('yes'), value: labAbnormalValues.yes },
  { label: t('no'), value: labAbnormalValues.no },
])

const specimenOptions = [
  { label: 'Blood', value: 'blood' },
  { label: 'Urine', value: 'urine' },
  { label: 'Saliva', value: 'saliva' },
  { label: 'Tissue', value: 'tissue' },
]

const testOptions = computed(() => {
  const needle = testFilter.value.trim().toLowerCase()
  const base = LAB_TEST_OPTIONS.map(item => ({
    label: item.label,
    value: item.value,
  }))
  if (!needle) {
    return base
  }

  return base.filter(item => item.label.toLowerCase().includes(needle))
})

watch(
  () => [
    open.value,
    props.mode,
    props.intent,
    String(props.lab?.id ?? ''),
  ],
  () => {
    if (open.value) {
      local.value = props.lab
        ? cloneLab(props.lab)
        : createEmptyLabOrder()
      if (props.mode === 'add') {
        local.value.orderedDate = todayDateUs()
      }
      if (String(props.intent ?? '').trim() === 'results') {
        local.value.resultDate = todayDateUs()
      }
      if (String(props.intent ?? '').trim() === 'review') {
        local.value.reviewedDate = todayDateUs()
      }
      applyDefaultOrderingClinician()
      applyDefaultReviewedBy()
      errors.value = {}
      testFilter.value = ''
      labCancelOpen.value = false
    }
  },
  { immediate: true },
)

watch(
  () => props.lab?.files ?? props.lab?.attachments,
  (files) => {
    if (!open.value || !Array.isArray(files)) {
      return
    }
    const pendingLocal = (
      local.value.files ?? local.value.attachments ?? []
    ).filter(item => item?.rawFile instanceof File)
    local.value.files = [...files, ...pendingLocal]
    local.value.attachments = local.value.files
  },
)

watch(
  () => props.clinicianOptions,
  () => {
    if (open.value) {
      applyDefaultOrderingClinician()
      applyDefaultReviewedBy()
    }
  },
)

function onTestFilter(val, update) {
  testFilter.value = val
  update(() => {})
}

function onTestSelected(name) {
  const category = categoryForTestName(name)
  if (category) {
    local.value.category = category
  }
}

function onSpecimenTypeChange(value) {
  if (specimenFieldsReadonly.value) {
    return
  }
  if (String(value ?? '').trim()) {
    local.value.collectedDate = todayDateUs()
  }
}

function onReviewedByChange(value) {
  if (reviewFieldsReadonly.value) {
    return
  }
  if (String(value ?? '').trim()) {
    local.value.reviewedDate = todayDateUs()
  }
}

function onClinicianChange(id) {
  const found = props.clinicianOptions.find(item => item.value === id)
  local.value.orderingClinicianName = found?.label ?? null
}

function errorText(field) {
  const err = errors.value[field]
  if (!err) {
    return ''
  }
  if (typeof err === 'string') {
    return t(err)
  }

  return t('fieldRequired')
}

function onCancel() {
  emit('cancel')
  open.value = false
}

function validationErrorsForAction(action) {
  if (action === 'order') {
    return validateLabOrder(local.value)
  }
  if (action === 'patch') {
    return validateLabPatch(local.value, currentStatus.value)
  }
  if (action === 'collect') {
    return validateLabCollect(local.value)
  }
  if (action === 'results') {
    return validateLabResults(local.value)
  }
  if (action === 'review') {
    return validateLabReview(local.value)
  }

  return {}
}

function buildLabCopy() {
  const copy = cloneLab(local.value)
  copy.abnormalResult = computeLabAbnormalResult(
    copy.components ?? [],
    copy.abnormalResultManual,
  )
  // Pending uploads are File objects; cloneLab cannot keep them.
  copy.files = (copy.files ?? []).filter(
    item => !(item?.rawFile instanceof File),
  )
  copy.attachments = copy.files

  return copy
}

function pendingAttachmentFiles() {
  return (local.value.files ?? local.value.attachments ?? [])
    .filter(item => item?.rawFile instanceof File)
    .map(item => item.rawFile)
}

function hasServerLabId() {
  const id = String(local.value?.id ?? props.lab?.id ?? '').trim()

  return id !== '' && Number.isFinite(Number(id))
}

function attachmentList() {
  return [...(local.value.files ?? local.value.attachments ?? [])]
}

function setAttachmentList(next) {
  local.value.files = next
  local.value.attachments = next
}

async function emitAction(action) {
  errors.value = validationErrorsForAction(action)
  if (Object.keys(errors.value).length) {
    await notifyAndScrollToValidationErrors(dialogBodyScrollRef)

    return
  }
  emit('save', buildLabCopy(), {
    action,
    pendingFiles: pendingAttachmentFiles(),
  })
}

function onCancelLabClick() {
  labCancelOpen.value = true
}

function onConfirmCancelLab() {
  labCancelOpen.value = false
  emit('save', buildLabCopy(), { action: 'cancel' })
}

function onDismissCancelLab() {
  labCancelOpen.value = false
}

function openComponentDialog(component = null) {
  editingComponent.value = component
  componentDialogOpen.value = true
}

function onComponentSaved(component, another) {
  const existingIdx = local.value.components.findIndex(
    item => item.id === component.id,
  )
  const record = {
    ...component,
    id: component.id || nextLocalId('cmp'),
  }
  if (existingIdx >= 0) {
    local.value.components.splice(existingIdx, 1, record)
  } else {
    local.value.components.push(record)
  }
  if (!another) {
    editingComponent.value = null
  }
}

function removeComponent(componentId) {
  local.value.components = local.value.components.map(item => {
    if (item.id !== componentId) {
      return item
    }

    return { ...item, deletedAt: new Date().toISOString() }
  })
}

function onDeleteComponent(row) {
  pendingDeleteComponentId.value = row?.id ?? row ?? null
  if (!pendingDeleteComponentId.value) {
    return
  }
  componentDeleteOpen.value = true
}

function onConfirmDeleteComponent() {
  const id = pendingDeleteComponentId.value
  pendingDeleteComponentId.value = null
  if (id) {
    removeComponent(id)
  }
}

function onCancelDeleteComponent() {
  pendingDeleteComponentId.value = null
  componentDeleteOpen.value = false
}

function onAttachmentUpload(file) {
  if (hasServerLabId()) {
    emit('upload-attachment', file)

    return
  }
  const next = attachmentList()
  next.push({
    id: nextLocalId('lab-file'),
    name: file.name,
    originalFilename: file.name,
    contentType: file.type || null,
    fileSize: file.size ?? 0,
    rawFile: file,
  })
  setAttachmentList(next)
}

function onAttachmentRemove(attachmentId) {
  const current = attachmentList()
  const item = current.find(
    file => String(file.id) === String(attachmentId),
  )
  if (item?.rawFile instanceof File || !hasServerLabId()) {
    setAttachmentList(
      current.filter(file => String(file.id) !== String(attachmentId)),
    )

    return
  }
  emit('remove-attachment', attachmentId)
}

function onAttachmentDownload(attachmentId) {
  emit('download-attachment', attachmentId)
}
</script>

<style lang="scss" scoped>
.lab-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
}

.lab-status-badge--ordered {
  background: #e0f2fe;
  color: #0369a1;
}

.lab-status-badge--collected {
  background: #fef3c7;
  color: #b45309;
}

.lab-status-badge--resulted {
  background: #dcfce7;
  color: #166534;
}

.lab-status-badge--reviewed {
  background: #dbeafe;
  color: #1d4ed8;
}

.lab-status-badge--cancelled {
  background: #fee2e2;
  color: #b91c1c;
}
</style>
