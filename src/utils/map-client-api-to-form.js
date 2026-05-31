import {
  clientAllergySeverityValues,
  clientContactTypeValues,
  clientCountryDefault,
  clientEmailTypeValues,
  clientFieldKeys as ck,
  clientFormSections,
  clientPhoneTypeValues,
  clientPreferredCommunicationValues,
  clientRelationshipTypeValues,
  clientGenderValues,
} from 'components/constants.js'
import {
  createEmptyAllergiesSection,
  nextAllergyId,
} from 'src/utils/client-allergies.js'
import {
  createEmptyContactSection,
  createEmptyEmail,
  createEmptyOtherContact,
  createEmptyPhone,
  formatPhoneUs,
  nextContactId,
  normalizePhoneDigits,
} from 'src/utils/client-contact-form.js'
import {
  createEmptyFamilyMedicalHistorySection,
  nextFamilyMedicalHistoryId,
} from 'src/utils/client-family-medical-history.js'
import { createEmptyVitalsSection } from 'src/utils/client-vitals.js'
import {
  ageAndUnitFromUsDateString,
  isoDateToUsDateString,
  parseUsDateString,
} from 'src/utils/client-form.js'

/* eslint-disable camelcase -- API token keys */
const PHONE_TYPE_FROM_API = {
  home: clientPhoneTypeValues.home,
  work: clientPhoneTypeValues.work,
  mobile: clientPhoneTypeValues.mobile,
  cell: clientPhoneTypeValues.mobile,
  fax: clientPhoneTypeValues.fax,
  pager: clientPhoneTypeValues.pager,
  emergency: clientPhoneTypeValues.emergency,
}

const EMAIL_TYPE_FROM_API = {
  personal: clientEmailTypeValues.personal,
  work: clientEmailTypeValues.work,
  other: clientEmailTypeValues.other,
  billing: clientEmailTypeValues.billing,
}

const COMM_PREF_FROM_API = {
  email: clientPreferredCommunicationValues.email,
  mobile: clientPreferredCommunicationValues.mobilePhone,
  home: clientPreferredCommunicationValues.homePhone,
  work: clientPreferredCommunicationValues.workPhone,
  mail: clientPreferredCommunicationValues.mail,
  declined: clientPreferredCommunicationValues.patientDeclined,
  not_asked: clientPreferredCommunicationValues.providerDidNotAsk,
}

const CONTACT_TYPE_FROM_API = {
  primary: clientContactTypeValues.primary,
  emergency: clientContactTypeValues.emergency,
  billing: clientContactTypeValues.billing,
  legal: clientContactTypeValues.legal,
  caregiver: clientContactTypeValues.caregiver,
  next_of_kin: clientContactTypeValues.nextOfKin,
  other: clientContactTypeValues.other,
}

const RELATIONSHIP_FROM_API = {
  parents: clientRelationshipTypeValues.parents,
  other_family: clientRelationshipTypeValues.otherFamily,
  others: clientRelationshipTypeValues.others,
}

const GENDER_FROM_API = {
  male: clientGenderValues.male,
  female: clientGenderValues.female,
  unknown: clientGenderValues.unknown,
}

function personalInfo(client) {
  return client?.personal_information ?? client?.basic_info ?? client ?? {}
}

function contactPersonalInfo(item) {
  return item?.personal_information ?? item ?? {}
}

