import { staffEntryPoints } from 'components/constants.js'

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
    username: '',
    roleId: null,
    password: '',
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

export function normalizeStaffCompensationRow(row) {
  return {
    id: row.id ?? nextStaffCompensationId(),
    rateType: row.rate_type ?? row.rateType ?? '',
    rate: row.rate ?? '',
    effectiveFrom: row.effective_from ?? row.effectiveFrom ?? '',
    effectiveTo: row.effective_to ?? row.effectiveTo ?? '',
    isCurrent: Boolean(row.is_current ?? row.isCurrent),
  }
}

export function normalizeStaffLicenseRow(row) {
  return {
    id: row.id ?? nextStaffLicenseId(),
    type: row.type ?? '',
    identifier: row.identifier ?? '',
    expirationDate: row.expiration_date ?? row.expirationDate ?? '',
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
      dob: personal.dob ?? '',
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
          phoneNumber: row.phone_number ?? '',
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
      hireDate: employment.hire ?? '',
      terminationDate: employment.termination ?? '',
      systemUser: {
        enabled: Boolean(employment.system_user?.enabled),
        username: employment.system_user?.username ?? '',
        roleId: employment.system_user?.role_id ?? null,
        password: '',
      },
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
