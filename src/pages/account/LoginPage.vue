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
        <q-card-section>
          <text-input v-model="email" label="Email" icon-left="mail" />
          <text-input v-model="password" label="Password" icon-left="lock" type="password" />
        </q-card-section>
        <q-card-actions align="around">
          <q-btn color="primary" label="Login" @click="handleLogin" />
          <q-btn color="secondary" class="text-teal-10" label="Forgot password?" />
        </q-card-actions>
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
  methods: {
    async handleLogin() {
      const store = useAuthStore()
      let result = await store.login(this.email, this.password)
      if (result) {
        this.$router.push('/')
      }
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
