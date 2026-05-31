/* eslint-disable camelcase -- API request body uses snake_case */
import {
  clientFieldKeys,
  clientFormSections,
} from 'components/constants.js'
import { normalizePhoneDigits } from 'src/utils/client-contact-form.js'
import { usDateToIso } from 'src/utils/client-form.js'

const ck = clientFieldKeys

function trim(value) {
  return String(value ?? '').trim()
}

function toSnakeToken(value) {
  return trim(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function mapPhoneType(value) {
  const token = toSnakeToken(value)
  if (!token) {
    return ''
  }
  if (token === 'cell' || token === 'cell_phone') {
    return 'mobile'
  }

  return token
}

function mapEmailType(value) {
  return toSnakeToken(value) || ''
}

function mapCommunicationPreference(value) {
  const raw = trim(value).toLowerCase()
  if (!raw) {
    return ''
  }
  if (raw.includes('email')) {
    return 'email'
  }
  if (raw.includes('mobile')) {
    return 'mobile'
  }
  if (raw.includes('home') && raw.includes('phone')) {
    return 'home'
  }
  if (raw.includes('work') && raw.includes('phone')) {
    return 'work'
  }
  if (raw === 'mail') {
    return 'mail'
  }
  if (raw.includes('declined')) {
    return 'declined'
  }
  if (raw.includes('did not ask')) {
    return 'not_asked'
  }
  if (raw.includes('point') && raw.includes('contact')) {
    return 'point_of_contact'
  }

  return toSnakeToken(value)
}

function mapCountry(value) {
  const v = trim(value)
  if (!v) {
    return ''
  }
  const lower = v.toLowerCase()
  if (
    lower === 'us'
    || lower === 'usa'
    || lower === 'united states'
    || lower === 'united states of america'
  ) {
    return 'US'
  }

  return v
}

function mapContactType(value) {
  const raw = trim(value).toLowerCase()
  if (!raw) {
    return ''
  }
  if (raw.includes('emergency')) {
    return 'emergency'
  }
  if (raw.includes('billing')) {
    return 'billing'
  }
  if (raw.includes('primary')) {
    return 'primary'
  }
  if (raw.includes('legal')) {
    return 'legal'
  }
  if (raw.includes('caregiver')) {
    return 'caregiver'
  }
  if (raw.includes('next')) {
    return 'next_of_kin'
  }

  return toSnakeToken(value.replace(/\s+contact$/i, ''))
}

function mapRelationshipType(value) {
  const token = toSnakeToken(value)
  if (!token) {
    return ''
  }
  if (token === 'other_family_member') {
    return 'other_family'
  }

  return token
}

function mapAllergySeverity(value) {
  return toSnakeToken(value)
}

function formatPhoneForApi(value) {
  const digits = normalizePhoneDigits(value)
  if (digits.length === 10) {
    return `+1-${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  return trim(value)
}

function mapPhonesAll(phones) {
  return (phones ?? [])
    .map(p => ({
      phone_number: formatPhoneForApi(p?.number),
      phone_type: mapPhoneType(p?.type),
    }))
    .filter(p => p.phone_number || p.phone_type)
}

function mapEmailsAll(emails) {
  return (emails ?? [])
    .map(e => ({
      email: trim(e?.address),
      email_type: mapEmailType(e?.type),
    }))
    .filter(e => e.email || e.email_type)
}

function admissionDateToIso(value) {
  const isoDate = usDateToIso(value)
  if (!isoDate) {
    return null
  }

  return `${isoDate}T00:00:00`
}

function allergyStartDateFromYear(year) {
  const y = Number(year)
  if (!Number.isFinite(y) || y < 1) {
    return null
  }

  return `${y}-01-01`
}

function resolveSsn(form) {
  const ssnDigits = trim(form[ck.socialSecurityNumber]).replace(/\D/g, '')
  if (!ssnDigits) {
    return null
  }

  return Number(ssnDigits)
}

function resolveClinicianId(form) {
  const clinicianRaw = trim(form[ck.assignedClinician])
  if (!clinicianRaw) {
    return null
  }
  const clinicianId = Number(clinicianRaw)

  return Number.isFinite(clinicianId) ? clinicianId : null
}

function buildAddressFields(source) {
  if (!source) {
    return {
      address: '',
      address2: '',
      zip_code: '',
      city: '',
      state: '',
      country: '',
      county: '',
      notes: '',
    }
  }

  return {
    address: trim(source.addressLine1),
    address2: trim(source.addressLine2),
    zip_code: trim(source.zipCode),
    city: trim(source.city),
    state: trim(source.state),
    country: mapCountry(source.country),
    county: trim(source.county),
    notes: trim(source.additionalNotes),
  }
}

function buildBasicInfo(form) {
  const contact = form[clientFormSections.contact] ?? {}
  const address = buildAddressFields(contact)
  const dobIso = usDateToIso(form[ck.dob])

  return {
    prefix: trim(form[ck.prefix]),
    first_name: trim(form[ck.firstName]),
    middle_name: trim(form[ck.middleName]),
    last_name: trim(form[ck.lastName]),
    suffix: trim(form[ck.suffix]),
    sex: trim(form[ck.gender]),
    race: trim(form[ck.race]),
    ethnicity: trim(form[ck.ethnicity]),
    dob: dobIso || null,
    ssn: resolveSsn(form),
    admission_date: admissionDateToIso(form[ck.admissionDate]),
    clinician_id: resolveClinicianId(form),
    status: trim(form[ck.status]) || 'active',
    emails: mapEmailsAll(contact.emails),
    phones: mapPhonesAll(contact.phones),
    communication_preference: mapCommunicationPreference(
      contact.preferredCommunication,
    ),
    address: address.address,
    address2: address.address2,
    zip_code: address.zip_code,
    city: address.city,
    state: address.state,
    country: address.country,
    county: address.county,
    notes: address.notes,
  }
}

function resolveOtherContactAddress(other, clientContact) {
  if (other?.sameAsClientAddress && clientContact) {
    const shared = buildAddressFields(clientContact)

    return {
      address: shared.address,
      city: shared.city,
      state: shared.state,
      zip_code: shared.zip_code,
      county: shared.county,
      country: shared.country,
    }
  }

  return {
    address: trim(other?.addressLine1),
    city: trim(other?.city),
    state: trim(other?.state),
    zip_code: trim(other?.zipCode),
    county: trim(other?.county),
    country: mapCountry(other?.country),
  }
}

function buildRegisterContact(other, clientContact) {
  const address = resolveOtherContactAddress(other, clientContact)

  return {
    contact_type: mapContactType(other?.contactType),
    relationship_type: mapRelationshipType(other?.relationshipType),
    status: 'active',
    responsive_for_payment: Boolean(other?.responsibleForPayments),
    prefix: trim(other?.prefix),
    first_name: trim(other?.firstName),
    middle_name: trim(other?.middleName),
    last_name: trim(other?.lastName),
    suffix: trim(other?.suffix),
    emails: mapEmailsAll(other?.emails),
    phones: mapPhonesAll(other?.phones),
    address: address.address,
    city: address.city,
    state: address.state,
    zip_code: address.zip_code,
    county: address.county,
    country: address.country,
  }
}

function buildContacts(form) {
  const contact = form[clientFormSections.contact] ?? {}

  return (contact.otherContacts ?? []).map(other =>
    buildRegisterContact(other, contact),
  )
}

function buildAllergies(form) {
  const section = form[clientFormSections.allergies] ?? {}

  return (section.entries ?? []).map(entry => ({
    name: trim(entry?.allergy),
    severity: mapAllergySeverity(entry?.severity),
    start_date: allergyStartDateFromYear(entry?.startYear),
  }))
}

export function buildClientRegisterBody(form) {
  if (!form || typeof form !== 'object') {
    return {
      basic_info: buildBasicInfo({}),
      contacts: [],
      allergies: [],
    }
  }

  return {
    basic_info: buildBasicInfo(form),
    contacts: buildContacts(form),
    allergies: buildAllergies(form),
  }
}
