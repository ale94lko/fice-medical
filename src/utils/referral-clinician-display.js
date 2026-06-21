import { clinicianInitialsFromPersonName } from 'src/utils/clinician-display.js'

function trim(value) {
  return String(value ?? '').trim()
}

function entryFromClinicianOption(option) {
  const label = trim(option?.label)
  if (!label) {
    return null
  }

  const parts = label.split(' - ')
  const personName = parts[0]?.trim() || label
  const specialty = parts.length > 1
    ? parts.slice(1).join(' - ').trim()
    : ''

  return {
    id: option.value ?? null,
    name: label,
    personName,
    specialty,
    initials: clinicianInitialsFromPersonName(personName),
  }
}

function findClinicianOptionForPartyLabel(partyLabel, clinicianOptions) {
  const label = trim(partyLabel)
  if (!label || label === '—') {
    return null
  }

  const options = Array.isArray(clinicianOptions) ? clinicianOptions : []
  const exact = options.find(
    option => trim(option?.label) === label,
  )
  if (exact) {
    return exact
  }

  const personOnly = options.find(
    option => trim(option?.label).split(' - ')[0] === label,
  )

  return personOnly ?? null
}

export function resolveReferralClinicianEntriesFromPartyLabel(
  partyLabel,
  clinicianOptions = [],
) {
  const match = findClinicianOptionForPartyLabel(
    partyLabel,
    clinicianOptions,
  )
  if (!match) {
    return []
  }

  const entry = entryFromClinicianOption(match)

  return entry ? [entry] : []
}

export function resolveReferralAssignedClinicianEntries(
  row,
  clinicianOptions = [],
) {
  const assigned = row?.assignedClinician
  if (assigned && typeof assigned === 'object') {
    const label = trim(
      assigned.display_name
      ?? assigned.displayName
      ?? assigned.name,
    )
    const displayName = trim(
      assigned.display_name ?? assigned.displayName,
    )
    const personName = displayName || trim(assigned.name)
    if (personName) {
      return [{
        id: assigned.id ?? row.assignedClinicianId ?? null,
        name: label || personName,
        personName,
        specialty: trim(assigned.specialty),
        initials: trim(assigned.initials)
          || clinicianInitialsFromPersonName(personName),
      }]
    }
  }

  if (row?.assignedClinicianId == null) {
    return []
  }

  const match = (clinicianOptions ?? []).find(
    option => Number(option.value) === Number(row.assignedClinicianId),
  )
  if (!match) {
    return []
  }

  const entry = entryFromClinicianOption(match)

  return entry ? [entry] : []
}
