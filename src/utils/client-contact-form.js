import {
  clientContactFieldKeys as ck,
  clientCountryDefault,
} from 'components/constants.js'
import { resolveCatalogOptionLabel } from 'src/utils/catalogs.js'
import {
  syncPreferredPointOfContactFlags,
} from 'src/utils/client-preferred-communication.js'

const ADDRESS_LINE_RE = /^[a-zA-Z0-9.\-\s]*$/
const LETTERS_ONLY_RE = /^[a-zA-Z\s]*$/
const ZIP_CODE_RE = /^(?:\d{5}|\d{5}-\d{4}|\d{5}-\d{5}|[A-Z]\d[A-Z] \d[A-Z]\d)$/
const EMAIL_RE = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const PHONE_CHARS_RE = /^[\d+\-() ]*$/

const ADDRESS_FIELDS = [
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'county',
  'zipCode',
]

let contactIdCounter = 0

export function nextContactId() {
  contactIdCounter += 1

  return `contact-${contactIdCounter}`
}

export function createEmptyPhone() {
  return {
    number: '',
    type: '',
  }
}

export function createEmptyEmail() {
  return {
    address: '',
    type: '',
  }
}

export function createEmptyOtherContact() {
  return {
    id: nextContactId(),
    apiId: null,
    contactType: '',
    relationshipType: '',
    prefix: null,
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: null,
    responsibleForPayments: false,
    isPreferredPointOfContact: false,
    sameAsClientAddress: false,
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    county: '',
    zipCode: '',
    country: clientCountryDefault,
    phones: [createEmptyPhone()],
    emails: [createEmptyEmail()],
  }
}

export function createEmptyContactSection() {
  return {
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    county: '',
    zipCode: '',
    country: clientCountryDefault,
    phones: [createEmptyPhone()],
    emails: [createEmptyEmail()],
    preferredCommunication: [],
    consent: null,
    preferredPointOfContactId: null,
    additionalNotes: '',
    otherContacts: [],
    activeOtherContactId: null,
    otherContactExpanded: true,
  }
}

export function hasClientAddressData(contact) {
  if (!contact) {
    return false
  }

  return ADDRESS_FIELDS.some(
    key => String(contact[key] ?? '').trim().length > 0,
  )
}

export function shouldPersistCountry(contact) {
  return hasClientAddressData(contact)
}

export function setOtherContactResponsibleForPayments(
  contactSection,
  contactId,
  value,
) {
  for (const other of contactSection.otherContacts ?? []) {
    other.responsibleForPayments = Boolean(value && other.id === contactId)
  }
}

export function resolveOtherContactTabLabel(
  contact,
  index,
  t,
  catalogOptions = {},
) {
  const {
    contactTypeOptions = [],
    relationshipTypeOptions = [],
  } = catalogOptions
  const type = String(contact.contactType ?? '').trim()
  if (type) {
    return resolveCatalogOptionLabel(contactTypeOptions, type)
  }
  const relationship = String(contact.relationshipType ?? '').trim()
  if (relationship) {
    return resolveCatalogOptionLabel(relationshipTypeOptions, relationship)
  }

  return t('otherContactTabGeneric', { n: index + 1 })
}

export function isValidAddressLine(value, maxLen = 100) {
  const s = String(value ?? '').trim()
  if (!s) {
    return true
  }

  return ADDRESS_LINE_RE.test(s) && s.length <= maxLen
}

export function isValidLettersField(value, maxLen = 50) {
  const s = String(value ?? '').trim()
  if (!s) {
    return true
  }

  return LETTERS_ONLY_RE.test(s) && s.length <= maxLen
}

export function isValidZipCode(value) {
  const s = String(value ?? '').trim()
  if (!s) {
    return true
  }

  return ZIP_CODE_RE.test(s) && s.length <= 11
}

export function isValidEmailAddress(value) {
  const s = String(value ?? '').trim()
  if (!s) {
    return true
  }

  return EMAIL_RE.test(s) && s.length <= 32
}

export function isValidPhoneChars(value) {
  const s = String(value ?? '').trim()
  if (!s) {
    return true
  }

  return PHONE_CHARS_RE.test(s)
}

export function normalizePhoneDigits(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 10)
}

