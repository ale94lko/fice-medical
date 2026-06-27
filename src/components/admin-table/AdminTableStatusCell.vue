<template>
  <span
    v-if="label"
    class="admin-table-status"
    :class="`admin-table-status--${variant}`">
    <span
      class="admin-table-status__dot"
      aria-hidden="true"
    />
    <span class="admin-table-status__label">
      <AdminTableSearchHighlight
        :text="label"
        :query="highlightQuery"
      />
    </span>
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
