import { computed } from 'vue'
import {
  clientFieldKeys,
  clientMaxAge,
  clientNameMaxLength,
} from 'components/constants.js'
import {
  isAdmissionDateValid,
  isLettersOnly,
  isValidTaxIdDigits,
  getSsnBlockValidationErrorKey,
  hasStoredIdNumberMasked,
  maxAgeForUnit,
  normalizeSsnDigits,
  parseUsDateString,
} from 'src/utils/client-form.js'
import {
  useAddClientContactRules,
} from 'src/composables/useAddClientContactRules.js'
import { isSelfReferredSource } from 'src/utils/referral-intake.js'

export function useAddClientFormRules(t, form, ageFieldsLocked) {
  const ck = clientFieldKeys

  function requiredRule(message) {
    return val => {
      const s = String(val ?? '').trim()

      return s.length > 0 || message
    }
  }

  function lettersFormatRule(maxLen) {
    return val => {
      const s = String(val ?? '').trim()
      if (!s) {
        return true
      }
      if (!isLettersOnly(s, maxLen)) {
        return t('lettersOnlyMax', { max: maxLen })
      }

      return true
    }
  }

  function lettersRule(message, maxLen, required = false) {
    return val => {
      const s = String(val ?? '').trim()
      if (!s) {
        return required ? message : true
      }
      if (!isLettersOnly(s, maxLen)) {
        return t('lettersOnlyMax', { max: maxLen })
      }

      return true
    }
  }

  function usDateRule(message, required = false, { maxToday = false } = {}) {
    return val => {
      const s = String(val ?? '').trim()
      if (!s) {
        return required ? message : true
      }
      if (!parseUsDateString(s)) {
        return message
      }
      if (maxToday && !isAdmissionDateValid(s)) {
        return message
      }

      return true
    }
  }

  function admissionDateRule() {
    return val => {
      const s = String(val ?? '').trim()
      if (!s) {
        return t('admissionDateRequired')
      }
      if (!isAdmissionDateValid(s)) {
        return t('admissionDateNotFuture')
      }

      return true
    }
  }

  function ageRule() {
    return val => {
      if (ageFieldsLocked.value) {
        return true
      }
      const s = String(val ?? '').trim()
      if (!s) {
        return true
      }
      const n = Number(s)
      const max = Math.min(
        clientMaxAge,
        maxAgeForUnit(form.value[ck.ageUnit]),
      )
      if (
        !Number.isFinite(n)
        || !Number.isInteger(n)
        || n < 0
        || n > max
      ) {
        return t('ageRange', { max })
      }

      return true
    }
  }

  function ageUnitRule() {
    return val => {
      if (ageFieldsLocked.value) {
        return true
      }
      const ageStr = String(form.value[ck.age] ?? '').trim()
      if (!ageStr) {
        return true
      }
      const s = String(val ?? '').trim()
      if (!s) {
        return t('ageUnitRequired')
      }

      return true
    }
  }

  function ssnRule() {
    return () => {
      const digits = normalizeSsnDigits(form.value[ck.socialSecurityNumber])
      if (!digits.length && hasStoredIdNumberMasked(form.value, ck)) {
        return true
      }
      const blockKey = getSsnBlockValidationErrorKey(digits)
      if (blockKey) {
        return t(blockKey)
      }

      return isValidTaxIdDigits(digits) || t('taxIdInvalid')
    }
  }

  function referralSourceRule() {
    return val => {
      const s = String(val ?? '').trim()

      return s.length > 0 || t('referralSourceRequired')
    }
  }

  function referralIntakeDateRule() {
    return val => {
      if (isSelfReferredSource(form.value[ck.referralSource])) {
        return true
      }
      const s = String(val ?? '').trim()
      if (!s) {
        return t('referralDateRequired')
      }
      if (!parseUsDateString(s)) {
        return t('referralDateInvalid')
      }

      return true
    }
  }

  const { contactRules } = useAddClientContactRules(t, lettersRule)

  const rules = computed(() => ({
    firstName: [
      requiredRule(t('firstNameRequired')),
      lettersFormatRule(clientNameMaxLength),
    ],
    middleName: [
      lettersFormatRule(clientNameMaxLength),
    ],
    lastName: [
      requiredRule(t('lastNameRequired')),
      lettersFormatRule(clientNameMaxLength),
    ],
    dob: [usDateRule(t('dobInvalid'), false, { maxToday: true })],
    admissionDate: [admissionDateRule()],
    age: [ageRule()],
    ageUnit: [ageUnitRule()],
    ssn: [ssnRule()],
    referralSource: [referralSourceRule()],
    referralIntakeDate: [referralIntakeDateRule()],
  }))

  return { rules, contactRules }
}
