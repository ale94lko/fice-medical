<template>
  <q-input
    ref="fieldRef"
    outlined
    v-model="model"
    lazy-rules="ondemand"
    hide-bottom-space
    class="login-text-input full-width"
    :class="{
      'login-text-input--float-on-value': floatLabelOnValue,
    }"
    :key="inputKey"
    :autofocus="autofocus"
    :autocomplete="autocomplete || undefined"
    :data-testid="testId"
    :type="resolvedType"
    :label="resolvedLabel"
    :placeholder="resolvedPlaceholder"
    :rules="rules"
    :error="error"
    :error-message="errorMessage || undefined"
    :maxlength="maxlengthResolved"
    @update:model-value="onUpdate">
    <template v-if="iconLeft" #prepend>
      <q-icon :name="iconLeft" class="login-text-input__icon" />
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
import PasswordToggleIcon from 'components/PasswordToggleIcon.vue'
import {
  isPasswordInputType,
  passwordFieldInputType,
} from 'src/composables/usePasswordVisibility.js'

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
  maxlength: {
    type: [Number, String],
    default: undefined,
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
  autocomplete: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  floatLabelOnValue: {
    type: Boolean,
    default: false,
  },
})

const model = defineModel({ type: String, default: '' })

const fieldRef = ref(null)
const showPlainPassword = ref(false)

const hasValue = computed(() => String(model.value ?? '').length > 0)

const resolvedLabel = computed(() => {
  if (props.floatLabelOnValue && !hasValue.value) {
    return undefined
  }
  return props.label || undefined
})

const resolvedPlaceholder = computed(() => {
  if (props.placeholder) {
    return props.placeholder
  }
  if (props.floatLabelOnValue && !hasValue.value) {
    return props.label || undefined
  }
  return undefined
})

function focus() {
  fieldRef.value?.focus()
}

defineExpose({ focus })

const isPasswordField = computed(() => isPasswordInputType(props.type))

const resolvedType = computed(() =>
  isPasswordField.value
    ? passwordFieldInputType(showPlainPassword.value)
    : props.type,
)

/** Remount on toggle so mobile browsers apply password↔text. */
const inputKey = computed(() => {
  if (!isPasswordField.value) {
    return 'login-input'
  }

  return showPlainPassword.value ? 'login-pwd-plain' : 'login-pwd-hidden'
})

const maxlengthResolved = computed(() => {
  if (props.maxlength == null || props.maxlength === '') {
    return undefined
  }
  const n = Number(props.maxlength)

  return Number.isFinite(n) ? n : undefined
})

function onUpdate(value) {
  model.value = value == null ? '' : String(value)
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.login-text-input__icon {
  color: $primary;
}

:deep(.q-field) {
  min-width: 120px;
  margin-bottom: 0;
}

.login-text-input--float-on-value {
  :deep(.q-field__native::placeholder) {
    color: $text-muted;
    opacity: 1;
  }
}
</style>
