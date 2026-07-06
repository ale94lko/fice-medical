<template>
  <div class="admin-table-role-badges">
    <span
      v-for="(role, index) in roles"
      :key="`${role}-${index}`"
      class="admin-table-role-badges__badge"
      :class="`admin-table-role-badges__badge--${badgeTone(role, index)}`">
      <AdminTableSearchHighlight
        :text="role"
        :query="highlightQuery"
      />
    </span>
    <span v-if="!roles.length" class="text-grey-7">—</span>
  </div>
</template>

<script setup>
import AdminTableSearchHighlight from
  'components/admin-table/AdminTableSearchHighlight.vue'
import { resolveRoleBadgeTone } from 'src/utils/user-list-display.js'

defineProps({
  roles: {
    type: Array,
    default: () => [],
  },
  highlightQuery: {
    type: String,
    default: '',
  },
})

function badgeTone(role, index) {
  return resolveRoleBadgeTone(role, index)
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.admin-table-role-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  &__badge {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    line-height: 1.2;
    white-space: nowrap;

    &--primary {
      background: #dcfce7;
      color: #166534;
    }

    &--info {
      background: #dbeafe;
      color: #1d4ed8;
    }

    &--violet {
      background: #ede9fe;
      color: #6d28d9;
    }

    &--amber {
      background: #fef3c7;
      color: #b45309;
    }
  }
}
</style>
