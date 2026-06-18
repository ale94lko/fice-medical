import {
  referralTypes,
} from 'components/constants.js'
import {
  isValidPhoneChars,
  normalizePhoneDigits,
} from 'src/utils/client-contact-form.js'
import { buildFollowUpDraftFromReferral } from 'src/utils/referral-follow-up.js'
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
  if (referral?.followUpRequired) {
    if (!referral?.assignedClinicianId) {
      errors.assignedClinicianId = t('referralFollowUpClinicianRequired')
    } else {
      const draft = buildFollowUpDraftFromReferral(referral)
      const followUpErrors = validateFollowUpDraft(draft, t, {
        referenceOptions: referral?.id
          ? [{ reference: Number(referral.id) }]
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
