import {
  formatPersonDisplayNameFromRecord,
  personNamePartsFromRecord,
} from 'src/utils/person-display-name.js'

const DISPLAY_NAME_PREFIXES = new Set([
  'mr',
  'mrs',
  'ms',
  'miss',
  'dr',
  'dra',
  'sr',
  'sra',
  'señor',
  'senor',
  'señora',
  'senora',
  'doctor',
  'doctora',
  'prof',
  'professor',
  'md',
  'do',
])

function trim(value) {
  return String(value ?? '').trim()
}

function givenNameFromDisplayName(name) {
  const beforeComma = String(name ?? '').split(',')[0].trim()
  if (!beforeComma) {
    return ''
  }
  const tokens = beforeComma.split(/\s+/).filter(Boolean)
  while (tokens.length) {
    const token = tokens[0].replace(/\./g, '').toLowerCase()
    if (!DISPLAY_NAME_PREFIXES.has(token)) {
      break
    }
    tokens.shift()
  }

  return tokens[0] ?? ''
}

/**
 * Given name for greetings. Prefers personal first_name, not the
 * full display name (which may start with Dr./Mr.) or username.
 */
export function staffGivenName(staff) {
  const explicit = trim(staff?.firstName ?? staff?.first_name)
  if (explicit) {
    return explicit
  }

  return givenNameFromDisplayName(staff?.name)
}

function readPhotoFileId(staff) {
  const personal = staff?.personal_information
    ?? staff?.personalInformation
    ?? {}
  const basic = staff?.basic_information
    ?? staff?.basicInformation
    ?? {}
  const raw = personal.photo_file_id
    ?? personal.photoFileId
    ?? basic.photo_file_id
    ?? basic.photoFileId
  const id = Number(raw)

  return Number.isFinite(id) && id > 0 ? id : null
}

function readStaffDisplayName(staff) {
  return formatPersonDisplayNameFromRecord(staff, {}, staff?.name)
    || trim(staff?.name)
}

function readStaffPosition(staff) {
  return trim(
    staff?.position_label
    ?? staff?.positionLabel
    ?? staff?.position,
  )
}

/**
 * Normalizes optional staff_member from user API or login user_info.
 * Returns null when absent.
 */
export function normalizeStaffMemberFromApi(raw) {
  const staff = raw?.staff_member ?? raw?.staffMember
  if (!staff || typeof staff !== 'object') {
    return null
  }

  const id = Number(staff.id)
  const name = readStaffDisplayName(staff)
  const nameParts = personNamePartsFromRecord(staff)
  const email = trim(staff.email)
  const position = readStaffPosition(staff)
  const staffNo = trim(staff.staff_no ?? staff.staffNo ?? staff.code)
  const status = trim(staff.status).toUpperCase()
  const isClinician = Boolean(staff.is_clinician ?? staff.isClinician)
  const photoFileId = readPhotoFileId(staff)

  if (
    !Number.isFinite(id)
    && !name
    && !email
    && !staffNo
    && !position
  ) {
    return null
  }

  return {
    id: Number.isFinite(id) ? id : null,
    staffNo,
    name,
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    email,
    position,
    isClinician,
    status: status || null,
    photoFileId,
  }
}

export function normalizeLoginStaffMember(raw) {
  return normalizeStaffMemberFromApi(raw)
}
