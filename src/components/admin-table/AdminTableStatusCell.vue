<template>
  <span
    v-if="label"
    class="admin-table-status-badge"
    :class="`admin-table-status-badge--${variant}`">
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
