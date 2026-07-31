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
    <div class="dashboard-careplans">
      <div
        v-if="pieSlices.length"
        class="dashboard-careplans__pie-layout row no-wrap">
        <div class="dashboard-careplans__pie-visual">
          <svg
            viewBox="0 0 120 120"
            class="dashboard-careplans__pie-svg"
            role="img"
            :aria-label="title">
            <path
              v-for="slice in pieSlices"
              :key="slice.key"
              class="dashboard-careplans__pie-slice"
              :d="slice.path"
              :fill="slice.color"
            >
              <title>{{ slice.label }}: {{ slice.value }}</title>
            </path>
            <circle
              class="dashboard-careplans__pie-center"
              cx="60"
              cy="60"
              r="30"
            />
            <text
              x="60"
              y="55"
              text-anchor="middle"
              class="dashboard-careplans__pie-total">
              {{ displayCount }}
            </text>
            <text
              x="60"
              y="72"
              text-anchor="middle"
              class="dashboard-careplans__pie-total-label">
              {{ activeLabel }}
            </text>
          </svg>
        </div>
        <ul class="dashboard-careplans__pie-legend q-mb-none col">
          <li
            v-for="item in statusBreakdown"
            :key="item.key"
            class="dashboard-careplans__pie-legend-item">
            <span
              class="dashboard-careplans__pie-legend-swatch"
              :style="{ background: item.color }"
            />
            <span class="dashboard-careplans__pie-legend-text">
              {{ item.label }}
            </span>
            <span class="dashboard-careplans__pie-legend-value">
              {{ item.value }}
              <small>({{ item.sharePct }}%)</small>
            </span>
          </li>
        </ul>
      </div>

      <div
        v-else
        class="dashboard-careplans__header row items-end no-wrap">
        <div class="dashboard-careplans__main col">
          <p class="dashboard-careplans__value q-mb-none">
            {{ displayCount }}
          </p>
          <p class="dashboard-careplans__caption q-mb-none">
            {{ activeLabel }}
          </p>
        </div>
      </div>

      <div
        v-if="alertMetrics.length"
        class="dashboard-careplans__metrics row q-col-gutter-sm">
        <div
          v-for="metric in alertMetrics"
          :key="metric.key"
          class="col-6">
          <p
            class="dashboard-careplans__metric-value q-mb-none"
            :class="{
              'dashboard-careplans__metric-value--warn': metric.warn,
            }">
            {{ metric.value }}
          </p>
          <p class="dashboard-careplans__metric-label q-mb-none">
            {{ metric.label }}
          </p>
        </div>
      </div>

      <ul
        v-if="rows.length"
        class="dashboard-careplans__list q-mb-none">
        <li
          v-for="row in rows"
          :key="row.id"
          class="dashboard-careplans__item"
          :class="{
            'dashboard-careplans__item--clickable': Boolean(row.target),
          }"
          @click.stop="onRowClick(row)">
          <div class="dashboard-careplans__item-main col">
            <p class="dashboard-careplans__item-title q-mb-none">
              {{ row.name }}
            </p>
            <p class="dashboard-careplans__item-meta q-mb-none">
              {{ row.meta }}
            </p>
          </div>
          <div class="dashboard-careplans__badges row items-center no-wrap">
            <q-badge
              v-if="row.overdue"
              color="negative"
              outline
              dense
              class="dashboard-careplans__badge">
              {{ overdueLabel }}
            </q-badge>
            <q-badge
              v-if="row.unsigned"
              color="orange"
              outline
              dense
              class="dashboard-careplans__badge">
              {{ unsignedLabel }}
            </q-badge>
            <q-icon
              v-if="row.target"
              name="chevron_right"
              size="18px"
              class="dashboard-careplans__chevron"
            />
          </div>
        </li>
      </ul>
    </div>
  </DashboardWidgetShell>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DashboardWidgetShell from 'components/dashboard/DashboardWidgetShell.vue'
