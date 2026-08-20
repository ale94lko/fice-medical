<template>
  <DashboardWidgetShell
    :title="title"
    :description="description"
    :icon="icon"
    :tone="tone"
    :footer-label="footerLabel"
    :deep-link-target="deepLinkTarget"
    :test-id="testId"
    @navigate="target => emit('navigate', target)">
    <div
      v-if="rows.length"
      class="dashboard-table-wrap">
      <table class="dashboard-table">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column">
              {{ columnLabel(column) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in rows"
            :key="rowKey(row, index)"
            :class="{
              'dashboard-table__row--clickable': Boolean(rowTarget(row)),
            }"
            @click.stop="onRowClick(row)">
            <td
              v-for="column in columns"
              :key="`${rowKey(row, index)}-${column}`">
              {{ formatCell(row[column]) }}
            </td>
          </tr>
        </tbody>
      </table>
      <p
        v-if="totalLabel"
        class="dashboard-table__total q-mb-none">
        {{ totalLabel }}
      </p>
    </div>
    <p
      v-else
      class="dashboard-widget__empty q-mb-none">
      {{ emptyLabel }}
    </p>
  </DashboardWidgetShell>
</template>

<script setup>
import { computed } from 'vue'
import DashboardWidgetShell from 'components/dashboard/DashboardWidgetShell.vue'
import {
  humanizeWidgetFieldKey,
  pickItemDisplayColumns,
  resolveDashboardNavigation,
} from 'src/utils/dashboard-normalize.js'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: 'table_chart',
  },
  tone: {
    type: String,
    default: 'blue',
  },
  items: {
    type: Array,
    default: () => [],
  },
  totalCount: {
    type: [Number, String],
    default: null,
  },
  totalLabelTemplate: {
    type: String,
    default: '',
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  footerLabel: {
    type: String,
    default: '',
  },
  deepLinkTarget: {
    type: [Object, String],
    default: null,
  },
  widget: {
    type: Object,
    default: null,
  },
  columnLabels: {
    type: Object,
    default: () => ({}),
  },
  testId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['navigate'])

const rows = computed(() =>
  (Array.isArray(props.items) ? props.items : []).slice(0, 8),
)

const columns = computed(() => pickItemDisplayColumns(rows.value, 4))

const totalLabel = computed(() => {
  if (props.totalCount == null || props.totalCount === '') {
    return ''
  }
  if (!props.totalLabelTemplate) {
    return String(props.totalCount)
  }

  return props.totalLabelTemplate.replace(
    '{count}',
    String(props.totalCount),
  )
})

function columnLabel(column) {
  return props.columnLabels[column] || humanizeWidgetFieldKey(column)
}

function formatCell(value) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

function rowKey(row, index) {
  return String(
    row?.id
      ?? row?.client_number
      ?? row?.appointment_id
      ?? index,
  )
}

function rowTarget(row) {
  return resolveDashboardNavigation(props.widget, row)
}

function onRowClick(row) {
  const target = rowTarget(row)
  if (!target) {
    return
  }
  emit('navigate', target)
}
</script>
