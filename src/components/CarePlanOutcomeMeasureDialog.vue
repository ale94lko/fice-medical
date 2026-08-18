<template>
  <q-dialog
    v-model="open"
    persistent
    class="app-nested-dialog"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        test-id="care-plan-outcome-measure"
        :close-label="t('close')"
        :info="t('carePlanMeasureSubtitle')"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div class="insurance-dialog__card-section">
          <SubsectionHeading
            icon="analytics"
            :title="t('carePlanMeasureSectionInfo')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('carePlanMeasureName')"
                required
                :test-id="tid.field('measure-name')">
                <q-select
                  v-model="local.measureName"
                  outlined
                  hide-bottom-space
                  use-input
                  fill-input
                  hide-selected
                  input-debounce="200"
                  emit-value
                  map-options
                  :readonly="readonly"
                  :options="measureOptions"
                  :placeholder="t('carePlanMeasureNamePlaceholder')"
                  :error="Boolean(errors.measureName)"
                  :error-message="errors.measureName"
                  @filter="onMeasureFilter"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('carePlanMeasureDirection')"
                required
                :test-id="tid.field('measure-direction')">
                <FormSelect
                  v-model="local.direction"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly"
                  :options="directionOptions"
                  :error="Boolean(errors.direction)"
                  :error-message="errors.direction"
                  :test-id="tid.field('measure-direction')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12">
              <AddClientLabeledField
                :label="t('description')"
                :test-id="tid.field('measure-description')">
                <q-input
                  v-model="local.description"
                  outlined
                  hide-bottom-space
                  type="textarea"
                  autogrow
                  counter
                  :readonly="readonly"
                  :maxlength="carePlanMeasureNotesMaxLength"
                  :placeholder="t('carePlanMeasureDescriptionPlaceholder')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('carePlanMeasureBaseline')"
                required
                :test-id="tid.field('measure-baseline')">
                <q-input
                  :model-value="local.baseline"
                  outlined
                  hide-bottom-space
                  inputmode="decimal"
                  :readonly="readonly"
                  :placeholder="t('carePlanMeasureBaselinePlaceholder')"
                  :error="Boolean(errors.baseline || errors.baselineTarget)"
                  :error-message="errors.baseline"
                  @update:model-value="onBaselineInput"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('carePlanMeasureTarget')"
                required
                :test-id="tid.field('measure-target')">
                <q-input
                  :model-value="local.target"
                  outlined
                  hide-bottom-space
                  inputmode="decimal"
                  :readonly="readonly"
                  :placeholder="t('carePlanMeasureTargetPlaceholder')"
                  :error="Boolean(errors.target || errors.baselineTarget)"
                  :error-message="errors.target"
                  @update:model-value="onTargetInput"
                />
              </AddClientLabeledField>
            </div>
            <div v-if="errors.baselineTarget" class="col-12">
              <p class="form-field__error q-mt-xs q-mb-none">
                {{ errors.baselineTarget }}
              </p>
            </div>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="tune"
            :title="t('carePlanMeasureSectionDetails')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-4">
              <AddClientLabeledField
                :label="t('carePlanMeasureUnit')"
                :test-id="tid.field('measure-unit')">
                <FormSelect
                  v-model="local.unit"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  clearable
                  :readonly="readonly"
                  :options="unitOptions"
                  :placeholder="t('carePlanMeasureUnitPlaceholder')"
                  :test-id="tid.field('measure-unit')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-4">
              <AddClientLabeledField
                :label="t('carePlanMeasureFrequency')"
                :test-id="tid.field('measure-frequency')">
                <FormSelect
                  v-model="local.frequency"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly"
                  :options="frequencyOptions"
                  :placeholder="t('carePlanInterventionFrequencyPlaceholder')"
                  :test-id="tid.field('measure-frequency')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-4">
              <AddClientLabeledField
                :label="t('carePlanMeasureSource')"
                :test-id="tid.field('measure-source')">
                <FormSelect
                  v-model="local.sourceType"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="true"
                  :options="sourceOptions"
                  :test-id="tid.field('measure-source')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12">
              <AddClientLabeledField
                :label="t('notes')"
                :test-id="tid.field('measure-notes')">
                <q-input
                  v-model="local.notes"
                  outlined
                  hide-bottom-space
                  type="textarea"
                  autogrow
                  counter
                  :readonly="readonly"
                  :maxlength="carePlanMeasureNotesMaxLength"
                  :placeholder="t('carePlanMeasureNotesPlaceholder')"
                />
              </AddClientLabeledField>
            </div>
          </div>
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
            outline
            color="primary"
            class="app-btn-outline"
            :label="t('carePlanMeasureSaveAnother')"
            :data-testid="tid.btn('save-another')"
            @click="onSave(true)"
          />
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :label="t('carePlanSaveMeasure')"
            :data-testid="tid.btn('save-measure')"
            @click="onSave(false)"
          />
        </template>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormSelect from 'components/FormSelect.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import {
  carePlanMeasureNotesMaxLength,
  carePlanOutcomeSourceTypes,
  carePlanProgressDirections,
} from 'components/constants.js'
import {
  CARE_PLAN_FREQUENCY_OPTIONS,
  CARE_PLAN_MEASURE_OPTIONS,
  CARE_PLAN_MEASURE_UNIT_OPTIONS,
  createEmptyOutcomeMeasure,
  isOutcomeMeasureAlreadyAdded,
} from 'src/utils/care-plan-orders.js'
import { carePlanTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  measure: {
    type: Object,
    default: null,
  },
  mode: {
    type: String,
    default: 'add',
  },
  existingMeasures: {
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
const local = ref(createEmptyOutcomeMeasure())
const errors = reactive({})
const measureFilter = ref('')

const dialogTitle = computed(() => {
  if (props.mode === 'view') {
    return t('carePlanMeasureViewTitle')
  }
  if (props.mode === 'edit') {
    return t('carePlanMeasureEditTitle')
  }

  return t('carePlanMeasureAddTitle')
})

const frequencyOptions = computed(() =>
  CARE_PLAN_FREQUENCY_OPTIONS.map(value => ({ label: value, value })),
)

const unitOptions = computed(() => {
  const base = CARE_PLAN_MEASURE_UNIT_OPTIONS.map(value => ({
    label: value,
    value,
  }))
  const current = String(local.value.unit ?? '').trim()
  if (
    current
    && !CARE_PLAN_MEASURE_UNIT_OPTIONS.includes(current)
  ) {
    return [{ label: current, value: current }, ...base]
  }

  return base
})

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

const sourceOptions = computed(() => [{
  label: t('carePlanSourceManual'),
  value: carePlanOutcomeSourceTypes.manual,
}])

const takenMeasureNames = computed(() => {
  const excludeId = String(props.measure?.id ?? '').trim()

  return new Set(
    (props.existingMeasures ?? [])
      .filter(item => {
        if (!item || item.deletedAt) {
          return false
        }
        if (excludeId && String(item.id ?? '').trim() === excludeId) {
          return false
        }

        return Boolean(String(item.measureName ?? '').trim())
      })
      .map(item => String(item.measureName).trim().toLowerCase()),
  )
})

const measureOptions = computed(() => {
  const needle = measureFilter.value.trim().toLowerCase()

  return CARE_PLAN_MEASURE_OPTIONS
    .filter(name => !needle || name.toLowerCase().includes(needle))
    .map(name => ({
      label: name,
      value: name,
      disable: takenMeasureNames.value.has(name.toLowerCase()),
    }))
})

watch(
  () => [props.modelValue, props.measure],
  () => {
    if (props.modelValue) {
      local.value = {
        ...createEmptyOutcomeMeasure(),
        ...(props.measure ?? {}),
        // Source is manual-only for now.
        sourceType: carePlanOutcomeSourceTypes.manual,
      }
      Object.keys(errors).forEach(key => delete errors[key])
      measureFilter.value = ''
    }
  },
  { immediate: true },
)

function onMeasureFilter(val, update) {
  update(() => {
    measureFilter.value = val
  })
}

function sanitizeMeasureNumberInput(value) {
  const raw = String(value ?? '')
  let result = ''
  let hasDot = false
  for (const ch of raw) {
    if (ch === '-' && result === '') {
      result = '-'
      continue
    }
    if (ch === '.' && !hasDot) {
      hasDot = true
      result += '.'
      continue
    }
    if (/\d/.test(ch)) {
      result += ch
    }
  }

  return result
}

function onBaselineInput(value) {
  local.value.baseline = sanitizeMeasureNumberInput(value)
}

function onTargetInput(value) {
  local.value.target = sanitizeMeasureNumberInput(value)
}

function parseMeasureNumber(value) {
  if (value == null || value === '' || value === '-' || value === '.') {
    return null
  }
  const num = Number(value)

  return Number.isFinite(num) ? num : NaN
}

function validateBaselineTarget() {
  const baselineRaw = local.value.baseline
  const targetRaw = local.value.target
  const baselineEmpty = baselineRaw == null || baselineRaw === ''
  const targetEmpty = targetRaw == null || targetRaw === ''

  if (baselineEmpty) {
    errors.baseline = t('carePlanMeasureBaselineRequired')
  } else {
    const baseline = parseMeasureNumber(baselineRaw)
    if (!Number.isFinite(baseline)) {
      errors.baseline = t('carePlanMeasureBaselineInvalid')
    }
  }

  if (targetEmpty) {
    errors.target = t('carePlanMeasureTargetRequired')
  } else {
    const target = parseMeasureNumber(targetRaw)
    if (!Number.isFinite(target)) {
      errors.target = t('carePlanMeasureTargetInvalid')
    }
  }

  if (errors.baseline || errors.target) {
    return
  }

  const baseline = parseMeasureNumber(baselineRaw)
  const target = parseMeasureNumber(targetRaw)
  if (baseline === target) {
    errors.baselineTarget = t('carePlanMeasureBaselineTargetEqual')

    return
  }

  const lower = carePlanProgressDirections.lowerIsBetter
  if (local.value.direction === lower && baseline <= target) {
    errors.baselineTarget = t('carePlanMeasureBaselineMustBeHigher')

    return
  }

  const higher = carePlanProgressDirections.higherIsBetter
  if (local.value.direction === higher && baseline >= target) {
    errors.baselineTarget = t('carePlanMeasureBaselineMustBeLower')
  }
}

function validate() {
  Object.keys(errors).forEach(key => delete errors[key])
  if (!String(local.value.measureName ?? '').trim()) {
    errors.measureName = t('carePlanMeasureNameRequired')
  } else if (isOutcomeMeasureAlreadyAdded(
    local.value.measureName,
    props.existingMeasures,
    { excludeId: props.measure?.id },
  )) {
    errors.measureName = t('carePlanMeasureDuplicate')
  }
  if (!local.value.direction) {
    errors.direction = t('carePlanMeasureDirectionRequired')
  }
  validateBaselineTarget()

  return !Object.keys(errors).length
}

function onSave(keepOpen) {
  if (!validate()) {
    return
  }
  emit('save', {
    ...local.value,
    sourceType: carePlanOutcomeSourceTypes.manual,
    baseline: parseMeasureNumber(local.value.baseline),
    target: parseMeasureNumber(local.value.target),
  }, keepOpen)
  if (keepOpen) {
    local.value = createEmptyOutcomeMeasure()
    Object.keys(errors).forEach(key => delete errors[key])
    measureFilter.value = ''

    return
  }
  open.value = false
}

function onCancel() {
  emit('cancel')
  open.value = false
}
</script>
