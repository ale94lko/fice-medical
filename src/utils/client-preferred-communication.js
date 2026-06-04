/* eslint-disable camelcase -- API payload keys use snake_case */
import { clientPreferredCommunicationValues as pref }
  from 'components/constants.js'
import { todayDateUs } from 'src/utils/client-form.js'
import { resolveOtherContactTabLabel } from 'src/utils/client-contact-form.js'

const COMM_PREF_FROM_API = {
  email: pref.email,
  mobile: pref.mobilePhone,
  mobile_phone: pref.mobilePhone,
  home: pref.homePhone,
  home_phone: pref.homePhone,
  work: pref.workPhone,
  work_phone: pref.workPhone,
  mail: pref.mail,
  declined: pref.patientDeclined,
  patient_declined: pref.patientDeclined,
  not_asked: pref.providerDidNotAsk,
  provider_did_not_ask: pref.providerDidNotAsk,
  point_of_contact: pref.pointOfContact,
}

const COMM_PREF_TO_API = {
  [pref.email]: 'email',
  [pref.mobilePhone]: 'mobile',
  [pref.homePhone]: 'home',
  [pref.workPhone]: 'work',
  [pref.mail]: 'mail',
  [pref.patientDeclined]: 'declined',
  [pref.providerDidNotAsk]: 'not_asked',
  [pref.pointOfContact]: 'point_of_contact',
}

const UI_VALUE_SET = new Set(Object.values(pref))

function toSnakeToken(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function mapSingleCommunicationFromApi(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) {
    return ''
  }
  if (UI_VALUE_SET.has(trimmed)) {
    return trimmed
  }
  const token = toSnakeToken(trimmed)

  return COMM_PREF_FROM_API[token] ?? ''
}

/**
 * Normalizes form state: array of UI labels, legacy string, or JSON from API.
 */
export function normalizePreferredCommunicationList(raw) {
  if (raw == null || raw === '') {
    return []
  }
  if (Array.isArray(raw)) {
    const list = []
    for (const item of raw) {
      const mapped = mapSingleCommunicationFromApi(item)
      if (mapped && !list.includes(mapped)) {
        list.push(mapped)
      }
    }

    return list
  }
  const str = String(raw).trim()
  if (!str) {
    return []
  }
  if (str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str)

      return normalizePreferredCommunicationList(parsed)
    } catch {
      const mapped = mapSingleCommunicationFromApi(str)

      return mapped ? [mapped] : []
    }
  }

  const mapped = mapSingleCommunicationFromApi(str)

  return mapped ? [mapped] : []
}

/** JSON string of API tokens for communication_preference. */
export function serializeCommunicationPreferenceForApi(list) {
  const normalized = normalizePreferredCommunicationList(list)
  if (!normalized.length) {
    return null
  }
  const tokens = normalized
    .map(item => COMM_PREF_TO_API[item] ?? toSnakeToken(item))
    .filter(Boolean)

  return tokens.length ? JSON.stringify(tokens) : null
}

export function isPreferredCommunicationSelected(list, value) {
  return normalizePreferredCommunicationList(list).includes(value)
}

export function isExcludedFromCommunicationAuthorization(value) {
  const selected = String(value ?? '').trim()
  if (!selected) {
    return true
  }

  return (
    selected === pref.providerDidNotAsk
    || selected === pref.patientDeclined
  )
}

export function isPointOfContactPreferred(list) {
  return isPreferredCommunicationSelected(list, pref.pointOfContact)
}

export function shouldShowCommunicationAuthorization(list) {
  const normalized = normalizePreferredCommunicationList(list)
  if (!normalized.length) {
    return false
  }

  return normalized.some(
    item => !isExcludedFromCommunicationAuthorization(item),
  )
}

export function resolvePreferredPointOfContactId(otherContacts, currentId) {
  const list = otherContacts ?? []
  if (!list.length) {
    return null
  }
  if (currentId && list.some(item => item.id === currentId)) {
    return currentId
  }

  return list[0].id
}

export function hasConsent(contact) {
  return Boolean(String(contact?.consent ?? '').trim())
}

