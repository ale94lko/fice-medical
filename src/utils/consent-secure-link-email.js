import {
  clientContactTypeValues,
  consentSignerTypeValues,
} from 'components/constants.js'
import { isGuardianContactType } from
  'src/utils/client-minor-guardian-validation.js'

function trim(value) {
  return String(value ?? '').trim()
}

function typeToken(value) {
  return trim(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function looksLikeEmail(value) {
  const email = trim(value)
  const at = email.indexOf('@')

  return at > 0
    && at < email.length - 1
    && !email.includes(' ')
    && email.indexOf('@', at + 1) < 0
}

function normalizeKey(email) {
  return trim(email).toLowerCase()
}

function collectEmailAddresses(emails) {
  const unique = new Map()
  for (const item of emails ?? []) {
    const address = typeof item === 'string'
      ? trim(item)
      : trim(item?.address ?? item?.email ?? item?.value)
    if (!address || !looksLikeEmail(address)) {
      continue
    }
    const key = normalizeKey(address)
    if (!unique.has(key)) {
      unique.set(key, address)
    }
  }

  return unique
}

function uniqueEmailOrEmpty(emails) {
  const unique = collectEmailAddresses(emails)
  if (unique.size === 1) {
    return [...unique.values()][0]
  }

  return ''
}

function activeOtherContacts(contactSection) {
  return (contactSection?.otherContacts ?? [])
    .filter(item => item && !item.deleted)
}

function isAuthorizedRepresentativeContactType(contactType) {
  const token = typeToken(contactType)
  const legal = typeToken(clientContactTypeValues.legal)

  return token === 'legal'
    || token === 'legal_representative'
    || token === 'authorized_representative'
    || token === legal
}

function contactMatchesSigner(contact, signerType) {
  if (!contact) {
    return false
  }
  if (signerType === consentSignerTypeValues.guardian) {
    return isGuardianContactType(contact.contactType)
  }
  if (signerType
    === consentSignerTypeValues.authorizedRepresentative) {
    return isAuthorizedRepresentativeContactType(contact.contactType)
  }

  return false
}

function matchingOtherContacts(contactSection, signerType) {
  return activeOtherContacts(contactSection)
    .filter(item => contactMatchesSigner(item, signerType))
}

function isPreferredOtherContact(contactSection, contact) {
  if (!contact) {
    return false
  }
  const preferredId = contactSection?.preferredPointOfContactId
  if (preferredId != null && contact.id === preferredId) {
    return true
  }

  return Boolean(contact.isPreferredPointOfContact)
}

function relationshipEmails(contactSection, signerType) {
  const unique = new Map()
  for (const contact of matchingOtherContacts(
    contactSection,
    signerType,
  )) {
    for (const [key, email] of collectEmailAddresses(contact.emails)) {
      if (!unique.has(key)) {
        unique.set(key, email)
      }
    }
  }

  return unique
}

function preferredRelationshipEmail(contactSection, signerType) {
  const unique = new Map()
  for (const contact of matchingOtherContacts(
    contactSection,
    signerType,
  )) {
    if (!isPreferredOtherContact(contactSection, contact)) {
      continue
    }
    for (const [key, email] of collectEmailAddresses(contact.emails)) {
      if (!unique.has(key)) {
        unique.set(key, email)
      }
    }
  }
  if (unique.size === 1) {
    return [...unique.values()][0]
  }

  return ''
}

function resolveSignerType(options = {}) {
  const requested = trim(options.signerType)
  if (requested) {
    return requested
  }
  const allowed = options.allowedSignerTypes
  if (Array.isArray(allowed) && allowed.length === 1) {
    return allowed[0]
  }

  return consentSignerTypeValues.client
}

/**
 * Deterministic authorized email to prefill for Consent Secure Link.
 * Does not pick among several addresses by list or alphabetical order.
 */
export function resolveConsentSecureLinkEmail(
  contactSection,
  options = {},
) {
  if (!contactSection || typeof contactSection !== 'object') {
    return ''
  }
  const signerType = resolveSignerType(options)
  if (signerType === consentSignerTypeValues.client) {
    return uniqueEmailOrEmpty(contactSection.emails)
  }
  const relationship = relationshipEmails(contactSection, signerType)
  if (relationship.size === 1) {
    return [...relationship.values()][0]
  }
  if (relationship.size > 1) {
    return preferredRelationshipEmail(contactSection, signerType)
  }

  return ''
}

export function isAuthorizedConsentSecureLinkEmail(
  contactSection,
  email,
  options = {},
) {
  const requested = trim(email)
  if (!requested || !looksLikeEmail(requested)) {
    return false
  }
  const signerType = resolveSignerType(options)
  const authorized = signerType === consentSignerTypeValues.client
    ? collectEmailAddresses(contactSection?.emails)
    : relationshipEmails(contactSection, signerType)

  return authorized.has(normalizeKey(requested))
}
