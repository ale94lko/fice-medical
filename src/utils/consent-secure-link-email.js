import { clientPreferredCommunicationValues as pref }
  from 'components/constants.js'
import {
  isPointOfContactPreferred,
  normalizePreferredCommunicationList,
} from 'src/utils/client-preferred-communication.js'

function firstEmailAddress(emails) {
  for (const item of emails ?? []) {
    if (typeof item === 'string') {
      const value = item.trim()
      if (value) {
        return value
      }
    } else {
      const address = String(
        item?.address
        ?? item?.email
        ?? item?.value
        ?? '',
      ).trim()
      if (address) {
        return address
      }
    }
  }

  return ''
}

function activeOtherContacts(contactSection) {
  return (contactSection?.otherContacts ?? [])
    .filter(item => item && !item.deleted)
}

function resolvePreferredOtherContact(contactSection) {
  const others = activeOtherContacts(contactSection)
  if (!others.length) {
    return null
  }
  const preferredId = contactSection?.preferredPointOfContactId
  if (preferredId != null) {
    const match = others.find(item => item.id === preferredId)
    if (match) {
      return match
    }
  }

  return others.find(item => item.isPreferredPointOfContact) || null
}

function firstOtherContactEmail(contactSection) {
  const preferredOther = resolvePreferredOtherContact(contactSection)
  const preferredEmail = firstEmailAddress(preferredOther?.emails)
  if (preferredEmail) {
    return preferredEmail
  }
  for (const other of activeOtherContacts(contactSection)) {
    const address = firstEmailAddress(other?.emails)
    if (address) {
      return address
    }
  }

  return ''
}

/**
 * Resolves the email to prefill for consent secure-link send,
 * using the Contact section and preferred communication method.
 */
export function resolveConsentSecureLinkEmail(contactSection) {
  if (!contactSection || typeof contactSection !== 'object') {
    return ''
  }
  const preferred = normalizePreferredCommunicationList(
    contactSection.preferredCommunication,
  )
  const selfEmail = firstEmailAddress(contactSection.emails)
  const otherEmail = firstOtherContactEmail(contactSection)
  const emailPreferred = preferred.includes(pref.email)
  const pocPreferred = isPointOfContactPreferred(preferred)

  if (emailPreferred && selfEmail) {
    return selfEmail
  }
  if (pocPreferred && otherEmail) {
    return otherEmail
  }
  if (emailPreferred) {
    return selfEmail || otherEmail
  }
  if (pocPreferred) {
    return otherEmail || selfEmail
  }

  return selfEmail || otherEmail || ''
}
