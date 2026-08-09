import {
  consentSignerTypeValues,
  consentStatusValues,
} from 'components/constants.js'
import {
  listClientConsents,
  revokeClientConsent,
} from 'src/utils/consent-api.js'
import { isGuardianContactType } from
  'src/utils/client-minor-guardian-validation.js'

function trim(value) {
  return String(value ?? '').trim()
}

export function isGuardianOtherContact(other) {
  if (!other || other.deleted) {
    return false
  }

  return isGuardianContactType(other.contactType)
}

export function wouldLoseGuardianContactType(currentType, nextType) {
  return isGuardianContactType(currentType)
    && !isGuardianContactType(nextType)
}

export function filterAcceptedGuardianConsents(consents) {
  const list = Array.isArray(consents) ? consents : []

  return list.filter(item => {
    const status = trim(item?.status).toUpperCase()
    const signerType = trim(item?.signerType).toUpperCase()

    return status === consentStatusValues.accepted
      && signerType === consentSignerTypeValues.guardian
  })
}

export async function listAcceptedGuardianConsents(clientId) {
  const id = Number(clientId)
  if (!Number.isFinite(id) || id <= 0) {
    return []
  }
  const consents = await listClientConsents(id)

  return filterAcceptedGuardianConsents(consents)
}

export async function revokeAcceptedGuardianConsents(
  clientId,
  reason,
) {
  const id = Number(clientId)
  if (!Number.isFinite(id) || id <= 0) {
    return 0
  }
  const targets = await listAcceptedGuardianConsents(id)
  const revocationReason = trim(reason)
  for (const consent of targets) {
    if (consent?.id != null) {
      await revokeClientConsent(id, consent.id, revocationReason)
    }
  }

  return targets.length
}
