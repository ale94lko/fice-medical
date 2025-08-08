<template>
  <div class="row justify-between login-container">
    <q-page :class="['login-card flex flex-center', { 'mobile': !showPromo }]">
      <q-img
        class="logo"
        src="test.png"
        spinner-color="white"
        style="max-width: 285px"
      />
      <q-card class="my-card bg-grey-1">
        <form @submit.prevent.stop="handleLogin">
          <q-card-section class="login-inputs">
            <text-input
              v-model="email"
              icon-left="mail"
              :label="t('email')"
              :error-message="emailErrorMessage"
              :error="isEmailInvalid"
            />
            <text-input
              v-model="password"
              icon-left="lock"
              type="password"
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
              color="primary"
              :label="t('sign_in')"
              type="submit"
              class="full-width" />
            <div class="forgot-password-container">
              <q-item-label @click="handleForgotPassword" class="forgot-password">
                {{ t('forgot_password') }}
              </q-item-label>
            </div>
          </q-card-actions>
        </form>
      </q-card>
    </q-page>

    <q-page class="promo-container" v-if="showPromo">
      <div class="promo">
        <!-- contenido de promo aquí -->
      </div>
    </q-page>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth-store'
import { siteBreakpointsPx } from 'components/constants'
//import { useNotifications } from 'src/composables/useNotifications'
import { useI18n } from 'vue-i18n'
import TextInput from 'components/TextInput.vue'

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

//Notifications
//const { notifyError } = useNotifications()

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
      loginError.value = error.message.replace(':br', '')
      //notifyError(error.message || 'Error al iniciar sesión')
    }
  }
}

// Forgot password placeholder
function handleForgotPassword() {
  console.log('Forgot password clicked')
}
</script>

<style scoped>
/* Tus estilos aquí si necesitas */
</style>
