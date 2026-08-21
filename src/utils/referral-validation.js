import {
  referralStatuses,
  referralTypes,
} from 'components/constants.js'
import {
  isValidPhoneChars,
  normalizePhoneDigits,
} from 'src/utils/client-contact-form.js'
import { buildFollowUpDraftFromReferral } from 'src/utils/referral-follow-up.js'
import { normalizeFollowUpReference } from
  'src/utils/follow-up-reference.js'
import { validateFollowUpDraft } from 'src/utils/follow-up-utils.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function trim(value) {
  return String(value ?? '').trim()
}

export function validateReferralForm(referral, t) {
  const errors = {}
  const type = trim(referral?.type).toUpperCase()
  if (!type) {
    errors.type = t('referralTypeRequired')
  }
  if (!trim(referral?.referralDate)) {
    errors.referralDate = t('referralDateRequired')
  }
  if (!trim(referral?.status)) {
    errors.status = t('referralStatusRequired')
  }
  if (!trim(referral?.reason)) {
    errors.reason = t('referralReasonRequired')
  }
  const email = trim(referral?.email)
  if (email && !EMAIL_RE.test(email)) {
    errors.email = t('referralEmailInvalid')
  }
  const phone = trim(referral?.phone)
  if (phone) {
    if (!isValidPhoneChars(phone)) {
      errors.phone = t('phoneInvalid')
    } else if (normalizePhoneDigits(phone).length !== 10) {
      errors.phone = t('referralPhoneIncomplete')
    }
  }
  if (type === referralTypes.incoming) {
    const provider = trim(referral?.referringProvider)
    const organization = trim(referral?.referringOrganization)
    if (
      !trim(referral?.sourceCategory)
      && !provider
      && !organization
    ) {
      errors.referringProvider = t('referralReferringProviderRequired')
    }
  }
  if (type === referralTypes.outgoing) {
    const provider = trim(referral?.referredToProvider)
    const organization = trim(referral?.referredToOrganization)
    if (!provider && !organization) {
      errors.referredToProvider = t('referralReferredToRequired')
    }
  }
  const status = trim(referral?.status).toUpperCase()
  if (
    (
      status === referralStatuses.declined
      || status === referralStatuses.closed
    )
    && !trim(referral?.statusReason)
  ) {
    errors.status = t('referralStatusReasonRequired')
  }
  if (referral?.followUpRequired) {
    if (!referral?.assignedClinicianId) {
      errors.assignedClinicianId = t('referralFollowUpClinicianRequired')
    } else {
      const draft = buildFollowUpDraftFromReferral(referral)
      const reference = normalizeFollowUpReference(draft.reference)
      const followUpErrors = validateFollowUpDraft(draft, t, {
        referenceOptions: reference != null
          ? [{ reference }]
          : [],
      })
      if (followUpErrors.dueDate) {
        errors.referralDate = followUpErrors.dueDate
      }
    }
  }

  return errors
}

export function referralFormHasErrors(errors) {
  return Object.keys(errors ?? {}).length > 0
}

/** Visual order in ReferralDialog (incoming/outgoing sections). */
export const REFERRAL_FORM_FIELD_ORDER = [
  'type',
  'referralDate',
  'status',
  'referringProvider',
  'referredToProvider',
  'phone',
  'email',
  'reason',
  'assignedClinicianId',
]

export function firstReferralFormErrorKey(errors) {
  const row = errors ?? {}
  const ordered = REFERRAL_FORM_FIELD_ORDER.find(key => row[key])
  if (ordered) {
    return ordered
  }

  return Object.keys(row)[0] || null
}
