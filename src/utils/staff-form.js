import { staffEntryPoints, userStatusValues } from 'components/constants.js'
import { apiDateToDisplay } from 'src/utils/app-datetime.js'
import { formatPhoneUs } from 'src/utils/client-contact-form.js'

export function createEmptyStaffAddress() {
  return {
    address: '',
    address2: '',
    city: '',
    state: '',
    county: '',
    zipCode: '',
    country: 'USA',
  }
}

export function createEmptyStaffPhone() {
  return {
    phoneNumber: '',
    phoneType: '',
  }
}

export function createEmptyStaffEmail() {
  return {
    email: '',
    emailType: '',
  }
}

export function createEmptyStaffBasic() {
  return {
    prefix: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    dob: '',
    sex: '',
    photoFileId: null,
    npiLookup: '',
    npiLookupFound: false,
  }
}

export function createEmptyStaffContact() {
  return {
    address: createEmptyStaffAddress(),
    phones: [createEmptyStaffPhone()],
    emails: [createEmptyStaffEmail()],
  }
}

export function createEmptyStaffSystemUser() {
  return {
    enabled: false,
    email: '',
    password: '',
    status: userStatusValues.active,
    roles: [],
    permissions: [],
    description: '',
    username: '',
    roleId: null,
  }
}

function normalizeStaffSystemUserFromApi(systemUser = {}) {
  const username = String(systemUser.username ?? '').trim()
  const roleId = systemUser.role_id ?? systemUser.roleId ?? null
  const roles = Array.isArray(systemUser.roles)
    ? systemUser.roles
    : roleId != null && roleId !== ''
      ? [roleId]
      : []

  return {
    enabled: Boolean(systemUser.enabled),
    email: String(systemUser.email ?? username).trim(),
    password: '',
    status: systemUser.status ?? userStatusValues.active,
    roles,
    permissions: Array.isArray(systemUser.permissions)
      ? systemUser.permissions
      : [],
    description: String(systemUser.description ?? '').trim(),
    username,
    roleId,
  }
}

export function createEmptyStaffCompensation() {
  return {
    rateType: '',
    rate: '',
    effectiveFrom: '',
    effectiveTo: '',
    isCurrent: false,
  }
}

export function createEmptyStaffEmployment() {
  return {
    status: 'active',
    position: '',
    hireDate: '',
    terminationDate: '',
    systemUser: createEmptyStaffSystemUser(),
    compensationDraft: createEmptyStaffCompensation(),
    compensation: [],
  }
}

export function createEmptyStaffLicense() {
  return {
    id: null,
    type: '',
    identifier: '',
    expirationDate: '',
    status: 'Active',
    attachmentFileId: null,
    isPrimary: false,
  }
}

let staffLicenseIdCounter = 0

export function nextStaffLicenseId() {
  staffLicenseIdCounter += 1

  return `staff-license-${staffLicenseIdCounter}`
}

let staffCompensationIdCounter = 0

export function nextStaffCompensationId() {
  staffCompensationIdCounter += 1

  return `staff-comp-${staffCompensationIdCounter}`
}

function mapApiDate(value) {
  return apiDateToDisplay(value) || String(value ?? '').trim()
}

export function normalizeStaffCompensationRow(row) {
  return {
    id: row.id ?? nextStaffCompensationId(),
    rateType: row.rate_type ?? row.rateType ?? '',
    rate: row.rate ?? '',
    effectiveFrom: mapApiDate(row.effective_from ?? row.effectiveFrom),
    effectiveTo: mapApiDate(row.effective_to ?? row.effectiveTo),
    isCurrent: Boolean(row.is_current ?? row.isCurrent),
  }
}

export function normalizeStaffLicenseRow(row) {
  return {
    id: row.id ?? nextStaffLicenseId(),
    type: row.type ?? '',
    identifier: row.identifier ?? '',
    expirationDate: mapApiDate(row.expiration_date ?? row.expirationDate),
    status: row.status ?? 'Active',
    attachmentFileId: row.attachment_file_id ?? row.attachmentFileId ?? null,
    isPrimary: Boolean(row.is_primary ?? row.isPrimary),
  }
}

export function createEmptyStaffClinical() {
  return {
    npi: '',
    credential: '',
    primarySpecialty: '',
    taxonomies: [],
    licenses: [],
    supervisorId: null,
  }
}

export function createEmptyStaffForm(
  entryPoint = staffEntryPoints.addStaff,
  apiData = null,
) {
  if (!apiData) {
    return {
      entryPoint,
      basic: createEmptyStaffBasic(),
      contact: createEmptyStaffContact(),
      employment: createEmptyStaffEmployment(),
      clinical: createEmptyStaffClinical(),
    }
  }

  const personal = apiData.personal_information
    ?? apiData.basic_information
    ?? {}
  const contact = apiData.contact_information ?? {}
  const employment = apiData.employment ?? {}
  const clinical = apiData.clinician ?? apiData.clinical_profile ?? {}

  return {
    entryPoint,
    basic: {
      prefix: personal.prefix ?? '',
      firstName: personal.first_name ?? '',
      middleName: personal.middle_name ?? '',
      lastName: personal.last_name ?? '',
      suffix: personal.suffix ?? '',
      dob: mapApiDate(personal.dob),
      sex: personal.sex ?? '',
      photoFileId: personal.photo_file_id ?? null,
      npiLookup: clinical.npi ?? '',
      npiLookupFound: false,
    },
    contact: {
      address: {
        address: contact.addresses?.[0]?.address ?? '',
        address2: contact.addresses?.[0]?.address2 ?? '',
        city: contact.addresses?.[0]?.city ?? '',
        state: contact.addresses?.[0]?.state ?? '',
        county: contact.addresses?.[0]?.county ?? '',
        zipCode: contact.addresses?.[0]?.zip_code ?? '',
        country: contact.addresses?.[0]?.country ?? 'USA',
      },
      phones: (contact.phones ?? []).length
        ? (contact.phones ?? []).map(row => ({
          phoneNumber: formatPhoneUs(row.phone_number ?? ''),
          phoneType: row.phone_type ?? '',
        }))
        : [createEmptyStaffPhone()],
      emails: (contact.emails ?? []).length
        ? (contact.emails ?? []).map(row => ({
          email: row.email ?? '',
          emailType: row.email_type ?? '',
        }))
        : [createEmptyStaffEmail()],
    },
    employment: {
      status: employment.status ?? 'active',
      position: employment.position ?? '',
      hireDate: mapApiDate(employment.hire ?? employment.hire_date),
      terminationDate: mapApiDate(
        employment.termination ?? employment.termination_date,
      ),
      systemUser: normalizeStaffSystemUserFromApi(employment.system_user),
      compensationDraft: createEmptyStaffCompensation(),
      compensation: (employment.compensation ?? []).map(
        normalizeStaffCompensationRow,
      ),
    },
    clinical: {
      npi: clinical.npi ?? '',
      credential: clinical.credential ?? '',
      primarySpecialty: clinical.primary_specialty ?? '',
      taxonomies: (clinical.taxonomies ?? []).map(row => ({
        code: row.code ?? '',
        displayName: row.display_name ?? row.displayName ?? '',
        isPrimary: Boolean(row.is_primary ?? row.isPrimary),
      })),
      licenses: (clinical.licenses ?? []).map(normalizeStaffLicenseRow),
      supervisorId: clinical.supervisor_id ?? null,
    },
  }
}
