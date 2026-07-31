import {
  formatPersonDisplayName,
  formatPersonDisplayNameFromRecord,
  personNamePartsFromRecord,
} from 'src/utils/person-display-name.js'

function trim(value) {
  return String(value ?? '').trim()
}

function staffMemberFromRow(row) {
  if (!row || typeof row !== 'object') {
    return null
  }

  return row.staff_member ?? row.staffMember ?? null
}

function personalFromClinicianRow(row) {
  if (!row || typeof row !== 'object') {
    return null
  }

  const staffMember = staffMemberFromRow(row)

  return staffMember?.personal_information
    ?? staffMember?.personalInformation
    ?? row.personal_information
    ?? row.personalInformation
    ?? null
}

function fallbackClinicianName(row, catalogOptions = {}) {
  const staffMember = staffMemberFromRow(row)
  const code = trim(staffMember?.code)

  if (code) {
    return code
  }

  return formatPersonDisplayNameFromRecord(row, catalogOptions)
}

/**
 * Prefix + first + middle + last, Suffix (canonical). Specialty not included.
 */
export function formatClinicianPersonName(clinicianRow, catalogOptions = {}) {
  if (!clinicianRow || typeof clinicianRow !== 'object') {
    return ''
  }

  const personal = personalFromClinicianRow(clinicianRow)
  const staffMember = staffMemberFromRow(clinicianRow)
  const partsSource = personal
    ?? staffMember
    ?? clinicianRow
  const parts = personNamePartsFromRecord(partsSource)
  const fromParts = formatPersonDisplayName(parts, catalogOptions)
  if (fromParts) {
    return fromParts
  }

  const directParts = personNamePartsFromRecord(clinicianRow)
  const fromDirect = formatPersonDisplayName(directParts, catalogOptions)
  if (fromDirect) {
    return fromDirect
  }

  return fallbackClinicianName(clinicianRow, catalogOptions)
}

/**
 * Secondary line for clinician select options (NPI · specialty).
 */
export function formatClinicianOptionCaption(clinicianRow) {
  if (!clinicianRow || typeof clinicianRow !== 'object') {
    return ''
  }

  const parts = []
  const npi = trim(clinicianRow.npi)
  const specialty = trim(clinicianRow.specialty)

  if (npi) {
    parts.push(`NPI ${npi}`)
  }
  if (specialty) {
    parts.push(specialty)
  }

  return parts.join(' · ')
}

/**
 * Person name (canonical) + " - " + specialty. Extra info preserved.
 */
export function formatClinicianDisplayLabel(
  clinicianRow,
  catalogOptions = {},
) {
  if (!clinicianRow || typeof clinicianRow !== 'object') {
    return ''
  }

  const specialty = trim(clinicianRow.specialty)
  const personName = formatClinicianPersonName(
    clinicianRow,
    catalogOptions,
  )

  if (personName && specialty) {
    return `${personName} - ${specialty}`
  }
  if (personName) {
    return personName
  }
  if (specialty) {
    return specialty
  }

  const id = clinicianRow.id ?? clinicianRow.clinician_id
  if (id != null && id !== '') {
    return `Clinician ${id}`
  }

  return ''
}

const CLINICIAN_AVATAR_PALETTE = [
  { background: '#ccfbf1', color: '#0f766e' },
  { background: '#e0f2fe', color: '#0369a1' },
  { background: '#ede9fe', color: '#6d28d9' },
  { background: '#fce7f3', color: '#be185d' },
  { background: '#ffedd5', color: '#c2410c' },
  { background: '#dcfce7', color: '#15803d' },
  { background: '#fef3c7', color: '#b45309' },
  { background: '#e2e8f0', color: '#334155' },
]

function hashString(value) {
  let hash = 0
  const text = String(value ?? '')

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0
  }

  return Math.abs(hash)
}

/**
 * Stable background/text colors for clinician avatar circles.
 */
export function clinicianAvatarStyle(seed) {
  const key = trim(seed) || '?'
  const palette = CLINICIAN_AVATAR_PALETTE[
    hashString(key) % CLINICIAN_AVATAR_PALETTE.length
  ]

  return {
    backgroundColor: palette.background,
    color: palette.color,
  }
}

export function clinicianInitialsFromPersonName(name) {
  const personPart = trim(
    String(name ?? '').split(' - ')[0].split(',')[0],
  )
  const parts = personPart.split(/\s+/).filter(Boolean)
  const skipPrefixes = new Set(['dr.', 'dr', 'mr.', 'mrs.', 'ms.', 'mr'])
  const meaningful = parts.filter(
    part => !skipPrefixes.has(part.toLowerCase()),
  )
  const source = meaningful.length ? meaningful : parts

  if (source.length >= 2) {
    return `${source[0][0] ?? ''}${source[source.length - 1][0] ?? ''}`
      .toUpperCase()
  }
  if (source.length === 1) {
    return source[0].slice(0, 2).toUpperCase()
  }

  return '?'
}
