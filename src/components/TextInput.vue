<template>
  <q-input
    outlined
    v-model="model"
    :lazy-rules="'ondemand'"
    :data-testid="props.testId"
    :type="resolvedType"
    :label="props.label"
    :rules="props.rules || []"
    :error="props.error"
    :error-message="props.errorMessage">
    <template v-slot:prepend v-if="iconLeft">
      <q-icon :name="iconLeft" class="input-icon"/>
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
import PasswordToggleIcon from './PasswordToggleIcon.vue'
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
    default: 'text',
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
})

const model = defineModel({ type: String, default: '' })

const showPlainPassword = ref(false)

const isPasswordField = computed(() => isPasswordInputType(props.type))

const resolvedType = computed(() =>
  isPasswordField.value
    ? passwordFieldInputType(showPlainPassword.value)
    : props.type,
)
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.q-input {
  min-width: 120px;
  margin-bottom: 10px;
}

.input-icon {
  color: $primary;
}
</style>
