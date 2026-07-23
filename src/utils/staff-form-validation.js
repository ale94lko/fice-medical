import { parseDisplayDate } from 'src/utils/app-datetime.js'
import {
  getPasswordPolicyViolation,
  passwordPolicyMessageKey,
} from 'src/utils/password-validation.js'

export function resolveStaffApiErrorMessage(error, t) {
  const data = error?.response?.data
  const code = data?.error_code ?? data?.code
  const map = {
    1063: 'staffErrorDuplicateEmail',
    1078: 'staffErrorDuplicateNpi',
    1079: 'staffErrorDuplicateUsername',
  }
  const key = map[code]
  if (key) {
    return t(key)
  }

  const message = String(data?.message ?? error?.message ?? '').trim()
  const lower = message.toLowerCase()
  if (
    lower.includes('taxonomy')
    && (
      lower.includes('not found')
      || lower.includes('invalid')
      || lower.includes('inactive')
      || lower.includes('reference')
    )
  ) {
    return t('staffTaxonomyCodeNotInCatalog')
  }

  return message || t('staffFormSaveError')
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function resolveSystemUserPasswordError(
  password,
  t,
  { required = false } = {},
) {
  const value = String(password ?? '').trim()
  if (!value) {
    return required ? t('passwordRequired') : ''
  }
  const violation = getPasswordPolicyViolation(value)

  return violation ? t(passwordPolicyMessageKey(violation)) : ''
}

function validateBasicStaffFields(basic, t, errors) {
  if (!String(basic.firstName ?? '').trim()) {
    errors.firstName = t('firstNameRequired')
  }
  if (!String(basic.lastName ?? '').trim()) {
    errors.lastName = t('staffLastNameRequired')
  }
  const dob = String(basic.dob ?? '').trim()
  if (!dob) {
    errors.dob = t('staffDobRequired')
  } else if (!parseDisplayDate(dob)) {
    errors.dob = t('dobInvalid')
  }
  if (!String(basic.sex ?? '').trim()) {
    errors.sex = t('staffGenderRequired')
  }
}

function validateEmploymentFields(employment, t, errors) {
  if (!String(employment.position ?? '').trim()) {
    errors.position = t('staffPositionRequired')
  }
  if (!String(employment.hireDate ?? '').trim()) {
    errors.hireDate = t('staffHireDateRequired')
  }
}

function validateSystemUserFields(systemUser, { isEdit, t }, errors) {
  if (!systemUser.enabled) {
    return
  }
  const email = String(
    systemUser.email ?? systemUser.username ?? '',
  ).trim()
  if (!email) {
    errors.email = t('emailRequired')
  } else if (!EMAIL_RE.test(email)) {
    errors.email = t('emailInvalid')
  }
  if (!String(systemUser.status ?? '').trim()) {
    errors.status = t('fieldRequired')
  }
  const roles = Array.isArray(systemUser.roles) ? systemUser.roles : []
  const hasRole = roles.length > 0
    || (systemUser.roleId != null && systemUser.roleId !== '')
  if (!hasRole) {
    errors.roles = t('fieldRequired')
  }
  if (!isEdit) {
    const passwordError = resolveSystemUserPasswordError(
      systemUser.password,
      t,
      { required: true },
    )
    if (passwordError) {
      errors.password = passwordError
    }
  }
}

function validateClinicalFields(clinical, t, errors) {
  if (!String(clinical.npi ?? '').trim()) {
    errors.npi = t('staffNpiRequired')
  }
  const taxonomies = Array.isArray(clinical.taxonomies)
    ? clinical.taxonomies
    : []
  const primary = taxonomies.find(row =>
    row.isPrimary || row.is_primary,
  )
  const primaryCode = String(primary?.code ?? '').trim()
  if (!primaryCode) {
    errors.taxonomies = t('staffPrimaryTaxonomyRequired')
  }
}

export function validateStaffForm(form, {
  includeClinicalProfile,
  isEdit,
  t,
}) {
  const errors = {}
  const basic = form?.basic ?? {}
  const employment = form?.employment ?? {}
  const clinical = form?.clinical ?? {}
  const systemUser = employment.systemUser ?? {}

  validateBasicStaffFields(basic, t, errors)
  validateEmploymentFields(employment, t, errors)
  validateSystemUserFields(systemUser, { isEdit, t }, errors)
  if (includeClinicalProfile) {
    validateClinicalFields(clinical, t, errors)
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  }
}
