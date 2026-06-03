/* eslint-disable camelcase -- API payload keys use snake_case */
import { clientPreferredCommunicationValues as pref }
  from 'components/constants.js'
import { todayDateUs } from 'src/utils/client-form.js'
import { resolveOtherContactTabLabel } from 'src/utils/client-contact-form.js'

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

export function isPointOfContactPreferred(value) {
  return String(value ?? '').trim() === pref.pointOfContact
}

export function shouldShowCommunicationAuthorization(value) {
  return !isExcludedFromCommunicationAuthorization(value)
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

export function setCommunicationAuthorization(contact, checked) {
  contact.communicationAuthorization = Boolean(checked)
  contact.communicationAuthorizationDate = checked ? todayDateUs() : ''
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

export function syncPointOfContactSelection(contactSection) {
  if (!isPointOfContactPreferred(contactSection.preferredCommunication)) {
    contactSection.preferredPointOfContactId = null

    return
  }

  contactSection.preferredPointOfContactId = resolvePreferredPointOfContactId(
    contactSection.otherContacts,
    contactSection.preferredPointOfContactId,
  )
}

export function onPreferredCommunicationChange(contactSection, value) {
  const previous = contactSection.preferredCommunication
  contactSection.preferredCommunication =
    previous === value ? '' : value

  const selected = contactSection.preferredCommunication
  if (isExcludedFromCommunicationAuthorization(selected)) {
    setCommunicationAuthorization(contactSection, false)
    contactSection.preferredPointOfContactId = null

    return
  }

  if (!isPointOfContactPreferred(selected)) {
    contactSection.preferredPointOfContactId = null

    return
  }

  syncPointOfContactSelection(contactSection)
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
