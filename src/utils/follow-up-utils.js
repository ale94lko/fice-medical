import {
  followUpNotesMaxLength,
  followUpPriorityValues,
  followUpRelatedToValues,
  followUpReminderUnitValues,
  followUpTypeValues,
} from 'components/constants.js'
import {
  followUpEffectiveStatus,
  followUpIsEditable,
} from 'src/utils/client-follow-ups.js'
import {
  followUpRelatedToRequiresReference,
  parseFollowUpReference,
} from 'src/utils/follow-up-reference.js'
import {
  isCompleteUsDateString,
  parseUsDateString,
} from 'src/utils/client-form.js'

function followUpOptionLabelKey(prefix, value) {
  const suffix = String(value ?? '')
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('')

  return `${prefix}${suffix}`
}

export function createEmptyFollowUpDraft() {
  return {
    type: null,
    dueDate: '',
    assignedProviderId: null,
    priority: followUpPriorityValues.medium,
    relatedTo: null,
    reference: null,
    referenceLabel: '',
    notes: '',
    reminderEnabled: true,
    reminderValue: 3,
    reminderUnit: followUpReminderUnitValues.daysBefore,
  }
}

export function followUpTypeOptionKeys() {
  return Object.values(followUpTypeValues)
}

export function followUpPriorityOptionKeys() {
  return Object.values(followUpPriorityValues)
}

export function followUpRelatedToKeys() {
  return Object.values(followUpRelatedToValues)
}

export function buildFollowUpTypeOptions(t) {
  return followUpTypeOptionKeys().map(value => ({
    label: t(followUpOptionLabelKey('followUpType', value)),
    value,
  }))
}

export function buildFollowUpPriorityOptions(t) {
  return followUpPriorityOptionKeys().map(value => ({
    label: t(followUpOptionLabelKey('followUpPriority', value)),
    value,
  }))
}

export function followUpRelatedToLabel(t, relatedTo) {
  const value = String(relatedTo ?? '').trim().toUpperCase()
  const match = followUpRelatedToKeys().find(key => key === value)
  if (!match) {
    return value || ''
  }

  return t(followUpOptionLabelKey('followUpRelatedTo', match))
}

export function buildFollowUpRelatedToOptions(t) {
  return followUpRelatedToKeys().map(value => ({
    label: t(followUpOptionLabelKey('followUpRelatedTo', value)),
    value,
  }))
}

export function buildFollowUpReminderUnitOptions(t) {
  return [
    followUpReminderUnitValues.daysBefore,
    followUpReminderUnitValues.weeksBefore,
  ].map(value => ({
    label: t(followUpOptionLabelKey('followUpReminderUnit', value)),
    value,
  }))
}

export function buildFollowUpReminderValueOptions() {
  return [1, 2, 3, 5, 7, 14, 21, 30].map(value => ({
    label: String(value),
    value,
  }))
}

export function resolveFollowUpDisplayStatus(record) {
  return followUpEffectiveStatus(record)
}

export function validateFollowUpDraft(draft, t, options = {}) {
  const errors = {}
  const type = String(draft?.type ?? '').trim()
  if (!type) {
    errors.type = t('followUpTypeRequired')
  }
  const dueDate = String(draft?.dueDate ?? '').trim()
  if (!dueDate) {
    errors.dueDate = t('followUpDueDateRequired')
  } else if (!isCompleteUsDateString(dueDate) || !parseUsDateString(dueDate)) {
    errors.dueDate = t('followUpDueDateInvalid')
  }
  const providerId = Number(draft?.assignedProviderId)
  if (!Number.isFinite(providerId) || providerId <= 0) {
    errors.assignedProviderId = t('followUpAssignedProviderRequired')
  }
  const relatedTo = String(draft?.relatedTo ?? '').trim().toUpperCase() || null
  if (relatedTo && followUpRelatedToRequiresReference(relatedTo)) {
    const refId = parseFollowUpReference(draft?.reference)
    const refOptions = options.referenceOptions ?? []
    if (refId == null) {
      errors.reference = t('followUpReferenceRequired')
    } else if (refOptions.length === 0) {
      errors.reference = t('followUpReferenceNoOptions')
    } else if (!refOptions.some(opt => opt.reference === refId)) {
      errors.reference = t('followUpReferenceInvalid')
    }
  }
  const notes = String(draft?.notes ?? '')
  if (notes.length > followUpNotesMaxLength) {
    errors.notes = t('followUpNotesMaxLength', {
      max: followUpNotesMaxLength,
    })
  }
  if (draft?.reminderEnabled) {
    const reminderValue = Number(draft?.reminderValue)
    if (!Number.isFinite(reminderValue) || reminderValue <= 0) {
      errors.reminderValue = t('followUpReminderValueRequired')
    }
    if (!String(draft?.reminderUnit ?? '').trim()) {
      errors.reminderUnit = t('followUpReminderUnitRequired')
    }
  }

  return errors
}

export function followUpDraftFromRecord(record) {
  return {
    type: record?.type ?? null,
    dueDate: record?.dueDate ?? '',
    assignedProviderId: record?.assignedProviderId ?? null,
    priority: record?.priority ?? followUpPriorityValues.medium,
    relatedTo: record?.relatedTo ?? null,
    reference: parseFollowUpReference(record?.reference),
    referenceLabel: record?.referenceLabel ?? '',
    notes: record?.notes ?? '',
    reminderEnabled: Boolean(record?.reminderEnabled),
    reminderValue: record?.reminderValue ?? 3,
    reminderUnit: record?.reminderUnit
      ?? followUpReminderUnitValues.daysBefore,
  }
}

export function providerLabelForFollowUp(record, clinicianOptions = []) {
  const id = String(record?.assignedProviderId ?? '').trim()
  if (!id) {
    return ''
  }
  const match = (clinicianOptions ?? []).find(
    opt => String(opt?.value ?? '') === id,
  )

  return String(match?.label ?? '').trim()
}

export function followUpStatusLabel(t, status) {
  return t(followUpOptionLabelKey('followUpStatus', status))
}

export function followUpCanEditRecord(record) {
  return followUpIsEditable(record)
}

export function followUpCanViewRecord(record) {
  return !followUpIsEditable(record)
}
