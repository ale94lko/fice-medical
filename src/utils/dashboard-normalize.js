/* eslint-disable camelcase -- API payloads use snake_case */

const WIDGET_TYPES = new Set([
  'TABLE',
  'LIST',
  'CHART',
  'KPI_CARD',
  'KPI_STRIP',
])

const WIDGET_SIZES = new Set(['S', 'M', 'L'])

const WIDGET_STATUSES = new Set(['READY', 'COMING_SOON'])

/** Preferred item keys for table/list columns (order matters). */
const ITEM_COLUMN_PRIORITY = [
  'client_name',
  'client_number',
  'name',
  'title',
  'label',
  'scheduled_at',
  'appointment_time',
  'start_at',
  'due_at',
  'due_date',
  'date',
  'status',
  'priority',
  'lab_name',
  'test_name',
  'template_name',
  'provider_name',
  'clinician_name',
  'referred_to',
  'resource_name',
  'action',
  'actor',
  'created_at',
  'updated_at',
  'expires_at',
  'credential_type',
  'count',
]

const HIDDEN_ITEM_KEYS = new Set([
  'id',
  'client_id',
  'appointment_id',
  'lab_id',
  'referral_id',
  'care_plan_id',
  'screening_id',
  'follow_up_id',
  'staff_id',
  'user_id',
  'resource_id',
  'deep_link',
  'deepLink',
])

function trimString(value) {
  return String(value ?? '').trim()
}

function toUpperEnum(value, allowed, fallback) {
  const key = trimString(value).toUpperCase()
  if (allowed.has(key)) {
    return key
  }

  return fallback
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const num = Number(value)

  return Number.isFinite(num) ? num : null
}

function normalizeSeriesPoint(row) {
  if (!row || typeof row !== 'object') {
    return null
  }
  const date = trimString(row.date ?? row.label ?? row.key)
  const count = toNullableNumber(row.count ?? row.value) ?? 0

  return { date, count }
}

function normalizeMetrics(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null
  }
  const metrics = {}
  Object.keys(raw).forEach((key) => {
    const num = toNullableNumber(raw[key])
    if (num !== null) {
      metrics[key] = num
    }
  })

  return Object.keys(metrics).length ? metrics : null
}

function normalizeWidgetData(raw, status) {
  if (status === 'COMING_SOON' || raw == null) {
    return null
  }
  if (typeof raw !== 'object') {
    return null
  }
  const items = Array.isArray(raw.items)
    ? raw.items.filter(item => item && typeof item === 'object')
    : []
  const series = Array.isArray(raw.series)
    ? raw.series.map(normalizeSeriesPoint).filter(Boolean)
    : []

  return {
    count: toNullableNumber(raw.count),
    totalCount: toNullableNumber(raw.total_count ?? raw.totalCount),
    items,
    series,
    metrics: normalizeMetrics(raw.metrics),
  }
}

export function normalizeDashboardWidget(row) {
  if (!row || typeof row !== 'object') {
    return null
  }
  const id = trimString(row.id)
  if (!id) {
    return null
  }
  const status = toUpperEnum(row.status, WIDGET_STATUSES, 'READY')
  const type = toUpperEnum(row.type, WIDGET_TYPES, 'KPI_CARD')
  const size = toUpperEnum(row.size, WIDGET_SIZES, 'M')
  const order = toNullableNumber(row.order) ?? 0
  const visible = row.visible !== false
  const permissionOk = row.permission_ok !== false
    && row.permissionOk !== false

  return {
    id,
    label: trimString(row.label) || id,
    description: trimString(row.description),
    category: trimString(row.category).toUpperCase() || 'OPERATIONS',
    type,
    status,
    permissionOk,
    visible,
    order,
    size,
    chartType: toUpperEnum(
      row.chart_type ?? row.chartType,
      new Set(['BAR', 'LINE', 'AREA', 'DONUT', 'HORIZONTAL_BAR']),
      '',
    ).toLowerCase() || null,
    deepLink: trimString(row.deep_link ?? row.deepLink),
    data: normalizeWidgetData(row.data, status),
  }
}

export function normalizeDashboardPayload(body) {
  const root = body?.data != null && typeof body.data === 'object'
    ? body.data
    : body
  const widgets = Array.isArray(root?.widgets)
    ? root.widgets.map(normalizeDashboardWidget).filter(Boolean)
    : []

  return {
    generatedAt: trimString(root?.generated_at ?? root?.generatedAt),
    subtenantId: toNullableNumber(root?.subtenant_id ?? root?.subtenantId),
    widgets: widgets
      .filter(widget => widget.permissionOk)
      .slice()
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)),
  }
}

export function normalizeDashboardConfigWidget(row) {
  if (!row || typeof row !== 'object') {
    return null
  }
  const id = trimString(row.id)
  if (!id) {
    return null
  }

  return {
    id,
    label: trimString(row.label) || id,
    description: trimString(row.description),
    category: trimString(row.category).toUpperCase() || 'OPERATIONS',
    type: toUpperEnum(row.type, WIDGET_TYPES, 'KPI_CARD'),
    status: toUpperEnum(row.status, WIDGET_STATUSES, 'READY'),
    permissionOk: row.permission_ok !== false
      && row.permissionOk !== false,
    visible: row.visible !== false,
    order: toNullableNumber(row.order) ?? 0,
    size: toUpperEnum(row.size, WIDGET_SIZES, 'M'),
  }
}

