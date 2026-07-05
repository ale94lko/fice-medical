export const PASSWORD_MIN_LENGTH = 8

export const passwordErrorCodes = {
  incorrectCurrent: 1005,
  changeRequired: 1149,
  sameAsCurrent: 1150,
  matchesHistory: 1151,
}

const POLICY_MESSAGE_KEYS = {
  required: 'passwordRequired',
  minLength: 'passwordMinLength',
  uppercase: 'passwordRequiresUppercase',
  lowercase: 'passwordRequiresLowercase',
  number: 'passwordRequiresNumber',
  special: 'passwordRequiresSpecial',
}

export function getPasswordPolicyViolation(password) {
  const value = String(password ?? '')
  if (!value) {
    return 'required'
  }
  if (value.length < PASSWORD_MIN_LENGTH) {
    return 'minLength'
  }
  if (!/[A-Z]/.test(value)) {
    return 'uppercase'
  }
  if (!/[a-z]/.test(value)) {
    return 'lowercase'
  }
  if (!/[0-9]/.test(value)) {
    return 'number'
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    return 'special'
  }

  return null
}

export function passwordPolicyMessageKey(violation) {
  return POLICY_MESSAGE_KEYS[violation] ?? 'passwordPolicyInvalid'
}

export function resolvePasswordPolicyMessage(password, t) {
  const violation = getPasswordPolicyViolation(password)
  if (!violation) {
    return ''
  }

  return t(passwordPolicyMessageKey(violation))
}

export function isNewPasswordSameAsCurrent(currentPassword, newPassword) {
  const current = String(currentPassword ?? '')
  const next = String(newPassword ?? '')
  if (!current || !next) {
    return false
  }

  return current === next
}

export function resolveNewPasswordChangeMessage(
  newPassword,
  t,
  { currentPassword } = {},
) {
  const policyMessage = resolvePasswordPolicyMessage(newPassword, t)
  if (policyMessage) {
    return policyMessage
  }
  if (isNewPasswordSameAsCurrent(currentPassword, newPassword)) {
    return t('passwordSameAsCurrent')
  }

  return ''
}

export function passwordsMatch(password, confirmPassword) {
  return String(password ?? '') === String(confirmPassword ?? '')
}

export function resolvePasswordConfirmMessage(password, confirmPassword, t) {
  if (!String(confirmPassword ?? '').trim()) {
    return t('passwordRequired')
  }
  if (!passwordsMatch(password, confirmPassword)) {
    return t('passwordsDoNotMatch')
  }

  return ''
}

export function createPasswordPolicyRule(t) {
  return val => {
    const violation = getPasswordPolicyViolation(val)
    if (!violation) {
      return true
    }

    return t(passwordPolicyMessageKey(violation))
  }
}

export function createOptionalPasswordPolicyRule(t) {
  return val => {
    const value = String(val ?? '').trim()
    if (!value) {
      return true
    }
    const violation = getPasswordPolicyViolation(value)
    if (!violation) {
      return true
    }

    return t(passwordPolicyMessageKey(violation))
  }
}

export function createPasswordMatchRule(t, getPassword) {
  return val => resolvePasswordConfirmMessage(getPassword(), val, t) || true
}

export function buildNewPasswordRules(t, { required = true } = {}) {
  const rules = []
  if (required) {
    rules.push(
      val => String(val ?? '').trim().length > 0 || t('passwordRequired'),
    )
  }
  rules.push(createPasswordPolicyRule(t))

  return rules
}

export function getPasswordChangeApiErrorCode(error) {
  const data = error?.response?.data
  const code = Number(data?.error_code ?? data?.errorCode)
  return Number.isFinite(code) && code > 0 ? code : null
}

export function resolvePasswordChangeApiError(error, t, fallbackKey) {
  const data = error?.response?.data
  const code = Number(data?.error_code ?? data?.errorCode)
  if (code === passwordErrorCodes.incorrectCurrent) {
    return t('currentPasswordIncorrect')
  }
  if (code === passwordErrorCodes.sameAsCurrent) {
    return t('passwordSameAsCurrent')
  }
  if (code === passwordErrorCodes.matchesHistory) {
    return t('passwordMatchesHistory')
  }
  const description = data?.error_description ?? data?.errorDescription
  if (typeof description === 'string' && description.trim()) {
    return description.trim()
  }
  const message = data?.message
  if (typeof message === 'string' && message.trim()) {
    return message.trim()
  }

  return t(fallbackKey ?? 'forcedChangePasswordFailed')
}
