<template>
  <div
    class="admin-table-actions-header">
    <span class="admin-table-actions-header__label">{{ label }}</span>
    <q-btn
      flat
      round
      dense
      icon="settings"
      class="admin-table-actions-header__settings app-btn-icon-action"
      :data-testid="testId"
      :aria-label="t('adminTableColumnSettingsTitle')"
      @click="emit('open')"
    >
          <q-tooltip
            class="app-info-tooltip"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 6]">
            {{ t('adminTableColumnSettingsTitle') }}
          </q-tooltip>
        </q-btn>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  label: {
    type: String,
    default: '',
  },
  testId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['open'])

const { t } = useI18n()
</script>