export function setCommunicationAuthorization(contact, checked) {
  contact.consent = checked ? todayDateUs() : null
}

export function resolvePointOfContactSelectLabel(
  other,
  index,
  t,
  catalogOptions = {},
) {
  const parts = [
    other.firstName,
    other.middleName,
    other.lastName,
  ]
    .map(part => String(part ?? '').trim())
    .filter(Boolean)
  if (parts.length) {
    return parts.join(' ')
  }

  return resolveOtherContactTabLabel(other, index, t, catalogOptions)
}

export function clearPreferredPointOfContactIfRemoved(
  contactSection,
  removedId,
) {
  if (contactSection.preferredPointOfContactId !== removedId) {
    return
  }
  contactSection.preferredPointOfContactId = resolvePreferredPointOfContactId(
    contactSection.otherContacts,
    null,
  )
}

export function syncPreferredPointOfContactFlags(contactSection) {
  const preferredId = contactSection.preferredPointOfContactId
  const pocEnabled = isPointOfContactPreferred(
    contactSection.preferredCommunication,
  )
  for (const other of contactSection.otherContacts ?? []) {
    other.isPreferredPointOfContact = Boolean(
      pocEnabled && preferredId && other.id === preferredId,
    )
  }
}

export function applyPreferredPointOfContactFromApi(contactSection) {
  const preferred = (contactSection.otherContacts ?? []).find(
    item => item.isPreferredPointOfContact,
  )
  if (!preferred) {
    return
  }
  contactSection.preferredPointOfContactId = preferred.id
  const list = normalizePreferredCommunicationList(
    contactSection.preferredCommunication,
  )
  if (!list.includes(pref.pointOfContact)) {
    contactSection.preferredCommunication = [...list, pref.pointOfContact]
  }
}

export function syncPointOfContactSelection(contactSection) {
  if (!isPointOfContactPreferred(contactSection.preferredCommunication)) {
    contactSection.preferredPointOfContactId = null
    syncPreferredPointOfContactFlags(contactSection)

    return
  }

  contactSection.preferredPointOfContactId = resolvePreferredPointOfContactId(
    contactSection.otherContacts,
    contactSection.preferredPointOfContactId,
  )
  syncPreferredPointOfContactFlags(contactSection)
}

function syncPreferredCommunicationSideEffects(contactSection) {
  const list = normalizePreferredCommunicationList(
    contactSection.preferredCommunication,
  )
  contactSection.preferredCommunication = list

  if (!shouldShowCommunicationAuthorization(list)) {
    setCommunicationAuthorization(contactSection, false)
    contactSection.preferredPointOfContactId = null
    syncPreferredPointOfContactFlags(contactSection)

    return
  }

  if (!isPointOfContactPreferred(list)) {
    contactSection.preferredPointOfContactId = null
    syncPreferredPointOfContactFlags(contactSection)

    return
  }

  syncPointOfContactSelection(contactSection)
}

export function togglePreferredCommunication(contactSection, value) {
  const list = [
    ...normalizePreferredCommunicationList(
      contactSection.preferredCommunication,
    ),
  ]
  const idx = list.indexOf(value)
  if (idx >= 0) {
    list.splice(idx, 1)
  } else {
    list.push(value)
  }
  contactSection.preferredCommunication = list
  syncPreferredCommunicationSideEffects(contactSection)
}

/** @deprecated Use togglePreferredCommunication for multiselect. */
export function onPreferredCommunicationChange(contactSection, value) {
  togglePreferredCommunication(contactSection, value)
}

export function resolvePreferredPointOfContactApiRef(contactSection) {
  const localId = contactSection.preferredPointOfContactId
  if (
    !localId
    || !isPointOfContactPreferred(contactSection.preferredCommunication)
  ) {
    return {}
  }

  const others = contactSection.otherContacts ?? []
  const index = others.findIndex(item => item.id === localId)
  if (index < 0) {
    return {}
  }

  const other = others[index]
  if (other?.apiId != null && String(other.apiId).trim()) {
    return {
      preferred_point_of_contact_id: String(other.apiId).trim(),
    }
  }

  return {
    preferred_point_of_contact_index: index,
  }
}
