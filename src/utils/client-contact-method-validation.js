import { normalizePhoneDigits } from 'src/utils/client-contact-form.js'

export function contactPhoneKey(number) {
  const digits = normalizePhoneDigits(number)
  if (!digits) {
    return null
  }

  return digits
}

export function contactEmailKey(address) {
  const email = String(address ?? '').trim().toLowerCase()
  if (!email) {
    return null
  }

  return email
}

export function isDuplicatePhoneAt(phones, index) {
  const list = phones ?? []
  const key = contactPhoneKey(list[index]?.number)
  if (!key) {
    return false
  }

  return list.filter(
    phone => contactPhoneKey(phone?.number) === key,
  ).length > 1
}

export function isDuplicateEmailAt(emails, index) {
  const list = emails ?? []
  const key = contactEmailKey(list[index]?.address)
  if (!key) {
    return false
  }

  return list.filter(
    email => contactEmailKey(email?.address) === key,
  ).length > 1
}

function countDuplicatesInList(list, keyFn) {
  const seen = new Set()
  let duplicates = 0

  for (const item of list ?? []) {
    const key = keyFn(item)
    if (!key) {
      continue
    }
    if (seen.has(key)) {
      duplicates += 1
    } else {
      seen.add(key)
    }
  }

  return duplicates
}

export function countDuplicatePhones(phones) {
  return countDuplicatesInList(
    phones,
    phone => contactPhoneKey(phone?.number),
  )
}

export function countDuplicateEmails(emails) {
  return countDuplicatesInList(
    emails,
    email => contactEmailKey(email?.address),
  )
}

export function countDuplicateContactMethodErrors(contact) {
  if (!contact) {
    return 0
  }

  let count = countDuplicatePhones(contact.phones)
  count += countDuplicateEmails(contact.emails)

  for (const other of contact.otherContacts ?? []) {
    count += countDuplicatePhones(other.phones)
    count += countDuplicateEmails(other.emails)
  }

  return count
}

export function duplicatePhoneRule(phones, index, message) {
  return () => (isDuplicatePhoneAt(phones, index) ? message : true)
}

export function duplicateEmailRule(emails, index, message) {
  return () => (isDuplicateEmailAt(emails, index) ? message : true)
}
