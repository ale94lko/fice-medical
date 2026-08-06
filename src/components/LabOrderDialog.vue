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

      <q-card-section
        ref="dialogBodyScrollRef"
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mt-none q-mb-md">
          {{ dialogSubtitle }}
        </p>

        <div class="insurance-dialog__card-section">
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
                :readonly="readonly"
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
                :readonly="readonly"
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
                :readonly="readonly"
                :options="clinicianOptions"
                :error="Boolean(errors.orderingClinicianId)"
                :error-message="errorText('orderingClinicianId')"
                :test-id="tid.field('clinician')"
                @update:model-value="onClinicianChange"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('status')"
              required
              :test-id="tid.field('status')">
              <FormSelect
                v-model="local.status"
                outlined
                hide-bottom-space
                emit-value
                map-options
                :readonly="readonly"
                :options="statusOptions"
                :error="Boolean(errors.status)"
                :error-message="errorText('status')"
                :test-id="tid.field('status')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('labOrderedDate')"
              required
              :test-id="tid.field('ordered-date')">
              <ClientDateField
                v-model="local.orderedDate"
                :readonly="readonly"
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
                :readonly="readonly"
                :options="priorityOptions"
                :test-id="tid.field('priority')"
              />
            </AddClientLabeledField>
          </div>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg
          lab-order-dialog__accordion">
          <AccordionSection
            v-model="specimenExpanded"
            boxed
            icon="biotech"
            :title="t('labSectionSpecimen')"
            :badge="specimenBadge"
            section-test-id="lab-section-specimen"
            toggle-test-id="lab-section-specimen-toggle">
            <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('labSpecimenType')"
              :test-id="tid.field('specimen')">
              <FormSelect
                v-model="local.specimenType"
                outlined
                hide-bottom-space
                emit-value
                map-options
                clearable
                :readonly="readonly"
                :options="specimenOptions"
                :test-id="tid.field('specimen')"
                @update:model-value="onSpecimenTypeChange"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('labCollectedDate')"
              :test-id="tid.field('collected-date')">
              <ClientDateField
                v-model="local.collectedDate"
                :readonly="readonly"
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
                :readonly="readonly"
                :data-testid="tid.field('collection-location')"
              />
            </AddClientLabeledField>
          </div>
            </div>
          </AccordionSection>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg
          lab-order-dialog__accordion">
          <AccordionSection
            v-model="resultsExpanded"
            boxed
            icon="assignment_turned_in"
            :title="t('labSectionResults')"
            :badge="resultsBadge"
            section-test-id="lab-section-results"
            toggle-test-id="lab-section-results-toggle">
            <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('labResultDate')"
              :test-id="tid.field('result-date')">
              <ClientDateField
                v-model="local.resultDate"
                :readonly="readonly"
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
                :readonly="readonly"
                :options="yesNoOptions"
                :test-id="tid.field('abnormal')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('labReviewedBy')"
              :test-id="tid.field('reviewed-by')">
              <ClinicianFormSelect
                v-model="local.reviewedBy"
                clearable
                :readonly="readonly"
                :options="clinicianOptions"
                :test-id="tid.field('reviewed-by')"
                @update:model-value="onReviewedByChange"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('labReviewedDate')"
              :test-id="tid.field('reviewed-date')">
              <ClientDateField
                v-model="local.reviewedDate"
                :readonly="readonly"
                :max-today="true"
                :error="Boolean(errors.reviewedDate)"
                :error-message="errorText('reviewedDate')"
                :test-id="tid.field('reviewed-date')"
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
                :readonly="readonly"
                :maxlength="labMaxResultSummaryLength"
                :counter="!readonly"
                :data-testid="tid.field('summary')"
              />
            </AddClientLabeledField>
          </div>
            </div>
          </AccordionSection>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <div class="row items-center justify-between q-mb-md">
          <SubsectionHeading
            icon="format_list_bulleted"
            :title="t('labSectionComponents')"
          />
          <q-btn
            v-if="!readonly"
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
            :can-edit="!readonly"
            :can-delete="!readonly"
            :empty-label="t('labComponentsEmpty')"
            @edit="openComponentDialog"
            @delete="onDeleteComponent"
          />
        </AdminTablePanel>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="attach_file"
            :title="t('labAttachmentsTitle')"
          />
          <LabAttachmentUploadField
            class="q-mt-md"
            :attachments="local.files ?? local.attachments"
            :readonly="readonly"
            :test-id="tid.field('attachments')"
            @upload="onAttachmentUpload"
            @remove="onAttachmentRemove"
            @download="onAttachmentDownload"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="readonly ? t('close') : t('cancel')"
          @click="onCancel"
        />
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('save')"
          :data-testid="tid.btn('save')"
          @click="emitSave"
        />
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
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AccordionSection from 'components/AccordionSection.vue'
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
  categoryForTestName,
  cloneLab,
  computeLabAbnormalResult,
  createEmptyLabOrder,
  hasLabResultsInfo,
  hasLabSpecimenInfo,
  nextLocalId,
  resolveDefaultOrderingClinicianOption,
  validateLabOrder,
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
const { canAddLabs } = useClientPermissions()

