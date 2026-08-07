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
import { useViewportLayout } from 'src/composables/useViewportLayout.js'

const authStore = useAuthStore()
const { mustChangePassword } = storeToRefs(authStore)

// Keeps body / #q-app classes: .vp-mobile | .vp-tablet | .vp-desktop
useViewportLayout({ syncDocument: true })
</script>
