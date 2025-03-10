<template>
  <q-page class="flex flex-center bg-teal-1">

    <q-card class="my-card">
      <q-card-section >
        <q-img
          src="/img/logo.png"
          loading="lazy"
          spinner-color="white"
          height="169px"
          style="max-width: 169px"/>
        <text-input v-model="email" label="Email" icon-left="mail" />
        <text-input v-model="password" label="Password" icon-left="lock" type="password" />
      </q-card-section>
      <q-card-actions align="around">
        <q-btn color="primary" label="Login" @click="handleLogin" />
        <q-btn color="secondary" class="text-teal-10" label="Forgot password?" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script >
import { ref } from 'vue'
import TextInput from 'components/TextInput.vue'
import { useAuthStore } from 'stores/auth-store.js'

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
