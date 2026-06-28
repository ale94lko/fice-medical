/* eslint-disable camelcase -- API payload field names */
function trim(value) {
  return String(value ?? '').trim()
}

function mapPhones(phones = []) {
  return phones
    .map(row => ({
      phone_number: trim(row.phoneNumber),
      phone_type: trim(row.phoneType),
    }))
    .filter(row => row.phone_number)
}

function mapEmails(emails = []) {
  return emails
    .map(row => ({
      email: trim(row.email),
      email_type: trim(row.emailType),
    }))
    .filter(row => row.email)
}

function mapAddress(address = {}) {
  const line1 = trim(address.address)
  if (!line1) {
    return []
  }

  return [{
    address: line1,
    address2: trim(address.address2),
    city: trim(address.city),
    state: trim(address.state),
    county: trim(address.county),
    zip_code: trim(address.zipCode),
    country: trim(address.country) || 'USA',
  }]
}

function mapBasicInformation(basic, photoFileId) {
  return {
    first_name: trim(basic.firstName),
    middle_name: trim(basic.middleName),
    last_name: trim(basic.lastName),
    suffix: trim(basic.suffix),
    prefix: trim(basic.prefix),
    dob: trim(basic.dob),
    sex: trim(basic.sex),
    photo_file_id: photoFileId ?? basic.photoFileId ?? null,
  }
}

function mapEmployment(employment, { isEdit }) {
  const payload = {
    status: trim(employment.status) || 'active',
    position: trim(employment.position),
    hire: trim(employment.hireDate),
    termination: trim(employment.terminationDate) || null,
    system_user: {
      enabled: Boolean(employment.systemUser?.enabled),
      username: trim(employment.systemUser?.username),
      role_id: employment.systemUser?.roleId ?? null,
    },
    compensation: (employment.compensation ?? []).map(row => ({
      rate_type: trim(row.rate_type ?? row.rateType),
      rate: row.rate != null ? Number(row.rate) : null,
      effective_from: row.effective_from ?? row.effectiveFrom ?? null,
      effective_to: row.effective_to ?? row.effectiveTo ?? null,
      is_current: Boolean(row.is_current ?? row.isCurrent),
    })),
  }

  if (!isEdit && employment.systemUser?.enabled) {
    payload.system_user.password = trim(employment.systemUser.password)
  }

  return payload
}

function mapClinicalProfile(clinical) {
  return {
    npi: trim(clinical.npi),
    credential: trim(clinical.credential),
    primary_specialty: trim(clinical.primarySpecialty),
    taxonomies: (clinical.taxonomies ?? []).map(row => ({
      code: trim(row.code),
      display_name: trim(row.display_name ?? row.displayName),
      is_primary: Boolean(row.is_primary ?? row.isPrimary),
    })),
    licenses: (clinical.licenses ?? []).map(row => ({
      type: trim(row.type),
      identifier: trim(row.identifier),
      expiration_date: trim(row.expiration_date ?? row.expirationDate),
      status: trim(row.status),
      attachment_file_id:
        row.attachment_file_id ?? row.attachmentFileId ?? null,
      is_primary: Boolean(row.is_primary ?? row.isPrimary),
    })),
    supervisor_id: clinical.supervisorId ?? null,
  }
}

export function buildStaffRegisterBody({
  form,
  entryPoint,
  photoFileId,
  includeClinicalProfile,
  isEdit,
}) {
  const payload = {
    entry_point: entryPoint,
    basic_information: mapBasicInformation(form.basic, photoFileId),
    contact_information: {
      addresses: mapAddress(form.contact?.address),
      phones: mapPhones(form.contact?.phones),
      emails: mapEmails(form.contact?.emails),
    },
    employment: mapEmployment(form.employment, { isEdit }),
  }

  if (includeClinicalProfile) {
    payload.clinical_profile = mapClinicalProfile(form.clinical)
  }

  return payload
}
