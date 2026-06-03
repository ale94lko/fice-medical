<template>
  <AddClientLabeledField
    :label="question.label"
    :required="question.required"
    :spaced="spaced"
    :test-id="fieldTestId">
    <template v-if="question.helpText" #hint>
      {{ question.helpText }}
    </template>

    <TextInput
      v-if="question.fieldType === fieldTypes.text"
      :model-value="stringValue"
      :external-label="false"
      :test-id="fieldTestId"
      :error="hasError"
      :error-message="errorMessage"
      @update:model-value="emitString"
    />

    <TextInput
      v-else-if="question.fieldType === fieldTypes.textarea"
      :model-value="stringValue"
      type="textarea"
      :external-label="false"
      :test-id="fieldTestId"
      :error="hasError"
      :error-message="errorMessage"
      @update:model-value="emitString"
    />

    <ClientDateField
      v-else-if="question.fieldType === fieldTypes.date"
      :model-value="stringValue"
      :test-id="fieldTestId"
      :error="hasError"
      :error-message="errorMessage"
      @update:model-value="emitString"
    />

    <q-input
      v-else-if="question.fieldType === fieldTypes.number"
      :model-value="stringValue"
      outlined
      hide-bottom-space
      type="text"
      inputmode="decimal"
      :data-testid="fieldTestId"
      :error="hasError"
      :error-message="errorMessage"
      @update:model-value="emitString"
    />

    <FormSelect
      v-else-if="question.fieldType === fieldTypes.select"
      :model-value="stringValue"
      outlined
      hide-bottom-space
      emit-value
      map-options
      clearable
      class="full-width"
      :options="selectOptions"
      :test-id="fieldTestId"
      :error="hasError"
      :error-message="errorMessage"
      @update:model-value="emitString"
    />

    <div
      v-else-if="question.fieldType === fieldTypes.radio"
      class="assessment-field__radio-group"
      :class="{ 'assessment-field--error': hasError }">
      <label
        v-for="(opt, optIndex) in question.options"
        :key="optionKey(opt, optIndex)"
        class="assessment-field__radio-option">
        <input
          type="radio"
          class="assessment-field__radio-input"
          :name="radioGroupName"
          :value="optionValue(opt)"
          :checked="stringValue === optionValue(opt)"
          @change="emitString(optionValue(opt))"
        />
        <span class="assessment-field__radio-indicator" aria-hidden="true" />
        <span class="assessment-field__radio-label">
          {{ optionLabel(opt) }}
        </span>
      </label>
      <div v-if="hasError" class="form-field__error q-mt-xs">
        {{ errorMessage }}
      </div>
    </div>

    <div
      v-else-if="question.fieldType === fieldTypes.chips"
      class="assessment-field__chips"
      :class="{ 'assessment-field--error': hasError }">
      <q-btn
        v-for="(opt, optIndex) in question.options"
        :key="optionKey(opt, optIndex)"
        no-caps
        flat
        :outline="!isChipSelected(opt)"
        :unelevated="isChipSelected(opt)"
        :color="isChipSelected(opt) ? 'primary' : undefined"
        :class="[
          'add-client-form__preferred-chip',
          {
            'add-client-form__preferred-chip--selected': isChipSelected(opt),
          },
        ]"
        @click="onChipToggle(opt)">
        <span class="add-client-form__preferred-chip-label">
          {{ optionLabel(opt) }}
        </span>
      </q-btn>
      <div v-if="hasError" class="form-field__error q-mt-xs">
        {{ errorMessage }}
      </div>
    </div>

    <div
      v-else-if="question.fieldType === fieldTypes.yesNo"
      class="assessment-field__yes-no"
      :class="{ 'assessment-field--error': hasError }">
      <q-btn
        v-for="opt in yesNoOptions"
        :key="opt.value"
        no-caps
        flat
        :outline="stringValue !== opt.value"
        :unelevated="stringValue === opt.value"
        :color="stringValue === opt.value ? 'primary' : undefined"
        :class="[
          'add-client-form__preferred-chip',
          {
            'add-client-form__preferred-chip--selected':
              stringValue === opt.value,
          },
        ]"
        @click="emitString(opt.value)">
        <span class="add-client-form__preferred-chip-label">
          {{ opt.label }}
        </span>
      </q-btn>
      <div v-if="hasError" class="form-field__error q-mt-xs">
        {{ errorMessage }}
      </div>
    </div>
  </AddClientLabeledField>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import TextInput from 'components/TextInput.vue'
import FormSelect from 'components/FormSelect.vue'
import ClientDateField from 'components/ClientDateField.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import { assessmentFieldTypes } from 'components/constants.js'
import {
  isChipSelected as checkChipSelected,
  toggleChipAnswer,
} from 'src/utils/assessment-answers.js'
import {
  optionKey,
  optionLabel,
  optionValue,
  optionsForSelectField,
} from 'src/utils/assessment-template-metadata.js'
import { assessmentTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
  modelValue: {
    type: [String, Number, Array, Boolean],
    default: '',
  },
  hasError: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  spaced: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const fieldTypes = assessmentFieldTypes

const fieldTestId = computed(
  () => tid.field(props.question?.id),
)

const radioGroupName = computed(
  () => `assessment-radio-${props.question?.id}`,
)

const stringValue = computed(() => {
  const v = props.modelValue
  if (Array.isArray(v)) {
    return ''
  }
  if (v === true) {
    return 'yes'
  }
  if (v === false) {
    return 'no'
  }

  return String(v ?? '')
})

const selectOptions = computed(() =>
  optionsForSelectField(props.question?.options),
)

const yesNoOptions = computed(() => [
  { label: t('yes'), value: 'yes' },
  { label: t('no'), value: 'no' },
])

function emitString(val) {
  emit('update:modelValue', val ?? '')
}

function isChipSelected(opt) {
  return checkChipSelected(
    props.modelValue,
    opt,
    props.question?.options,
  )
}

function onChipToggle(opt) {
  emit(
    'update:modelValue',
    toggleChipAnswer(
      props.modelValue,
      opt,
      props.question?.options,
    ),
  )
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.assessment-field__radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.assessment-field__radio-option {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  margin: 0;
}

.assessment-field__radio-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.assessment-field__radio-indicator {
  width: 18px;
  height: 18px;
  border: 1.5px solid $text-hint;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}

.assessment-field__radio-input:checked + .assessment-field__radio-indicator {
  border-color: $primary;
  background: $primary;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 6px;
    height: 6px;
    margin: -3px 0 0 -3px;
    border-radius: 50%;
    background: $white;
  }
}

.assessment-field__radio-label {
  font-size: 0.875rem;
  color: $text-strong;
}

.assessment-field__chips,
.assessment-field__yes-no {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.assessment-field--error {
  padding: 8px 10px;
  border-radius: $radius-md;
  border: 1px solid $negative;
  background: rgba($negative, 0.04);
}
</style>
