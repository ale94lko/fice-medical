function trim(value) {
  return String(value ?? '').trim()
}

function parseId(value) {
  const id = Number(value)
  if (!Number.isFinite(id) || id <= 0) {
    return null
  }

  return id
}

function locationFromAddresses(addresses) {
  const list = Array.isArray(addresses) ? addresses : []
  const first = list[0] || {}
  const city = trim(first.city)
  const state = trim(first.state)
  if (city && state) {
    return `${city}, ${state}`
  }

  return city || trim(first.address) || ''
}

function initialsFromName(name) {
  const parts = trim(name).split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  if (parts.length === 1) {
    return parts[0][0].toUpperCase()
  }

  return ''
}

export function clinicianCardTitle(item) {
  const name = trim(item?.fullName)
  const credentials = trim(item?.credentials)
  if (name && credentials && !name.includes(credentials)) {
    return `${name}, ${credentials}`
  }

  return name || credentials
}

export function clinicianMetaLine(item, t) {
  const parts = []
  const npi = trim(item?.npi)
  if (npi) {
    parts.push(t('assignCliniciansNpi', { npi }))
  }
  const location = trim(item?.primaryLocation)
  if (location) {
    parts.push(location)
  }

  return parts.join(' • ')
}

export function idsKey(ids) {
  return [...ids]
    .map(Number)
    .filter(id => Number.isFinite(id))
    .sort((a, b) => a - b)
    .join(',')
}

export function matchesClinicianQuery(item, query) {
  const needle = trim(query).toLowerCase()
  if (!needle) {
    return true
  }
  const haystack = [
    item.fullName,
    item.credentials,
    item.specialty,
    item.npi,
    item.primaryLocation,
  ]
    .map(trim)
    .join(' ')
    .toLowerCase()

  return haystack.includes(needle)
}

export function normalizeAssignedClinician(raw = {}) {
  const id = parseId(raw.id)
  if (id == null) {
    return null
  }
  const fullName = trim(raw.full_name ?? raw.fullName)
  const initials = trim(raw.initials) || initialsFromName(fullName)

  return {
    id,
    fullName,
    credentials: trim(raw.credentials),
    specialty: trim(raw.specialty),
    npi: trim(raw.npi),
    primaryLocation: trim(
      raw.primary_location ?? raw.primaryLocation,
    ),
    status: trim(raw.status).toUpperCase(),
    photoFileId: parseId(raw.photo_file_id ?? raw.photoFileId),
    initials,
  }
}

export function mergeAssignedClinicians(assignedRows, available) {
  const byIdMap = new Map(available.map(row => [row.id, row]))

  return assignedRows.map(row => {
    const extra = byIdMap.get(row.id)
    if (!extra) {
      return row
    }

    return {
      ...extra,
      ...row,
      fullName: row.fullName || extra.fullName,
      credentials: row.credentials || extra.credentials,
      primaryLocation: row.primaryLocation || extra.primaryLocation,
      photoFileId: row.photoFileId || extra.photoFileId,
      initials: row.initials || extra.initials,
    }
  })
}

export function mapClinicianListRowToAssignment(row) {
  const staffMember = row?.staff_member ?? row?.staffMember ?? {}
  const personal = staffMember.personal_information
    ?? staffMember.personalInformation
    ?? {}
  const first = trim(personal.first_name ?? personal.firstName)
  const last = trim(personal.last_name ?? personal.lastName)
  const fullName = [first, last].filter(Boolean).join(' ')
    || trim(row?.full_name ?? row?.fullName)
  const suffix = trim(personal.suffix)
  const id = parseId(row?.id)
  if (id == null) {
    return null
  }

  return {
    id,
    fullName,
    credentials: suffix,
    specialty: trim(row?.specialty),
    npi: trim(row?.npi),
    primaryLocation: locationFromAddresses(personal.addresses),
    status: trim(row?.status ?? staffMember.status).toUpperCase(),
    photoFileId: parseId(
      personal.photo_file_id ?? personal.photoFileId,
    ),
    initials: initialsFromName(fullName),
  }
}

