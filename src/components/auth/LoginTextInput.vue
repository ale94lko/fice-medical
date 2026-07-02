<template>
  <q-input
    outlined
    v-model="model"
    lazy-rules="ondemand"
    hide-bottom-space
    class="login-text-input full-width"
    :data-testid="testId"
    :type="resolvedType"
    :label="label || undefined"
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
</style>
