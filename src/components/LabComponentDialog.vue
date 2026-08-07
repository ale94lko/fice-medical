<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="family-medical-history-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        :info="t('labComponentDialogSubtitle')"
        @close="onCancel">
        {{ t('labComponentDialogTitle') }}
      </AppDialogHeader>

      <q-card-section
        ref="dialogBodyScrollRef"
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <AddClientLabeledField
              :label="t('labComponentName')"
              required
              :test-id="tid.field('component-name')">
              <q-select
                v-model="local.componentName"
                outlined
                hide-bottom-space
                use-input
                fill-input
                hide-selected
                input-debounce="200"
                emit-value
                map-options
                :options="componentOptions"
                :placeholder="t('labComponentNamePlaceholder')"
                :error="Boolean(errors.componentName)"
                :error-message="errorText('componentName')"
                :data-testid="tid.field('component-name')"
                @filter="onComponentFilter"
                @update:model-value="onComponentSelected"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('labComponentValue')"
              required
              :test-id="tid.field('value')">
              <q-input
                v-model="local.value"
                outlined
                hide-bottom-space
                :placeholder="t('labComponentValuePlaceholder')"
                :error="Boolean(errors.value)"
                :error-message="errorText('value')"
                :data-testid="tid.field('value')"
                @update:model-value="onValueChange"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('labComponentUnit')"
              :test-id="tid.field('unit')">
              <FormSelect
                v-model="local.unit"
                outlined
                hide-bottom-space
                emit-value
                map-options
                clearable
                :options="unitOptions"
                :test-id="tid.field('unit')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-8">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <AddClientLabeledField
                  :label="t('labRefRangeLow')"
                  :test-id="tid.field('ref-low')">
                  <q-input
                    v-model.number="local.referenceRangeLow"
                    outlined
                    hide-bottom-space
                    type="number"
                    :error="Boolean(errors.referenceRange)"
                    :data-testid="tid.field('ref-low')"
                    @update:model-value="onRangeChange"
                  />
                </AddClientLabeledField>
              </div>
              <div class="col-12 col-md-6">
                <AddClientLabeledField
                  :label="t('labRefRangeHigh')"
                  :test-id="tid.field('ref-high')">
                  <q-input
                    v-model.number="local.referenceRangeHigh"
                    outlined
                    hide-bottom-space
                    type="number"
                    :error="Boolean(errors.referenceRange)"
                    :data-testid="tid.field('ref-high')"
                    @update:model-value="onRangeChange"
                  />
                </AddClientLabeledField>
              </div>
            </div>
            <div
              v-if="errors.referenceRange"
              class="form-field__error q-mt-xs">
              {{ errorText('referenceRange') }}
            </div>
          </div>
          <div class="col-12 col-md-4">
            <AddClientLabeledField
              :label="t('labComponentFlag')"
              :test-id="tid.field('flag')">
              <FormSelect
                v-model="local.flag"
                outlined
                hide-bottom-space
                emit-value
                map-options
                clearable
                :options="flagOptions"
                :test-id="tid.field('flag')"
                @update:model-value="onFlagChange"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12">
            <div class="lab-component-dialog__info text-body2">
              <q-icon
                name="info"
                size="18px"
                class="lab-component-dialog__info-icon"
              />
              <span>{{ t('labFlagAutoHint') }}</span>
            </div>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('labComponentResultDate')"
              required
              :test-id="tid.field('result-date')">
              <ClientDateField
                v-model="local.resultDate"
                :max-today="true"
                :error="Boolean(errors.resultDate)"
                :error-message="errorText('resultDate')"
                :test-id="tid.field('result-date')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('labComponentResultTime')"
              :test-id="tid.field('result-time')">
              <q-input
                v-model="local.resultTime"
                outlined
                hide-bottom-space
                mask="##:##:##"
                :placeholder="t('labComponentResultTimePlaceholder')"
                :data-testid="tid.field('result-time')"
                @blur="onResultTimeBlur"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12">
            <AddClientLabeledField
              :label="t('labComponentNotes')"
              :test-id="tid.field('notes')">
              <q-input
                v-model="local.notes"
                outlined
                hide-bottom-space
                type="textarea"
                autogrow
                :maxlength="labMaxComponentNotesLength"
                :data-testid="tid.field('notes')"
              />
            </AddClientLabeledField>
          </div>
        </div>

        <div class="lab-component-dialog__preview q-mt-md q-pa-md">
          <p class="text-caption text-weight-medium q-mb-sm">
            {{ t('labComponentPreview') }}
          </p>
          <div class="row q-col-gutter-sm text-body2">
            <div class="col-6 col-md-3">
              <span class="text-grey-7">{{ t('labComponentName') }}</span>
              <div>{{ local.componentName || '—' }}</div>
            </div>
            <div class="col-6 col-md-3">
              <span class="text-grey-7">{{ t('labComponentValue') }}</span>
              <div>
                {{ local.value || '—' }}
                {{ local.unit ? ` ${local.unit}` : '' }}
              </div>
            </div>
            <div class="col-6 col-md-3">
              <span class="text-grey-7">{{ t('labColReferenceRange') }}</span>
              <div>{{ previewRange }}</div>
            </div>
            <div class="col-6 col-md-3">
              <span class="text-grey-7">{{ t('labComponentFlag') }}</span>
              <div>
                <span
                  v-if="local.flag"
                  class="lab-flag-preview"
                  :class="`lab-flag-preview--${String(local.flag ?? '')
                    .toLowerCase()}`">
                  {{ flagLabel(local.flag) }}
                </span>
                <span v-else>—</span>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          v-if="!editMode"
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('labComponentSaveAnother')"
          :data-testid="tid.btn('save-another')"
          @click="onSave(true)"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="editMode ? t('save') : t('labComponentAdd')"
          :data-testid="tid.btn('save')"
          @click="onSave(false)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import {
  labFlags,
  labMaxComponentNotesLength,
} from 'components/constants.js'
import {
  LAB_COMPONENT_OPTIONS,
  createEmptyLabComponent,
  formatLabResultTimeInput,
  formatReferenceRange,
  resolveClinicalKeyForComponent,
  suggestFlagFromReference,
  validateLabComponent,
} from 'src/utils/lab-orders.js'
import { labTestIds as tid } from 'src/test-ids/index.js'
import { labI18nKey } from 'src/utils/lab-i18n.js'
import { useValidationSaveFeedback } from
  'src/composables/useValidationSaveFeedback.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  component: {
    type: Object,
    default: null,
  },
  editMode: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['save', 'cancel'])

const open = defineModel({ type: Boolean, default: false })

const { t } = useI18n()
const { notifyAndScrollToValidationErrors } = useValidationSaveFeedback()

const dialogBodyScrollRef = ref(null)
const local = ref(createEmptyLabComponent())
const errors = ref({})
const componentFilter = ref('')
const flagTouched = ref(false)

const unitOptions = [
  { label: 'g/dL', value: 'g/dL' },
  { label: 'K/uL', value: 'K/uL' },
  { label: '%', value: '%' },
  { label: 'mg/dL', value: 'mg/dL' },
]

const flagOptions = computed(() =>
  Object.values(labFlags).map(value => ({
    label: flagLabel(value),
    value,
  })),
)

const componentOptions = computed(() => {
  const needle = componentFilter.value.trim().toLowerCase()
  const base = LAB_COMPONENT_OPTIONS.map(item => ({
    label: item.label,
    value: item.value,
  }))
  if (!needle) {
    return base
  }

  return base.filter(
    item => item.label.toLowerCase().includes(needle),
  )
})

const previewRange = computed(() =>
  formatReferenceRange(
    local.value.referenceRangeLow,
    local.value.referenceRangeHigh,
    local.value.unit,
  ),
)

watch(
  () => [open.value, props.component],
  () => {
    if (open.value) {
      local.value = props.component
        ? { ...createEmptyLabComponent(), ...props.component }
        : createEmptyLabComponent()
      errors.value = {}
      // Do not lock auto-flag on edit; recalc when value/range change.
      flagTouched.value = false
      componentFilter.value = ''
    }
  },
  { immediate: true },
)

function flagLabel(flag) {
  const key = labI18nKey('labFlag', flag)
  const translated = t(key)

  return translated !== key ? translated : flag
}

function onComponentFilter(val, update) {
  componentFilter.value = val
  update(() => {})
}

function onComponentSelected(name) {
  local.value.clinicalKey = resolveClinicalKeyForComponent(name)
}

function onValueChange() {
  if (hasBothReferenceRanges()) {
    flagTouched.value = false
  }
  applySuggestedFlag()
}

function normalizeRangeValue(value) {
  if (value === '' || value == null || Number.isNaN(value)) {
    return null
  }

  return value
}

function hasBothReferenceRanges() {
  const low = local.value.referenceRangeLow
  const high = local.value.referenceRangeHigh

  return low != null && high != null
    && low !== '' && high !== ''
    && Number.isFinite(Number(low))
    && Number.isFinite(Number(high))
}

function onRangeChange() {
  local.value.referenceRangeLow = normalizeRangeValue(
    local.value.referenceRangeLow,
  )
  local.value.referenceRangeHigh = normalizeRangeValue(
    local.value.referenceRangeHigh,
  )
  if (errors.value.referenceRange) {
    const next = { ...errors.value }
    delete next.referenceRange
    errors.value = next
  }
  if (hasBothReferenceRanges()) {
    flagTouched.value = false
  }
  applySuggestedFlag()
}

function applySuggestedFlag() {
  if (!hasBothReferenceRanges()) {
    // Without Low+High, Flag is manual only — never auto-assign.
    if (!flagTouched.value) {
      local.value.flag = null
    }

    return
  }
  if (flagTouched.value) {
    return
  }
  local.value.flag = suggestFlagFromReference(
    local.value.value,
    local.value.referenceRangeLow,
    local.value.referenceRangeHigh,
  )
}

function onResultTimeBlur() {
  local.value.resultTime = formatLabResultTimeInput(local.value.resultTime)
}

function onFlagChange(value) {
  flagTouched.value = value != null && value !== ''
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

async function onSave(another) {
  errors.value = validateLabComponent(local.value)
  if (Object.keys(errors.value).length) {
    await notifyAndScrollToValidationErrors(dialogBodyScrollRef)

    return
  }
  if (!local.value.clinicalKey) {
    local.value.clinicalKey = resolveClinicalKeyForComponent(
      local.value.componentName,
    )
  }
  emit('save', { ...local.value }, another)
  if (another) {
    local.value = createEmptyLabComponent()
    errors.value = {}
    flagTouched.value = false

    return
  }
  open.value = false
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.lab-component-dialog__info {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: $radius-md;
  background: #eff6ff;
  color: #1e3a8a;
}

.lab-component-dialog__info-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.lab-component-dialog__preview {
  border-radius: $radius-md;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.lab-flag-preview {
  display: inline-flex;
  padding: 2px 8px;
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
