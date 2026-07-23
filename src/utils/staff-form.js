import { staffEntryPoints, userStatusValues } from 'components/constants.js'
import { apiDateToDisplay } from 'src/utils/app-datetime.js'
import { formatPhoneUs } from 'src/utils/client-contact-form.js'
import { mapUserStatusFromApi } from 'src/utils/user-register-payload.js'

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
    changePasswordRequired: true,
    status: userStatusValues.active,
    roles: [],
    permissions: [],
    description: '',
    username: '',
    roleId: null,
    tenantUserId: null,
  }
}

export function staffHasExistingSystemUser(systemUser = {}) {
  const tenantUserId = Number(
    systemUser.tenantUserId ?? systemUser.tenant_user_id,
  )
  if (Number.isFinite(tenantUserId) && tenantUserId > 0) {
    return true
  }

  const username = String(
    systemUser.username ?? systemUser.email ?? '',
  ).trim()

  return Boolean(username)
}

function resolveSystemUserEnabled(systemUser = {}) {
  if (staffHasExistingSystemUser(systemUser)) {
    return true
  }

  return Boolean(systemUser.enabled)
}

function normalizeStaffSystemUserFromApi(systemUser = {}) {
  const username = String(systemUser.username ?? '').trim()
  const roleId = systemUser.role_id ?? systemUser.roleId ?? null
  const roles = Array.isArray(systemUser.roles)
    ? systemUser.roles
    : roleId != null && roleId !== ''
      ? [roleId]
      : []
  const tenantUserId = Number(
    systemUser.tenant_user_id ?? systemUser.tenantUserId,
  )

  return {
    enabled: resolveSystemUserEnabled(systemUser),
    email: String(systemUser.email ?? username).trim(),
    password: '',
    changePasswordRequired: Boolean(
      systemUser.change_password_required
      ?? systemUser.changePasswordRequired
      ?? systemUser.change_password
      ?? systemUser.changePassword
      ?? true,
    ),
    status: mapUserStatusFromApi(
      systemUser.status ?? userStatusValues.active,
    ),
    roles,
    permissions: Array.isArray(systemUser.permissions)
      ? systemUser.permissions
      : [],
    description: String(systemUser.description ?? '').trim(),
    username,
    roleId,
    tenantUserId: Number.isFinite(tenantUserId) && tenantUserId > 0
      ? tenantUserId
      : null,
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

export function resolveStaffIsClinician(apiData = {}) {
  if (apiData.is_clinician != null || apiData.isClinician != null) {
    return Boolean(apiData.is_clinician ?? apiData.isClinician)
  }

  if (apiData.clinician || apiData.clinical_profile) {
    return true
  }

  return Boolean(apiData.position_is_clinical ?? apiData.positionIsClinical)
}

function mapTaxonomyRowFromApi(row = {}, { isPrimary = false } = {}) {
  return {
    code: String(row.code ?? '').trim(),
    displayName: String(
      row.display_name ?? row.displayName ?? '',
    ).trim(),
    definition: String(row.definition ?? '').trim(),
    grouping: String(row.grouping ?? '').trim(),
    classification: String(row.classification ?? '').trim(),
    specialization: String(
      row.specialization ?? '',
    ).trim(),
    isPrimary: Boolean(isPrimary || row.is_primary || row.isPrimary),
  }
}

function resolveClinicalTaxonomies(clinical = {}) {
  const taxonomies = []
  const primary = clinical.primary_taxonomy ?? clinical.primaryTaxonomy
  if (primary && typeof primary === 'object') {
    taxonomies.push(mapTaxonomyRowFromApi(primary, { isPrimary: true }))
  }

  const secondary = clinical.secondary_taxonomies
    ?? clinical.secondaryTaxonomies
    ?? []
  secondary.forEach(row => {
    taxonomies.push(mapTaxonomyRowFromApi(row, { isPrimary: false }))
  })

  if (taxonomies.length) {
    return taxonomies.filter(row => row.code)
  }

  return (clinical.taxonomies ?? [])
    .map(row => mapTaxonomyRowFromApi(row))
    .filter(row => row.code)
}

function resolveApiEmployment(apiData = {}) {
  const employment = apiData.employment ?? {}

  return {
    status: employment.status ?? apiData.status ?? 'active',
    position: employment.position ?? apiData.position ?? '',
    hireDate: mapApiDate(
      employment.hire ?? employment.hire_date ?? apiData.hire,
    ),
    terminationDate: mapApiDate(
      employment.termination
      ?? employment.termination_date
      ?? apiData.termination,
    ),
    systemUser: normalizeStaffSystemUserFromApi(
      employment.system_user ?? apiData.system_user ?? {},
    ),
    compensation: (
      employment.compensation ?? apiData.compensation ?? []
    ).map(normalizeStaffCompensationRow),
  }
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
      isClinician: entryPoint === staffEntryPoints.addClinician,
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
  const clinical = apiData.clinician ?? apiData.clinical_profile ?? {}
  const isClinician = resolveStaffIsClinician(apiData)
  const resolvedEntryPoint = isClinician
    ? staffEntryPoints.addClinician
    : entryPoint
  const employment = resolveApiEmployment(apiData)

  return {
    entryPoint: resolvedEntryPoint,
    isClinician,
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
      status: employment.status,
      position: employment.position,
      hireDate: employment.hireDate,
      terminationDate: employment.terminationDate,
      systemUser: employment.systemUser,
      compensationDraft: createEmptyStaffCompensation(),
      compensation: employment.compensation,
    },
    clinical: {
      npi: clinical.npi ?? '',
      credential: clinical.credential ?? '',
      primarySpecialty:
        clinical.primary_specialty ?? clinical.specialty ?? '',
      taxonomies: resolveClinicalTaxonomies(clinical),
      licenses: (clinical.licenses ?? []).map(normalizeStaffLicenseRow),
      supervisorId: clinical.supervisor_id ?? clinical.supervisorId ?? null,
    },
  }
}
