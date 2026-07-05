import {
  clientContactFieldKeys as ck,
  clientCountryDefault,
} from 'components/constants.js'
import { resolveCatalogOptionLabel } from 'src/utils/catalogs.js'
import {
  syncPreferredPointOfContactFlags,
  defaultPreferredCommunicationList,
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
    notes: '',
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
    preferredCommunication: defaultPreferredCommunicationList(),
    consent: null,
    preferredPointOfContactId: null,
    additionalNotes: '',
    otherContacts: [],
    activeContactSubTab: 'self',
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

export function contactMethodRowHasValue(row, kind) {
  if (kind === 'phone') {
    return Boolean(String(row?.number ?? '').trim())
  }

  return Boolean(String(row?.address ?? '').trim())
}

export function canAddContactMethodRow(rows, kind) {
  const list = rows ?? []
  if (!list.length) {
    return false
  }
  const last = list[list.length - 1]

  return contactMethodRowHasValue(last, kind)
}

export function otherContactMeetsMinimumRequirements(
  other,
  clientAddress = null,
) {
  const hasFirstName = Boolean(String(other?.firstName ?? '').trim())
  const hasLastName = Boolean(String(other?.lastName ?? '').trim())

  return hasFirstName
    && hasLastName
    && otherContactHasContactMethod(other, clientAddress)
}

export function canAddAnotherOtherContact(contactSection) {
  const others = contactSection?.otherContacts ?? []
  if (!others.length) {
    return true
  }

  return others.every(other =>
    otherContactMeetsMinimumRequirements(other, contactSection),
  )
}

export function resolveOtherContactTabGroupKey(contact) {
  const relationship = String(contact?.relationshipType ?? '').trim()
  if (relationship) {
    return { kind: 'relationship', value: relationship }
  }
  const contactType = String(contact?.contactType ?? '').trim()
  if (contactType) {
    return { kind: 'contactType', value: contactType }
  }

  return null
}

function contactsInSameTabGroup(list, contact) {
  const key = resolveOtherContactTabGroupKey(contact)
  if (!key) {
    return list.filter(row => !resolveOtherContactTabGroupKey(row))
  }

  return list.filter(row => {
    const rowKey = resolveOtherContactTabGroupKey(row)
    if (!rowKey) {
      return false
    }

    return rowKey.kind === key.kind && rowKey.value === key.value
  })
}

export function resolveOtherContactTabLabel(
  contact,
  index,
  t,
  catalogOptions = {},
  allContacts = null,
) {
  const {
    contactTypeOptions = [],
    relationshipTypeOptions = [],
  } = catalogOptions
  const list = allContacts ?? []
  const relationship = String(contact.relationshipType ?? '').trim()
  const contactType = String(contact.contactType ?? '').trim()
  let label = ''

  if (relationship) {
    label = resolveCatalogOptionLabel(relationshipTypeOptions, relationship)
  } else if (contactType) {
    label = resolveCatalogOptionLabel(contactTypeOptions, contactType)
  }

  if (label) {
    const sameGroup = contactsInSameTabGroup(list, contact)
    if (sameGroup.length > 1) {
      const groupIndex = sameGroup.findIndex(row => row.id === contact.id) + 1

      return `${label} ${groupIndex}`
    }

    return label
  }

  const withoutLabel = list.filter(row => !resolveOtherContactTabGroupKey(row))
  const genericIndex = withoutLabel.findIndex(row => row.id === contact.id) + 1

  return t('otherContactTabGeneric', {
    n: genericIndex > 0 ? genericIndex : index + 1,
  })
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

export function isCompletePhoneNumber(value) {
  const s = String(value ?? '').trim()
  if (!s) {
    return true
  }

  return normalizePhoneDigits(s).length === 10
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

export function otherContactHasContactMethod(other, clientAddress) {
  if (!other) {
    return false
  }
  if (other.sameAsClientAddress && hasClientAddressData(clientAddress)) {
    return true
  }
  if (hasOtherAddressData(other)) {
    return true
  }
  if ((other.phones ?? []).some(
    phone => contactMethodRowHasValue(phone, 'phone'),
  )) {
    return true
  }
  if ((other.emails ?? []).some(
    email => contactMethodRowHasValue(email, 'email'),
  )) {
    return true
  }

  return false
}

export function otherContactIdsMissingContactMethod(
  contactSection,
) {
  return (contactSection?.otherContacts ?? [])
    .filter(other => !otherContactHasContactMethod(
      other,
      contactSection,
    ))
    .map(other => other.id)
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
    || (other.emails ?? []).some(e => String(e.address ?? '').trim())
    || String(other.notes ?? '').trim(),
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
