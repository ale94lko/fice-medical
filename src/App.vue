<template>
  <router-view />
  <ForcedChangePasswordDialog v-if="mustChangePassword" />
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from 'stores/auth-store.js'
import ForcedChangePasswordDialog from
  'components/ForcedChangePasswordDialog.vue'

const authStore = useAuthStore()
const { mustChangePassword } = storeToRefs(authStore)
</script>
