/* eslint-disable camelcase -- staff/NPI API payloads use snake_case */
import { mapPhoneTypeFromApi } from 'src/utils/client-contact-select-options.js'
import { formatPhoneUs } from 'src/utils/client-contact-form.js'
import { resolveCatalogSelectValue } from 'src/utils/catalogs.js'
import {
  createEmptyStaffEmail,
  createEmptyStaffPhone,
  nextStaffLicenseId,
  normalizeStaffLicenseRow,
} from 'src/utils/staff-form.js'

export const NPI_DIGIT_LENGTH = 10

export function sanitizeNpiDigits(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, NPI_DIGIT_LENGTH)
}

export function isValidNpiDigits(value) {
  return /^\d{10}$/.test(sanitizeNpiDigits(value))
}

function hasText(value) {
  return String(value ?? '').trim().length > 0
}

function pickUnlessFilled(current, incoming) {
  return hasText(current) ? current : String(incoming ?? '').trim()
}

function normalizeCountry(country) {
  const value = String(country ?? '').trim()
  if (!value || value === 'US' || value === 'USA') {
    return 'USA'
  }

  return value
}

function resolvePhoneType(rawType, phoneTypeOptions) {
  const mapped = mapPhoneTypeFromApi(rawType)
  if (!mapped) {
    return ''
  }

  return resolveCatalogSelectValue(phoneTypeOptions, mapped) ?? mapped
}

function phoneDigitsKey(number) {
  return String(number ?? '').replace(/\D/g, '')
}

function mapLookupPhones(apiPhones, existingPhones, phoneTypeOptions) {
  const incoming = (apiPhones ?? []).filter(row => hasText(row?.phone_number))
  if (!incoming.length) {
    return existingPhones
  }

  const mappedIncoming = incoming.map(row => ({
    phoneNumber: formatPhoneUs(String(row.phone_number ?? '').trim()),
    phoneType: resolvePhoneType(row.phone_type, phoneTypeOptions),
  }))

  const hasUserPhones = (existingPhones ?? []).some(
    row => hasText(row?.phoneNumber),
  )
  if (!hasUserPhones) {
    return mappedIncoming.length
      ? mappedIncoming
      : [createEmptyStaffPhone()]
  }

  const seen = new Set(
    (existingPhones ?? [])
      .map(row => phoneDigitsKey(row.phoneNumber))
      .filter(Boolean),
  )
  const merged = [...(existingPhones ?? [])]

  for (const row of mappedIncoming) {
    const key = phoneDigitsKey(row.phoneNumber)
    if (!key || seen.has(key)) {
      continue
    }
    seen.add(key)
    const emptyIndex = merged.findIndex(item => !hasText(item.phoneNumber))
    if (emptyIndex >= 0) {
      merged[emptyIndex] = row
    } else {
      merged.push(row)
    }
  }

  return merged.length ? merged : [createEmptyStaffPhone()]
}

function mapTaxonomiesFromClinician(clinician) {
  if (!clinician) {
    return []
  }
  if (Array.isArray(clinician.taxonomies) && clinician.taxonomies.length) {
    return clinician.taxonomies.map(row => ({
      code: String(row.code ?? '').trim(),
      displayName: String(row.display_name ?? row.displayName ?? '').trim(),
      isPrimary: Boolean(row.is_primary ?? row.isPrimary),
    }))
  }

  const rows = []
  const primary = clinician.primary_taxonomy
  if (primary?.code) {
    rows.push({
      code: String(primary.code ?? '').trim(),
      displayName: String(primary.display_name ?? '').trim(),
      isPrimary: true,
    })
  }
  for (const row of clinician.secondary_taxonomies ?? []) {
    if (!row?.code) {
      continue
    }
    rows.push({
      code: String(row.code ?? '').trim(),
      displayName: String(row.display_name ?? '').trim(),
      isPrimary: Boolean(row.is_primary),
    })
  }

  return rows
}

function mapLookupLicenses(apiLicenses, existingLicenses) {
  const incoming = (apiLicenses ?? []).filter(
    row => hasText(row?.identifier) || hasText(row?.type),
  )
  if (!incoming.length) {
    return existingLicenses
  }

  const hasUserLicenses = (existingLicenses ?? []).some(
    row => hasText(row?.identifier) || hasText(row?.type),
  )
  if (hasUserLicenses) {
    return existingLicenses
  }

  return incoming.map(row => normalizeStaffLicenseRow({
    id: nextStaffLicenseId(),
    type: row.type ?? '',
    identifier: row.identifier ?? '',
    expiration_date: row.expiration_date ?? '',
    status: row.status ?? 'Active',
    attachment_file_id: null,
    is_primary: row.is_primary,
  }))
}

