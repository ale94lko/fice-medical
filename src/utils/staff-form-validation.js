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
  if (!String(basic.dob ?? '').trim()) {
    errors.dob = t('staffDobRequired')
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
    if (!String(systemUser.username ?? '').trim()) {
      errors.username = t('staffUsernameRequired')
    }
    if (systemUser.roleId == null || systemUser.roleId === '') {
      errors.roleId = t('staffRoleRequired')
    }
    if (!isEdit && !String(systemUser.password ?? '').trim()) {
      errors.password = t('staffPasswordRequired')
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
