import { ref } from 'vue'
import { adminTableStoragePrefix } from 'src/constants/admin-table.js'

function buildStorageKey(tableId) {
  return `${adminTableStoragePrefix}.${tableId}`
}

function normalizePreferences(raw, defaultOrder, requiredColumns) {
  const required = new Set(requiredColumns)

  if (!raw || typeof raw !== 'object') {
    return {
      order: [...defaultOrder],
      hidden: [],
    }
  }

  const order = Array.isArray(raw.order)
    ? raw.order.filter(name => defaultOrder.includes(name))
    : []
  const hidden = Array.isArray(raw.hidden)
    ? raw.hidden.filter(name => defaultOrder.includes(name))
    : []

  const missing = defaultOrder.filter(name => !order.includes(name))
  const normalizedOrder = [...order, ...missing]
  const actionsName = defaultOrder[defaultOrder.length - 1]
  if (actionsName && !normalizedOrder.includes(actionsName)) {
    normalizedOrder.push(actionsName)
  }
  const firstName = defaultOrder[0]
  if (firstName && !normalizedOrder.includes(firstName)) {
    normalizedOrder.unshift(firstName)
  }

  const normalizedHidden = hidden
    .filter(name => !required.has(name))

  return {
    order: normalizedOrder,
    hidden: normalizedHidden,
  }
}

function readPreferences(storageKey, defaultOrder, requiredColumns) {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) {
      return normalizePreferences(null, defaultOrder, requiredColumns)
    }

    return normalizePreferences(
      JSON.parse(raw),
      defaultOrder,
      requiredColumns,
    )
  } catch {
    return normalizePreferences(null, defaultOrder, requiredColumns)
  }
}

export function useAdminTableColumnPreferences({
  tableId,
  defaultOrder,
  requiredColumns = [],
  lockedColumns = [],
}) {
  const storageKey = buildStorageKey(tableId)
  const requiredSet = new Set(requiredColumns)
  const lockedSet = new Set(lockedColumns)

  const preferences = ref(
    readPreferences(storageKey, defaultOrder, requiredColumns),
  )

  function savePreferences(nextPreferences) {
    preferences.value = normalizePreferences(
      nextPreferences,
      defaultOrder,
      requiredColumns,
    )
    localStorage.setItem(
      storageKey,
      JSON.stringify(preferences.value),
    )
  }

  function resetPreferences() {
    savePreferences({
      order: [...defaultOrder],
      hidden: [],
    })
  }

  function buildVisibleColumns(columnDefinitions) {
    const byName = new Map(
      columnDefinitions.map(column => [column.name, column]),
    )

    return preferences.value.order
      .filter(name => !preferences.value.hidden.includes(name))
      .map(name => byName.get(name))
      .filter(Boolean)
  }

  function isRequiredColumn(columnId) {
    return requiredSet.has(columnId)
  }

  function isLockedColumn(columnId) {
    return lockedSet.has(columnId)
  }

  return {
    preferences,
    savePreferences,
    resetPreferences,
    buildVisibleColumns,
    isRequiredColumn,
    isLockedColumn,
    defaultOrder,
  }
}
