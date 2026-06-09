import { clientFieldKeys, clientFormSections } from 'components/constants.js'
import { normalizePhoneDigits } from 'src/utils/client-contact-form.js'

const ck = clientFieldKeys

function trim(value) {
  return String(value ?? '').trim()
}

export function summarizeNewClientDataForAudit(form) {
  if (!form || typeof form !== 'object') {
    return {}
  }
  const contact = form[clientFormSections.contact] ?? {}
  const phones = (contact.phones ?? [])
    .map(p => normalizePhoneDigits(p?.number))
    .filter(Boolean)
  const emails = (contact.emails ?? [])
    .map(e => trim(e?.address))
    .filter(Boolean)

  return {
    firstName: trim(form[ck.firstName]),
    lastName: trim(form[ck.lastName]),
    dateOfBirth: trim(form[ck.dob]),
    phoneCount: phones.length,
    emailCount: emails.length,
  }
}
