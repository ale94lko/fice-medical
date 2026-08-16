<template>
  <div class="row justify-between login-container">
    <q-page :class="['login-card flex flex-center', { 'mobile': !showPromo }]">
      <q-img
        class="logo"
        src="logo.png"
        spinner-color="white"
      />
      <q-card class="my-card">
        <form @submit.prevent.stop="handleSubmit">
          <q-card-section class="login-inputs">
            <template v-if="phase === 'password'">
              <LoginTextInput
                v-model="email"
                icon-left="mail"
                :test-id="authTestIds.emailInput"
                :label="t('email')"
                :error-message="emailErrorMessage"
                :error="isEmailInvalid"
              />
              <LoginTextInput
                v-model="password"
                icon-left="lock"
                type="password"
                :test-id="authTestIds.passwordInput"
                :label="t('password')"
                :error-message="passwordErrorMessage"
                :error="isPasswordInvalid"
              />
            </template>
            <template v-else>
              <p class="login-mfa-hint text-body2 text-grey-7 q-mb-md">
                {{ t('loginMfaSubtitle') }}
              </p>
              <LoginTextInput
                ref="mfaInputRef"
                v-model="mfaCode"
                icon-left="pin"
                autocomplete="one-time-code"
                autofocus
                float-label-on-value
                :test-id="authTestIds.mfaCodeInput"
                :label="t('loginMfaCodeLabel')"
                :error-message="mfaCodeErrorMessage"
                :error="isMfaCodeInvalid"
              />
            </template>
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
              :data-testid="phase === 'mfa'
                ? authTestIds.mfaVerifyButton
                : authTestIds.signInButton"
              :label="phase === 'mfa'
                ? t('loginMfaVerify')
                : t('signIn')"
              :loading="loading">
            </q-btn>
            <div class="forgot-password-container">
              <q-item-label
                v-if="phase === 'password'"
                class="forgot-password"
                :data-testid="authTestIds.forgotPasswordLink"
                @click="router.push('/reset-password')">
                {{ t('forgotPassword') }}
              </q-item-label>
              <q-item-label
                v-else
                class="forgot-password"
                :data-testid="authTestIds.mfaBackButton"
                @click="backToPassword">
                {{ t('loginMfaBack') }}
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
import { ref, computed, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from 'stores/auth-store.js'
import { siteBreakpointsPx } from 'components/constants.js'
import LoginTextInput from 'components/auth/LoginTextInput.vue'
import LoginPromoPanel from '../../components/LoginPromoPanel.vue'
import { authTestIds } from 'src/test-ids/index.js'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const mfaCode = ref('')
const mfaChallengeToken = ref('')
const mfaInputRef = ref(null)
const phase = ref('password')

const isEmailInvalid = ref(false)
const isPasswordInvalid = ref(false)
const isMfaCodeInvalid = ref(false)
const loginError = ref('')
const loading = ref(false)

const { t } = useI18n()

const emailErrorMessage = computed(() => {
  const valid = /.+@.+\..+/.test(email.value)
  return email.value.trim() === ''
    ? 'Email is required'
    : (!valid ? 'Please enter a valid email address' : '')
})

const passwordErrorMessage = computed(() => {
  return password.value.trim() === '' ? 'Password is required' : ''
})

const mfaCodeErrorMessage = computed(() => {
  return mfaCode.value.trim() === '' ? t('loginMfaCodeRequired') : ''
})

const windowWidth = computed(() => $q.screen.width)
const showPromo = computed(() => windowWidth.value >= siteBreakpointsPx.MD)

watch(phase, async(nextPhase) => {
  if (nextPhase !== 'mfa') {
    return
  }
  void import('layouts/MainLayout.vue')
  void import('pages/dashboard/DashboardPage.vue')
  await nextTick()
  mfaInputRef.value?.focus()
})

function backToPassword() {
  phase.value = 'password'
  mfaCode.value = ''
  mfaChallengeToken.value = ''
  loginError.value = ''
  isMfaCodeInvalid.value = false
}

async function handleSubmit() {
  loginError.value = ''
  loading.value = true
  try {
    if (phase.value === 'mfa') {
      await handleMfa()
    } else {
      await handlePassword()
    }
  } finally {
    loading.value = false
  }
}

async function handlePassword() {
  isEmailInvalid.value = !!emailErrorMessage.value
  isPasswordInvalid.value = password.value.trim() === ''
  if (isEmailInvalid.value || isPasswordInvalid.value) {
    return
  }
  try {
    const result = await authStore.login(
      email.value.trim(),
      password.value,
      t,
    )
    if (result?.mfaRequired) {
      mfaChallengeToken.value = result.token
      mfaCode.value = ''
      phase.value = 'mfa'
      return
    }
    if (result) {
      await authStore.enterAppIfReady()
    }
  } catch (error) {
    loginError.value = error.message || t('networkError')
  }
}

async function handleMfa() {
  isMfaCodeInvalid.value = !!mfaCodeErrorMessage.value
  if (isMfaCodeInvalid.value) {
    return
  }
  try {
    const ok = await authStore.completeMfaLogin(
      mfaChallengeToken.value,
      mfaCode.value,
      t,
    )
    if (ok) {
      await authStore.enterAppIfReady()
    }
  } catch (error) {
    loginError.value = error.message || t('networkError')
  }
}
</script>
