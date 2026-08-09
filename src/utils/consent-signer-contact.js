import {
  clientContactTypeValues,
} from 'components/constants.js'
import { isGuardianContactType } from
  'src/utils/client-minor-guardian-validation.js'
import { formatPersonDisplayName } from 'src/utils/person-display-name.js'

function trim(value) {
  return String(value ?? '').trim()
}

function activeOtherContacts(contactSection) {
  return (contactSection?.otherContacts ?? [])
    .filter(item => item && !item.deleted)
}

export function findGuardianOtherContact(contactSection) {
  return activeOtherContacts(contactSection)
    .find(item => isGuardianContactType(item.contactType))
    ?? null
}

/**
 * Resolves signer name + relationship from a Guardian other-contact.
 * Returns null when the client has no usable Guardian contact.
 */
export function resolveGuardianSignerFromContact(
  contactSection,
  catalogOptions = {},
) {
  const guardian = findGuardianOtherContact(contactSection)
  if (!guardian) {
    return null
  }
  const signerName = formatPersonDisplayName(guardian, catalogOptions)
  if (!signerName) {
    return null
  }
  const relationshipToClient = trim(guardian.relationshipType)
    || clientContactTypeValues.guardian

  return {
    signerName,
    relationshipToClient,
    contact: guardian,
  }
}
