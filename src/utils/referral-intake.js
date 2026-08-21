import {
  clientFieldKeys,
  referralIntakeSourceDetailsMaxLength,
  referralPriorities,
  referralSourceSelfReferredCode,
  referralStatuses,
  referralTypes,
} from 'components/constants.js'
import { todayDateUs } from 'src/utils/client-form.js'
import { specialtyAfterProviderChange } from
  'src/utils/referral-clinician.js'
import {
  cloneReferral,
  createEmptyReferral,
} from 'src/utils/referral-orders.js'

export const INTAKE_REFERRAL_DRAFT_ID = 'intake-draft'
export const EXTRA_REFERRAL_DRAFT_PREFIX = 'extra-draft-'

let extraReferralDraftSeq = 0

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

export function buildIntakeReferralFromForm(form, t, extras = {}) {
  const ck = clientFieldKeys
  const details = trim(form[ck.referralSourceDetails])
  const extra = extras && typeof extras === 'object' ? extras : {}

  return {
    type: referralTypes.incoming,
    status: extra.status || referralStatuses.received,
    priority: extra.priority || referralPriorities.routine,
    referralDate: trim(form[ck.referralIntakeDate]) || todayDateUs(),
    sourceCategory: form[ck.referralSource],
    referringProvider: trim(form[ck.referringProvider])
      || trim(extra.referringProvider)
      || null,
    referringOrganization: trim(form[ck.referringOrganization])
      || trim(extra.referringOrganization)
      || null,
    specialty: trim(extra.specialty) || null,
    phone: trim(extra.phone) || null,
    email: trim(extra.email) || null,
    reason: trim(extra.reason) || details || t('referralIntakeDefaultReason'),
    diagnoses: Array.isArray(extra.diagnoses) ? extra.diagnoses : [],
    assignedClinicianId: extra.assignedClinicianId ?? null,
    followUpRequired: Boolean(extra.followUpRequired),
    notes: extra.notes ?? null,
  }
}

export function clearNonSelfReferralIntakeFields(form) {
  const ck = clientFieldKeys
  form[ck.referralIntakeDate] = ''
  form[ck.referringProvider] = ''
  form[ck.referringOrganization] = ''
  form[ck.referralSourceDetails] = ''
}

export function applyIntakeReferralToBasicInfo(form, referral) {
  if (!form || !referral) {
    return
  }
  const ck = clientFieldKeys
  const date = trim(referral.referralDate)
  if (date) {
    form[ck.referralIntakeDate] = date
  }
  form[ck.referringProvider] = trim(referral.referringProvider)
  form[ck.referringOrganization] = trim(referral.referringOrganization)
  const source = referral.sourceCategory
  if (source) {
    form[ck.referralSource] = source
  }
  form[ck.referralSourceDetails] = trim(referral.reason)
    .slice(0, referralIntakeSourceDetailsMaxLength)
}

export function mergeBasicInfoIntoIntakeExtras(
  extras,
  form,
  clinicianOptions = [],
) {
  const ck = clientFieldKeys
  const extra = extras && typeof extras === 'object' ? { ...extras } : {}
  const previousProvider = trim(extra.referringProvider)
  const provider = trim(form?.[ck.referringProvider])
  extra.referringProvider = provider
  extra.referringOrganization = trim(form?.[ck.referringOrganization])
  extra.referralDate = trim(form?.[ck.referralIntakeDate])
  extra.sourceCategory = form?.[ck.referralSource] ?? extra.sourceCategory
  extra.reason = trim(form?.[ck.referralSourceDetails])
  extra.specialty = specialtyAfterProviderChange(
    provider,
    previousProvider,
    clinicianOptions,
    extra.specialty,
  )

  return extra
}

export function isIntakeReferralDraft(row) {
  return String(row?.id ?? '') === INTAKE_REFERRAL_DRAFT_ID
}

export function isExtraReferralDraftId(value) {
  return trim(value).startsWith(EXTRA_REFERRAL_DRAFT_PREFIX)
}

export function isExtraReferralDraft(row) {
  return isExtraReferralDraftId(row?.id)
}

export function isLocalReferralDraft(row) {
  return isIntakeReferralDraft(row) || isExtraReferralDraft(row)
}

export function nextExtraReferralDraftId() {
  extraReferralDraftSeq += 1

  return `${EXTRA_REFERRAL_DRAFT_PREFIX}${Date.now()}`
    + `-${extraReferralDraftSeq}`
}

export function stampExtraReferralDraft(referral) {
  const row = cloneReferral(referral)
  if (isIntakeReferralDraft(row)) {
    return row
  }
  if (!isExtraReferralDraft(row)) {
    row.id = nextExtraReferralDraftId()
  }
  row.localPreview = true

  return row
}

export function mergeExtraReferralDraftsIntoList(list, extras = []) {
  const extraRows = (extras ?? [])
    .map(item => item?.referral)
    .filter(row => isExtraReferralDraft(row))
  const source = Array.isArray(list) ? list : []
  if (!extraRows.length) {
    return source
  }
  const intake = []
  const rest = []
  source.forEach(row => {
    if (isIntakeReferralDraft(row)) {
      intake.push(row)
    } else if (!isExtraReferralDraft(row)) {
      rest.push(row)
    }
  })

  return [...intake, ...extraRows, ...rest]
}

export function buildIntakeReferralDraftRow(form, t, extras = {}) {
  const payload = buildIntakeReferralFromForm(form, t, extras)
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
  list.unshift(buildIntakeReferralDraftRow(form, t, options.extras))

  return list
}
