/* eslint-disable camelcase -- API payloads use snake_case */
import {
  followUpPriorityValues,
  followUpReminderUnitValues,
  followUpStatuses,
  followUpStoredStatuses,
} from 'components/constants.js'
import {
  isoDateToUsDateString,
  usDateToIso,
} from 'src/utils/client-form.js'
import {
  followUpRelatedToRequiresReference,
  parseFollowUpReference,
} from 'src/utils/follow-up-reference.js'

let localFollowUpIdCounter = 0

function trim(value) {
  return String(value ?? '').trim()
}

function parseOptionalNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) ? n : null
}

function parseOptionalBool(value) {
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true
  }
  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false
  }

  return false
}

function dueDateFromApi(value) {
  const raw = trim(value)
  if (!raw) {
    return ''
  }
  if (raw.includes('/')) {
    return raw
  }

  return isoDateToUsDateString(raw) || raw
}

function dueDateToApi(value) {
  const raw = trim(value)
  if (!raw) {
    return ''
  }
  if (raw.includes('/')) {
    return usDateToIso(raw) || raw
  }

  return raw
}

function resolveProviderId(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) {
    return null
  }

  return n
}

export function nextFollowUpLocalId() {
  localFollowUpIdCounter += 1

  return `local-follow-up-${Date.now()}-${localFollowUpIdCounter}`
}

export function createEmptyFollowUpsSection() {
  return {
    visible: true,
    entries: [],
    pending: [],
  }
}

function isLocalFollowUpId(id) {
  return String(id ?? '').startsWith('local-follow-up-')
}

export function mapEntryFromDraft(existing, draft) {
  const base = existing ?? mapPendingFollowUpFromDraft(draft)

  return {
    ...base,
    type: trim(draft?.type).toUpperCase() || base.type,
    dueDate: trim(draft?.dueDate) || base.dueDate,
    assignedProviderId: draft?.assignedProviderId ?? base.assignedProviderId,
    priority: trim(draft?.priority ?? base.priority).toUpperCase(),
    relatedTo: trim(draft?.relatedTo).toUpperCase() || null,
    reference: parseFollowUpReference(draft?.reference),
    referenceLabel: trim(draft?.referenceLabel) || null,
    notes: trim(draft?.notes),
    reminderEnabled: Boolean(draft?.reminderEnabled),
    reminderValue: parseOptionalNumber(draft?.reminderValue),
    reminderUnit: trim(draft?.reminderUnit ?? base.reminderUnit).toUpperCase()
      || null,
    isDirty: !base.isPending,
    pendingAction: null,
  }
}

export function applyLocalFollowUpComplete(entry) {
  return {
    ...entry,
    status: followUpStatuses.completed,
    storedStatus: followUpStoredStatuses.completed,
    overdue: false,
    pendingAction: 'complete',
    isDirty: false,
  }
}

export function applyLocalFollowUpCancel(entry, notes = '') {
  const noteText = trim(notes) || entry.notes

  return {
    ...entry,
    status: followUpStatuses.cancelled,
    storedStatus: followUpStoredStatuses.cancelled,
    overdue: false,
    notes: noteText,
    pendingAction: 'cancel',
    isDirty: false,
  }
}

export function followUpsSectionHasUnsavedChanges(section) {
  if ((section?.pending ?? []).length > 0) {
    return true
  }

  return (section?.entries ?? []).some(entry =>
    entry.isDirty || Boolean(entry.pendingAction),
  )
}

export function buildFollowUpsForSave(section) {
  if (!section?.visible) {
    return []
  }
  const payloads = []

  for (const item of section.pending ?? []) {
    payloads.push(buildFollowUpCreatePayload(item))
  }

  for (const entry of section.entries ?? []) {
    if (entry.pendingAction === 'complete') {
      payloads.push(buildFollowUpCompletePayload(entry.id))
      continue
    }
    if (entry.pendingAction === 'cancel') {
      payloads.push(buildFollowUpCancelPayload(entry.id, entry.notes))
      continue
    }
    if (entry.isDirty && !isLocalFollowUpId(entry.id)) {
      payloads.push(buildFollowUpUpdatePayload(entry.id, entry))
    }
  }

  return payloads
}

