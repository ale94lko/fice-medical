<template>
  <div class="row justify-between bg-grey-4">
    <q-page
      :class="['login-card flex flex-center', { 'mobile': !showPromo }]">
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
              :error-message="getEmailErrorMessage()"
              :error="isEmailInvalid" />
            <text-input
              v-model="password"
              label="Password"
              icon-left="lock"
              type="password"
              :error-message="getPasswordErrorMessage()"
              :error="isPasswordInvalid" />
          </q-card-section>
          <q-card-actions>
            <q-btn color="primary" label="Sign in" type="submit" class="full-width"/>
            <div class="forgot-password-container">
              <q-item-label @click="handleForgotPassword()" class="forgot-password">Forgot your password?</q-item-label>
            </div>
          </q-card-actions>
        </form>
      </q-card>
    </q-page>
    <q-page class="promo-container" v-if="showPromo">
      <div class="promo">
      </div>
    </q-page>
  </div>
</template>

<script >
import { ref } from 'vue'
import TextInput from 'components/TextInput.vue'
import { useAuthStore } from 'stores/auth-store.js'
import { siteBreakpointsPx } from 'components/constants.js'

export default {
  data() {
    return {
      isEmailInvalid: false,
      isPasswordInvalid: false,
    }
  },
  methods: {
    async handleLogin() {
      this.isEmailInvalid = false
      this.isPasswordInvalid = false

      if (this.getEmailErrorMessage()) {
        this.isEmailInvalid = true
      }
      if (this.password.trim() === '') {
        this.isPasswordInvalid = true
      }

      if (!this.isEmailInvalid && !this.isPasswordInvalid) {
        const store = useAuthStore()
        let result = await store.login(this.email, this.password)
        if (result) {
          this.$router.push('/')
        }
      }
    },
    handleForgotPassword() {
      console.log('Forgot password clicked')
    },
    getEmailErrorMessage() {
      const valid = /.+@.+\..+/.test(this.email)

      return this.email.trim() === ''
          ? 'Email is required'
          : (!valid ? 'Please enter a valid email address' : '')
    },
    getPasswordErrorMessage() {
      return this.password.trim() === '' ? 'Password is required' : ''
    },
  },
  computed: {
    showPromo() {
      return this.windowWidth >= siteBreakpointsPx.MD
    },
    windowWidth() {
      return this.$q.screen.width
    },
  },
  components: {
    TextInput,
  },
  setup() {
    const email = ref('')
    const password = ref('')

    return {
      email,
      password,
    }
  },
}
</script>
