import {
  getAppDateTimeConfig,
  resolveIntlTimeZone,
} from 'src/utils/app-datetime.js'

export function normalizeClinicalAuditItem(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const id = raw.id ?? raw.audit_id ?? raw.auditId
  if (id == null || String(id).trim() === '') {
    return null
  }

  return {
    id,
    clientId: raw.client_id ?? raw.clientId ?? null,
    clientName: String(
      raw.client_name ?? raw.clientName ?? '',
    ).trim(),
    entityType: String(raw.entity_type ?? raw.entityType ?? '').trim(),
    entityId: raw.entity_id ?? raw.entityId ?? null,
    entityName: String(
      raw.entity_name ?? raw.entityName ?? '',
    ).trim(),
    action: String(raw.action ?? '').trim(),
    changedBy: raw.changed_by ?? raw.changedBy ?? null,
    changedByName: String(
      raw.changed_by_name ?? raw.changedByName ?? '',
    ).trim(),
    ipAddress: String(raw.ip_address ?? raw.ipAddress ?? '').trim(),
    userAgent: String(raw.user_agent ?? raw.userAgent ?? '').trim(),
    correlationId: String(
      raw.correlation_id ?? raw.correlationId ?? '',
    ).trim(),
    reason: String(raw.reason ?? '').trim(),
    beforeJson: raw.before_json ?? raw.beforeJson ?? null,
    afterJson: raw.after_json ?? raw.afterJson ?? null,
    createdAt: raw.created_at ?? raw.createdAt ?? '',
  }
}

function trimLabel(value) {
  return String(value ?? '').trim()
}

/** Prefer API name; fall back to id; empty → em dash. */
export function clinicalAuditDisplayLabel(name, id) {
  const label = trimLabel(name)
  if (label) {
    return label
  }
  const rawId = trimLabel(id)
  if (rawId) {
    return rawId
  }

  return '—'
}

export function clinicalAuditIdTooltip(name, id) {
  const label = trimLabel(name)
  const rawId = trimLabel(id)
  if (label && rawId && label !== rawId) {
    return rawId
  }

  return ''
}

export function formatClinicalAuditJson(value) {
  if (value == null || value === '') {
    return ''
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value

    return JSON.stringify(parsed, null, 2)
  } catch {
    return String(value)
  }
}

export function formatClinicalAuditDateTime(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return '—'
  }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return raw
  }

  return date.toLocaleString()
}

/** Detail header: "Aug 8, 2026 • 12:19:16 AM (UTC-04:00)". */
export function formatClinicalAuditDetailDateTime(value, timezone = '') {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return '—'
  }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return raw
  }

  const config = getAppDateTimeConfig()
  const tzRaw = String(timezone || config.timezone || '').trim()
  const timeZone = resolveIntlTimeZone(tzRaw || 'UTC')
  let datePart = ''
  let timePart = ''
  try {
    datePart = new Intl.DateTimeFormat('en-US', {
      timeZone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
    timePart = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date)
  } catch {
    datePart = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    timePart = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  }

  return `${datePart} • ${timePart} (${tzRaw || timeZone})`
}

export const clinicalAuditActionValues = [
  'CREATED',
  'UPDATED',
  'DELETED',
  'VIEWED',
  'PREVIEW_FILE',
  'SIGNED',
  'CANCELLED',
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'EXPORTED',
  'AI_GENERATED',
  'AI_ACCEPTED',
  'AI_REJECTED',
]

export const clinicalAuditEntityTypeValues = [
  'CLIENT',
  'ALLERGY',
  'VITALS',
  'MEDICATION',
  'LAB',
  'CARE_PLAN',
  'CLINICAL_NOTE',
  'SCREENING',
  'REFERRAL',
  'FOLLOW_UP',
  'APPOINTMENT',
  'INSURANCE',
  'FAMILY_MEDICAL_HISTORY',
  'STORED_FILE',
  'AUTH_SESSION',
  'AI_SUGGESTION',
]

const ACTION_I18N_KEYS = {
  CREATED: 'clinicalAuditActionCreated',
  UPDATED: 'clinicalAuditActionUpdated',
  DELETED: 'clinicalAuditActionDeleted',
  VIEWED: 'clinicalAuditActionViewed',
  PREVIEW_FILE: 'clinicalAuditActionPreviewFile',
  SIGNED: 'clinicalAuditActionSigned',
  CANCELLED: 'clinicalAuditActionCancelled',
  LOGIN: 'clinicalAuditActionLogin',
  LOGOUT: 'clinicalAuditActionLogout',
  LOGIN_FAILED: 'clinicalAuditActionLoginFailed',
  EXPORTED: 'clinicalAuditActionExported',
  AI_GENERATED: 'clinicalAuditActionAiGenerated',
  AI_ACCEPTED: 'clinicalAuditActionAiAccepted',
  AI_REJECTED: 'clinicalAuditActionAiRejected',
}

