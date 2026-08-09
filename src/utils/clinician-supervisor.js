import { parseDisplayDate } from 'src/utils/app-datetime.js'

function trim(value) {
  return String(value ?? '').trim()
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return today
}

/**
 * Resolve nested / flat supervisor fields from a clinician API payload.
 */
export function resolveClinicianSupervisorFromApi(raw = {}) {
  const nested = raw?.supervisor && typeof raw.supervisor === 'object'
    ? raw.supervisor
    : null
  const idRaw = raw?.supervisor_id
    ?? raw?.supervisorId
    ?? nested?.id
    ?? null
  const idNumber = idRaw != null && idRaw !== ''
    ? Number(idRaw)
    : null
  const id = Number.isFinite(idNumber) ? idNumber : null
  const displayName = trim(
    raw?.supervisor_display_name
    ?? raw?.supervisorDisplayName
    ?? nested?.display_name
    ?? nested?.displayName
    ?? nested?.name
    ?? '',
  )

  return {
    supervisorId: id,
    supervisorDisplayName: displayName,
    supervisor: nested
      ? {
        id: nested.id ?? id,
        displayName: trim(
          nested.display_name ?? nested.displayName ?? nested.name,
        ),
        npi: trim(nested.npi),
        specialty: trim(nested.specialty),
        staffMembersId: nested.staff_members_id
          ?? nested.staffMembersId
          ?? null,
      }
      : null,
  }
}

/**
 * Active license = status Active and expiration date not before today.
 */
export function isStaffLicenseCurrentlyActive(license) {
  const status = trim(license?.status ?? license?.Status)
  if (!status || status.toLowerCase() !== 'active') {
    return false
  }
  const expiration = parseDisplayDate(
    license?.expirationDate ?? license?.expiration_date,
  )
  if (!expiration) {
    return false
  }

  return expiration.getTime() >= startOfToday().getTime()
}

export function clinicianHasActiveLicense(licenses = []) {
  return (Array.isArray(licenses) ? licenses : [])
    .some(row => isStaffLicenseCurrentlyActive(row))
}

export function isClinicianSupervisorRequired(clinical = {}) {
  return !clinicianHasActiveLicense(clinical?.licenses)
}

export function mapSupervisorIdForApi(value) {
  if (value == null || value === '') {
    return null
  }
  const id = Number(value)

  return Number.isFinite(id) ? id : null
}

/**
 * Build select options excluding a clinician id, ensuring the current
 * supervisor label is present when options have not loaded it yet.
 */
export function buildSupervisorSelectOptions({
  options = [],
  excludeClinicianId = null,
  supervisorId = null,
  supervisorDisplayName = '',
} = {}) {
  const list = Array.isArray(options) ? [...options] : []
  const selectedId = supervisorId != null && supervisorId !== ''
    ? String(supervisorId)
    : ''
  const selectedLabel = trim(supervisorDisplayName)
  if (
    selectedId
    && selectedLabel
    && !list.some(option => String(option?.value) === selectedId)
  ) {
    list.unshift({
      value: selectedId,
      label: selectedLabel,
      name: selectedLabel,
    })
  }
  const exclude = excludeClinicianId != null && excludeClinicianId !== ''
    ? String(excludeClinicianId)
    : ''
  if (!exclude) {
    return list
  }

  return list.filter(option => String(option?.value) !== exclude)
}
