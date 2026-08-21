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
import {
  normalizeFollowUpReference,
  parseFollowUpReference,
} from 'src/utils/follow-up-reference.js'
import {
  INTAKE_REFERRAL_DRAFT_ID,
  isLocalReferralDraft,
} from 'src/utils/referral-intake.js'
import {
  applyLocalFollowUpCancel,
  followUpIsEditable,
  mapEntryFromDraft,
  mapPendingFollowUpFromDraft,
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
  if (token === referralPriorities.low) {
    return followUpPriorityValues.low
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

export function buildReferralReferenceLabel(referral) {
  const number = trim(referral?.referralNumber)
  const type = trim(referral?.type)
  const status = trim(referral?.status)
  const isDraft = isLocalReferralDraft(referral)
  const head = number
    || (isDraft ? type : '')
    || (referral?.id ? `#${referral.id}` : '')
  const parts = isDraft
    ? [head, status].filter(Boolean)
    : [head, type, status].filter(Boolean)

  return parts.join(' — ')
}

export function buildFollowUpDraftFromReferral(referral) {
  const referralId = isLocalReferralDraft(referral)
    ? String(referral?.id ?? '').trim()
    : parseFollowUpReference(referral?.id)

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
    fromReferral: true,
  }
}

export function isReferralLinkedFollowUp(item) {
  if (item?.fromReferral) {
    return true
  }
  const type = trim(item?.type).toUpperCase()
  const related = trim(item?.relatedTo).toUpperCase()
  if (type !== followUpTypeValues.referralVerification) {
    return false
  }
  if (related !== followUpRelatedToValues.referral) {
    return false
  }

  return normalizeFollowUpReference(item?.reference) != null
}

export function isFollowUpForReferral(item, referralId) {
  const id = normalizeFollowUpReference(referralId)
  if (id == null) {
    return false
  }

  return trim(item?.relatedTo).toUpperCase()
    === followUpRelatedToValues.referral
    && String(normalizeFollowUpReference(item?.reference)) === String(id)
}

export function followUpExistsForReferral(section, referralId) {
  const id = normalizeFollowUpReference(referralId)
  if (id == null) {
    return false
  }

  const matches = item => isFollowUpForReferral(item, referralId)

  return (section?.pending ?? []).some(matches)
    || (section?.entries ?? []).some(
      item => matches(item) && followUpIsEditable(item),
    )
}

function sameReferralIdentity(left, right) {
  const a = normalizeFollowUpReference(left)
  const b = normalizeFollowUpReference(right)
  if (a == null || b == null) {
    return false
  }

  return String(a) === String(b)
}

export function shouldCreateFollowUpFromReferral(saved, previous) {
  if (!saved?.followUpRequired || saved?.id == null || saved?.id === '') {
    return false
  }
  if (
    previous?.followUpRequired
    && sameReferralIdentity(previous?.id, saved?.id)
  ) {
    return false
  }

  return true
}

export function shouldRemoveFollowUpFromReferral(saved, previous) {
  if (saved?.followUpRequired || saved?.id == null || saved?.id === '') {
    return false
  }
  if (!previous?.followUpRequired) {
    return false
  }

  return sameReferralIdentity(previous?.id, saved?.id)
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

export function snapshotPendingFollowUpsForReference(
  section,
  referralId,
) {
  return (section?.pending ?? [])
    .filter(item => isFollowUpForReferral(item, referralId))
    .map(item => ({ ...item }))
}

export function snapshotIntakePendingFollowUps(section) {
  return snapshotPendingFollowUpsForReference(
    section,
    INTAKE_REFERRAL_DRAFT_ID,
  )
}

export function upsertFollowUpFromReferralDraft(section, draft) {
  if (!section?.visible || !draft) {
    return { section, inserted: false }
  }
  const reference = normalizeFollowUpReference(draft.reference)
  if (reference == null) {
    return { section, inserted: false }
  }
  const nextDraft = { ...draft, reference }
  const pending = section.pending ?? []
  const pendingIndex = pending.findIndex(
    item => isFollowUpForReferral(item, reference),
  )
  if (pendingIndex >= 0) {
    const nextPending = [...pending]
    nextPending[pendingIndex] = {
      ...mapPendingFollowUpFromDraft(nextDraft),
      id: pending[pendingIndex].id,
      isPending: true,
    }

    return {
      section: { ...section, pending: nextPending },
      inserted: false,
    }
  }
  const entries = section.entries ?? []
  const entryIndex = entries.findIndex(
    item => isFollowUpForReferral(item, reference)
      && followUpIsEditable(item),
  )
  if (entryIndex >= 0) {
    const nextEntries = [...entries]
    nextEntries[entryIndex] = mapEntryFromDraft(
      entries[entryIndex],
      nextDraft,
    )

    return {
      section: { ...section, entries: nextEntries },
      inserted: false,
    }
  }

  return {
    section: {
      ...section,
      pending: [
        ...pending,
        mapPendingFollowUpFromDraft(nextDraft),
      ],
    },
    inserted: true,
  }
}

export function bindPendingFollowUpsToReferral(
  pendingItems,
  draftReference,
  referral,
) {
  const referralId = parseFollowUpReference(referral?.id)
  if (referralId == null) {
    return []
  }
  const label = buildReferralReferenceLabel(referral)

  return (pendingItems ?? [])
    .filter(item => isFollowUpForReferral(item, draftReference))
    .map(item => ({
      ...item,
      reference: referralId,
      referenceLabel: label || item.referenceLabel,
    }))
}

export function bindIntakeFollowUpsToReferral(pendingItems, referral) {
  return bindPendingFollowUpsToReferral(
    pendingItems,
    INTAKE_REFERRAL_DRAFT_ID,
    referral,
  )
}

export function resolveReferralFollowUpDueDateFallback() {
  return resolveFollowUpDueDateFromReferral(todayDateUs())
}
