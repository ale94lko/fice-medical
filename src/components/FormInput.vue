<template>
  <FormField
    v-if="externalLabel"
    :label="props.label"
    :required="props.required">
    <q-input
      ref="inputRef"
      v-model="model"
      outlined
      hide-bottom-space
      class="full-width"
      :data-testid="props.testId"
      :type="resolvedType"
      :rules="props.rules || []"
      :maxlength="maxlengthResolved"
      :error="props.error"
      :error-message="props.errorMessage"
      :placeholder="props.placeholder || undefined"
      :disable="props.disable"
      lazy-rules="ondemand">
      <template v-if="iconLeft" #prepend>
        <q-icon :name="iconLeft" class="input-icon" />
      </template>
      <template v-if="isPasswordField" #append>
        <PasswordToggleIcon
          :show-plain="showPlainPassword"
          @toggle="showPlainPassword = !showPlainPassword"
        />
      </template>
    </q-input>
  </FormField>
  <q-input
    v-else
    ref="inputRef"
    v-model="model"
    outlined
    :stack-label="stackSpacing"
    :hide-bottom-space="!stackSpacing"
    :class="{ 'text-input--stack-spacing': stackSpacing }"
    :data-testid="props.testId"
    :type="resolvedType"
    :label="props.label || undefined"
    :rules="props.rules || []"
    :maxlength="maxlengthResolved"
    :error="props.error"
    :error-message="props.errorMessage"
    :placeholder="props.placeholder || undefined"
    :disable="props.disable"
    lazy-rules="ondemand">
    <template v-if="iconLeft" #prepend>
      <q-icon :name="iconLeft" class="input-icon" />
    </template>
    <template v-if="isPasswordField" #append>
      <PasswordToggleIcon
        :show-plain="showPlainPassword"
        @toggle="showPlainPassword = !showPlainPassword"
      />
    </template>
  </q-input>
</template>

<script setup>
import { computed, ref } from 'vue'
import FormField from './FormField.vue'
import PasswordToggleIcon from './PasswordToggleIcon.vue'
import {
  isPasswordInputType,
  passwordFieldInputType,
} from 'src/composables/usePasswordVisibility.js'
import { sanitizeLettersOnlyInput } from 'src/utils/client-form.js'

const props = defineProps({
  type: {
    type: String,
    default: 'text',
  },
  label: {
    type: String,
    default: '',
  },
  iconLeft: {
    type: String,
    default: '',
  },
  testId: {
    type: String,
    default: 'input',
  },
  rules: {
    type: Array,
    default: () => [],
  },
  error: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  stackSpacing: {
    type: Boolean,
    default: false,
  },
  maxlength: {
    type: [Number, String],
    default: undefined,
  },
  lettersOnly: {
    type: Boolean,
    default: false,
  },
  externalLabel: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: '',
  },
  disable: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const inputRef = ref(null)

const showPlainPassword = ref(false)

const isPasswordField = computed(() => isPasswordInputType(props.type))

const resolvedType = computed(() =>
  isPasswordField.value
    ? passwordFieldInputType(showPlainPassword.value)
    : props.type,
)

const maxlengthResolved = computed(() => {
  if (props.maxlength == null || props.maxlength === '') {
    return undefined
  }
  const n = Number(props.maxlength)

  return Number.isFinite(n) ? n : undefined
})

const model = computed({
  get: () => props.modelValue ?? '',
  set: value => onUpdate(value),
})

function onUpdate(value) {
  let next = value == null ? '' : String(value)
  const maxLen = maxlengthResolved.value
  if (props.lettersOnly) {
    next = sanitizeLettersOnlyInput(next, maxLen)
  } else if (maxLen != null) {
    next = next.slice(0, maxLen)
  }
  emit('update:modelValue', next)
}

async function validate() {
  return inputRef.value?.validate?.()
}

function resetValidation() {
  inputRef.value?.resetValidation?.()
}

defineExpose({
  validate,
  resetValidation,
})
</script>

<style lang="scss" scoped>
  @import 'src/css/quasar.variables';

  .q-input {
    min-width: 120px;
  }

  .text-input--stack-spacing {
    margin-bottom: 0;
  }

  .input-icon {
    color: $primary;
  }
</style>
