import { parseDisplayDate } from 'src/utils/app-datetime.js'

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

  return String(data?.message ?? error?.message ?? t('staffFormSaveError'))
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  if (!String(employment.position ?? '').trim()) {
    errors.position = t('staffPositionRequired')
  }
  if (!String(employment.hireDate ?? '').trim()) {
    errors.hireDate = t('staffHireDateRequired')
  }
  if (systemUser.enabled) {
    const email = String(
      systemUser.email ?? systemUser.username ?? '',
    ).trim()
    if (!email) {
      errors.email = t('emailRequired')
    } else if (!EMAIL_RE.test(email)) {
      errors.email = t('emailInvalid')
    }
    if (!isEdit) {
      if (!String(systemUser.status ?? '').trim()) {
        errors.status = t('fieldRequired')
      }
      const roles = Array.isArray(systemUser.roles) ? systemUser.roles : []
      const hasRole = roles.length > 0
        || (systemUser.roleId != null && systemUser.roleId !== '')
      if (!hasRole) {
        errors.roles = t('fieldRequired')
      }
      if (!String(systemUser.password ?? '').trim()) {
        errors.password = t('passwordRequired')
      }
    }
  }
  if (includeClinicalProfile && !String(clinical.npi ?? '').trim()) {
    errors.npi = t('staffNpiRequired')
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  }
}
