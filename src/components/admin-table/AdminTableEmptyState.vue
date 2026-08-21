<template>
  <div
    class="admin-table-empty-state full-width column flex-center
      q-pa-lg"
    :data-testid="testId || undefined">
    <div class="admin-table-empty-state__icon">
      <q-icon :name="icon" size="32px" />
    </div>
    <p class="admin-table-empty-state__title">
      {{ title }}
    </p>
    <p
      v-if="hint"
      class="admin-table-empty-state__hint">
      {{ hint }}
    </p>
    <div
      v-if="$slots.default"
      class="admin-table-empty-state__actions q-mt-sm">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  hint: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: 'find_in_page',
  },
  testId: {
    type: String,
    default: '',
  },
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.admin-table-empty-state {
  min-height: 220px;
  gap: 8px;
}

.admin-table-empty-state__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba($primary, 0.12);
  color: $primary;
}

.admin-table-empty-state__title {
  margin: 8px 0 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: $text-strong;
}

.admin-table-empty-state__hint {
  margin: 0;
  max-width: 360px;
  font-size: 0.875rem;
  line-height: 1.4;
  text-align: center;
  color: $text-muted;
}
</style>
