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
          {{ t('carePlanMeasureSubtitle') }}
        </p>

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
                  v-model="local.baseline"
                  outlined
                  hide-bottom-space
                  type="number"
                  :readonly="readonly"
                  :placeholder="t('carePlanMeasureBaselinePlaceholder')"
                  :error="Boolean(errors.baseline)"
                  :error-message="errors.baseline"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('carePlanMeasureTarget')"
                required
                :test-id="tid.field('measure-target')">
                <q-input
                  v-model="local.target"
                  outlined
                  hide-bottom-space
                  type="number"
                  :readonly="readonly"
                  :placeholder="t('carePlanMeasureTargetPlaceholder')"
                  :error="Boolean(errors.target)"
                  :error-message="errors.target"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div
          v-if="previewProgress.percent != null"
          class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="show_chart"
            :title="t('carePlanMeasureProgressPreview')"
          />
          <div class="care-plan-measure-preview q-mt-md">
            <p class="text-body2 q-mb-sm">
              {{ t('carePlanMeasurePreviewSummary', previewSummary) }}
            </p>
            <q-linear-progress
              :value="previewProgress.percent / 100"
              color="positive"
              track-color="grey-3"
              rounded
              size="10px"
            />
            <p class="text-caption text-positive q-mt-sm q-mb-none">
              {{ Math.round(previewProgress.percent) }}%
            </p>
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
                <q-input
                  v-model="local.unit"
                  outlined
                  hide-bottom-space
                  :readonly="readonly"
                  :placeholder="t('carePlanMeasureUnitPlaceholder')"
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
                  :readonly="readonly"
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
            <div v-if="!readonly" class="col-12">
              <q-checkbox
                v-model="addCurrentMeasurement"
                :label="t('carePlanMeasureAddCurrent')"
              />
              <q-input
                v-if="addCurrentMeasurement"
                v-model="local.currentValue"
                outlined
                hide-bottom-space
                type="number"
                class="q-mt-sm"
                :placeholder="t('carePlanMeasureCurrentPlaceholder')"
              />
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
          @click="onCancel"
        />
        <template v-if="!readonly">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :label="t('carePlanMeasureSaveAnother')"
            @click="onSave(true)"
          />
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :label="t('carePlanSaveMeasure')"
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
  createEmptyOutcomeMeasure,
} from 'src/utils/care-plan-orders.js'
import { calculateOutcomeMeasureProgress } from
  'src/utils/care-plan-progress.js'
import { carePlanI18nKey } from 'src/utils/care-plan-i18n.js'
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
const addCurrentMeasurement = ref(false)
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

const measureOptions = computed(() => {
  const needle = measureFilter.value.trim().toLowerCase()

  return CARE_PLAN_MEASURE_OPTIONS
    .filter(name => !needle || name.toLowerCase().includes(needle))
    .map(name => ({ label: name, value: name }))
})

const previewProgress = computed(() => calculateOutcomeMeasureProgress(
  local.value.baseline,
  local.value.currentValue ?? local.value.baseline,
  local.value.target,
  local.value.direction,
))

const previewSummary = computed(() => ({
  baseline: local.value.baseline ?? '—',
  target: local.value.target ?? '—',
  direction: t(carePlanI18nKey(
    'carePlanDirection',
    local.value.direction,
  )),
}))

watch(
  () => [props.modelValue, props.measure],
  () => {
    if (props.modelValue) {
      local.value = {
        ...createEmptyOutcomeMeasure(),
        ...(props.measure ?? {}),
      }
      addCurrentMeasurement.value = local.value.currentValue != null
      Object.keys(errors).forEach(key => delete errors[key])
    }
  },
  { immediate: true },
)

function onMeasureFilter(val, update) {
  update(() => {
    measureFilter.value = val
  })
}

function validate() {
  Object.keys(errors).forEach(key => delete errors[key])
  if (!String(local.value.measureName ?? '').trim()) {
    errors.measureName = t('carePlanMeasureNameRequired')
  }
  if (!local.value.direction) {
    errors.direction = t('carePlanMeasureDirectionRequired')
  }
  if (local.value.baseline == null || local.value.baseline === '') {
    errors.baseline = t('carePlanMeasureBaselineRequired')
  }
  if (local.value.target == null || local.value.target === '') {
    errors.target = t('carePlanMeasureTargetRequired')
  }

  return !Object.keys(errors).length
}

function onSave(keepOpen) {
  if (!validate()) {
    return
  }
  const payload = { ...local.value }
  if (!addCurrentMeasurement.value) {
    payload.currentValue = null
  }
  emit('save', payload, keepOpen)
  if (keepOpen) {
    local.value = createEmptyOutcomeMeasure()
    addCurrentMeasurement.value = false

    return
  }
  open.value = false
}

function onCancel() {
  emit('cancel')
  open.value = false
}
</script>

<style lang="scss" scoped>
.care-plan-measure-preview {
  padding: 12px 16px;
  border-radius: 8px;
  background: #f0fdf4;
}
</style>
