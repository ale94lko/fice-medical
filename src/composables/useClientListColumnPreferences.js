import { computed } from 'vue'
import { clientListColumnKeys as col } from 'components/constants.js'
import { useSiteStore } from 'src/stores/site-store.js'
import {
  apiColumnKeyToFrontend,
  defaultClientListColumnPreferences,
} from 'src/utils/client-list-columns.js'

export const CLIENT_LIST_DEFAULT_COLUMN_ORDER =
  defaultClientListColumnPreferences().order

export const CLIENT_LIST_REQUIRED_COLUMNS = [
  col.clientNumber,
  col.actions,
]

export const CLIENT_LIST_LOCKED_COLUMNS = [
  col.clientNumber,
  col.actions,
]

export const CLIENT_LIST_SUMMARY_FILTERS = {
  upcomingAppointments: 'upcoming_appointments',
  missingInformation: 'missing_information',
  pendingBilling: 'pending_billing',
  authorizationsExpiring: 'authorizations_expiring',
}

export function useClientListColumnPreferences() {
  const siteStore = useSiteStore()

  const preferences = computed(
    () => siteStore.clientListColumnPreferences,
  )

  const columnCatalog = computed(
    () => siteStore.clientListColumnCatalog,
  )

  async function loadPreferences() {
    await siteStore.fetchClientListColumnConfig()
  }

  function savePreferences(nextPreferences) {
    return siteStore.saveClientListColumnConfig(nextPreferences)
  }

  function resetPreferences() {
    return siteStore.resetClientListColumnConfig()
  }

  function buildVisibleColumns(columnDefinitions) {
    const apiColumns = siteStore.clientListVisibleColumns
    const byName = new Map(
      columnDefinitions.map(column => [column.name, column]),
    )

    if (apiColumns.length) {
      return apiColumns
        .map(entry => {
          const column = byName.get(entry.frontendKey)
          if (!column) {
            return null
          }

          return {
            ...column,
            label: entry.label || column.label,
            sortable: entry.sortable ?? column.sortable,
          }
        })
        .filter(Boolean)
    }

    return preferences.value.order
      .filter(name => !preferences.value.hidden.includes(name))
      .map(name => byName.get(name))
      .filter(Boolean)
  }

  function isRequiredColumn(columnId) {
    const meta = columnCatalog.value.find(
      entry => apiColumnKeyToFrontend(entry.key) === columnId,
    )
    if (meta?.required) {
      return true
    }

    return CLIENT_LIST_REQUIRED_COLUMNS.includes(columnId)
  }

  function isLockedColumn(columnId) {
    const meta = columnCatalog.value.find(
      entry => apiColumnKeyToFrontend(entry.key) === columnId,
    )
    if (meta?.locked) {
      return true
    }

    return CLIENT_LIST_LOCKED_COLUMNS.includes(columnId)
  }

  return {
    preferences,
    columnCatalog,
    loadPreferences,
    savePreferences,
    resetPreferences,
    buildVisibleColumns,
    isRequiredColumn,
    isLockedColumn,
    defaultOrder: CLIENT_LIST_DEFAULT_COLUMN_ORDER,
  }
}