export function formatPhoneUs(value) {
  const digits = normalizePhoneDigits(value)
  if (!digits) {
    return ''
  }
  if (digits.length <= 3) {
    return `(${digits}`
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export function copyClientAddressToContact(clientAddress, target) {
  target.addressLine1 = clientAddress.addressLine1
  target.addressLine2 = clientAddress.addressLine2
  target.city = clientAddress.city
  target.state = clientAddress.state
  target.county = clientAddress.county
  target.zipCode = clientAddress.zipCode
  target.country = shouldPersistCountry(clientAddress)
    ? clientAddress.country
    : clientCountryDefault
}

export function clearContactAddress(target) {
  for (const key of ADDRESS_FIELDS) {
    target[key] = ''
  }
  target.country = clientCountryDefault
}

function hasOtherAddressData(other) {
  return ADDRESS_FIELDS.some(
    key => String(other[key] ?? '').trim().length > 0,
  )
}

export function otherContactHasData(other) {
  return Boolean(
    String(other.contactType ?? '').trim()
    || String(other.relationshipType ?? '').trim()
    || String(other.firstName ?? '').trim()
    || String(other.middleName ?? '').trim()
    || String(other.lastName ?? '').trim()
    || String(other.prefix ?? '').trim()
    || String(other.suffix ?? '').trim()
    || other.responsibleForPayments
    || hasOtherAddressData(other)
    || (other.phones ?? []).some(p => String(p.number ?? '').trim())
    || (other.emails ?? []).some(e => String(e.address ?? '').trim()),
  )
}

function mapPhonesForPayload(phones) {
  return (phones ?? [])
    .map(p => ({
      number: normalizePhoneDigits(p.number),
      type: String(p.type ?? '').trim(),
    }))
    .filter(p => p.number || p.type)
}

function mapEmailsForPayload(emails) {
  return (emails ?? [])
    .map(e => ({
      address: String(e.address ?? '').trim(),
      type: String(e.type ?? '').trim(),
    }))
    .filter(e => e.address || e.type)
}

function appendOtherContactIdentity(item, other) {
  if (other.contactType) {
    item.contactType = other.contactType
  }
  if (other.relationshipType) {
    item.relationshipType = other.relationshipType
  }
  item.responsibleForPayments = Boolean(other.responsibleForPayments)
  item.isPreferredPointOfContact = Boolean(other.isPreferredPointOfContact)
  if (other.prefix) {
    item.prefix = String(other.prefix).trim()
  }
  if (other.firstName) {
    item.firstName = other.firstName.trim()
  }
  if (other.middleName) {
    item.middleName = other.middleName.trim()
  }
  if (other.lastName) {
    item.lastName = other.lastName.trim()
  }
  if (other.suffix) {
    item.suffix = String(other.suffix).trim()
  }
}

function copyAddressFieldsToPayload(target, source, trimValues) {
  for (const key of ADDRESS_FIELDS) {
    const raw = source[key] ?? ''
    const val = trimValues ? String(raw).trim() : raw
    if (!trimValues || val) {
      target[key] = val
    }
  }
}

function appendOtherContactAddress(item, other, clientAddress) {
  if (other.sameAsClientAddress) {
    item.sameAsClientAddress = true
    item.address = {}
    copyAddressFieldsToPayload(item.address, clientAddress, false)
    if (shouldPersistCountry(clientAddress)) {
      item.address.country = clientAddress.country
    }

    return
  }
  if (!hasOtherAddressData(other)) {
    return
  }
  item.address = {}
  copyAddressFieldsToPayload(item.address, other, true)
  const country = String(other.country ?? '').trim()
  if (country) {
    item.address.country = country
  }
}

function buildOtherContactPayload(other, clientAddress) {
  if (!otherContactHasData(other)) {
    return null
  }

  const item = {
    isPreferredPointOfContact: Boolean(other.isPreferredPointOfContact),
  }
  appendOtherContactIdentity(item, other)
  appendOtherContactAddress(item, other, clientAddress)

  const phones = mapPhonesForPayload(other.phones)
  if (phones.length) {
    item.phones = phones
  }

  const emails = mapEmailsForPayload(other.emails)
  if (emails.length) {
    item.emails = emails
  }

  return item
}

export function buildContactPayload(contact) {
  if (!contact) {
    return null
  }

  syncPreferredPointOfContactFlags(contact)

  const payload = {}

  for (const key of ADDRESS_FIELDS) {
    const val = String(contact[key] ?? '').trim()
    if (val) {
      payload[key] = val
    }
  }

  if (shouldPersistCountry(contact)) {
    payload[ck.country] = String(
      contact[ck.country] ?? clientCountryDefault,
    ).trim()
  }

  const phones = mapPhonesForPayload(contact.phones)
  if (phones.length) {
    payload.phones = phones
  }

  const emails = mapEmailsForPayload(contact.emails)
  if (emails.length) {
    payload.emails = emails
  }

  const preferred = contact.preferredCommunication
  if (Array.isArray(preferred) && preferred.length) {
    payload.preferredCommunication = preferred
  }

  const consentDate = String(contact.consent ?? '').trim()
  if (consentDate) {
    payload.consent = consentDate
  }

  if (contact.preferredPointOfContactId) {
    payload.preferredPointOfContactId = contact.preferredPointOfContactId
  }

  const notes = String(contact.additionalNotes ?? '').trim()
  if (notes) {
    payload.additionalNotes = notes
  }

  const otherContacts = (contact.otherContacts ?? [])
    .map(oc => buildOtherContactPayload(oc, contact))
    .filter(Boolean)
  if (otherContacts.length) {
    payload.otherContacts = otherContacts
  }

  if (!Object.keys(payload).length) {
    return null
  }

  return payload
}
