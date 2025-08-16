<template>
  <div class="row justify-between login-container">
    <q-page class="login-card flex flex-center">
      <q-img
        class="logo"
        src="logo.png"
        spinner-color="white"
        style="max-width: 115px"
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
              :label="t('email')"
              :error-message="emailErrorMessage"
              :error="isEmailInvalid"
              maxlength="32"
            />
          </q-card-section>
          <q-card-actions>
            <q-btn
              color="primary"
              type="submit"
              class="full-width"
              data-testId="button_continue"
              :label="t('continue')"
              :loading="loading"/>
          </q-card-actions>
        </form>
      </q-card>
    </q-page>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { apiInstance } from 'boot/axios'
import { useI18n } from 'vue-i18n'
import TextInput from 'components/TextInput.vue'

const router = useRouter()
const $q = useQuasar()
const { t } = useI18n()

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

async function handleSubmit () {
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

