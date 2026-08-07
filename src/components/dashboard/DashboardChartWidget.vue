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
      v-if="points.length"
      class="dashboard-chart"
      :class="`dashboard-chart--${chartType}`"
      role="img"
      :aria-label="title">
      <!-- Bar -->
      <div
        v-if="chartType === 'bar'"
        class="dashboard-chart__bars row items-end no-wrap">
        <div
          v-for="point in points"
          :key="point.id"
          class="dashboard-chart__bar-col col">
          <span class="dashboard-chart__value">{{ point.count }}</span>
          <div
            class="dashboard-chart__bar"
            :style="{
              height: `${point.heightPct}%`,
              background: point.color,
            }"
          >
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ point.label }}: {{ point.count }}
            </q-tooltip>
          </div>
          <p class="dashboard-chart__label q-mb-none">
            {{ point.shortLabel }}
          </p>
        </div>
      </div>

      <!-- Horizontal bar -->
      <div
        v-else-if="chartType === 'horizontal_bar'"
        class="dashboard-chart__hbar-list">
        <div
          v-for="point in points"
          :key="point.id"
          class="dashboard-chart__hbar-row">
          <div class="dashboard-chart__hbar-meta row items-center no-wrap">
            <span class="dashboard-chart__hbar-label col">
              {{ point.shortLabel }}
            </span>
            <span class="dashboard-chart__hbar-count">
              {{ point.count }}
            </span>
          </div>
          <div class="dashboard-chart__hbar-track">
            <div
              class="dashboard-chart__hbar-fill"
              :style="{
                width: `${point.widthPct}%`,
                background: point.color,
              }"
            />
          </div>
        </div>
      </div>

      <!-- Line / Area -->
      <div
        v-else-if="chartType === 'line' || chartType === 'area'"
        class="dashboard-chart__svg-wrap">
        <svg
          class="dashboard-chart__svg"
          viewBox="0 0 240 120"
          preserveAspectRatio="none"
          aria-hidden="true">
          <path
            v-if="chartType === 'area'"
            class="dashboard-chart__area"
            :d="paths.area"
            :fill="points[0]?.color || 'currentColor'"
          />
          <path
            class="dashboard-chart__line"
            :d="paths.line"
            :stroke="points[0]?.color || 'currentColor'"
            fill="none"
          />
          <circle
            v-for="(coord, index) in paths.coords"
            :key="`dot-${index}`"
            class="dashboard-chart__dot"
            :cx="coord.x"
            :cy="coord.y"
            r="3.2"
            :fill="points[index]?.color || 'currentColor'"
          />
        </svg>
        <div class="dashboard-chart__axis row no-wrap">
          <span
            v-for="point in points"
            :key="`axis-${point.id}`"
            class="dashboard-chart__label col">
            {{ point.shortLabel }}
          </span>
        </div>
      </div>

      <!-- Donut -->
      <div
        v-else
        class="dashboard-chart__donut row items-center no-wrap">
        <div class="dashboard-chart__donut-visual">
          <svg
            viewBox="0 0 120 120"
            class="dashboard-chart__donut-svg"
            aria-hidden="true">
            <circle
              class="dashboard-chart__donut-track"
              cx="60"
              cy="60"
              r="42"
            />
            <circle
              v-for="segment in donutSegments"
              :key="segment.id"
              class="dashboard-chart__donut-segment"
              cx="60"
              cy="60"
              :r="segment.radius"
              :stroke="segment.color"
              :stroke-width="segment.stroke"
              :stroke-dasharray="segment.dasharray"
              :stroke-dashoffset="segment.dashoffset"
              transform="rotate(-90 60 60)"
            />
            <text
              x="60"
              y="58"
              text-anchor="middle"
              class="dashboard-chart__donut-total">
              {{ donutTotal }}
            </text>
            <text
              x="60"
              y="74"
              text-anchor="middle"
              class="dashboard-chart__donut-total-label">
              {{ totalLabel }}
            </text>
          </svg>
        </div>
        <ul class="dashboard-chart__legend q-mb-none col">
          <li
            v-for="point in points"
            :key="`legend-${point.id}`"
            class="dashboard-chart__legend-item">
            <span
              class="dashboard-chart__legend-swatch"
              :style="{ background: point.color }"
            />
            <span class="dashboard-chart__legend-text">
              {{ point.shortLabel }}
            </span>
            <span class="dashboard-chart__legend-value">
              {{ point.count }}
              <small>({{ point.sharePct }}%)</small>
            </span>
          </li>
        </ul>
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
import { useI18n } from 'vue-i18n'
import DashboardWidgetShell from 'components/dashboard/DashboardWidgetShell.vue'
import {
  buildChartPoints,
  buildDonutSegments,
  buildLinePath,
} from 'src/utils/dashboard-charts.js'

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
    default: 'show_chart',
  },
  tone: {
    type: String,
    default: 'purple',
  },
  chartType: {
    type: String,
    default: 'bar',
  },
  series: {
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
  testId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['navigate'])
const { t } = useI18n()

const points = computed(() =>
  buildChartPoints(props.series, props.tone),
)

const paths = computed(() =>
  buildLinePath(points.value, 240, 120, 10),
)

const donutSegments = computed(() =>
  buildDonutSegments(points.value),
)

const donutTotal = computed(() =>
  points.value.reduce((sum, point) => sum + point.count, 0),
)

const totalLabel = computed(() => t('dashboardChartTotal'))
</script>
