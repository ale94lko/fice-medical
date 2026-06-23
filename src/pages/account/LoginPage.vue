<template>
  <div class="row justify-between login-container">
    <q-page :class="['login-card flex flex-center', { 'mobile': !showPromo }]">
      <q-img
        class="logo"
        src="logo.png"
        spinner-color="white"
      />
      <q-card class="my-card">
        <form @submit.prevent.stop="handleLogin">
          <q-card-section class="login-inputs">
            <form-input
              v-model="email"
              stack-spacing
              icon-left="mail"
              :test-id="authTestIds.emailInput"
              :label="t('email')"
              :error-message="emailErrorMessage"
              :error="isEmailInvalid"
            />
            <form-input
              v-model="password"
              stack-spacing
              icon-left="lock"
              type="password"
              :test-id="authTestIds.passwordInput"
              :label="t('password')"
              :error-message="passwordErrorMessage"
              :error="isPasswordInvalid"
            />
            <q-item-label v-if="loginError" class="login-error-msg">
              {{ loginError }}
            </q-item-label>
          </q-card-section>
          <q-card-actions>
            <q-btn
              no-caps
              unelevated
              color="primary"
              type="submit"
              class="full-width"
              :data-testid="authTestIds.signInButton"
              :label="t('signIn')"
              :loading="loading">
            </q-btn>
            <div class="forgot-password-container">
              <q-item-label
                class="forgot-password"
                :data-testid="authTestIds.forgotPasswordLink"
                @click="router.push('/reset-password')">
                {{ t('forgotPassword') }}
              </q-item-label>
            </div>
          </q-card-actions>
        </form>
      </q-card>
    </q-page>

    <LoginPromoPanel v-if="showPromo" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from 'stores/auth-store.js'
import { siteBreakpointsPx } from 'components/constants.js'
import FormInput from '../../components/FormInput.vue'
import LoginPromoPanel from '../../components/LoginPromoPanel.vue'
import { authTestIds } from 'src/test-ids/index.js'

// Quasar + Router + Auth Store
const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()

// Reactive form fields
const email = ref('')
const password = ref('')

// Validation flags
const isEmailInvalid = ref(false)
const isPasswordInvalid = ref(false)
const loginError = ref('')
const loading = ref(false)

// Validation error messages
const emailErrorMessage = computed(() => {
  const valid = /.+@.+\..+/.test(email.value)
  return email.value.trim() === ''
    ? 'Email is required'
    : (!valid ? 'Please enter a valid email address' : '')
})

const passwordErrorMessage = computed(() => {
  return password.value.trim() === '' ? 'Password is required' : ''
})

const { t } = useI18n()

// Responsive logic
const windowWidth = computed(() => $q.screen.width)
const showPromo = computed(() => windowWidth.value >= siteBreakpointsPx.MD)

// Login handler
async function handleLogin() {
  isEmailInvalid.value = !!emailErrorMessage.value
  isPasswordInvalid.value = password.value.trim() === ''
  loading.value = true

  if (!isEmailInvalid.value && !isPasswordInvalid.value) {
    try {
      const result = await authStore.login(
        email.value.trim(),
        password.value,
        t
      )
      if (result) {
        await router.push('/')
      }
    } catch (error) {
      loginError.value = error.message || t('networkError')
    }
  }
  loading.value = false
}

</script>
