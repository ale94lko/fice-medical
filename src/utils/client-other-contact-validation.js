import {
  otherContactIdsMissingContactMethod,
} from 'src/utils/client-contact-form.js'

export function resolveOtherContactContactMethodSaveErrorKey(
  contactSection,
) {
  if (!otherContactIdsMissingContactMethod(contactSection).length) {
    return null
  }

  return 'otherContactContactMethodRequired'
}

export function contactBusinessRuleExtraErrorCount(errorKey) {
  if (!errorKey) {
    return 0
  }
  if (errorKey === 'otherContactContactMethodRequired') {
    return 0
  }

  return 1
}