function toSnakeToken(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function optionalSelectValue(value) {
  const trimmed = String(value ?? '').trim()

  return trimmed || null
}

function pickPrimaryAddress(source) {
  if (!source || typeof source !== 'object') {
    return {}
  }
  const list = source.addresses
  if (Array.isArray(list) && list.length) {
    const active = list.find(
      entry => entry?.status === 1 || entry?.status === 'active',
    )

    return active ?? list[0] ?? {}
  }

  return {
    address: source.address ?? source.address_line1 ?? '',
    address2: source.address2 ?? source.address_line2 ?? '',
    city: source.city ?? '',
    state: source.state ?? '',
    county: source.county ?? '',
    zip_code: source.zip_code ?? source.zipCode ?? '',
    country: source.country ?? '',
  }
}

function mapPhoneTypeFromApi(value) {
  const token = toSnakeToken(value)
  if (!token) {
    return ''
  }

  return PHONE_TYPE_FROM_API[token] ?? ''
}

function mapEmailTypeFromApi(value) {
  const token = toSnakeToken(value)

  return EMAIL_TYPE_FROM_API[token] ?? ''
}

function mapCommunicationFromApi(value) {
  const token = toSnakeToken(value)
  if (!token) {
    return ''
  }

  return COMM_PREF_FROM_API[token] ?? ''
}

function mapContactTypeFromApi(value) {
  const token = toSnakeToken(value)
  if (!token) {
    return ''
  }

  return CONTACT_TYPE_FROM_API[token] ?? ''
}

function mapRelationshipFromApi(value) {
  const token = toSnakeToken(value)
  if (!token) {
    return ''
  }

  return RELATIONSHIP_FROM_API[token] ?? ''
}

function mapGenderFromApi(value) {
  const token = toSnakeToken(value)
  if (!token) {
    return ''
  }

  return GENDER_FROM_API[token] ?? ''
}

function mapSeverityFromApi(value) {
  const token = toSnakeToken(value)
  if (!token) {
    return ''
  }
  const match = Object.values(clientAllergySeverityValues).find(
    label => toSnakeToken(label) === token,
  )

  return match ?? ''
}

function mapPhonesFromApi(phones) {
  const list = Array.isArray(phones) ? phones : []
  const mapped = list
    .map(item => {
      const number = formatPhoneUs(
        normalizePhoneDigits(
          item?.phone_number ?? item?.number ?? item?.phone,
        ),
      )
      const type = mapPhoneTypeFromApi(
        item?.phone_type ?? item?.type,
      )
      if (!number && !type) {
        return null
      }

      return { number, type }
    })
    .filter(Boolean)

  return mapped.length ? mapped : [createEmptyPhone()]
}

function mapEmailsFromApi(emails) {
  const list = Array.isArray(emails) ? emails : []
  const mapped = list
    .map(item => {
      const address = String(
        item?.email ?? item?.address ?? '',
      ).trim()
      const type = mapEmailTypeFromApi(
        item?.email_type ?? item?.type,
      )
      if (!address && !type) {
        return null
      }

      return { address, type }
    })
    .filter(Boolean)

  return mapped.length ? mapped : [createEmptyEmail()]
}

function mapCountryToForm(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return clientCountryDefault
  }
  const lower = raw.toLowerCase()
  if (lower === 'us' || lower === 'usa') {
    return clientCountryDefault
  }

  return raw
}

function mapAddressFieldsToContact(contact, addr) {
  contact.addressLine1 = String(addr?.address ?? addr?.address_line1 ?? '')
    .trim()
  contact.addressLine2 = String(
    addr?.address2 ?? addr?.address_line2 ?? '',
  ).trim()
  contact.city = String(addr?.city ?? '').trim()
  contact.state = String(addr?.state ?? '').trim()
  contact.county = String(addr?.county ?? '').trim()
  contact.zipCode = String(addr?.zip_code ?? addr?.zipCode ?? '').trim()
  contact.country = mapCountryToForm(addr?.country)
}

function findPrimaryApiContact(contacts) {
  const list = Array.isArray(contacts) ? contacts : []
  const primary = list.find(
    item => toSnakeToken(item?.contact_type) === 'primary',
  )

  return primary ?? list[0] ?? null
}

function resolvePreferredCommunication(client, personal) {
  const primaryContact = findPrimaryApiContact(client?.contacts)
  const raw = primaryContact?.communication_preference
    ?? personal?.communication_preference
    ?? personal?.preferred_communication
    ?? client?.communication_preference

  return mapCommunicationFromApi(raw)
}

