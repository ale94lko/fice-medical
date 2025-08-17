<template>
  <div class="row justify-between login-container">
    <q-page class="login-card flex flex-center">
      <q-img
        class="logo"
        src="logo.png"
        spinner-color="white"
      />
      <q-card class="my-card bg-grey-1">
        <form @submit.prevent.stop="handleSubmit">
          <q-card-section>
            <div class="text-h6">{{ t('reset_password') }}</div>
          </q-card-section>
          <q-card-section class="login-inputs">
            <text-input
              v-model="email"
              icon-left="mail"
              test-id="input_email"
              maxlength="32"
              :label="t('email')"
              :error-message="emailErrorMessage"
              :error="isEmailInvalid"
            />
          </q-card-section>
          <q-card-actions>
            <q-btn
              color="primary"
              type="submit"
              class="full-width"
              data-testId="button_continue"
              :label="t('continue')"
              :loading="loading">
            </q-btn>
            <div class="forgot-password-container">
              <q-item-label
                class="forgot-password"
                data-testId="button_back_to_login"
                @click="router.push('/login')">
                {{ t('backToLogin') }}
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
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { apiInstance } from 'boot/axios'
import { siteBreakpointsPx } from 'components/constants.js'
import TextInput from 'components/TextInput.vue'

const router = useRouter()
const $q = useQuasar()
const { t } = useI18n()

// Responsive logic
const windowWidth = computed(() => $q.screen.width)
const showPromo = computed(() => windowWidth.value >= siteBreakpointsPx.MD)

const email = ref('')
const isEmailInvalid = ref(false)
const loading = ref(false)

const emailErrorMessage = computed(() => {
  const value = email.value.trim()
  const regex = /^[A-Za-z0-9_-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  return value === ''
    ? 'Email is required'
    : value.length > 32
      ? 'Email must be at most 32 characters'
      : !regex.test(value)
        ? 'Please enter a valid email address'
        : ''
})

async function handleSubmit() {
  isEmailInvalid.value = !!emailErrorMessage.value

  if (isEmailInvalid.value) {
    return
  }

  loading.value = true

  try {
    await apiInstance.post('/oauth/v1/reset-password', {
      email: email.value.trim()
    })
  } catch {
    // Ignore errors to avoid leaking account existence
  }

  loading.value = false
  $q.notify({ type: 'positive', message: t('password_reset_email_sent') })
  await router.push('/login')
}
</script>

<style scoped>
</style>

