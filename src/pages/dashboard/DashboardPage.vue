<template>
  <q-page class="dashboard-page flex flex-center">
    <div
      v-if="!hasAssignedPermissions"
      class="dashboard-page__no-access text-center q-pa-xl">
      <q-icon name="lock" size="48px" color="grey-6" class="q-mb-md" />
      <h1 class="text-h6 text-grey-8 q-mb-sm">
        {{ t('noPermissionsTitle') }}
      </h1>
      <p class="text-body1 text-grey-7 q-mb-none">
        {{ t('noPermissionsMessage') }}
      </p>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from 'stores/auth-store.js'

const { t } = useI18n()
const authStore = useAuthStore()

const hasAssignedPermissions = computed(
  () => authStore.hasAssignedPermissions,
)
</script>
