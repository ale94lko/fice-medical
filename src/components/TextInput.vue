<template>
  <FormField v-if="externalLabel" :label="props.label">
    <q-input
      outlined
      hide-bottom-space
      class="full-width"
      :model-value="model"
      :data-testid="props.testId"
      :type="resolvedType"
      :rules="props.rules || []"
      :maxlength="maxlengthResolved"
      :error="props.error"
      :error-message="props.errorMessage"
      :placeholder="props.placeholder || undefined"
      :disable="props.disable"
      lazy-rules="ondemand"
      @update:model-value="onUpdate">
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
    outlined
    :stack-label="stackSpacing"
    :hide-bottom-space="!stackSpacing"
    :model-value="model"
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
    lazy-rules="ondemand"
    @update:model-value="onUpdate">
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
import FormField from 'components/FormField.vue'
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
  /** Vertical spacing when fields are stacked (e.g. login). */
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
  placeholder: {
    type: String,
    default: '',
  },
  disable: {
    type: Boolean,
    default: false,
  },
})

const model = defineModel({ type: String, default: '' })

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

function onUpdate(value) {
  let next = value == null ? '' : String(value)
  const maxLen = maxlengthResolved.value
  if (props.lettersOnly) {
    next = sanitizeLettersOnlyInput(next, maxLen)
  } else if (maxLen != null) {
    next = next.slice(0, maxLen)
  }
  model.value = next
}
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
