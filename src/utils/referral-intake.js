import {
  clientFieldKeys,
  referralPriorities,
  referralSourceSelfReferredCode,
  referralStatuses,
  referralTypes,
} from 'components/constants.js'
import { todayDateUs } from 'src/utils/client-form.js'
import { createEmptyReferral } from 'src/utils/referral-orders.js'

export const INTAKE_REFERRAL_DRAFT_ID = 'intake-draft'

function trim(value) {
  return String(value ?? '').trim()
}

function normalizeToken(value) {
  return trim(value).toUpperCase()
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
    referralDate: trim(form[ck.referralIntakeDate]) || todayDateUs(),
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

export function isIntakeReferralDraft(row) {
  return String(row?.id ?? '') === INTAKE_REFERRAL_DRAFT_ID
    || row?.localPreview === true
}

export function buildIntakeReferralDraftRow(form, t) {
  const payload = buildIntakeReferralFromForm(form, t)
  const provider = payload.referringProvider || ''
  const organization = payload.referringOrganization || ''
  const parts = [provider, organization].filter(Boolean)

  return createEmptyReferral({
    ...payload,
    id: INTAKE_REFERRAL_DRAFT_ID,
    localPreview: true,
    referredByLabel: parts.length ? parts.join(' / ') : '—',
  })
}

export function listHasMatchingIntakeReferral(rows, form) {
  if (!shouldCreateIntakeReferral(form)) {
    return false
  }
  const source = normalizeToken(form?.[clientFieldKeys.referralSource])
  const list = Array.isArray(rows) ? rows : []

  return list.some(row => {
    if (isIntakeReferralDraft(row)) {
      return false
    }
    const type = normalizeToken(row?.type)
    if (type && type !== referralTypes.incoming) {
      return false
    }
    const rowSource = normalizeToken(
      row?.source_category ?? row?.sourceCategory,
    )

    return rowSource === source
  })
}

export function mergeIntakeReferralIntoList(
  rows,
  form,
  t,
  options = {},
) {
  const list = Array.isArray(rows) ? [...rows] : []
  if (options.skip || options.alreadyCreated) {
    return list
  }
  if (!shouldCreateIntakeReferral(form)) {
    return list
  }
  if (listHasMatchingIntakeReferral(list, form)) {
    return list
  }
  list.unshift(buildIntakeReferralDraftRow(form, t))

  return list
}
