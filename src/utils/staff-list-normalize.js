import { staffFieldKeys as fk } from 'src/utils/staff-list-columns.js'
import { apiDateToDisplay } from 'src/utils/app-datetime.js'
import {
  staffStatusLabel,
  staffStatusVariant,
} from 'src/utils/staff-status.js'
import { normalizeStaffSystemUserFromApi } from
  'src/utils/staff-system-user.js'

function formatHireDate(value) {
  return apiDateToDisplay(value) || String(value ?? '').trim()
}

export function mapStaffListItem(item, t) {
  if (!item || item.id == null) {
    return null
  }

  const statusRaw = item.status ?? ''
  const isClinician = Boolean(
    item.is_clinician ?? item.position_is_clinical,
  )
  const systemUser = normalizeStaffSystemUserFromApi(item)
  const roleLabel = systemUser?.roleName
    || String(
      item.role_label ?? item.role ?? item.system_role ?? '',
    ).trim()
  const username = systemUser?.username
    || String(item.username ?? '').trim()

  return {
    id: item.id,
    [fk.staffNo]: String(item.staff_no ?? item.code ?? '').trim(),
    [fk.name]: String(item.name ?? '').trim(),
    [fk.email]: String(item.email ?? '').trim(),
    [fk.position]: String(
      item.position_label ?? item.position ?? '',
    ).trim(),
    [fk.role]: roleLabel,
    [fk.username]: username,
    systemUser,
    tenantUserId: systemUser?.tenantUserId ?? null,
    [fk.npi]: String(item.npi ?? '').trim(),
    [fk.status]: staffStatusLabel(statusRaw, t),
    statusRaw,
    statusVariant: staffStatusVariant(statusRaw),
    [fk.isClinician]: isClinician,
    [fk.hireDate]: formatHireDate(item.hire_date ?? item.hire),
  }
}
