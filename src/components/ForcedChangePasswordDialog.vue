<template>
  <q-dialog
    :model-value="true"
    persistent
    no-esc-dismiss
    no-backdrop-dismiss
    transition-show="scale"
    transition-hide="scale"
    class="forced-change-password-dialog"
    :data-testid="forcedChangePasswordTestIds.dialog"
    @update:model-value="() => {}">
    <q-card class="forced-change-password-dialog__card app-dialog-card">
      <q-card-section class="forced-change-password-dialog__header">
        <div
          class="forced-change-password-dialog__icon-wrap"
          aria-hidden="true">
          <q-icon name="lock_reset" size="26px" />
        </div>
        <h2 class="forced-change-password-dialog__title">
          {{ t('forcedChangePasswordTitle') }}
        </h2>
        <p class="forced-change-password-dialog__subtitle">
          {{ dialogSubtitle }}
        </p>
      </q-card-section>

      <q-card-section class="forced-change-password-dialog__body">
        <q-form
          greedy
          class="forced-change-password-dialog__form"
          @submit.prevent="onSubmit">
          <LoginTextInput
            v-if="requiresCurrentPassword"
            v-model="currentPassword"
            icon-left="lock"
            type="password"
            :test-id="forcedChangePasswordTestIds.currentPassword"
            :label="t('forcedChangePasswordCurrentLabel')"
            :error="isCurrentPasswordInvalid"
            :error-message="currentPasswordErrorMessage"
          />
          <LoginTextInput
            v-model="password"
            icon-left="lock"
            type="password"
            :test-id="forcedChangePasswordTestIds.newPassword"
            :label="t('forcedChangePasswordNewLabel')"
            :error="isPasswordInvalid"
            :error-message="passwordErrorMessage"
          />
          <LoginTextInput
            v-model="passwordRepeat"
            icon-left="lock"
            type="password"
            :test-id="forcedChangePasswordTestIds.repeatPassword"
            :label="t('repeatPassword')"
            :error="isPasswordRepeatInvalid"
            :error-message="passwordRepeatErrorMessage"
          />
          <p
            v-if="submitError"
            class="forced-change-password-dialog__error">
            {{ submitError }}
          </p>
          <q-btn
            no-caps
            unelevated
            color="primary"
            type="submit"
            class="full-width app-btn-primary
              forced-change-password-dialog__submit"
            :loading="loading"
            :data-testid="forcedChangePasswordTestIds.submit"
            :label="t('forcedChangePasswordSubmit')"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import LoginTextInput from 'components/auth/LoginTextInput.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { useAuthStore } from 'stores/auth-store.js'
import {
  changeAuthenticatedPassword,
  changeInitialPassword,
} from 'src/utils/auth-change-password-api.js'
import {
  getPasswordChangeApiErrorCode,
  passwordErrorCodes,
  resolvePasswordChangeApiError,
  resolvePasswordConfirmMessage,
  resolveNewPasswordChangeMessage,
} from 'src/utils/password-validation.js'
import { forcedChangePasswordTestIds } from 'src/test-ids/index.js'

const { t } = useI18n()
const $q = useQuasar()
const authStore = useAuthStore()

const currentPassword = ref('')
const password = ref('')
const passwordRepeat = ref('')
const isCurrentPasswordInvalid = ref(false)
const isPasswordInvalid = ref(false)
const isPasswordRepeatInvalid = ref(false)
const submitError = ref('')
const currentPasswordApiError = ref('')
const loading = ref(false)

const requiresCurrentPassword = computed(
  () => authStore.requiresCurrentPasswordForChange,
)

const dialogSubtitle = computed(() =>
  requiresCurrentPassword.value
    ? t('forcedChangePasswordCurrentSubtitle')
    : t('forcedChangePasswordSubtitle'),
)

const currentPasswordErrorMessage = computed(() => {
  if (currentPasswordApiError.value) {
    return currentPasswordApiError.value
  }

  return currentPassword.value.trim().length > 0 ? '' : t('passwordRequired')
})

const passwordErrorMessage = computed(() =>
  resolveNewPasswordChangeMessage(password.value, t, {
    currentPassword: requiresCurrentPassword.value
      ? currentPassword.value
      : undefined,
  }),
)

const passwordRepeatErrorMessage = computed(() =>
  resolvePasswordConfirmMessage(
    password.value,
    passwordRepeat.value,
    t,
  ),
)

async function onSubmit() {
  submitError.value = ''
  currentPasswordApiError.value = ''
  isCurrentPasswordInvalid.value = requiresCurrentPassword.value
    && !!currentPasswordErrorMessage.value
  isPasswordInvalid.value = !!passwordErrorMessage.value
  isPasswordRepeatInvalid.value = !!passwordRepeatErrorMessage.value
  if (
    isCurrentPasswordInvalid.value
    || isPasswordInvalid.value
    || isPasswordRepeatInvalid.value
  ) {
    return
  }

  loading.value = true
  try {
    if (requiresCurrentPassword.value) {
      await changeAuthenticatedPassword({
        currentPassword: currentPassword.value,
        newPassword: password.value,
        confirmNewPassword: passwordRepeat.value,
      })
    } else {
      await changeInitialPassword({
        newPassword: password.value,
        confirmNewPassword: passwordRepeat.value,
      })
    }
    authStore.completePasswordChange()
    currentPassword.value = ''
    password.value = ''
    passwordRepeat.value = ''
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('forcedChangePasswordSuccess'),
    })
  } catch (error) {
    const message = resolvePasswordChangeApiError(
      error,
      t,
      'forcedChangePasswordFailed',
    )
    if (
      requiresCurrentPassword.value
      && getPasswordChangeApiErrorCode(error)
      === passwordErrorCodes.incorrectCurrent
    ) {
      currentPasswordApiError.value = message
      isCurrentPasswordInvalid.value = true
      return
    }
    submitError.value = message
  } finally {
    loading.value = false
  }
}

watch(currentPassword, () => {
  currentPasswordApiError.value = ''
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.forced-change-password-dialog {
  &__card {
    width: 100%;
    max-width: 440px;
    min-width: 280px;
  }

  &__header {
    padding: 24px 24px 8px;
    text-align: center;
  }

  &__icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    margin-bottom: 12px;
    border-radius: 50%;
    background: rgba($primary, 0.12);
    color: $primary;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.3;
    color: $text-strong;
  }

  &__subtitle {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.45;
    color: $text-muted;
  }

  &__body {
    padding: 8px 24px 24px;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__error {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.4;
    color: $negative;
  }

  &__submit {
    margin-top: 4px;
  }
}
</style>
