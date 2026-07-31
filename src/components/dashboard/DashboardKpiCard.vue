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
      v-if="pieSlices.length"
      class="dashboard-kpi dashboard-kpi--pie">
      <div
        class="dashboard-kpi__pie-layout row no-wrap">
        <div class="dashboard-kpi__pie-visual">
          <svg
            viewBox="0 0 120 120"
            class="dashboard-kpi__pie-svg"
            role="img"
            :aria-label="title">
            <path
              v-for="slice in pieSlices"
              :key="slice.key"
              class="dashboard-kpi__pie-slice"
              :d="slice.path"
              :fill="slice.color"
            >
              <title>{{ slice.label }}: {{ slice.value }}</title>
            </path>
            <circle
              class="dashboard-kpi__pie-center"
              cx="60"
              cy="60"
              r="30"
            />
            <text
              x="60"
              y="55"
              text-anchor="middle"
              class="dashboard-kpi__pie-total">
              {{ displayCount }}
            </text>
            <text
              x="60"
              y="72"
              text-anchor="middle"
              class="dashboard-kpi__pie-total-label">
              {{ totalLabel }}
            </text>
          </svg>
        </div>
        <ul class="dashboard-kpi__pie-legend q-mb-none col">
          <li
            v-for="item in statusBreakdown"
            :key="item.key"
            class="dashboard-kpi__pie-legend-item"
            :class="{
              'dashboard-kpi__pie-legend-item--muted': item.muted,
            }">
            <span
              class="dashboard-kpi__pie-legend-swatch"
              :style="{ background: item.color }"
            />
            <span class="dashboard-kpi__pie-legend-text">
              {{ item.label }}
            </span>
            <span class="dashboard-kpi__pie-legend-value">
              {{ item.value }}
              <small>({{ item.sharePct }}%)</small>
            </span>
          </li>
        </ul>
      </div>
    </div>

    <div
      v-else
      class="dashboard-kpi">
      <div class="dashboard-kpi__top row items-end no-wrap">
        <div class="dashboard-kpi__main col">
          <p class="dashboard-kpi__value q-mb-none">
            {{ displayCount }}
          </p>
          <p
            v-if="caption"
            class="dashboard-kpi__caption q-mb-none">
            {{ caption }}
          </p>
        </div>
        <div
          v-if="sparkPoints.length"
          class="dashboard-kpi__spark"
          aria-hidden="true">
          <svg
            class="dashboard-kpi__spark-svg"
            viewBox="0 0 120 40"
            preserveAspectRatio="none">
            <path
              class="dashboard-kpi__spark-area"
              :d="sparkPaths.area"
              :fill="sparkColor"
            />
            <path
              class="dashboard-kpi__spark-line"
              :d="sparkPaths.line"
              :stroke="sparkColor"
              fill="none"
            />
          </svg>
        </div>
      </div>
    </div>
  </DashboardWidgetShell>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DashboardWidgetShell from 'components/dashboard/DashboardWidgetShell.vue'
import {
  buildLinePath,
  buildPieSlices,
  buildChartPoints,
  tonePalette,
} from 'src/utils/dashboard-charts.js'

const STATUS_COLORS = {
  active: '#16a34a',
  inactive: '#ea580c',
  other: '#94a3b8',
}

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
    default: 'insights',
  },
  tone: {
    type: String,
    default: 'blue',
  },
  count: {
    type: [Number, String],
    default: null,
  },
  caption: {
    type: String,
    default: '',
  },
  metrics: {
    type: Object,
    default: null,
  },
  series: {
    type: Array,
    default: () => [],
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
const { t } = useI18n()

function toDisplayNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const num = Number(value)

  return Number.isFinite(num) ? num : null
}

const displayCount = computed(() => {
  const metrics = props.metrics && typeof props.metrics === 'object'
    ? props.metrics
    : null
  const fromMetrics = toDisplayNumber(metrics?.total)
  if (fromMetrics !== null) {
    return String(fromMetrics)
  }
  const fromCount = toDisplayNumber(props.count)
  if (fromCount !== null) {
    return String(fromCount)
  }

  return '—'
})

const totalLabel = computed(() => t('dashboardChartTotal'))

const statusBreakdown = computed(() => {
  const metrics = props.metrics && typeof props.metrics === 'object'
    ? props.metrics
    : null
  if (!metrics) {
    return []
  }
  const active = toDisplayNumber(metrics.active)
  const inactive = toDisplayNumber(metrics.inactive)
  if (active === null && inactive === null) {
    return []
  }
  const rows = []
  const pushRow = (key, value, label, muted = false) => {
    if (value === null) {
      return
    }
    if (muted && value <= 0) {
      return
    }
    rows.push({
      key,
      value,
      label,
      muted,
      color: STATUS_COLORS[key] || tonePalette(props.tone)[0],
      count: value,
    })
  }
  pushRow('active', active, t('dashboardMetricActive'))
  pushRow('inactive', inactive, t('dashboardMetricInactive'))
  pushRow(
    'other',
    toDisplayNumber(metrics.other),
    t('dashboardMetricOther'),
    true,
  )
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1

  return rows.map(row => ({
    ...row,
    sharePct: Math.round((row.value / total) * 100),
  }))
})

const pieSlices = computed(() => {
  if (!statusBreakdown.value.length) {
    return []
  }
  const points = statusBreakdown.value.map(row => ({
    key: row.key,
    label: row.label,
    value: row.value,
    count: row.count,
    color: row.color,
  }))

  return buildPieSlices(points).map(slice => ({
    ...slice,
    key: slice.key,
    value: slice.count,
  }))
})

const sparkPoints = computed(() =>
  buildChartPoints(props.series, props.tone),
)

const sparkPaths = computed(() =>
  buildLinePath(sparkPoints.value, 120, 40, 4),
)

const sparkColor = computed(() => tonePalette(props.tone)[0])
</script>
