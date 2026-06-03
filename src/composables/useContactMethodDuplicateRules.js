import {
  duplicateEmailRule,
  duplicatePhoneRule,
} from 'src/utils/client-contact-method-validation.js'

export function useContactMethodDuplicateRules(t) {
  function phoneNumberRules(phones, index, baseRules = []) {
    return [
      ...baseRules,
      duplicatePhoneRule(phones, index, t('duplicatePhone')),
    ]
  }

  function emailAddressRules(emails, index, baseRules = []) {
    return [
      ...baseRules,
      duplicateEmailRule(emails, index, t('duplicateEmail')),
    ]
  }

  return {
    phoneNumberRules,
    emailAddressRules,
  }
}
