import { clientListColumnKeys as col } from 'components/constants.js'
import { adminTableIds } from 'src/constants/admin-table.js'
import { useAdminTableColumnPreferences } from
  'src/composables/useAdminTableColumnPreferences.js'

export const CLIENT_LIST_DEFAULT_COLUMN_ORDER = [
  col.clientNumber,
  col.name,
  col.email,
  col.dob,
  col.clinicians,
  col.admissionDate,
  col.status,
  col.actions,
]

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
  return useAdminTableColumnPreferences({
    tableId: adminTableIds.clients,
    defaultOrder: CLIENT_LIST_DEFAULT_COLUMN_ORDER,
    requiredColumns: CLIENT_LIST_REQUIRED_COLUMNS,
    lockedColumns: CLIENT_LIST_LOCKED_COLUMNS,
  })
}
