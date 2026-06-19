<template>
  <div
    class="admin-table-pagination row items-center justify-end">
    <div
      class="admin-table-pagination__end row items-center no-wrap">
      <p class="admin-table-pagination__summary q-mb-none">
        {{ summaryText }}
      </p>
      <div class="row items-center admin-table-pagination__controls">
        <q-select
          dense
          borderless
          emit-value
          map-options
          hide-bottom-space
          class="admin-table-pagination__per-page"
          :model-value="rowsPerPage"
          :options="rowsPerPageOptions"
          :disable="disable"
          @update:model-value="emit('update:rowsPerPage', $event)"
        />
        <q-pagination
          :model-value="page"
          :max="pagesNumber"
          :max-pages="6"
          direction-links
          boundary-links
          color="primary"
          size="sm"
          :disable="disable"
          @update:model-value="emit('update:page', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  page: {
    type: Number,
    default: 1,
  },
  rowsPerPage: {
    type: Number,
    default: 20,
  },
  rowsNumber: {
    type: Number,
    default: 0,
  },
  rowsPerPageChoices: {
    type: Array,
    default: () => [20, 50, 100],
  },
  summaryKey: {
    type: String,
    default: 'adminTablePaginationSummary',
  },
  perPageKey: {
    type: String,
    default: 'adminTablePerPage',
  },
  disable: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:page', 'update:rowsPerPage'])

const { t } = useI18n()

const pagesNumber = computed(() => {
  if (!props.rowsNumber) {
    return 1
  }

  return Math.max(1, Math.ceil(props.rowsNumber / props.rowsPerPage))
})

const summaryText = computed(() => {
  const total = props.rowsNumber || 0
  if (!total) {
    return t(props.summaryKey, { from: 0, to: 0, total: 0 })
  }
  const from = (props.page - 1) * props.rowsPerPage + 1
  const to = Math.min(props.page * props.rowsPerPage, total)

  return t(props.summaryKey, { from, to, total })
})

const rowsPerPageOptions = computed(() =>
  props.rowsPerPageChoices.map(count => ({
    label: t(props.perPageKey, { count }),
    value: count,
  })),
)
</script>