const dialogBodyScrollRef = ref(null)
const local = ref(createEmptyLabOrder())
const errors = ref({})
const testFilter = ref('')
const componentDialogOpen = ref(false)
const editingComponent = ref(null)
const componentDeleteOpen = ref(false)
const pendingDeleteComponentId = ref(null)
const specimenExpanded = ref(false)
const resultsExpanded = ref(false)

const readonly = computed(() => props.mode === 'view')

const specimenHasInfo = computed(() => hasLabSpecimenInfo(local.value))
const resultsHasInfo = computed(() => hasLabResultsInfo(local.value))

const specimenBadge = computed(() =>
  specimenHasInfo.value ? '' : t('labSpecimenNotCollected'),
)

const resultsBadge = computed(() =>
  resultsHasInfo.value ? '' : t('labResultsEmpty'),
)

function syncOptionalSectionExpanded() {
  specimenExpanded.value = specimenHasInfo.value
  resultsExpanded.value = resultsHasInfo.value
}

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

const dialogTitle = computed(() => {
  if (props.mode === 'view') {
    return t('labViewTitle')
  }
  if (props.mode === 'edit') {
    return t('labEditTitle')
  }

  return t('labAddTitle')
})

const dialogSubtitle = computed(() => {
  if (props.mode === 'view') {
    return t('labViewSubtitle')
  }

  return t('labAddSubtitle')
})

const visibleComponents = computed(() =>
  filterVisibleComponents(local.value.components),
)

const statusOptions = computed(() =>
  Object.values(labStatuses).map(value => ({
    label: t(labI18nKey('labStatus', value)),
    value,
  })),
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
  () => [open.value, props.lab, props.mode],
  () => {
    if (open.value) {
      local.value = props.lab
        ? cloneLab(props.lab)
        : createEmptyLabOrder()
      if (props.mode === 'add') {
        local.value.orderedDate = todayDateUs()
      }
      applyDefaultOrderingClinician()
      syncOptionalSectionExpanded()
      errors.value = {}
      testFilter.value = ''
    }
  },
  { immediate: true },
)

watch(
  () => props.clinicianOptions,
  () => {
    if (open.value) {
      applyDefaultOrderingClinician()
    }
  },
)

watch(specimenHasInfo, hasInfo => {
  if (!hasInfo) {
    specimenExpanded.value = false
  }
})

watch(resultsHasInfo, hasInfo => {
  if (!hasInfo) {
    resultsExpanded.value = false
  }
})

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
  if (readonly.value) {
    return
  }
  if (String(value ?? '').trim()) {
    local.value.collectedDate = todayDateUs()
  }
}

function onReviewedByChange(value) {
  if (readonly.value) {
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

async function emitSave() {
  errors.value = validateLabOrder(local.value)
  if (Object.keys(errors.value).length) {
    await notifyAndScrollToValidationErrors(dialogBodyScrollRef)

    return
  }
  const copy = cloneLab(local.value)
  copy.abnormalResult = computeLabAbnormalResult(
    copy.components ?? [],
    copy.abnormalResultManual,
  )
  emit('save', copy)
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
  emit('upload-attachment', file)
}

function onAttachmentRemove(attachmentId) {
  emit('remove-attachment', attachmentId)
}

function onAttachmentDownload(attachmentId) {
  emit('download-attachment', attachmentId)
}
</script>

<style lang="scss" scoped>
.lab-order-dialog__accordion {
  :deep(.accordion-header),
  :deep(.accordion-panel .section-hint),
  :deep(.fields.accordion-body) {
    max-width: none;
    margin-left: 0;
    margin-right: 0;
  }
}
</style>
