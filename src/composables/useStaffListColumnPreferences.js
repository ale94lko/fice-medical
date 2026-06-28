import { useAdminTableColumnPreferences } from
  'src/composables/useAdminTableColumnPreferences.js'
import { adminTableIds } from 'src/constants/admin-table.js'
import {
  defaultStaffListColumnOrder,
  lockedStaffListColumns,
  requiredStaffListColumns,
} from 'src/utils/staff-list-columns.js'

export function useStaffListColumnPreferences() {
  return useAdminTableColumnPreferences({
    tableId: adminTableIds.staff,
    defaultOrder: defaultStaffListColumnOrder,
    requiredColumns: requiredStaffListColumns,
    lockedColumns: lockedStaffListColumns,
  })
}
