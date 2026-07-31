/* eslint-disable camelcase -- widget ids and API keys use snake_case */

const CHART_TYPES = new Set([
  'bar',
  'line',
  'area',
  'donut',
  'horizontal_bar',
])

const WIDGET_CHART_TYPE = {
  appointments_week_chart: 'bar',
  appointments_today: 'area',
  appointments_next_48h: 'line',
  revenue_trend: 'line',
  payments_recent: 'area',
  staff_summary: 'donut',
  users_active: 'donut',
  claims_status: 'donut',
  labs_pending: 'horizontal_bar',
  labs_abnormal: 'horizontal_bar',
  followups_overdue: 'horizontal_bar',
  followups_due_soon: 'horizontal_bar',
  screenings_incomplete: 'donut',
  referrals_open: 'donut',
  clients_missing_info: 'horizontal_bar',
  credentials_expiring: 'bar',
  audit_recent: 'bar',
  billing_pending: 'donut',
  authorizations_expiring: 'bar',
  clinical_resources_pinned: 'donut',
}

const CATEGORY_KEYS = [
  'status',
  'priority',
  'flag',
  'severity_result',
  'severity',
  'severityResult',
  'category',
  'type',
  'state',
]

const TONE_COLORS = {
  blue: ['#2563eb', '#60a5fa', '#93c5fd', '#1d4ed8', '#3b82f6'],
  green: ['#16a34a', '#4ade80', '#86efac', '#15803d', '#22c55e'],
  orange: ['#ea580c', '#fb923c', '#fdba74', '#c2410c', '#f97316'],
  purple: ['#7c3aed', '#a78bfa', '#c4b5fd', '#6d28d9', '#8b5cf6'],
  red: ['#dc2626', '#f87171', '#fca5a5', '#b91c1c', '#ef4444'],
}

function trimString(value) {
  return String(value ?? '').trim()
}

function toNumber(value) {
  const num = Number(value)

  return Number.isFinite(num) ? num : 0
}

export function resolveDashboardChartType(widget) {
  const fromApi = trimString(
    widget?.chartType
      ?? widget?.chart_type
      ?? widget?.data?.chart_type
      ?? widget?.data?.chartType,
  ).toLowerCase()
  if (CHART_TYPES.has(fromApi)) {
    return fromApi
  }
  const byId = WIDGET_CHART_TYPE[widget?.id]
  if (byId) {
    return byId
  }
  if (widget?.type === 'KPI_STRIP') {
    return 'donut'
  }
  if (widget?.type === 'CHART') {
    return 'bar'
  }

  return 'bar'
}

export function tonePalette(tone = 'blue') {
  return TONE_COLORS[tone] || TONE_COLORS.blue
}

export function seriesFromMetrics(metrics) {
  if (!metrics || typeof metrics !== 'object') {
    return []
  }

  return Object.keys(metrics).map(key => ({
    date: key,
    label: key,
    count: toNumber(metrics[key]),
  }))
}

export function seriesFromItemCategories(items) {
  if (!Array.isArray(items) || !items.length) {
    return []
  }
  const categoryKey = CATEGORY_KEYS.find(key =>
    items.some(item => trimString(item?.[key]) !== ''),
  )
  if (!categoryKey) {
    return []
  }
  const counts = new Map()
  items.forEach((item) => {
    const label = trimString(item?.[categoryKey]) || '—'
    counts.set(label, (counts.get(label) || 0) + 1)
  })

  return [...counts.entries()].map(([label, count]) => ({
    date: label,
    label,
    count,
  }))
}

export function resolveChartSeries(widget) {
  const data = widget?.data || {}
  if (Array.isArray(data.series) && data.series.length) {
    return data.series.map(point => ({
      date: trimString(point.date ?? point.label ?? point.key),
      label: trimString(point.label ?? point.date ?? point.key),
      count: toNumber(point.count ?? point.value),
    }))
  }
  const fromMetrics = seriesFromMetrics(data.metrics)
  if (fromMetrics.length) {
    return fromMetrics
  }

  return seriesFromItemCategories(data.items)
}

export function widgetHasChartableData(widget) {
  return resolveChartSeries(widget).length > 0
}

