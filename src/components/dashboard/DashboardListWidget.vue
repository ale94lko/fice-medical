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
    <ul
      v-if="rows.length"
      class="dashboard-list q-mb-none">
      <li
        v-for="(row, index) in rows"
        :key="rowKey(row, index)"
        class="dashboard-list__item"
        :class="{
          'dashboard-list__item--clickable': Boolean(rowTarget(row)),
        }"
        @click.stop="onRowClick(row)">
        <div class="dashboard-list__main">
          <p class="dashboard-list__title q-mb-none">
            {{ primaryText(row) }}
          </p>
          <p
            v-if="secondaryText(row)"
            class="dashboard-list__meta q-mb-none">
            {{ secondaryText(row) }}
          </p>
        </div>
        <q-icon
          v-if="rowTarget(row)"
          name="chevron_right"
          size="18px"
          class="dashboard-list__chevron"
        />
      </li>
    </ul>
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
    default: 'list',
  },
  tone: {
    type: String,
    default: 'green',
  },
  items: {
    type: Array,
    default: () => [],
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
  testId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['navigate'])

const rows = computed(() =>
  (Array.isArray(props.items) ? props.items : []).slice(0, 8),
)

function rowKey(row, index) {
  return String(
    row?.id
      ?? row?.appointment_id
      ?? row?.client_id
      ?? row?.resource_id
      ?? index,
  )
}

function primaryText(row) {
  const columns = pickItemDisplayColumns([row], 1)

  return columns.length
    ? String(row[columns[0]] ?? '—')
    : '—'
}

function secondaryText(row) {
  const columns = pickItemDisplayColumns([row], 3).slice(1)
  if (!columns.length) {
    return ''
  }

  return columns
    .map(key => row[key])
    .filter(value => value != null && String(value).trim() !== '')
    .map(String)
    .join(' · ')
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
