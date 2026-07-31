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

function joinMethodValues(entries, valueKey) {
  return (entries ?? [])
    .map((item) => {
      const value = valueKey === 'number'
        ? formatPhoneUs(trim(item?.number))
        : trim(item?.address)
      if (!value) {
        return ''
      }
      const type = trim(item?.type)

      return type ? `${value} (${type})` : value
    })
    .filter(Boolean)
    .join(', ')
}

/**
 * Read-only Contact panel model for Client Overview (Alt).
 */
export function buildClientOverviewAltContact(form, t) {
  const contact = form?.[clientFormSections.contact] ?? {}
  const phones = joinMethodValues(contact?.[cfk.phones], 'number')
  const emails = joinMethodValues(contact?.[cfk.emails], 'address')
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
      field('phone', t('phone'), phones),
      field('email', t('email'), emails),
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
