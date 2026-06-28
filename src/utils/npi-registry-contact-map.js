import {
  clientEmailTypeValues,
  clientPhoneTypeValues,
} from 'components/constants.js'
import { resolveCatalogSelectValue } from 'src/utils/catalogs.js'
import { createEmptyStaffEmail, createEmptyStaffPhone } from
  'src/utils/staff-form.js'

const NPI_PHONE_KIND_TO_CATALOG_HINT = {
  telephone: clientPhoneTypeValues.work,
  fax: clientPhoneTypeValues.fax,
}

const NPI_EMAIL_KIND_TO_CATALOG_HINT = {
  work: clientEmailTypeValues.work,
  personal: clientEmailTypeValues.personal,
}

function phoneDigitsKey(number) {
  return String(number ?? '').replace(/\D/g, '')
}

export function mapNpiPhonesToStaffContact(phones, phoneTypeOptions) {
  const seen = new Set()
  const rows = []

  for (const entry of phones ?? []) {
    const number = String(entry?.number ?? '').trim()
    if (!number) {
      continue
    }
    const digits = phoneDigitsKey(number)
    if (!digits || seen.has(digits)) {
      continue
    }
    seen.add(digits)
    const hint = NPI_PHONE_KIND_TO_CATALOG_HINT[entry?.kind]
      ?? clientPhoneTypeValues.work
    const phoneType = resolveCatalogSelectValue(phoneTypeOptions, hint) ?? ''

    rows.push({
      phoneNumber: number,
      phoneType,
    })
  }

  return rows.length ? rows : [createEmptyStaffPhone()]
}

export function mapNpiEmailsToStaffContact(emails, emailTypeOptions) {
  const seen = new Set()
  const rows = []

  for (const entry of emails ?? []) {
    const address = String(entry?.address ?? '').trim()
    if (!address) {
      continue
    }
    const key = address.toLowerCase()
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    const hint = NPI_EMAIL_KIND_TO_CATALOG_HINT[entry?.kind]
      ?? clientEmailTypeValues.work
    const emailType = resolveCatalogSelectValue(emailTypeOptions, hint) ?? ''

    rows.push({
      email: address,
      emailType,
    })
  }

  return rows.length ? rows : [createEmptyStaffEmail()]
}

export function resolveNpiAddressState(stateCode, stateOptions) {
  const trimmed = String(stateCode ?? '').trim()
  if (!trimmed) {
    return ''
  }

  return resolveCatalogSelectValue(stateOptions, trimmed) ?? trimmed
}
