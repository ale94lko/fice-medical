import { computed } from 'vue'
import { clientNameMaxLength } from 'components/constants.js'
import {
  isValidAddressLine,
  isValidEmailAddress,
  isValidLettersField,
  isValidPhoneChars,
  isValidZipCode,
} from 'src/utils/client-contact-form.js'

export function useAddClientContactRules(t, lettersRule) {
  function optionalAddressLineRule(maxLen) {
    return val =>
      isValidAddressLine(val, maxLen)
      || t('addressLineInvalid', { max: maxLen })
  }

  function optionalLettersRule(maxLen) {
    return val =>
      isValidLettersField(val, maxLen) || t('lettersOnlyMax', { max: maxLen })
  }

  const contactRules = computed(() => ({
    addressLine1: [optionalAddressLineRule(100)],
    addressLine2: [optionalAddressLineRule(100)],
    city: [optionalLettersRule(50)],
    state: [optionalLettersRule(50)],
    county: [optionalLettersRule(50)],
    zipCode: [
      val => isValidZipCode(val) || t('zipCodeInvalid'),
    ],
    phoneNumber: [
      val => isValidPhoneChars(val) || t('phoneInvalid'),
    ],
    emailAddress: [
      val => isValidEmailAddress(val) || t('clientEmailInvalid'),
    ],
    otherFirstName: [
      lettersRule(t('firstNameRequired'), clientNameMaxLength, false),
    ],
    otherMiddleName: [
      lettersRule(t('firstNameRequired'), clientNameMaxLength, false),
    ],
    otherLastName: [
      lettersRule(t('lastNameRequired'), clientNameMaxLength, false),
    ],
    additionalNotes: [
      val => {
        const s = String(val ?? '')
        if (s.length <= 500) {
          return true
        }

        return t('notesMax', { max: 500 })
      },
    ],
  }))

  return { contactRules }
}
