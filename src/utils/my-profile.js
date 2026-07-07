import { fetchTenantUser } from 'src/utils/user-list-api.js'
import { fetchStaffById } from 'src/utils/staff-api.js'
import { createEmptyStaffForm } from 'src/utils/staff-form.js'
import { resolveUserInitials } from 'src/utils/user-list-display.js'

export const myProfileTabKeys = {
  personal: 'personal',
  activity: 'activity',
}

function splitDisplayName(name) {
  const trimmed = String(name ?? '').trim()
  if (!trimmed) {
    return { firstName: '', lastName: '' }
  }
  const parts = trimmed.split(/\s+/)

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  }
}

function resolvePrimaryPhone(contact) {
  const phones = contact?.phones ?? []
  const match = phones.find(
    row => String(row?.phoneNumber ?? '').trim().length > 0,
  )

  return String(match?.phoneNumber ?? '').trim()
}

function resolveClinicianLabel(isClinician, t) {
  if (!isClinician) {
    return '—'
  }

  return t('staffListClinicianYes')
}

export function buildMyProfileViewModel({
  userRecord = null,
  staffForm = null,
  authUserInfo = null,
  activeSubtenant = null,
  t,
}) {
  const staffMember = userRecord?.staffMember
    ?? authUserInfo?.staffMember
    ?? null
  const staffBasic = staffForm?.basic ?? null
  const staffContact = staffForm?.contact ?? null
  const staffEmployment = staffForm?.employment ?? null
  const displayName = String(
    userRecord?.name
    ?? staffMember?.name
    ?? authUserInfo?.username
    ?? '',
  ).trim()
  const nameParts = staffBasic?.firstName || staffBasic?.lastName
    ? {
      firstName: String(staffBasic.firstName ?? '').trim(),
      lastName: String(staffBasic.lastName ?? '').trim(),
    }
    : splitDisplayName(displayName)
  const position = String(
    staffMember?.position
    ?? staffEmployment?.position
    ?? '',
  ).trim()
  const email = String(
    userRecord?.email
    ?? authUserInfo?.username
    ?? staffMember?.email
    ?? '',
  ).trim()
  const phone = resolvePrimaryPhone(staffContact)
  const clinicName = String(activeSubtenant?.name ?? '').trim()
  const systemRole = String(userRecord?.role ?? '').trim() || '—'
  const memberSince = String(userRecord?.createdAt ?? '').trim() || '—'
  const bio = String(
    userRecord?.description
    ?? authUserInfo?.description
    ?? '',
  ).trim()
  const staffNo = String(staffMember?.staffNo ?? '').trim()
  const photoFileId = userRecord?.photoFileId
    ?? staffMember?.photoFileId
    ?? staffBasic?.photoFileId
    ?? null
  const status = String(userRecord?.status ?? '').trim() || '—'
  const lastLogin = String(userRecord?.lastLogin ?? '').trim() || '—'
  const isClinician = Boolean(
    staffMember?.isClinician
    || String(staffForm?.clinical?.npi ?? '').trim(),
  )
  const hireDate = String(staffEmployment?.hireDate ?? '').trim() || '—'

  return {
    displayName: displayName || email || '—',
    firstName: nameParts.firstName || '—',
    lastName: nameParts.lastName || '—',
    position: position || '—',
    email: email || '—',
    phone: phone || '—',
    clinicName: clinicName || '—',
    systemRole,
    memberSince,
    bio: bio || '—',
    staffNo: staffNo || '—',
    photoFileId,
    status,
    lastLogin,
    isClinician,
    clinicianLabel: resolveClinicianLabel(isClinician, t),
    hireDate,
    initials: userRecord?.initials
      || resolveUserInitials(displayName, email),
    tenantUserId: userRecord?.id ?? authUserInfo?.id ?? null,
    staffId: staffMember?.id ?? userRecord?.tenantStaffId ?? null,
  }
}

export async function loadMyProfileData({ userId, staffId, t }) {
  let userRecord = null
  let staffForm = null

  if (userId != null) {
    userRecord = await fetchTenantUser(userId, t)
  }

  const resolvedStaffId = staffId
    ?? userRecord?.tenantStaffId
    ?? userRecord?.staffMember?.id
    ?? null

  if (resolvedStaffId != null) {
    const staffData = await fetchStaffById(resolvedStaffId)
    staffForm = createEmptyStaffForm(null, staffData)
  }

  return { userRecord, staffForm }
}
