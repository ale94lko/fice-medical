/* eslint-disable camelcase -- API request body uses snake_case */
import {
  clientFieldKeys,
  clientFormSections,
} from 'components/constants.js'
import {
  normalizePhoneDigits,
  otherContactHasData,
} from 'src/utils/client-contact-form.js'
import {
  resolvePreferredPointOfContactApiRef,
  serializeCommunicationPreferenceForApi,
  syncPreferredPointOfContactFlags,
} from 'src/utils/client-preferred-communication.js'
import { usDateToIso } from 'src/utils/client-form.js'

const ck = clientFieldKeys

function trim(value) {
  return String(value ?? '').trim()
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

function formatPhoneForApi(value) {
  return normalizePhoneDigits(value)
}

function mapPhonesAll(phones) {
  return (phones ?? [])
    .map(p => ({
      phone_number: formatPhoneForApi(p?.number),
      phone_type: trim(p?.type),
    }))
    .filter(p => p.phone_number || p.phone_type)
}

function mapEmailsAll(emails) {
  return (emails ?? [])
    .map(e => ({
      email: trim(e?.address),
      email_type: trim(e?.type),
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
    communication_preference: serializeCommunicationPreferenceForApi(
      contact.preferredCommunication,
    ),
    consent: contact.consent
      ? usDateToIso(contact.consent) || null
      : null,
    ...resolvePreferredPointOfContactApiRef(contact),
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
    return buildAddressFields(clientContact)
  }

  return buildAddressFields(other)
}

function buildRegisterContact(other, clientContact) {
  const address = resolveOtherContactAddress(other, clientContact)

  const payload = {
    contact_type: trim(other?.contactType),
    relationship_type: trim(other?.relationshipType),
    responsive_for_payment: Boolean(other?.responsibleForPayments),
    first_name: trim(other?.firstName),
    middle_name: trim(other?.middleName),
    last_name: trim(other?.lastName),
    prefix: trim(other?.prefix),
    suffix: trim(other?.suffix),
    emails: mapEmailsAll(other?.emails),
    phones: mapPhonesAll(other?.phones),
    address: address.address,
    address2: address.address2,
    zip_code: address.zip_code,
    city: address.city,
    state: address.state,
    country: address.country,
    county: address.county,
    notes: '',
    is_preferred_point_of_contact: Boolean(
      other?.isPreferredPointOfContact,
    ),
  }

  if (other?.sameAsClientAddress) {
    payload.same_as_client_address = true
  }

  const apiId = other?.apiId
  if (apiId != null && String(apiId).trim()) {
    const numericId = Number(apiId)
    payload.id = Number.isFinite(numericId) ? numericId : apiId
  }

  return payload
}

function buildContacts(form) {
  const contact = form[clientFormSections.contact] ?? {}
  syncPreferredPointOfContactFlags(contact)

  return (contact.otherContacts ?? [])
    .filter(other => otherContactHasData(other))
    .map(other => buildRegisterContact(other, contact))
}

function buildAllergies(form) {
  const section = form[clientFormSections.allergies] ?? {}

  return (section.entries ?? []).map(entry => ({
    name: trim(entry?.allergy),
    severity: trim(entry?.severity),
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
