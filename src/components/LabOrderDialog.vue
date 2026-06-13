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
              <FormSelect
                v-model="local.orderingClinicianId"
                outlined
                hide-bottom-space
                emit-value
                map-options
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

        <div class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="biotech"
            :title="t('labSectionSpecimen')"
          />
          <div class="row q-col-gutter-md q-mt-md">
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
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="assignment_turned_in"
            :title="t('labSectionResults')"
          />
          <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('labResultDate')"
              :test-id="tid.field('result-date')">
              <ClientDateField
                v-model="local.resultDate"
                :readonly="readonly"
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
              <FormSelect
                v-model="local.reviewedBy"
                outlined
                hide-bottom-space
                emit-value
                map-options
                clearable
                :readonly="readonly"
                :options="clinicianOptions"
                :test-id="tid.field('reviewed-by')"
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

        <div
          v-if="visibleComponents.length"
          class="fmh-table-wrap">
          <table class="fmh-table">
            <thead>
              <tr>
                <th>{{ t('labColComponent') }}</th>
                <th>{{ t('labComponentValue') }}</th>
                <th>{{ t('labComponentUnit') }}</th>
                <th>{{ t('labColReferenceRange') }}</th>
                <th>{{ t('labComponentFlag') }}</th>
                <th
                  v-if="!readonly"
                  class="fmh-table-actions-col">
                  {{ t('actions') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="comp in visibleComponents"
                :key="comp.id">
                <td>{{ comp.componentName }}</td>
                <td>{{ comp.value }}</td>
                <td>{{ comp.unit || '—' }}</td>
                <td>
                  {{
                    formatReferenceRange(
                      comp.referenceRangeLow,
                      comp.referenceRangeHigh,
                      comp.unit,
                    )
                  }}
                </td>
                <td>
                  <span
                    v-if="comp.flag"
                    class="lab-order-dialog__flag"
                    :class="`lab-order-dialog__flag--${comp.flag}`">
                    {{ flagLabel(comp.flag) }}
                  </span>
                  <span v-else>—</span>
                </td>
                <td
                  v-if="!readonly"
                  class="fmh-table-actions">
                  <q-btn
                    flat
                    round
                    size="sm"
                    class="app-btn-icon-action"
                    icon="edit"
                    color="primary"
                    @click="openComponentDialog(comp)"
                  />
                  <q-btn
                    flat
                    round
                    size="sm"
                    class="app-btn-icon-action"
                    icon="delete"
                    color="primary"
                    @click="removeComponent(comp.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-body2 text-grey-7 q-mb-none">
          {{ t('labComponentsEmpty') }}
        </p>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="attach_file"
            :title="t('labAttachmentsTitle')"
          />
          <p class="text-body2 text-grey-7 q-mb-md q-mt-md">
            {{ t('labAttachmentsHint') }}
          </p>
          <LabAttachmentUploadField
            :attachments="local.attachments"
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
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import SubsectionHeading from './SubsectionHeading.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import LabAttachmentUploadField from 'components/LabAttachmentUploadField.vue'
import LabComponentDialog from 'components/LabComponentDialog.vue'
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
  createEmptyLabOrder,
  formatReferenceRange,
  nextLocalId,
  validateLabOrder,
  visibleComponents as filterVisibleComponents,
} from 'src/utils/lab-orders.js'
import { labTestIds as tid } from 'src/test-ids/index.js'
import { labI18nKey } from 'src/utils/lab-i18n.js'
import {
  useValidationSaveFeedback,
} from 'src/composables/useValidationSaveFeedback.js'

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

const dialogBodyScrollRef = ref(null)
const local = ref(createEmptyLabOrder())
const errors = ref({})
const testFilter = ref('')
const componentDialogOpen = ref(false)
const editingComponent = ref(null)

const readonly = computed(() => props.mode === 'view')

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
      if (
        props.mode === 'add'
        && !local.value.orderingClinicianId
        && props.clinicianOptions.length
      ) {
        local.value.orderingClinicianId = props.clinicianOptions[0].value
        local.value.orderingClinicianName = props.clinicianOptions[0].label
      }
      errors.value = {}
      testFilter.value = ''
    }
  },
  { immediate: true },
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

function onClinicianChange(id) {
  const found = props.clinicianOptions.find(item => item.value === id)
  local.value.orderingClinicianName = found?.label ?? null
}

function flagLabel(flag) {
  const key = labI18nKey('labFlag', flag)
  const translated = t(key)

  return translated !== key ? translated : flag
}

function errorText(field) {
  return errors.value[field] ? t('assessmentFieldRequired') : ''
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
  emit('save', cloneLab(local.value))
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
.lab-order-dialog__flag {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;

  &--normal {
    background: #dcfce7;
    color: #166534;
  }

  &--high,
  &--critical_high,
  &--abnormal {
    background: #fee2e2;
    color: #b91c1c;
  }

  &--low,
  &--critical_low {
    background: #fef3c7;
    color: #b45309;
  }
}
</style>
