<template>
  <div class="row justify-between login-container">
    <q-page class="login-card flex flex-center">
      <q-img
        class="logo"
        src="logo.png"
        spinner-color="white"
      />
      <q-card class="my-card">
        <form @submit.prevent.stop="handleSubmit">
          <q-card-section>
            <div class="text-h6">{{ t('resetPassword') }}</div>
          </q-card-section>
          <q-card-section class="login-inputs">
            <template v-if="isTokenResetMode">
              <LoginTextInput
                v-model="password"
                icon-left="lock"
                type="password"
                test-id="input_new_password"
                :label="t('password')"
                :error="isPasswordInvalid"
                :error-message="passwordErrorMessage"
              />
              <LoginTextInput
                v-model="passwordRepeat"
                icon-left="lock"
                type="password"
                test-id="input_repeat_password"
                :label="t('repeatPassword')"
                :error="isPasswordRepeatInvalid"
                :error-message="passwordRepeatErrorMessage"
              />
              <q-item-label
                v-if="submitError"
                class="login-error-msg">
                {{ submitError }}
              </q-item-label>
            </template>
            <template v-else>
              <LoginTextInput
                v-model="email"
                icon-left="mail"
                test-id="input_email"
                maxlength="32"
                :label="t('email')"
                :error-message="emailErrorMessage"
                :error="isEmailInvalid"
              />
            </template>
          </q-card-section>
          <q-card-actions>
            <q-btn
              no-caps
              unelevated
              color="primary"
              type="submit"
              class="full-width"
              :data-testId="isTokenResetMode
                ? 'button_accept_reset'
                : 'button_continue'"
              :label="isTokenResetMode ? t('accept') : t('continue')"
              :loading="loading"
            />
            <div class="forgot-password-container">
              <q-item-label
                class="forgot-password"
                data-testId="button_back_to_login"
                @click="goToLogin">
                {{ t('backToLogin') }}
              </q-item-label>
            </div>
          </q-card-actions>
        </form>
      </q-card>
    </q-page>

    <q-page v-if="showPromo" class="promo-container">
      <div class="promo" />
    </q-page>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { apiInstance } from 'boot/axios'
import {
  apiPaths,
  quasarNotifyTypes,
  siteBreakpointsPx,
} from 'components/constants.js'
import LoginTextInput from 'components/auth/LoginTextInput.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const { t } = useI18n()

const windowWidth = computed(() => $q.screen.width)
const showPromo = computed(() => windowWidth.value >= siteBreakpointsPx.MD)

function readTokenFromRouteQuery() {
  const raw = route.query.token
  const value = Array.isArray(raw) ? raw[0] : raw

  return typeof value === 'string' ? value.trim() : ''
}

function readTokenFromWindowSearch() {
  if (typeof window === 'undefined') {
    return ''
  }
  const value = new URLSearchParams(window.location.search).get('token')

  return typeof value === 'string' ? value.trim() : ''
}

const resetToken = computed(() => {
  const fromRoute = readTokenFromRouteQuery()
  if (fromRoute) {
    return fromRoute
  }

  return readTokenFromWindowSearch()
})

const isTokenResetMode = computed(() => resetToken.value.length > 0)

async function goToLogin() {
  await router.replace({ name: 'LoginPage' })
}

const email = ref('')
const password = ref('')
const passwordRepeat = ref('')
const isEmailInvalid = ref(false)
const isPasswordInvalid = ref(false)
const isPasswordRepeatInvalid = ref(false)
const loading = ref(false)
const submitError = ref('')

const emailErrorMessage = computed(() => {
  const value = email.value.trim()
  const regex = /^[A-Za-z0-9_-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  if (value === '') {
    return t('emailRequired')
  }
  if (value.length > 32) {
    return t('emailMaxLength')
  }
  if (!regex.test(value)) {
    return t('emailInvalid')
  }

  return ''
})

const passwordErrorMessage = computed(() =>
  password.value.length > 0 ? '' : t('passwordRequired'),
)

const passwordRepeatErrorMessage = computed(() => {
  if (passwordRepeat.value.length === 0) {
    return t('passwordRequired')
  }
  if (passwordRepeat.value !== password.value) {
    return t('passwordsDoNotMatch')
  }

  return ''
})

async function handleSubmit() {
  submitError.value = ''
  if (isTokenResetMode.value) {
    await submitTokenReset()
  } else {
    await submitForgotPassword()
  }
}

async function submitForgotPassword() {
  isEmailInvalid.value = !!emailErrorMessage.value
  if (isEmailInvalid.value) {
    return
  }

  loading.value = true
  try {
    await apiInstance.post(apiPaths.oauthForgotPassword, {
      email: email.value.trim(),
    })
  } catch {
    // Ignore errors to avoid leaking account existence
  }
  loading.value = false
  $q.notify({
    type: quasarNotifyTypes.positive,
    message: t('passwordResetEmailSent'),
  })
  await goToLogin()
}

async function submitTokenReset() {
  isPasswordInvalid.value = !!passwordErrorMessage.value
  isPasswordRepeatInvalid.value = !!passwordRepeatErrorMessage.value
  if (isPasswordInvalid.value || isPasswordRepeatInvalid.value) {
    return
  }

  loading.value = true
  try {
    await apiInstance.post(apiPaths.oauthResetPassword, {
      token: resetToken.value,
      newPassword: password.value,
    })
    loading.value = false
    password.value = ''
    passwordRepeat.value = ''
    submitError.value = ''
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('resetPasswordSuccess'),
    })
    await goToLogin()
  } catch (err) {
    const apiMsg = err?.response?.data?.message
    submitError.value = typeof apiMsg === 'string' && apiMsg.trim()
      ? apiMsg.trim()
      : t('resetPasswordFailed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
</style>
