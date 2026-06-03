import { clientFieldKeys } from 'components/constants.js'
import {
  countDuplicateContactMethodErrors,
} from 'src/utils/client-contact-method-validation.js'

export function countFieldRuleErrors(value, rules) {
  if (!rules?.length) {
    return 0
  }
  for (const rule of rules) {
    const result = rule(value)
    if (result !== true) {
      return 1
    }
  }

  return 0
}

export function countBasicTabFieldErrors(form, rules) {
  if (!form || !rules) {
    return 0
  }
  const ck = clientFieldKeys
  const fields = [
    { value: form[ck.firstName], rules: rules.firstName },
    { value: form[ck.middleName], rules: rules.middleName },
    { value: form[ck.lastName], rules: rules.lastName },
    { value: form[ck.dob], rules: rules.dob },
    { value: form[ck.admissionDate], rules: rules.admissionDate },
    { value: form[ck.age], rules: rules.age },
    { value: form[ck.ageUnit], rules: rules.ageUnit },
    {
      value: form[ck.socialSecurityNumber],
      rules: rules.ssn,
    },
  ]
  let count = 0

  for (const field of fields) {
    count += countFieldRuleErrors(field.value, field.rules)
  }

  return count
}

export function countContactTabFieldErrors(contact, rules) {
  if (!contact || !rules) {
    return 0
  }
  let count = 0

  count += countFieldRuleErrors(contact.addressLine1, rules.addressLine1)
  count += countFieldRuleErrors(contact.addressLine2, rules.addressLine2)
  count += countFieldRuleErrors(contact.zipCode, rules.zipCode)

  for (const phone of contact.phones ?? []) {
    count += countFieldRuleErrors(phone?.number, rules.phoneNumber)
  }
  for (const email of contact.emails ?? []) {
    count += countFieldRuleErrors(email?.address, rules.emailAddress)
  }
  count += countFieldRuleErrors(
    contact.additionalNotes,
    rules.additionalNotes,
  )

  for (const other of contact.otherContacts ?? []) {
    count += countFieldRuleErrors(other.firstName, rules.otherFirstName)
    count += countFieldRuleErrors(other.middleName, rules.otherMiddleName)
    count += countFieldRuleErrors(other.lastName, rules.otherLastName)
    if (!other.sameAsClientAddress) {
      count += countFieldRuleErrors(other.addressLine1, rules.addressLine1)
      count += countFieldRuleErrors(other.addressLine2, rules.addressLine2)
      count += countFieldRuleErrors(other.zipCode, rules.zipCode)
    }
    for (const phone of other.phones ?? []) {
      count += countFieldRuleErrors(phone?.number, rules.phoneNumber)
    }
    for (const email of other.emails ?? []) {
      count += countFieldRuleErrors(email?.address, rules.emailAddress)
    }
  }

  count += countDuplicateContactMethodErrors(contact)

  return count
}
