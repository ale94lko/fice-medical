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
      v-if="metricEntries.length"
      class="dashboard-kpi-strip row q-col-gutter-sm">
      <div
        v-for="metric in metricEntries"
        :key="metric.key"
        class="col-6 col-sm-4">
        <p class="dashboard-kpi-strip__value q-mb-none">
          {{ metric.value }}
        </p>
        <p class="dashboard-kpi-strip__label q-mb-none">
          {{ metric.label }}
        </p>
      </div>
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
import { humanizeWidgetFieldKey } from 'src/utils/dashboard-normalize.js'

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
    default: 'groups',
  },
  tone: {
    type: String,
    default: 'green',
  },
  metrics: {
    type: Object,
    default: () => ({}),
  },
  metricLabels: {
    type: Object,
    default: () => ({}),
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
  testId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['navigate'])

const metricEntries = computed(() => {
  const source = props.metrics && typeof props.metrics === 'object'
    ? props.metrics
    : {}

  return Object.keys(source).map(key => ({
    key,
    value: source[key],
    label: props.metricLabels[key] || humanizeWidgetFieldKey(key),
  }))
})
</script>
