<template>
  <AccordionSection
    v-model="expanded"
    icon="straighten"
    :title="t('assessmentPatientMeasurements')"
    section-test-id="assessment-section-patient-measurements"
    :toggle-test-id="tid.section('patient-measurements')">
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-4">
        <AddClientLabeledField
          :label="t('assessmentWeight')"
          :test-id="tid.field('weight')">
          <q-input
            :model-value="weight"
            outlined
            hide-bottom-space
            type="text"
            inputmode="decimal"
            :disable="readonly"
            :data-testid="tid.field('weight')"
            :placeholder="t('assessmentWeightUnit')"
            :error="Boolean(errors.weight)"
            :error-message="errors.weight"
            @update:model-value="val => emit('update:weight', val)"
          />
        </AddClientLabeledField>
      </div>
      <div class="col-12 col-md-4">
        <AddClientLabeledField
          :label="t('assessmentHeight')"
          :test-id="tid.field('height')">
          <q-input
            :model-value="height"
            outlined
            hide-bottom-space
            type="text"
            inputmode="decimal"
            :disable="readonly"
            :data-testid="tid.field('height')"
            :placeholder="t('assessmentHeightUnit')"
            :error="Boolean(errors.height)"
            :error-message="errors.height"
            @update:model-value="val => emit('update:height', val)"
          />
        </AddClientLabeledField>
      </div>
      <div class="col-12 col-md-4">
        <AddClientLabeledField
          :label="t('assessmentBmi')"
          :test-id="tid.field('bmi')">
          <template #hint>
            {{ t('assessmentBmiHint') }}
          </template>
          <q-input
            :model-value="bmiDisplay"
            outlined
            hide-bottom-space
            readonly
            disable
            class="assessment-measurements__bmi-field"
            :data-testid="tid.field('bmi')"
          />
        </AddClientLabeledField>
      </div>
    </div>
  </AccordionSection>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AccordionSection from './AccordionSection.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import { assessmentTestIds as tid } from 'src/test-ids/index.js'

defineProps({
  weight: {
    type: String,
    default: '',
  },
  height: {
    type: String,
    default: '',
  },
  bmiDisplay: {
    type: String,
    default: '—',
  },
  errors: {
    type: Object,
    default: () => ({}),
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:weight', 'update:height'])

const { t } = useI18n()
const expanded = ref(true)
</script>

<style lang="scss" scoped>
.assessment-measurements__bmi-field {
  :deep(.q-field__control) {
    background: #f8fafc;
  }

  :deep(.q-field__native) {
    color: #64748b;
    font-weight: 600;
  }
}
</style>
