<template>
  <q-page class="flex flex-center bg-teal-1">

    <q-card class="my-card">
      <q-card-section >
        <q-img
          src="/img/logo.png"
          loading="lazy"
          spinner-color="white"
          height="169px"
          style="max-width: 169px"
        />
        <text-input v-model="user" label="Username" />
        <text-input v-model="password" label="Password" type="password" />
      </q-card-section>
      <q-card-actions align="around">
        <q-btn color="primary" label="Login" />
        <q-btn color="secondary" class="text-teal-10" label="Forgot password?" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script >
import { ref } from "vue";
import TextInput from "components/TextInput.vue";

export default {
  components: {
    TextInput,
  },
  setup() {
    const user = ref("");
    const password = ref("");

    return {
      user,
      password,
    };
  },
}
</script>
