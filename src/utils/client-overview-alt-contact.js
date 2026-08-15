import {
  clientContactFieldKeys as cfk,
  clientFormSections,
} from 'components/constants.js'
import { formatPhoneUs } from 'src/utils/client-contact-form.js'
import { formatPersonDisplayName } from 'src/utils/person-display-name.js'

function trim(value) {
  return String(value ?? '').trim()
}

function displayOrDash(value) {
  const text = trim(value)

  return text || '—'
}

function field(key, label, value) {
  return {
    key,
    label,
    value: displayOrDash(value),
  }
}

function resolvePhoneEntries(entries) {
  return (entries ?? [])
    .map((item, index) => {
      const number = formatPhoneUs(trim(item?.number))
      if (!number) {
        return null
      }

      return {
        id: `phone-${index}`,
        value: number,
        type: trim(item?.type),
      }
    })
    .filter(Boolean)
}

function resolveEmailEntries(entries) {
  return (entries ?? [])
    .map((item, index) => {
      const address = trim(item?.address)
      if (!address) {
        return null
      }

      return {
        id: `email-${index}`,
        value: address,
        type: trim(item?.type),
      }
    })
    .filter(Boolean)
}

/**
 * Read-only Contact panel model for Client Overview (Alt).
 */
export function buildClientOverviewAltContact(form, t) {
  const contact = form?.[clientFormSections.contact] ?? {}
  const phoneEntries = resolvePhoneEntries(contact?.[cfk.phones])
  const emailEntries = resolveEmailEntries(contact?.[cfk.emails])
  const otherContacts = (contact?.[cfk.otherContacts] ?? [])
    .filter((item) => !item?.deleted)
    .map((item, index) => {
      const name = formatPersonDisplayName({
        prefix: item?.prefix,
        firstName: item?.firstName,
        middleName: item?.middleName,
        lastName: item?.lastName,
        suffix: item?.suffix,
      })

      return {
        key: `other-${item?.id || index}`,
        label: displayOrDash(item?.contactType || t('contact')),
        value: displayOrDash(
          [name, trim(item?.relationship)].filter(Boolean).join(' · '),
        ),
      }
    })

  return {
    fields: [
      field('addressLine1', t('addressLine1'), contact?.[cfk.addressLine1]),
      field('addressLine2', t('addressLine2'), contact?.[cfk.addressLine2]),
      field('city', t('city'), contact?.[cfk.city]),
      field('state', t('state'), contact?.[cfk.state]),
      field('county', t('county'), contact?.[cfk.county]),
      field('zipCode', t('zipCode'), contact?.[cfk.zipCode]),
      {
        key: 'phone',
        label: t('phone'),
        type: 'phones',
        entries: phoneEntries,
        value: displayOrDash(phoneEntries[0]?.value),
      },
      {
        key: 'email',
        label: t('email'),
        type: 'emails',
        entries: emailEntries,
        value: displayOrDash(emailEntries[0]?.value),
      },
      field(
        'preferredCommunication',
        t('preferredCommunication'),
        contact?.[cfk.preferredCommunication],
      ),
      field(
        'additionalNotes',
        t('additionalNotes'),
        contact?.[cfk.additionalNotes],
      ),
      ...otherContacts,
    ],
  }
}
