import {
  followUpPriorityValues,
  followUpRelatedToValues,
  followUpReminderUnitValues,
  followUpTypeValues,
  referralPriorities,
} from 'components/constants.js'
import {
  formatDateUs,
  parseUsDateString,
  startOfDay,
  todayDateUs,
} from 'src/utils/client-form.js'
import { parseFollowUpReference } from 'src/utils/follow-up-reference.js'
import {
  applyLocalFollowUpCancel,
  followUpIsEditable,
} from 'src/utils/client-follow-ups.js'

const REFERRAL_FOLLOW_UP_DUE_DAYS = 7

function trim(value) {
  return String(value ?? '').trim()
}

export function mapReferralPriorityToFollowUpPriority(referralPriority) {
  const token = trim(referralPriority).toUpperCase()
  if (token === referralPriorities.stat) {
    return followUpPriorityValues.urgent
  }
  if (token === referralPriorities.urgent) {
    return followUpPriorityValues.high
  }

  return followUpPriorityValues.medium
}

export function resolveFollowUpDueDateFromReferral(referralDate) {
  const base = parseUsDateString(referralDate) ?? startOfDay(new Date())
  const due = new Date(base)
  due.setDate(due.getDate() + REFERRAL_FOLLOW_UP_DUE_DAYS)
  const today = startOfDay(new Date())
  if (due < today) {
    due.setTime(today.getTime())
    due.setDate(due.getDate() + REFERRAL_FOLLOW_UP_DUE_DAYS)
  }

  return formatDateUs(due)
}

function buildFollowUpNotesFromReferral(referral) {
  const parts = []
  const number = trim(referral?.referralNumber)
  if (number) {
    parts.push(number)
  }
  const reason = trim(referral?.reason)
  if (reason) {
    parts.push(reason)
  }

  return parts.join(' — ')
}

function buildReferralReferenceLabel(referral) {
  const number = trim(referral?.referralNumber)
  const type = trim(referral?.type)
  const status = trim(referral?.status)
  const head = number || (referral?.id ? `#${referral.id}` : '')
  const parts = [head, type, status].filter(Boolean)

  return parts.join(' — ')
}

export function buildFollowUpDraftFromReferral(referral) {
  const referralId = parseFollowUpReference(referral?.id)

  return {
    type: followUpTypeValues.referralVerification,
    dueDate: resolveFollowUpDueDateFromReferral(referral?.referralDate),
    assignedProviderId: referral?.assignedClinicianId ?? null,
    priority: mapReferralPriorityToFollowUpPriority(referral?.priority),
    relatedTo: followUpRelatedToValues.referral,
    reference: referralId,
    referenceLabel: buildReferralReferenceLabel(referral),
    notes: buildFollowUpNotesFromReferral(referral),
    reminderEnabled: true,
    reminderValue: 3,
    reminderUnit: followUpReminderUnitValues.daysBefore,
  }
}

export function isFollowUpForReferral(item, referralId) {
  const id = parseFollowUpReference(referralId)
  if (id == null) {
    return false
  }

  return trim(item?.relatedTo).toUpperCase()
    === followUpRelatedToValues.referral
    && parseFollowUpReference(item?.reference) === id
}

export function followUpExistsForReferral(section, referralId) {
  const id = parseFollowUpReference(referralId)
  if (id == null) {
    return false
  }

  const matches = item => isFollowUpForReferral(item, referralId)

  return (section?.pending ?? []).some(matches)
    || (section?.entries ?? []).some(
      item => matches(item) && followUpIsEditable(item),
    )
}

export function shouldCreateFollowUpFromReferral(saved, previous) {
  if (!saved?.followUpRequired || !saved?.id) {
    return false
  }
  if (
    previous?.followUpRequired
    && Number(previous?.id) === Number(saved?.id)
  ) {
    return false
  }

  return true
}

export function shouldRemoveFollowUpFromReferral(saved, previous) {
  if (saved?.followUpRequired || !saved?.id) {
    return false
  }
  if (!previous?.followUpRequired) {
    return false
  }

  return Number(previous?.id) === Number(saved?.id)
}

export function removeFollowUpForReferral(section, referralId) {
  if (!section) {
    return section
  }

  const pending = (section.pending ?? []).filter(
    item => !isFollowUpForReferral(item, referralId),
  )
  const entries = (section.entries ?? []).map(item => {
    if (!isFollowUpForReferral(item, referralId)) {
      return item
    }
    if (followUpIsEditable(item)) {
      return applyLocalFollowUpCancel(item)
    }

    return item
  })

  return {
    ...section,
    pending,
    entries,
  }
}

export function resolveReferralFollowUpDueDateFallback() {
  return resolveFollowUpDueDateFromReferral(todayDateUs())
}
