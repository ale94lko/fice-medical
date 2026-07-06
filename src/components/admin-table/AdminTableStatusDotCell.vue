<template>
  <span
    v-if="label"
    class="admin-table-status-dot"
    :class="`admin-table-status-dot--${variant}`">
    <span
      class="admin-table-status-dot__indicator"
      aria-hidden="true"
    />
    <AdminTableSearchHighlight
      :text="label"
      :query="highlightQuery"
    />
  </span>
  <span v-else class="text-grey-7">—</span>
</template>

<script setup>
import AdminTableSearchHighlight from
  'components/admin-table/AdminTableSearchHighlight.vue'

defineProps({
  label: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: 'other',
  },
  highlightQuery: {
    type: String,
    default: '',
  },
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.admin-table-status-dot {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.2;
  color: $text-strong;
  white-space: nowrap;

  &__indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    background: $text-muted;
  }

  &--active .admin-table-status-dot__indicator {
    background: #22c55e;
  }

  &--pending .admin-table-status-dot__indicator {
    background: #f59e0b;
  }

  &--inactive .admin-table-status-dot__indicator {
    background: #94a3b8;
  }

  &--other .admin-table-status-dot__indicator {
    background: #f59e0b;
  }
}
</style>