function isClientPrimaryContact(item) {
  const type = toSnakeToken(item?.contact_type)
  const rel = toSnakeToken(item?.relationship_type)

  return type === 'primary' || rel === 'self'
}

function mapClientContactFromApi(client, personal) {
  const addr = pickPrimaryAddress(personal)
  const contact = createEmptyContactSection()

  mapAddressFieldsToContact(contact, addr)
  contact.phones = mapPhonesFromApi(personal.phones)
  contact.emails = mapEmailsFromApi(personal.emails)
  contact.preferredCommunication = resolvePreferredCommunication(
    client,
    personal,
  )
  contact.additionalNotes = String(
    client?.notes
    ?? client?.additional_notes
    ?? personal?.notes
    ?? '',
  ).trim()

  return contact
}

function addressesMatch(clientAddr, otherAddr) {
  const keys = [
    'addressLine1',
    'addressLine2',
    'city',
    'state',
    'county',
    'zipCode',
  ]

  return keys.every(
    key => String(clientAddr[key] ?? '').trim()
      === String(otherAddr[key] ?? '').trim(),
  )
}

function mapOtherContactFromApi(item, clientContact) {
  const pi = contactPersonalInfo(item)
  const other = createEmptyOtherContact()
  other.id = nextContactId()
  other.contactType = mapContactTypeFromApi(
    item?.contact_type ?? item?.contactType,
  )
  other.relationshipType = mapRelationshipFromApi(
    item?.relationship_type ?? item?.relationshipType,
  )
  other.responsibleForPayments = Boolean(
    item?.responsive_for_payment
    ?? item?.responsible_for_payments
    ?? item?.responsibleForPayments,
  )
  other.firstName = String(pi.first_name ?? item?.first_name ?? '').trim()
  other.middleName = String(
    pi.middle_name ?? item?.middle_name ?? '',
  ).trim()
  other.lastName = String(pi.last_name ?? item?.last_name ?? '').trim()
  other.suffix = String(pi.suffix ?? item?.suffix ?? '').trim()
  other.phones = mapPhonesFromApi(pi.phones ?? item?.phones)
  other.emails = mapEmailsFromApi(pi.emails ?? item?.emails)

  const addr = pickPrimaryAddress(pi)
  mapAddressFieldsToContact(other, addr)

  if (addressesMatch(clientContact, other)) {
    other.sameAsClientAddress = true
  }

  return other
}

function mapAllergiesFromApi(client) {
  const section = createEmptyAllergiesSection()
  const list = Array.isArray(client?.allergies) ? client.allergies : []
  section.entries = list.map(item => {
    const startRaw = item?.start_date ?? item?.startDate ?? ''
    let startYear = ''
    if (startRaw) {
      const year = String(startRaw).slice(0, 4)
      if (/^\d{4}$/.test(year)) {
        startYear = year
      }
    }

    return {
      id: nextAllergyId(),
      allergy: String(item?.name ?? item?.allergy ?? '').trim(),
      severity: mapSeverityFromApi(item?.severity),
      startYear,
    }
  })

  if (!section.entries.length && client?.no_allergies) {
    section.entries = []
  }

  return section
}

function mapFamilyMedicalHistoryFromApi(entries) {
  const section = createEmptyFamilyMedicalHistorySection()
  const list = Array.isArray(entries) ? entries : []
  section.entries = list.map(item => ({
    id: nextFamilyMedicalHistoryId(),
    familyRelationship: String(
      item?.family_relationship
      ?? item?.relationship
      ?? item?.familyRelationship
      ?? '',
    ).trim(),
    medicalConditions: String(
      item?.medical_conditions ?? item?.medicalConditions ?? '',
    ).trim(),
  }))

  return section
}

