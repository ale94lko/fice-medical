import { formatClinicianPersonName } from 'src/utils/clinician-display.js'

function trim(value) {
  return String(value ?? '').trim()
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
  const direct = trim(staff?.name)
  if (direct) {
    return direct
  }

  return formatClinicianPersonName(staff)
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