export function normalizeDashboardConfig(body) {
  const root = body?.data != null && typeof body.data === 'object'
    ? body.data
    : body
  const widgets = Array.isArray(root?.widgets)
    ? root.widgets.map(normalizeDashboardConfigWidget).filter(Boolean)
    : []

  return {
    widgets: widgets
      .filter(widget => widget.permissionOk)
      .slice()
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)),
  }
}

export function dashboardConfigToApiPayload(widgets) {
  const list = Array.isArray(widgets) ? widgets : []

  return {
    widgets: list.map((widget, index) => ({
      id: widget.id,
      visible: widget.visible !== false,
      order: toNullableNumber(widget.order) ?? (index + 1) * 10,
      size: toUpperEnum(widget.size, WIDGET_SIZES, 'M'),
    })),
  }
}

export function widgetGridColClass(size) {
  const key = toUpperEnum(size, WIDGET_SIZES, 'M')
  if (key === 'S') {
    return 'col-12 col-sm-6 col-md-4 col-lg-3'
  }
  if (key === 'L') {
    return 'col-12'
  }

  return 'col-12 col-md-6'
}

export function pickItemDisplayColumns(items, maxColumns = 4) {
  if (!Array.isArray(items) || !items.length) {
    return []
  }
  const keyCounts = new Map()
  items.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (HIDDEN_ITEM_KEYS.has(key)) {
        return
      }
      keyCounts.set(key, (keyCounts.get(key) || 0) + 1)
    })
  })
  const keys = [...keyCounts.keys()]
  keys.sort((a, b) => {
    const ai = ITEM_COLUMN_PRIORITY.indexOf(a)
    const bi = ITEM_COLUMN_PRIORITY.indexOf(b)
    const aRank = ai === -1 ? 999 : ai
    const bRank = bi === -1 ? 999 : bi
    if (aRank !== bRank) {
      return aRank - bRank
    }

    return a.localeCompare(b)
  })

  return keys.slice(0, maxColumns)
}

export function humanizeWidgetFieldKey(key) {
  return trimString(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

export function resolveDashboardNavigation(widget, item = null) {
  const row = item && typeof item === 'object' ? item : null
  if (row) {
    // Appointment rows often include client_id; prefer opening details.
    const appointmentId = trimString(
      row.appointment_id ?? row.appointmentId,
    )
    if (appointmentId) {
      return {
        action: 'appointmentDetail',
        appointmentId,
      }
    }
    const clientId = trimString(row.client_id ?? row.clientId)
    if (clientId) {
      return {
        name: 'ClientOverview',
        params: { id: clientId },
      }
    }
    const itemLink = trimString(row.deep_link ?? row.deepLink)
    if (itemLink) {
      return { path: itemLink }
    }
  }
  const widgetLink = trimString(widget?.deepLink ?? widget?.deep_link)
  if (widgetLink) {
    return { path: widgetLink }
  }

  return null
}

const WIDGET_META = {
  appointments_today: { icon: 'event', tone: 'blue' },
  appointments_next_48h: { icon: 'schedule', tone: 'blue' },
  appointments_week_chart: { icon: 'show_chart', tone: 'purple' },
  clients_total: { icon: 'groups', tone: 'green' },
  clients_missing_info: { icon: 'warning_amber', tone: 'orange' },
  clients_recent: { icon: 'person_add', tone: 'green' },
  followups_overdue: { icon: 'priority_high', tone: 'red' },
  followups_due_soon: { icon: 'upcoming', tone: 'orange' },
  labs_pending: { icon: 'science', tone: 'blue' },
  labs_abnormal: { icon: 'report', tone: 'red' },
  screenings_incomplete: { icon: 'assignment_late', tone: 'orange' },
  careplans_active: { icon: 'healing', tone: 'green' },
  referrals_open: { icon: 'share', tone: 'blue' },
  staff_summary: { icon: 'badge', tone: 'green' },
  credentials_expiring: { icon: 'verified_user', tone: 'orange' },
  clinical_resources_pinned: { icon: 'push_pin', tone: 'purple' },
  users_active: { icon: 'manage_accounts', tone: 'blue' },
  audit_recent: { icon: 'history', tone: 'purple' },
  billing_pending: { icon: 'receipt_long', tone: 'orange' },
  claims_status: { icon: 'request_quote', tone: 'orange' },
  authorizations_expiring: { icon: 'policy', tone: 'orange' },
  payments_recent: { icon: 'payments', tone: 'green' },
  revenue_trend: { icon: 'trending_up', tone: 'purple' },
}

export function getDashboardWidgetMeta(widgetId) {
  return WIDGET_META[widgetId] || {
    icon: 'widgets',
    tone: 'blue',
  }
}

export function dashboardWidgetI18nSuffix(widgetId) {
  return String(widgetId ?? '')
    .split('_')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}