export function shouldRenderAsChart(widget) {
  if (!widget || widget.status === 'COMING_SOON') {
    return false
  }
  if (widget.type === 'CHART') {
    return true
  }
  const data = widget.data || {}
  const hasSeries = Array.isArray(data.series) && data.series.length > 0
  const hasMetrics = Boolean(
    data.metrics && Object.keys(data.metrics).length,
  )

  if (widget.type === 'KPI_STRIP' && (hasSeries || hasMetrics)) {
    return true
  }

  // Explicit time-series from API → prefer a chart surface.
  if (hasSeries) {
    return true
  }

  // Rich KPI widgets with status breakdown stay as KPI cards.
  if (
    widget.id === 'clients_total'
    || widget.id === 'careplans_active'
    || (widget.type === 'KPI_CARD' && hasClientStatusBreakdown(data.metrics))
  ) {
    return false
  }

  // Metric bags (e.g. staff_summary) → donut/bar chart.
  if (hasMetrics && WIDGET_CHART_TYPE[widget.id]) {
    return true
  }

  return false
}

function hasClientStatusBreakdown(metrics) {
  if (!metrics || typeof metrics !== 'object') {
    return false
  }

  return metrics.active != null || metrics.inactive != null
}

export function buildChartPoints(series, tone = 'blue') {
  const list = Array.isArray(series) ? series : []
  if (!list.length) {
    return []
  }
  const max = Math.max(...list.map(point => toNumber(point.count)), 1)
  const total = list.reduce((sum, point) => sum + toNumber(point.count), 0) || 1
  const colors = tonePalette(tone)

  return list.map((point, index) => {
    const count = toNumber(point.count)
    const label = trimString(point.label ?? point.date)
    const shortLabel = label.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(label)
      ? label.slice(5).replace('-', '/')
      : label

    return {
      id: `${label}-${index}`,
      label,
      shortLabel,
      count,
      heightPct: Math.max(6, Math.round((count / max) * 100)),
      widthPct: Math.max(6, Math.round((count / max) * 100)),
      sharePct: Math.round((count / total) * 100),
      color: colors[index % colors.length],
    }
  })
}

export function buildLinePath(points, width = 240, height = 120, pad = 8) {
  const list = Array.isArray(points) ? points : []
  if (!list.length) {
    return { line: '', area: '' }
  }
  const max = Math.max(...list.map(point => point.count), 1)
  const step = list.length > 1
    ? (width - pad * 2) / (list.length - 1)
    : 0
  const coords = list.map((point, index) => {
    const x = pad + (step * index)
    const y = height - pad
      - ((point.count / max) * (height - pad * 2))

    return { x, y }
  })
  const line = coords
    .map((point, index) =>
      `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ')
  const first = coords[0]
  const last = coords[coords.length - 1]
  const area = [
    line,
    `L${last.x.toFixed(1)} ${(height - pad).toFixed(1)}`,
    `L${first.x.toFixed(1)} ${(height - pad).toFixed(1)}`,
    'Z',
  ].join(' ')

  return { line, area, coords }
}

export function buildDonutSegments(points, radius = 42, stroke = 14) {
  const list = Array.isArray(points) ? points : []
  const total = list.reduce((sum, point) => sum + point.count, 0)
  if (!total) {
    return []
  }
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return list.map((point) => {
    const length = (point.count / total) * circumference
    const segment = {
      ...point,
      radius,
      stroke,
      dasharray: `${length} ${circumference - length}`,
      dashoffset: -offset,
    }
    offset += length

    return segment
  })
}

function polarToCartesian(cx, cy, radius, angleDeg) {
  const radians = ((angleDeg - 90) * Math.PI) / 180

  return {
    x: cx + (radius * Math.cos(radians)),
    y: cy + (radius * Math.sin(radians)),
  }
}

function describePieSlice(cx, cy, radius, startAngle, endAngle) {
  const sweep = endAngle - startAngle
  if (sweep >= 359.99) {
    return [
      `M ${cx} ${cy - radius}`,
      `A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius}`,
      'Z',
    ].join(' ')
  }
  const start = polarToCartesian(cx, cy, radius, startAngle)
  const end = polarToCartesian(cx, cy, radius, endAngle)
  const largeArc = sweep > 180 ? 1 : 0

  return [
    `M ${cx} ${cy}`,
    `L ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 `
      + `${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}

/** Filled pie slices for SVG paths (center 60,60 by default). */
export function buildPieSlices(
  points,
  {
    cx = 60,
    cy = 60,
    radius = 48,
  } = {},
) {
  const list = (Array.isArray(points) ? points : [])
    .filter(point => toNumber(point.count) > 0)
  const total = list.reduce((sum, point) => sum + toNumber(point.count), 0)
  if (!total) {
    return []
  }
  let angle = 0

  return list.map((point) => {
    const count = toNumber(point.count)
    const sweep = (count / total) * 360
    const startAngle = angle
    const endAngle = angle + sweep
    angle = endAngle

    return {
      ...point,
      count,
      sharePct: Math.round((count / total) * 100),
      path: describePieSlice(cx, cy, radius, startAngle, endAngle),
    }
  })
}

