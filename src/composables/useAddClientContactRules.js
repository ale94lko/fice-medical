import { computed } from 'vue'
import { clientNameMaxLength, otherContactNotesMaxLength } from
  'components/constants.js'
import {
  isValidAddressLine,
  isValidEmailAddress,
  isValidLettersField,
  isCompletePhoneNumber,
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
      val => isCompletePhoneNumber(val) || t('clientPhoneIncomplete'),
    ],
    emailAddress: [
      val => isValidEmailAddress(val) || t('clientEmailInvalid'),
    ],
    otherFirstName: [
      lettersRule(t('firstNameRequired'), clientNameMaxLength, true),
    ],
    otherMiddleName: [
      lettersRule(t('firstNameRequired'), clientNameMaxLength, false),
    ],
    otherLastName: [
      lettersRule(t('lastNameRequired'), clientNameMaxLength, true),
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
    otherContactNotes: [
      val => {
        const s = String(val ?? '')
        if (s.length <= otherContactNotesMaxLength) {
          return true
        }

        return t('notesMax', { max: otherContactNotesMaxLength })
      },
    ],
  }))

  return { contactRules }
}
