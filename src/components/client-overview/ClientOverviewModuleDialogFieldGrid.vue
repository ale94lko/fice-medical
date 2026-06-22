<template>
  <div class="client-overview-module-dialog__fields">
    <div
      v-for="(field, index) in fields"
      :key="`dialog-field-${index}`"
      class="client-overview-module-dialog__field">
      <span class="client-overview-module-dialog__field-label">
        {{ t(field.labelKey) }}
      </span>
      <span class="client-overview-module-dialog__field-value">
        {{ field.value }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  fields: {
    type: Array,
    default: () => [],
  },
})

const { t } = useI18n()
</script>
