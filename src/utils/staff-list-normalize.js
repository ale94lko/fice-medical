import { staffFieldKeys as fk } from 'src/utils/staff-list-columns.js'
import {
  staffStatusLabel,
  staffStatusVariant,
} from 'src/utils/staff-status.js'

function formatHireDate(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    return raw
  }
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw)
  if (isoMatch) {
    return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`
  }

  return raw
}

export function mapStaffListItem(item, t) {
  if (!item || item.id == null) {
    return null
  }

  const statusRaw = item.status ?? ''
  const isClinician = Boolean(
    item.is_clinician ?? item.position_is_clinical,
  )

  return {
    id: item.id,
    [fk.staffNo]: String(item.staff_no ?? item.code ?? '').trim(),
    [fk.name]: String(item.name ?? '').trim(),
    [fk.email]: String(item.email ?? '').trim(),
    [fk.position]: String(
      item.position_label ?? item.position ?? '',
    ).trim(),
    [fk.role]: String(
      item.role_label ?? item.role ?? item.system_role ?? '',
    ).trim(),
    [fk.username]: String(item.username ?? '').trim(),
    [fk.npi]: String(item.npi ?? '').trim(),
    [fk.status]: staffStatusLabel(statusRaw, t),
    statusRaw,
    statusVariant: staffStatusVariant(statusRaw),
    [fk.isClinician]: isClinician,
    [fk.hireDate]: formatHireDate(item.hire_date ?? item.hire),
  }
}