import { buildPieSlices } from 'src/utils/dashboard-charts.js'
import { resolveDashboardNavigation } from 'src/utils/dashboard-normalize.js'

const STATUS_COLORS = {
  active: '#16a34a',
  completed: '#2563eb',
  archived: '#94a3b8',
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
    default: 'healing',
  },
  tone: {
    type: String,
    default: 'green',
  },
  count: {
    type: [Number, String],
    default: null,
  },
  metrics: {
    type: Object,
    default: null,
  },
  items: {
    type: Array,
    default: () => [],
  },
  widget: {
    type: Object,
    default: null,
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

function toNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const num = Number(value)

  return Number.isFinite(num) ? num : null
}

const metrics = computed(() =>
  (props.metrics && typeof props.metrics === 'object'
    ? props.metrics
    : null),
)

const displayCount = computed(() => {
  const active = toNumber(metrics.value?.active)
  if (active !== null) {
    return String(active)
  }
  const count = toNumber(props.count)
  if (count !== null) {
    return String(count)
  }

  return '—'
})

const activeLabel = computed(() => t('dashboardMetricActive'))
const overdueLabel = computed(() => t('dashboardMetricOverdue'))
const unsignedLabel = computed(() => t('dashboardMetricUnsigned'))

const statusBreakdown = computed(() => {
  const source = metrics.value
  if (!source) {
    return []
  }
  const defs = [
    {
      key: 'active',
      label: t('dashboardMetricActive'),
      color: STATUS_COLORS.active,
    },
    {
      key: 'completed',
      label: t('dashboardMetricCompleted'),
      color: STATUS_COLORS.completed,
    },
    {
      key: 'archived',
      label: t('dashboardMetricArchived'),
      color: STATUS_COLORS.archived,
    },
  ]
  const rows = defs
    .map((def) => {
      const value = toNumber(source[def.key])
      if (value === null) {
        return null
      }

      return { ...def, value, count: value }
    })
    .filter(Boolean)
  if (!rows.length) {
    return []
  }
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

  return buildPieSlices(statusBreakdown.value).map(slice => ({
    ...slice,
    key: slice.key,
    value: slice.count,
  }))
})

const alertMetrics = computed(() => {
  const source = metrics.value
  if (!source) {
    return []
  }
  const defs = [
    {
      key: 'unsigned_active',
      label: t('dashboardMetricUnsigned'),
      warn: true,
    },
    {
      key: 'overdue_active',
      label: t('dashboardMetricOverdue'),
      warn: true,
    },
  ]

  return defs
    .map((def) => {
      const value = toNumber(source[def.key])
      if (value === null) {
        return null
      }

      return { ...def, value }
    })
    .filter(Boolean)
})

function formatDate(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10)
  }

  return raw
}

function clientLabel(item) {
  const name = String(
    item?.client_name
      ?? item?.clientName
      ?? item?.client
      ?? '',
  ).trim()
  if (name) {
    return name
  }
  const id = item?.client_id ?? item?.clientId
  if (id == null || id === '') {
    return ''
  }

  return t('dashboardCarePlanClientId', { id: String(id) })
}

const rows = computed(() => {
  const list = Array.isArray(props.items) ? props.items : []

  return list.slice(0, 8).map((item, index) => {
    const name = String(item?.name ?? item?.problem ?? '—').trim() || '—'
    const client = clientLabel(item)
    const targetDate = formatDate(item?.target_date ?? item?.targetDate)
    const metaParts = [client, targetDate].filter(Boolean)

    return {
      id: String(item?.id ?? `${index}`),
      name,
      meta: metaParts.join(' · '),
      overdue: item?.overdue === true,
      unsigned: item?.signed === false,
      target: resolveDashboardNavigation(props.widget, item),
    }
  })
})

function onRowClick(row) {
  if (!row?.target) {
    return
  }
  emit('navigate', row.target)
}
</script>