const ENTITY_I18N_KEYS = {
  CLIENT: 'clinicalAuditEntityClient',
  ALLERGY: 'clinicalAuditEntityAllergy',
  VITALS: 'clinicalAuditEntityVitals',
  MEDICATION: 'clinicalAuditEntityMedication',
  LAB: 'clinicalAuditEntityLab',
  CARE_PLAN: 'clinicalAuditEntityCarePlan',
  CLINICAL_NOTE: 'clinicalAuditEntityClinicalNote',
  SCREENING: 'clinicalAuditEntityScreening',
  REFERRAL: 'clinicalAuditEntityReferral',
  FOLLOW_UP: 'clinicalAuditEntityFollowUp',
  APPOINTMENT: 'clinicalAuditEntityAppointment',
  INSURANCE: 'clinicalAuditEntityInsurance',
  FAMILY_MEDICAL_HISTORY: 'clinicalAuditEntityFamilyMedicalHistory',
  STORED_FILE: 'clinicalAuditEntityStoredFile',
  AUTH_SESSION: 'clinicalAuditEntityAuthSession',
  AI_SUGGESTION: 'clinicalAuditEntityAiSuggestion',
}

export function clinicalAuditActionI18nKey(action) {
  const token = String(action ?? '').trim().toUpperCase()

  return ACTION_I18N_KEYS[token] || ''
}

export function clinicalAuditEntityI18nKey(entityType) {
  const token = String(entityType ?? '').trim().toUpperCase()

  return ENTITY_I18N_KEYS[token] || ''
}

function clinicalAuditSortValue(row, sortBy) {
  const key = String(sortBy ?? '').trim()
  if (key === 'createdAt') {
    const ms = Date.parse(String(row?.createdAt ?? ''))

    return Number.isFinite(ms) ? ms : 0
  }
  if (key === 'changedBy') {
    return clinicalAuditDisplayLabel(row?.changedByName, row?.changedBy)
      .toLowerCase()
  }
  if (key === 'clientId') {
    return clinicalAuditDisplayLabel(row?.clientName, row?.clientId)
      .toLowerCase()
  }
  if (key === 'entityId') {
    return clinicalAuditDisplayLabel(row?.entityName, row?.entityId)
      .toLowerCase()
  }
  if (key === 'action') {
    return String(row?.action ?? '').trim().toLowerCase()
  }
  if (key === 'entityType') {
    return String(row?.entityType ?? '').trim().toLowerCase()
  }

  return ''
}

function compareClinicalAuditSortValues(left, right) {
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right
  }
  const a = String(left ?? '')
  const b = String(right ?? '')
  if (a < b) {
    return -1
  }
  if (a > b) {
    return 1
  }

  return 0
}

/** True when sort should be descending. Only explicit true → DESC. */
export function isClinicalAuditSortDescending(descending) {
  return descending === true
}

/** Client-side sort for the current page (fallback if API ignores sort). */
export function sortClinicalAuditRows(
  rows,
  sortBy = 'createdAt',
  descending = true,
) {
  const list = Array.isArray(rows) ? [...rows] : []
  const dir = isClinicalAuditSortDescending(descending) ? -1 : 1

  return list.sort((left, right) => {
    const cmp = compareClinicalAuditSortValues(
      clinicalAuditSortValue(left, sortBy),
      clinicalAuditSortValue(right, sortBy),
    )
    if (cmp !== 0) {
      return cmp * dir
    }

    return Number(left?.id ?? 0) - Number(right?.id ?? 0)
  })
}

function readJsonStringToken(source, start) {
  let end = start + 1
  while (end < source.length) {
    const char = source[end]
    if (char === '\\') {
      end += 2
      continue
    }
    if (char === '"') {
      return end + 1
    }
    end += 1
  }

  return end
}

function isJsonKeyString(source, afterString) {
  let look = afterString
  while (look < source.length && /\s/.test(source[look])) {
    look += 1
  }

  return source[look] === ':'
}

/**
 * Tokenize one pretty-printed JSON line for light syntax highlighting.
 * @returns {{ type: string, text: string }[]}
 */
export function highlightClinicalAuditJsonLine(line) {
  const source = String(line ?? '')
  const parts = []
  let index = 0

  while (index < source.length) {
    const char = source[index]
    if (/\s/.test(char)) {
      let end = index + 1
      while (end < source.length && /\s/.test(source[end])) {
        end += 1
      }
      parts.push({ type: 'plain', text: source.slice(index, end) })
      index = end
      continue
    }

    if (char === '"') {
      const end = readJsonStringToken(source, index)
      const text = source.slice(index, end)
      parts.push({
        type: isJsonKeyString(source, end) ? 'key' : 'string',
        text,
      })
      index = end
      continue
    }

    const numberMatch = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/
      .exec(source.slice(index))
    if (numberMatch) {
      parts.push({ type: 'number', text: numberMatch[0] })
      index += numberMatch[0].length
      continue
    }

    const literalMatch = /^(true|false|null)/.exec(source.slice(index))
    if (literalMatch) {
      parts.push({ type: 'literal', text: literalMatch[0] })
      index += literalMatch[0].length
      continue
    }

    parts.push({ type: 'plain', text: char })
    index += 1
  }

  return parts
}
