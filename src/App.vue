<template>
  <router-view />
  <ForcedChangePasswordDialog v-if="mustChangePassword" />
  <TelehealthFloatingCall />
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from 'stores/auth-store.js'
import ForcedChangePasswordDialog from
  'components/ForcedChangePasswordDialog.vue'
import TelehealthFloatingCall from
  'components/telehealth/TelehealthFloatingCall.vue'

const authStore = useAuthStore()
const { mustChangePassword } = storeToRefs(authStore)
</script>