function resolveCatalogOrRaw(options, raw) {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) {
    return ''
  }

  return resolveCatalogSelectValue(options, trimmed) ?? trimmed
}

function resolvePersonalNames(lookup, basic, genderOptions = []) {
  const personal = lookup.personal_information ?? {}
  const isOrganization = lookup.enumeration_type === 'NPI-2'
  const orgName = String(
    personal.organization_name ?? personal.last_name ?? '',
  ).trim()

  return {
    firstName: pickUnlessFilled(
      basic.firstName,
      isOrganization && !hasText(personal.first_name)
        ? ''
        : personal.first_name,
    ),
    middleName: pickUnlessFilled(basic.middleName, personal.middle_name),
    lastName: pickUnlessFilled(
      basic.lastName,
      isOrganization ? orgName : personal.last_name,
    ),
    prefix: pickUnlessFilled(basic.prefix, personal.prefix),
    suffix: pickUnlessFilled(basic.suffix, personal.suffix ?? ''),
    sex: pickUnlessFilled(
      basic.sex,
      resolveCatalogOrRaw(genderOptions, personal.sex),
    ),
  }
}

export function prefillStaffFormFromNpiLookup(
  form,
  lookup,
  catalogOptions = {},
) {
  if (!lookup?.found) {
    return form
  }

  const {
    phoneTypeOptions = [],
    stateOptions = [],
    prefixOptions = [],
    suffixOptions = [],
    credentialOptions = [],
    specialtyOptions = [],
    genderOptions = [],
  } = catalogOptions

  const personal = lookup.personal_information ?? {}
  const clinician = lookup.clinician ?? {}
  const apiAddress = personal.addresses?.[0] ?? {}
  const names = resolvePersonalNames(lookup, form.basic ?? {}, genderOptions)

  const taxonomies = mapTaxonomiesFromClinician(clinician)
  const primarySpecialtyRaw = clinician.primary_specialty
    ?? clinician.specialty
    ?? taxonomies.find(row => row.isPrimary)?.displayName
    ?? ''

  return {
    ...form,
    basic: {
      ...form.basic,
      ...names,
      prefix: pickUnlessFilled(
        names.prefix,
        resolveCatalogOrRaw(prefixOptions, personal.prefix),
      ),
      suffix: pickUnlessFilled(
        names.suffix,
        resolveCatalogOrRaw(suffixOptions, personal.suffix),
      ),
      npiLookup: lookup.npi ?? form.basic?.npiLookup ?? '',
      npiLookupFound: true,
    },
    contact: {
      ...form.contact,
      address: {
        ...form.contact?.address,
        address: pickUnlessFilled(
          form.contact?.address?.address,
          apiAddress.address,
        ),
        address2: pickUnlessFilled(
          form.contact?.address?.address2,
          apiAddress.address2,
        ),
        city: pickUnlessFilled(form.contact?.address?.city, apiAddress.city),
        state: pickUnlessFilled(
          form.contact?.address?.state,
          resolveCatalogOrRaw(stateOptions, apiAddress.state),
        ),
        zipCode: pickUnlessFilled(
          form.contact?.address?.zipCode,
          apiAddress.zip_code,
        ),
        country: pickUnlessFilled(
          form.contact?.address?.country,
          normalizeCountry(apiAddress.country),
        ),
      },
      phones: mapLookupPhones(
        personal.phones,
        form.contact?.phones,
        phoneTypeOptions,
      ),
      emails: form.contact?.emails?.length
        ? form.contact.emails
        : [createEmptyStaffEmail()],
    },
    clinical: {
      ...form.clinical,
      npi: pickUnlessFilled(form.clinical?.npi, lookup.npi ?? clinician.npi),
      credential: pickUnlessFilled(
        form.clinical?.credential,
        resolveCatalogOrRaw(credentialOptions, clinician.credential),
      ),
      primarySpecialty: pickUnlessFilled(
        form.clinical?.primarySpecialty,
        resolveCatalogOrRaw(specialtyOptions, primarySpecialtyRaw),
      ),
      taxonomies: (form.clinical?.taxonomies ?? []).length
        ? form.clinical.taxonomies
        : taxonomies,
      licenses: mapLookupLicenses(
        clinician.licenses,
        form.clinical?.licenses,
      ),
    },
  }
}

export function resolveNpiLookupErrorMessage(error, t) {
  const data = error?.response?.data

  return String(
    data?.message
    ?? data?.error?.message
    ?? t('staffNpiLookupFailed'),
  )
}
