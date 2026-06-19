<template>
  <div class="admin-table-panel">
    <div
      v-if="$slots.toolbar"
      class="admin-table-panel__toolbar row items-center q-gutter-sm">
      <slot name="toolbar" />
    </div>
    <div
      v-if="$slots.pagination"
      class="admin-table-panel__pagination">
      <slot name="pagination" />
    </div>
    <div class="admin-table-panel__table-wrap">
      <q-btn
        v-if="showColumnSettings && !inlineColumnSettings"
        flat
        round
        dense
        icon="settings"
        class="admin-table-panel__column-settings app-btn-icon-action"
        :data-testid="columnSettingsTestId"
        :title="t('adminTableColumnSettingsTitle')"
        :aria-label="t('adminTableColumnSettingsTitle')"
        @click="emit('open-column-settings')"
      />
      <slot />
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  showColumnSettings: {
    type: Boolean,
    default: true,
  },
  columnSettingsTestId: {
    type: String,
    default: '',
  },
  inlineColumnSettings: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['open-column-settings'])

const { t } = useI18n()
</script>