export function mapFollowUpFromApi(raw) {
  const item = raw ?? {}
  const storedStatus = trim(
    item.stored_status ?? item.storedStatus ?? item.status,
  ).toUpperCase() || followUpStoredStatuses.scheduled
  const effectiveStatus = trim(item.status ?? storedStatus).toUpperCase()
    || followUpStatuses.scheduled

  return {
    id: item.id != null ? String(item.id) : '',
    clientId: item.client_id ?? item.clientId ?? null,
    type: trim(item.type).toUpperCase(),
    dueDate: dueDateFromApi(item.due_date ?? item.dueDate),
    assignedProviderId: item.assigned_provider_id ?? item.assignedProviderId
      ?? null,
    priority: trim(
      item.priority ?? followUpPriorityValues.medium,
    ).toUpperCase(),
    relatedTo: trim(item.related_to ?? item.relatedTo).toUpperCase() || null,
    reference: parseFollowUpReference(item.reference),
    referenceLabel: null,
    notes: trim(item.notes),
    reminderEnabled: parseOptionalBool(
      item.reminder_enabled ?? item.reminderEnabled,
    ),
    reminderValue: parseOptionalNumber(
      item.reminder_value ?? item.reminderValue,
    ),
    reminderUnit: trim(
      item.reminder_unit ?? item.reminderUnit,
    ).toUpperCase() || null,
    remindAtUtc: item.remind_at_utc ?? item.remindAtUtc ?? null,
    reminderSentAtUtc: item.reminder_sent_at_utc
      ?? item.reminderSentAtUtc
      ?? null,
    status: effectiveStatus,
    storedStatus,
    overdue: Boolean(item.overdue),
    completedAt: item.completed_at ?? item.completedAt ?? null,
    cancelledAt: item.cancelled_at ?? item.cancelledAt ?? null,
    createdAt: item.created_at ?? item.createdAt ?? null,
    updatedAt: item.updated_at ?? item.updatedAt ?? null,
    isPending: false,
    isDirty: false,
    pendingAction: null,
  }
}

export function mapFollowUpsSectionFromApi(client) {
  if (client?.follow_ups === null) {
    return {
      visible: false,
      entries: [],
      pending: [],
    }
  }
  const list = Array.isArray(client?.follow_ups) ? client.follow_ups : []

  return {
    visible: true,
    entries: list.map(mapFollowUpFromApi),
    pending: [],
  }
}

function buildFollowUpFieldsFromDraft(draft) {
  const reminderEnabled = Boolean(draft?.reminderEnabled)
  const relatedTo = trim(draft?.relatedTo).toUpperCase() || null
  const body = {
    type: trim(draft?.type).toUpperCase(),
    due_date: dueDateToApi(draft?.dueDate),
    assigned_provider_id: resolveProviderId(draft?.assignedProviderId),
    priority: trim(draft?.priority ?? followUpPriorityValues.medium)
      .toUpperCase(),
    notes: trim(draft?.notes),
    reminder_enabled: reminderEnabled,
  }

  if (relatedTo) {
    body.related_to = relatedTo
    if (followUpRelatedToRequiresReference(relatedTo)) {
      body.reference = parseFollowUpReference(draft?.reference)
    } else {
      body.reference = null
    }
  }

  if (reminderEnabled) {
    body.reminder_value = parseOptionalNumber(draft?.reminderValue)
    body.reminder_unit = trim(
      draft?.reminderUnit ?? followUpReminderUnitValues.daysBefore,
    ).toUpperCase()
  }

  return body
}

export function buildFollowUpCreatePayload(draft) {
  return buildFollowUpFieldsFromDraft(draft)
}

export function buildFollowUpUpdatePayload(id, draft) {
  const numericId = Number(id)

  return {
    id: Number.isFinite(numericId) ? numericId : id,
    ...buildFollowUpFieldsFromDraft(draft),
  }
}

export function buildFollowUpCompletePayload(id) {
  const numericId = Number(id)

  return {
    id: Number.isFinite(numericId) ? numericId : id,
    complete: true,
  }
}

export function buildFollowUpCancelPayload(id, notes = '') {
  const numericId = Number(id)
  const payload = {
    id: Number.isFinite(numericId) ? numericId : id,
    cancel: true,
  }
  const noteText = trim(notes)
  if (noteText) {
    payload.notes = noteText
  }

  return payload
}

export function buildFollowUpsForRegister(section) {
  return (section?.pending ?? [])
    .map(item => buildFollowUpCreatePayload(item))
    .filter(row => row.type && row.due_date && row.assigned_provider_id)
}

export function mapPendingFollowUpFromDraft(draft) {
  const mapped = {
    ...mapFollowUpFromApi({
      ...buildFollowUpCreatePayload(draft),
      id: nextFollowUpLocalId(),
      status: followUpStatuses.scheduled,
      stored_status: followUpStoredStatuses.scheduled,
    }),
    isPending: true,
    isDirty: false,
    pendingAction: null,
    referenceLabel: trim(draft?.referenceLabel) || null,
  }

  return mapped
}

export function followUpIsEditable(record) {
  return String(record?.storedStatus ?? '').toUpperCase()
    === followUpStoredStatuses.scheduled
}

export function followUpEffectiveStatus(record) {
  return String(record?.status ?? followUpStatuses.scheduled).toUpperCase()
}
