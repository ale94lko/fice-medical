<template>
  <div class="row justify-between login-container">
    <q-page :class="['login-card flex flex-center', { 'mobile': !showPromo }]">
      <q-img
        class="logo"
        src="logo.png"
        spinner-color="white"
        style="max-width: 120px"
      />
      <q-card class="my-card bg-grey-1">
        <form @submit.prevent.stop="handleLogin">
          <q-card-section>
            <text-input
              v-model="email"
              label="Email"
              icon-left="mail"
              :error-message="emailErrorMessage"
              :error="isEmailInvalid"
            />
            <text-input
              v-model="password"
              label="Password"
              icon-left="lock"
              type="password"
              :error-message="passwordErrorMessage"
              :error="isPasswordInvalid"
            />
          </q-card-section>
          <q-card-actions>
            <q-btn
              color="primary"
              label="Sign in"
              type="submit"
              class="full-width" />
            <div class="forgot-password-container">
              <q-item-label @click="handleForgotPassword" class="forgot-password">
                Forgot your password?
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
import TextInput from 'components/TextInput.vue'
import { useNotifications } from 'src/composables/useNotifications'

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

//Notifications
const { notifyError } = useNotifications()

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

// Responsive logic
const windowWidth = computed(() => $q.screen.width)
const showPromo = computed(() => windowWidth.value >= siteBreakpointsPx.MD)

// Login handler
async function handleLogin() {
  isEmailInvalid.value = !!emailErrorMessage.value
  isPasswordInvalid.value = password.value.trim() === ''

  if (!isEmailInvalid.value && !isPasswordInvalid.value) {
    try {
      const result = await authStore.login(email.value, password.value)
      if (result) {
        await router.push('/')
      }
    } catch (error) {
      notifyError(error.message || 'Error al iniciar sesión')
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
