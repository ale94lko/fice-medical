/* eslint-disable camelcase -- API column keys use snake_case */
import { clientListColumnKeys as col } from 'components/constants.js'

/** Backend list-view column keys (snake_case). */
export const CLIENT_LIST_API_COLUMN_ORDER = [
  'client_number',
  'name',
  'email',
  'phones',
  'dob',
  'allergies',
  'clinicians',
  'admission_date',
  'status',
  'actions',
]

const API_TO_FRONTEND = {
  client_number: col.clientNumber,
  name: col.name,
  email: col.email,
  phones: col.phones,
  dob: col.dob,
  allergies: col.allergies,
  clinicians: col.clinicians,
  admission_date: col.admissionDate,
  status: col.status,
  actions: col.actions,
}

const FRONTEND_TO_API = Object.fromEntries(
  Object.entries(API_TO_FRONTEND).map(([api, front]) => [front, api]),
)

export function apiColumnKeyToFrontend(apiKey) {
  return API_TO_FRONTEND[String(apiKey ?? '').trim()] ?? ''
}

export function frontendColumnKeyToApi(frontendKey) {
  return FRONTEND_TO_API[String(frontendKey ?? '').trim()] ?? ''
}

export function defaultClientListColumnPreferences() {
  return {
    order: CLIENT_LIST_API_COLUMN_ORDER
      .map(apiColumnKeyToFrontend)
      .filter(Boolean),
    hidden: [],
  }
}

export function normalizeClientListColumnPreferences(raw) {
  const defaults = defaultClientListColumnPreferences()
  const defaultOrder = defaults.order
  const required = new Set([
    col.clientNumber,
    col.actions,
  ])

  if (!raw || typeof raw !== 'object') {
    return defaults
  }

  const order = Array.isArray(raw.order)
    ? raw.order
      .map(key => (
        defaultOrder.includes(key)
          ? key
          : apiColumnKeyToFrontend(key)
      ))
      .filter(key => defaultOrder.includes(key))
    : []
  const hidden = Array.isArray(raw.hidden)
    ? raw.hidden
      .map(key => (
        defaultOrder.includes(key)
          ? key
          : apiColumnKeyToFrontend(key)
      ))
      .filter(key => defaultOrder.includes(key))
    : []

  const missing = defaultOrder.filter(name => !order.includes(name))
  const normalizedOrder = [...order, ...missing]

  if (!normalizedOrder.includes(col.actions)) {
    normalizedOrder.push(col.actions)
  }
  if (!normalizedOrder.includes(col.clientNumber)) {
    normalizedOrder.unshift(col.clientNumber)
  }

  const normalizedHidden = hidden.filter(name => !required.has(name))

  return {
    order: normalizedOrder,
    hidden: normalizedHidden,
  }
}

export function normalizeColumnCatalogFromApi(root) {
  const columns = Array.isArray(root?.columns) ? root.columns : []

  return columns.map(entry => ({
    key: String(entry?.key ?? '').trim(),
    label: String(entry?.label ?? '').trim(),
    visible: entry?.visible !== false,
    required: Boolean(entry?.required),
    locked: Boolean(entry?.locked),
    sortable: entry?.sortable !== false,
  })).filter(entry => entry.key)
}

function isRequiredApiColumn(key, meta = {}) {
  return Boolean(meta.required)
    || key === 'client_number'
    || key === 'actions'
}

function isLockedApiColumn(key, meta = {}) {
  return Boolean(meta.locked)
    || key === 'client_number'
    || key === 'actions'
}

export function preferencesFromColumnConfig(root) {
  const catalog = normalizeColumnCatalogFromApi(root)
  const orderSource = Array.isArray(root?.order) && root.order.length
    ? root.order
    : catalog.map(entry => entry.key)

  const order = orderSource
    .map(apiColumnKeyToFrontend)
    .filter(Boolean)

  const hidden = catalog
    .filter(entry => !entry.visible && !entry.required && !entry.locked)
    .map(entry => apiColumnKeyToFrontend(entry.key))
    .filter(Boolean)

  return normalizeClientListColumnPreferences({ order, hidden })
}

