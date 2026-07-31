<template>
  <component
    :is="resolved.component"
    v-bind="resolved.props"
    @navigate="target => emit('navigate', target)"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DashboardCarePlansActiveWidget from
  'components/dashboard/DashboardCarePlansActiveWidget.vue'
import DashboardChartWidget from
  'components/dashboard/DashboardChartWidget.vue'
import DashboardComingSoonCard from
  'components/dashboard/DashboardComingSoonCard.vue'
import DashboardKpiCard from 'components/dashboard/DashboardKpiCard.vue'
import DashboardKpiStrip from 'components/dashboard/DashboardKpiStrip.vue'
import DashboardListWidget from
  'components/dashboard/DashboardListWidget.vue'
import DashboardTableWidget from
  'components/dashboard/DashboardTableWidget.vue'
import {
  resolveChartSeries,
  resolveDashboardChartType,
  shouldRenderAsChart,
} from 'src/utils/dashboard-charts.js'
import {
  dashboardWidgetI18nSuffix,
  getDashboardWidgetMeta,
  humanizeWidgetFieldKey,
  resolveDashboardNavigation,
} from 'src/utils/dashboard-normalize.js'
import { dashboardTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  widget: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['navigate'])

const { t, te } = useI18n()

function widgetTitle(widget) {
  const key = `dashboardWidget${dashboardWidgetI18nSuffix(widget.id)}Label`
  if (widget.label) {
    return widget.label
  }
  if (te(key)) {
    return t(key)
  }

  return widget.id
}

function widgetDescription(widget) {
  const key = `dashboardWidget${
    dashboardWidgetI18nSuffix(widget.id)
  }Description`
  if (widget.description) {
    return widget.description
  }
  if (te(key)) {
    return t(key)
  }

  return ''
}

function resolveMetricLabel(metricKey) {
  const i18nKey = `dashboardMetric${dashboardWidgetI18nSuffix(metricKey)}`
  if (te(i18nKey)) {
    return t(i18nKey)
  }

  return humanizeWidgetFieldKey(metricKey)
}

function metricLabelsFromI18n(metrics) {
  const labels = {}
  Object.keys(metrics || {}).forEach((key) => {
    labels[key] = resolveMetricLabel(key)
  })

  return labels
}

function localizeSeriesLabels(series) {
  return (series || []).map((point) => {
    const raw = point.label ?? point.date ?? point.key

    return {
      ...point,
      label: resolveMetricLabel(raw),
    }
  })
}

function buildComingSoonProps(shared) {
  return {
    component: DashboardComingSoonCard,
    props: {
      ...shared,
      comingSoonLabel: t('dashboardComingSoon'),
      message: t('dashboardComingSoonMessage'),
    },
  }
}

function buildChartProps(widget, shared, deepLinkTarget) {
  return {
    component: DashboardChartWidget,
    props: {
      ...shared,
      chartType: resolveDashboardChartType(widget),
      series: localizeSeriesLabels(resolveChartSeries(widget)),
      emptyLabel: t('dashboardWidgetEmpty'),
      footerLabel: deepLinkTarget ? t('dashboardOpenLink') : '',
      deepLinkTarget,
    },
  }
}

function buildReadyProps(widget, shared, deepLinkTarget) {
  const data = widget.data || {}
  const footerLabel = deepLinkTarget ? t('dashboardOpenLink') : ''
  const series = resolveChartSeries(widget)

  if (widget.id === 'careplans_active') {
    return {
      component: DashboardCarePlansActiveWidget,
      props: {
        ...shared,
        count: data.count ?? data.totalCount,
        metrics: data.metrics || null,
        items: data.items || [],
        widget,
        footerLabel,
        deepLinkTarget,
      },
    }
  }

  if (shouldRenderAsChart(widget)) {
    return buildChartProps(widget, shared, deepLinkTarget)
  }

  if (widget.type === 'KPI_STRIP') {
    return {
      component: DashboardKpiStrip,
      props: {
        ...shared,
        metrics: data.metrics || {},
        metricLabels: metricLabelsFromI18n(data.metrics),
        emptyLabel: t('dashboardWidgetEmpty'),
        footerLabel,
        deepLinkTarget,
      },
    }
  }

  if (widget.type === 'TABLE') {
    return {
      component: DashboardTableWidget,
      props: {
        ...shared,
        items: data.items || [],
        totalCount: data.totalCount,
        totalLabelTemplate: t('dashboardTotalCount'),
        emptyLabel: t('dashboardWidgetEmpty'),
        footerLabel,
        deepLinkTarget,
        widget,
      },
    }
  }

  if (widget.type === 'LIST') {
    return {
      component: DashboardListWidget,
      props: {
        ...shared,
        items: data.items || [],
        emptyLabel: t('dashboardWidgetEmpty'),
        footerLabel,
        deepLinkTarget,
        widget,
      },
    }
  }

  return {
    component: DashboardKpiCard,
    props: {
      ...shared,
      count: data.count ?? data.totalCount,
      metrics: data.metrics || null,
      series: widget.id === 'clients_total' ? [] : series,
      footerLabel,
      deepLinkTarget,
    },
  }
}

const resolved = computed(() => {
  const widget = props.widget
  const meta = getDashboardWidgetMeta(widget.id)
  const shared = {
    title: widgetTitle(widget),
    description: widgetDescription(widget),
    icon: meta.icon,
    tone: meta.tone,
    testId: dashboardTestIds.widget(widget.id),
  }

  if (widget.status === 'COMING_SOON') {
    return buildComingSoonProps(shared)
  }

  return buildReadyProps(
    widget,
    shared,
    resolveDashboardNavigation(widget),
  )
})
</script>
