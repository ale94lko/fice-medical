import {
  clientFieldKeys,
  referralPriorities,
  referralSourceSelfReferredCode,
  referralStatuses,
  referralTypes,
} from 'components/constants.js'

function trim(value) {
  return String(value ?? '').trim()
}

export function isSelfReferredSource(source) {
  return trim(source).toUpperCase() === referralSourceSelfReferredCode
}

export function shouldCreateIntakeReferral(form) {
  const source = form?.[clientFieldKeys.referralSource]
  if (!trim(source)) {
    return false
  }

  return !isSelfReferredSource(source)
}

export function buildIntakeReferralFromForm(form, t) {
  const ck = clientFieldKeys
  const details = trim(form[ck.referralSourceDetails])

  return {
    type: referralTypes.incoming,
    status: referralStatuses.received,
    priority: referralPriorities.routine,
    referralDate: form[ck.referralIntakeDate],
    sourceCategory: form[ck.referralSource],
    referringProvider: trim(form[ck.referringProvider]) || null,
    referringOrganization: trim(form[ck.referringOrganization]) || null,
    reason: details || t('referralIntakeDefaultReason'),
    followUpRequired: false,
    notes: null,
  }
}

export function clearNonSelfReferralIntakeFields(form) {
  const ck = clientFieldKeys
  form[ck.referralIntakeDate] = ''
  form[ck.referringProvider] = ''
  form[ck.referringOrganization] = ''
  form[ck.referralSourceDetails] = ''
}