export function columnCatalogFromPreferences(preferences, catalog = []) {
  const normalized = normalizeClientListColumnPreferences(preferences)
  const hiddenSet = new Set(normalized.hidden)
  const catalogByKey = new Map(
    catalog.map(entry => [entry.key, entry]),
  )
  const orderedKeys = normalized.order
    .map(frontendColumnKeyToApi)
    .filter(Boolean)

  for (const apiKey of CLIENT_LIST_API_COLUMN_ORDER) {
    if (!orderedKeys.includes(apiKey)) {
      orderedKeys.push(apiKey)
    }
  }

  return orderedKeys.map(key => {
    const meta = catalogByKey.get(key) ?? {}
    const frontendKey = apiColumnKeyToFrontend(key)
    const required = isRequiredApiColumn(key, meta)
    const locked = isLockedApiColumn(key, meta)

    return {
      key,
      label: String(meta.label ?? '').trim(),
      visible: required || locked || !hiddenSet.has(frontendKey),
      required,
      locked,
      sortable: meta.sortable !== false,
    }
  })
}

export function visibleColumnsFromPreferences(preferences, catalog = []) {
  const normalized = normalizeClientListColumnPreferences(preferences)
  const hiddenSet = new Set(normalized.hidden)
  const catalogByKey = new Map(
    catalog.map(entry => [entry.key, entry]),
  )

  return normalized.order
    .filter(frontendKey => !hiddenSet.has(frontendKey))
    .map(frontendKey => {
      const apiKey = frontendColumnKeyToApi(frontendKey)
      const meta = catalogByKey.get(apiKey) ?? {}

      return {
        key: apiKey,
        frontendKey,
        label: String(meta.label ?? '').trim(),
        visible: true,
        required: isRequiredApiColumn(apiKey, meta),
        locked: isLockedApiColumn(apiKey, meta),
        sortable: meta.sortable !== false,
      }
    })
    .filter(entry => entry.frontendKey)
}

export function applyClientListColumnPreferencesState(
  preferences,
  catalog = [],
) {
  const normalized = normalizeClientListColumnPreferences(preferences)
  const nextCatalog = columnCatalogFromPreferences(normalized, catalog)

  return {
    preferences: normalized,
    catalog: nextCatalog,
    visibleColumns: visibleColumnsFromPreferences(normalized, nextCatalog),
  }
}

export function columnConfigToApiPayload(preferences, catalog = []) {
  const normalized = normalizeClientListColumnPreferences(preferences)
  const hiddenSet = new Set(normalized.hidden)
  const catalogByKey = new Map(
    catalog.map(entry => [entry.key, entry]),
  )

  const orderSnake = []
  for (const frontendKey of normalized.order) {
    const apiKey = frontendColumnKeyToApi(frontendKey)
    if (apiKey && !orderSnake.includes(apiKey)) {
      orderSnake.push(apiKey)
    }
  }
  for (const apiKey of CLIENT_LIST_API_COLUMN_ORDER) {
    if (!orderSnake.includes(apiKey)) {
      orderSnake.push(apiKey)
    }
  }

  const columns = CLIENT_LIST_API_COLUMN_ORDER.map(key => {
    const meta = catalogByKey.get(key) ?? {}
    const frontendKey = apiColumnKeyToFrontend(key)
    const required = meta.required
      || key === 'client_number'
      || key === 'actions'
    const locked = meta.locked
      || key === 'client_number'
      || key === 'actions'

    return {
      key,
      visible: required || locked
        ? true
        : !hiddenSet.has(frontendKey),
    }
  })

  return {
    order: orderSnake,
    columns,
  }
}

export function normalizeVisibleColumnsFromApi(columns) {
  if (!Array.isArray(columns)) {
    return []
  }

  return columns.map(entry => ({
    key: String(entry?.key ?? '').trim(),
    frontendKey: apiColumnKeyToFrontend(entry?.key),
    label: String(entry?.label ?? '').trim(),
    visible: entry?.visible !== false,
    required: Boolean(entry?.required),
    locked: Boolean(entry?.locked),
    sortable: entry?.sortable !== false,
  })).filter(entry => entry.frontendKey)
}
