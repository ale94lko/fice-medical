import { computed, ref, watch } from 'vue'
import {
  addClientTabKeys,
  clientFieldKeys,
  clientMaxAge,
  clientNameMaxLength,
  clientSexValues,
  clientSuffixOptions,
} from 'components/constants.js'
import {
  ageFromUsDateString,
  generateClientNumber,
  isAdmissionDateValid,
  isLettersOnly,
  isValidSsnDigits,
  normalizeSsnDigits,
  snapshotAddClientForm,
  todayDateUs,
} from 'src/utils/client-form.js'

const TAB_ORDER = [
  addClientTabKeys.basic,
  addClientTabKeys.contact,
  addClientTabKeys.medicalHistory,
]

export function useAddClientForm(t) {
  const ck = clientFieldKeys
  const activeTab = ref(addClientTabKeys.basic)
  const initialSnapshot = ref('')
  const formRef = ref(null)

  const form = ref(createEmptyForm())

  const ageReadonly = computed(() => {
    const dob = String(form.value[ck.dob] ?? '').trim()

    return dob.length > 0
  })

  const sexOptions = computed(() => [
    { label: t('sexMale'), value: clientSexValues.male },
    { label: t('sexFemale'), value: clientSexValues.female },
    { label: t('sexUnknown'), value: clientSexValues.unknown },
  ])

  const suffixSelectOptions = computed(() =>
    clientSuffixOptions.map(o => ({
      label: t(o.labelKey),
      value: o.value,
    })),
  )

  watch(
    () => form.value[ck.dob],
    dob => {
      const trimmed = String(dob ?? '').trim()
      if (!trimmed) {
        return
      }
      const age = ageFromUsDateString(trimmed)
      if (age != null) {
        form.value[ck.age] = String(age)
      }
    },
  )

  function createEmptyForm() {
    return {
      [ck.clientNumber]: generateClientNumber(),
      [ck.firstName]: '',
      [ck.middleName]: '',
      [ck.lastName]: '',
      [ck.suffix]: '',
      [ck.sex]: '',
      [ck.dob]: '',
      [ck.age]: '',
      [ck.socialSecurityNumber]: '',
      [ck.admissionDate]: todayDateUs(),
    }
  }

  function resetForm() {
    form.value = createEmptyForm()
    activeTab.value = addClientTabKeys.basic
    initialSnapshot.value = snapshotAddClientForm(form.value)
  }

  function markPristine() {
    initialSnapshot.value = snapshotAddClientForm(form.value)
  }

  function isDirty() {
    return snapshotAddClientForm(form.value) !== initialSnapshot.value
  }

  function requiredRule(message) {
    return val => {
      const s = String(val ?? '').trim()

      return s.length > 0 || message
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

  function usDateRule(message, required = false) {
    return val => {
      const s = String(val ?? '').trim()
      if (!s) {
        return required ? message : true
      }

      return ageFromUsDateString(s) != null || message
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
      if (ageReadonly.value) {
        return true
      }
      const s = String(val ?? '').trim()
      if (!s) {
        return true
      }
      const n = Number(s)
      if (!Number.isFinite(n) || n < 0 || n > clientMaxAge) {
        return t('ageRange', { max: clientMaxAge })
      }

      return true
    }
  }

  function ssnRule() {
    return val => {
      const digits = normalizeSsnDigits(val)

      return isValidSsnDigits(digits) || t('ssnInvalid')
    }
  }

  const rules = computed(() => ({
    firstName: [
      requiredRule(t('firstNameRequired')),
      lettersRule(t('firstNameRequired'), clientNameMaxLength, true),
    ],
    middleName: [
      lettersRule(t('firstNameRequired'), clientNameMaxLength, false),
    ],
    lastName: [
      requiredRule(t('lastNameRequired')),
      lettersRule(t('lastNameRequired'), clientNameMaxLength, true),
    ],
    dob: [usDateRule(t('dobInvalid'), false)],
    admissionDate: [admissionDateRule()],
    age: [ageRule()],
    ssn: [ssnRule()],
  }))

  function tabIndex(tab) {
    return TAB_ORDER.indexOf(tab)
  }

  function goNextTab() {
    const idx = tabIndex(activeTab.value)
    if (idx < 0 || idx >= TAB_ORDER.length - 1) {
      return
    }
    activeTab.value = TAB_ORDER[idx + 1]
  }

  function canGoNext() {
    return tabIndex(activeTab.value) < TAB_ORDER.length - 1
  }

  async function validateBasicTab() {
    if (!formRef.value) {
      return false
    }

    return formRef.value.validate()
  }

  return {
    ck,
    form,
    formRef,
    activeTab,
    addClientTabKeys,
    ageReadonly,
    sexOptions,
    suffixSelectOptions,
    rules,
    resetForm,
    markPristine,
    isDirty,
    goNextTab,
    canGoNext,
    validateBasicTab,
    createEmptyForm,
  }
}
