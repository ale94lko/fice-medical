import {
  consentSignatureMethodValues,
  consentSignerTypeValues,
  consentStatusValues,
  consentTypeValues,
  consentVersionStatusValues,
} from 'components/constants.js'
import { labI18nKey } from 'src/utils/lab-i18n.js'
import {
  apiDateToDisplay,
  formatDateTime,
} from 'src/utils/app-datetime.js'

export function consentTypeI18nKey(type) {
  return labI18nKey('consentType', type)
}

export function consentStatusI18nKey(status) {
  return labI18nKey('consentStatus', status)
}

export function consentVersionStatusI18nKey(status) {
  return labI18nKey('consentVersionStatus', status)
}

export function consentSignerTypeI18nKey(type) {
  return labI18nKey('consentSignerType', type)
}

export function consentSignatureMethodI18nKey(method) {
  return labI18nKey('consentSignatureMethod', method)
}

export function buildConsentTypeOptions(t, te) {
  return Object.values(consentTypeValues).map(value => {
    const key = consentTypeI18nKey(value)

    return {
      label: te?.(key) ? t(key) : value,
      value,
    }
  })
}

export function buildConsentSignerTypeOptions(t, te, allowed = null) {
  const all = Object.values(consentSignerTypeValues)
  const list = Array.isArray(allowed) && allowed.length
    ? all.filter(value => allowed.includes(value))
    : all

  return list.map(value => {
    const key = consentSignerTypeI18nKey(value)

    return {
      label: te?.(key) ? t(key) : value,
      value,
    }
  })
}

export function buildConsentAuthorizationSignerTypeOptions(t, te) {
  return buildConsentSignerTypeOptions(t, te, [
    consentSignerTypeValues.client,
    consentSignerTypeValues.guardian,
    consentSignerTypeValues.authorizedRepresentative,
  ])
}

export function buildConsentSignatureMethodOptions(t, te) {
  return Object.values(consentSignatureMethodValues).map(value => {
    const key = consentSignatureMethodI18nKey(value)

    return {
      label: te?.(key) ? t(key) : value,
      value,
    }
  })
}

export function buildConsentStatusOptions(t, te) {
  return Object.values(consentStatusValues).map(value => {
    const key = consentStatusI18nKey(value)

    return {
      label: te?.(key) ? t(key) : value,
      value,
    }
  })
}

export function consentVersionStatusVariant(status) {
  const token = String(status ?? '').toUpperCase()
  if (token === consentVersionStatusValues.published) {
    return 'active'
  }
  if (token === consentVersionStatusValues.archived) {
    return 'archived'
  }

  return 'pending'
}

export function consentStatusVariant(status) {
  const token = String(status ?? '').toUpperCase()
  switch (token) {
    case consentStatusValues.accepted:
      return 'active'
    case consentStatusValues.pendingSignature:
      return 'pending'
    case consentStatusValues.declined:
    case consentStatusValues.revoked:
      return 'archived'
    case consentStatusValues.cancelled:
      return 'cancelled'
    case consentStatusValues.expired:
      return 'inactive'
    default:
      return 'other'
  }
}

export function formatConsentDateTime(value) {
  const token = String(value ?? '').trim()
  if (!token) {
    return '—'
  }

  return formatDateTime(token) || token
}

export function formatConsentDate(value) {
  const token = String(value ?? '').trim()
  if (!token) {
    return '—'
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(token) && !token.includes('T')) {
    return apiDateToDisplay(token.slice(0, 10)) || token.slice(0, 10)
  }

  return formatDateTime(token) || token
}
