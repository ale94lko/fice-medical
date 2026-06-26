<template>
  <AddClientLabeledField
    :label="question.label"
    :required="question.required"
    :spaced="spaced"
    :test-id="fieldTestId">
    <template v-if="question.helpText" #hint>
      {{ question.helpText }}
    </template>

    <FormInput
      v-if="question.fieldType === fieldTypes.text"
      :model-value="stringValue"
      :external-label="false"
      :disable="readonly"
      :test-id="fieldTestId"
      :error="hasError"
      :error-message="errorMessage"
      @update:model-value="emitString"
    />

    <FormInput
      v-else-if="question.fieldType === fieldTypes.textarea"
      :model-value="stringValue"
      type="textarea"
      :external-label="false"
      :disable="readonly"
      :test-id="fieldTestId"
      :error="hasError"
      :error-message="errorMessage"
      @update:model-value="emitString"
    />

    <ClientDateField
      v-else-if="question.fieldType === fieldTypes.date"
      :model-value="stringValue"
      :readonly="readonly"
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
      :readonly="readonly"
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
      :disable="readonly"
      :options="selectOptions"
      :test-id="fieldTestId"
      :error="hasError"
      :error-message="errorMessage"
      @update:model-value="emitString"
    />

    <div
      v-else-if="question.fieldType === fieldTypes.radio"
      class="screening-field__radio-group"
      :class="{ 'screening-field--error': hasError }">
      <label
        v-for="(opt, optIndex) in question.options"
        :key="optionKey(opt, optIndex)"
        class="screening-field__radio-option">
        <input
          type="radio"
          class="screening-field__radio-input"
          :name="radioGroupName"
          :value="optionValue(opt)"
          :checked="stringValue === optionValue(opt)"
          :disabled="readonly"
          @change="emitString(optionValue(opt))"
        />
        <span class="screening-field__radio-indicator" aria-hidden="true" />
        <span class="screening-field__radio-label">
          {{ optionLabel(opt) }}
        </span>
      </label>
      <div v-if="hasError" class="form-field__error q-mt-xs">
        {{ errorMessage }}
      </div>
    </div>

    <div
      v-else-if="question.fieldType === fieldTypes.chips"
      class="screening-field__chips"
      :class="{ 'screening-field--error': hasError }">
      <q-btn
        v-for="(opt, optIndex) in question.options"
        :key="optionKey(opt, optIndex)"
        no-caps
        flat
        :outline="!isChipSelected(opt)"
        :unelevated="isChipSelected(opt)"
        :color="isChipSelected(opt) ? 'primary' : undefined"
        :class="[
          'preferred-chip',
          {
            'preferred-chip--selected': isChipSelected(opt),
          },
        ]"
        :disable="readonly"
        @click="onChipToggle(opt)">
        <span class="preferred-chip-label">
          {{ optionLabel(opt) }}
        </span>
      </q-btn>
      <div v-if="hasError" class="form-field__error q-mt-xs">
        {{ errorMessage }}
      </div>
    </div>

    <div
      v-else-if="question.fieldType === fieldTypes.yesNo"
      class="screening-field__yes-no"
      :class="{ 'screening-field--error': hasError }">
      <q-btn
        v-for="opt in yesNoOptions"
        :key="opt.value"
        no-caps
        flat
        :outline="stringValue !== opt.value"
        :unelevated="stringValue === opt.value"
        :color="stringValue === opt.value ? 'primary' : undefined"
        :class="[
          'preferred-chip',
          {
            'preferred-chip--selected':
              stringValue === opt.value,
          },
        ]"
        :disable="readonly"
        @click="emitString(opt.value)">
        <span class="preferred-chip-label">
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
import FormInput from './FormInput.vue'
import FormSelect from 'components/FormSelect.vue'
import ClientDateField from 'components/ClientDateField.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import { screeningFieldTypes } from 'components/constants.js'
import {
  isChipSelected as checkChipSelected,
  toggleChipAnswer,
} from 'src/utils/screening-answers.js'
import {
  optionKey,
  optionLabel,
  optionValue,
  optionsForSelectField,
} from 'src/utils/screening-template-metadata.js'
import { screeningTestIds as tid } from 'src/test-ids/index.js'

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
  readonly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const fieldTypes = screeningFieldTypes

const fieldTestId = computed(
  () => tid.field(props.question?.id),
)

const radioGroupName = computed(
  () => `screening-radio-${props.question?.id}`,
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
  if (props.readonly) {
    return
  }
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

.screening-field__radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.screening-field__radio-option {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  margin: 0;
}

.screening-field__radio-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.screening-field__radio-indicator {
  width: 18px;
  height: 18px;
  border: 1.5px solid $text-hint;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}

.screening-field__radio-input:checked + .screening-field__radio-indicator {
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

.screening-field__radio-label {
  font-size: 0.875rem;
  color: $text-strong;
}

.screening-field__chips,
.screening-field__yes-no {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.screening-field--error {
  padding: 8px 10px;
  border-radius: $radius-md;
  border: 1px solid $negative;
  background: rgba($negative, 0.04);
}
</style>
