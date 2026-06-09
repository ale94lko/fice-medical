/* eslint-disable camelcase -- match API uses snake_case */
import { apiInstance } from 'boot/axios'
import { apiPaths, clientFieldKeys, clientFormSections } from
  'components/constants.js'
import { normalizePhoneDigits } from 'src/utils/client-contact-form.js'
import { usDateToIso } from 'src/utils/client-form.js'
import { sortDuplicateMatches } from 'src/utils/client-duplicate-match-sort.js'

const ck = clientFieldKeys

function trim(value) {
  return String(value ?? '').trim()
}

function collectPhonesFromContact(contact) {
  const phones = contact?.phones ?? []
  const out = []
  for (const p of phones) {
    const raw = trim(p?.number)
    if (!raw) {
      continue
    }
    const digits = normalizePhoneDigits(raw)
    if (digits) {
      out.push(digits)
    } else {
      out.push(raw)
    }
  }

  return out
}

function collectEmailsFromContact(contact) {
  const emails = contact?.emails ?? []
  const out = []
  for (const e of emails) {
    const addr = trim(e?.address)
    if (addr) {
      out.push(addr)
    }
  }

  return out
}

/**
 * Builds POST /client/v1/match body from the add-client form.
 * Call only when first + last name are non-empty.
 */
export function buildClientMatchRequestBody(form) {
  const contact = form?.[clientFormSections.contact] ?? {}
  const first = trim(form?.[ck.firstName])
  const last = trim(form?.[ck.lastName])
  const dobIso = usDateToIso(form?.[ck.dob] ?? '')

  return {
    first_name: first,
    last_name: last,
    date_of_birth: dobIso || null,
    emails: collectEmailsFromContact(contact),
    phones: collectPhonesFromContact(contact),
  }
}

function firstTimestampMs(raw, keys) {
  for (const key of keys) {
    const ms = parseSortTimestampMs(raw?.[key])
    if (ms > 0) {
      return ms
    }
  }

  return 0
}

function parseSortTimestampMs(value) {
  if (value == null || value === '') {
    return 0
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 1e11) {
      return Math.trunc(value)
    }
    if (value > 1e9) {
      return Math.trunc(value * 1000)
    }

    return 0
  }
  const n = Number(value)
  if (Number.isFinite(n)) {
    if (n > 1e11) {
      return Math.trunc(n)
    }
    if (n > 1e9) {
      return Math.trunc(n * 1000)
    }
  }
  const parsed = Date.parse(String(value))
  if (Number.isFinite(parsed)) {
    return parsed
  }

  return 0
}

function normalizePatientIsActive(raw) {
  if (raw.is_active === false || raw.active === false) {
    return false
  }
  if (raw.is_active === true || raw.active === true) {
    return true
  }
  const token = String(raw.patient_status ?? raw.status ?? '')
    .trim()
    .toLowerCase()
  if (
    token === 'inactive'
    || token === 'closed'
    || token === '0'
    || token === 'false'
  ) {
    return false
  }
  if (
    token === 'active'
    || token === 'open'
    || token === '1'
    || token === 'true'
  ) {
    return true
  }

  return null
}

/**
 * Optional match row fields used for ordering (see sortDuplicateMatches):
 * match_created_at | matched_at | match_timestamp
 * last_updated | updated_at | client_last_updated | modified_at
 * is_active | active | patient_status | status
 */
function normalizeMatchRow(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const patientId = raw.patient_id ?? raw.patientId ?? raw.client_id
  const idNum = Number(patientId)
  if (!Number.isFinite(idNum)) {
    return null
  }

  const matchRecordedAtMs = firstTimestampMs(raw, [
    'match_created_at',
    'matchCreatedAt',
    'matched_at',
    'matchedAt',
    'match_timestamp',
    'matchTimestamp',
  ])
  const clientLastUpdatedAtMs = firstTimestampMs(raw, [
    'last_updated',
    'lastUpdated',
    'updated_at',
    'updatedAt',
    'client_last_updated',
    'clientLastUpdated',
    'modified_at',
    'modifiedAt',
  ])

  return {
    patientId: idNum,
    fullName: String(raw.full_name ?? raw.fullName ?? '').trim()
      || `Client #${idNum}`,
    dateOfBirth: String(raw.date_of_birth ?? raw.dateOfBirth ?? '').trim(),
    matchConfidence: String(raw.match_confidence ?? raw.matchConfidence ?? '')
      .trim(),
    matchScore: Number(raw.match_score ?? raw.matchScore ?? 0) || 0,
    matchRecordedAtMs,
    clientLastUpdatedAtMs,
    patientIsActive: normalizePatientIsActive(raw),
  }
}

/**
 * @returns {{
 *   hasMatches: boolean,
 *   matches: Array<ReturnType<typeof normalizeMatchRow>>
 * }}
 */
export async function fetchClientMatchCandidates(form) {
  const body = buildClientMatchRequestBody(form)
  if (!body.first_name || !body.last_name) {
    return { hasMatches: false, matches: [] }
  }

  const response = await apiInstance.post(apiPaths.clientMatch, body)
  const root = response?.data?.data
  const hasMatches = Boolean(root?.has_matches)
  const rawList = Array.isArray(root?.matches) ? root.matches : []
  const matches = rawList
    .map(normalizeMatchRow)
    .filter(Boolean)

  return {
    hasMatches: hasMatches && matches.length > 0,
    matches: sortDuplicateMatches(matches),
  }
}