function resolveAgeFields(personal, dobUs, resolveAgeUnitCode) {
  const ageRaw = personal?.age
  const unitRaw = personal?.age_unit ?? personal?.ageUnit
  if (dobUs && parseUsDateString(dobUs)) {
    const derived = ageAndUnitFromUsDateString(dobUs)
    if (derived) {
      const unit = resolveAgeUnitCode?.(derived.unit) ?? derived.unit

      return {
        age: String(derived.age),
        ageUnit: unit,
      }
    }
  }
  if (ageRaw != null && ageRaw !== '') {
    const unit = resolveAgeUnitCode?.(unitRaw)
      ?? unitRaw
      ?? ''

    return {
      age: String(ageRaw),
      ageUnit: unit,
    }
  }

  return { age: '', ageUnit: resolveAgeUnitCode?.('years') ?? 'years' }
}

function resolveClinicianValue(client, personal) {
  const id = personal?.clinician_id
    ?? client?.clinician_id
    ?? personal?.assigned_clinician_id
  if (id != null && id !== '') {
    return String(id)
  }
  const clinicians = client?.clinicians ?? client?.clinician_assignments
  if (Array.isArray(clinicians) && clinicians[0]?.id != null) {
    return String(clinicians[0].id)
  }

  return ''
}

/**
 * Maps a client list/detail API payload into the add/edit client form shape.
 */
export function mapClientApiToForm(client, options = {}) {
  const { resolveAgeUnitCode, defaultAgeUnitValue } = options
  if (!client || typeof client !== 'object') {
    return null
  }

  const personal = personalInfo(client)
  const dobResolved = isoDateToUsDateString(personal.dob ?? client.dob)
  const ageFields = resolveAgeFields(
    personal,
    dobResolved,
    resolveAgeUnitCode,
  )
  if (!ageFields.ageUnit && defaultAgeUnitValue) {
    ageFields.ageUnit = defaultAgeUnitValue()
  }

  const contact = mapClientContactFromApi(client, personal)
  const otherRaw = client.contacts ?? client.other_contacts ?? []
  contact.otherContacts = (Array.isArray(otherRaw) ? otherRaw : [])
    .filter(item => !isClientPrimaryContact(item))
    .map(item => mapOtherContactFromApi(item, contact))
  if (contact.otherContacts.length) {
    contact.activeOtherContactId = contact.otherContacts[0].id
  }

  const ssnRaw = personal.ssn ?? client.ssn ?? client.social_security_number
  let ssnDigits = ''
  if (ssnRaw != null && ssnRaw !== '') {
    ssnDigits = String(ssnRaw).replace(/\D/g, '').slice(0, 9)
  }

  return {
    [ck.id]: client.id ?? client.client_id ?? null,
    [ck.clientNumber]: String(
      client.client_number ?? client[ck.clientNumber] ?? '',
    ).trim(),
    [ck.prefix]: optionalSelectValue(personal.prefix),
    [ck.firstName]: String(personal.first_name ?? '').trim(),
    [ck.middleName]: String(personal.middle_name ?? '').trim(),
    [ck.lastName]: String(personal.last_name ?? '').trim(),
    [ck.suffix]: optionalSelectValue(personal.suffix),
    [ck.gender]: mapGenderFromApi(
      personal.gender ?? personal.sex ?? client.gender ?? client.sex,
    ),
    [ck.race]: optionalSelectValue(personal.race),
    [ck.ethnicity]: optionalSelectValue(personal.ethnicity),
    [ck.dob]: dobResolved,
    [ck.age]: ageFields.age,
    [ck.ageUnit]: ageFields.ageUnit,
    [ck.socialSecurityNumber]: ssnDigits,
    [ck.admissionDate]: isoDateToUsDateString(
      client.admission_date ?? personal.admission_date,
    ),
    [ck.assignedClinician]: resolveClinicianValue(client, personal),
    [ck.status]: String(client.status ?? personal.status ?? 'active').trim(),
    [clientFormSections.contact]: contact,
    [clientFormSections.familyMedicalHistory]: mapFamilyMedicalHistoryFromApi(
      client.family_medical_history
      ?? client.familyMedicalHistory,
    ),
    [clientFormSections.allergies]: mapAllergiesFromApi(client),
    [clientFormSections.vitals]: createEmptyVitalsSection(),
  }
}
