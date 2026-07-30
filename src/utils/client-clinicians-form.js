import { clientFieldKeys } from 'components/constants.js'

const ck = clientFieldKeys

function clinicianIdFromApiEntry(entry) {
  if (entry == null || entry === '') {
    return null
  }
  if (typeof entry === 'object') {
    const id = entry.id ?? entry.clinician_id
    if (id == null || id === '') {
      return null
    }

    return String(id)
  }

  return String(entry)
}

function clinicianIsPrimaryFromApiEntry(entry) {
  if (entry == null || typeof entry !== 'object') {
    return false
  }

  return Boolean(entry.is_primary ?? entry.isPrimary)
}

export function withPrimaryClinicianFirst(ids, primaryId) {
  const list = []
  const seen = new Set()
  for (const raw of ids ?? []) {
    const id = String(raw ?? '').trim()
    if (!id || seen.has(id)) {
      continue
    }
    seen.add(id)
    list.push(id)
  }
  const primary = String(primaryId ?? '').trim()
  if (!primary || !seen.has(primary)) {
    return list
  }

  return [primary, ...list.filter(id => id !== primary)]
}

/**
 * Keeps the previous primary (first id) first when the multi-select changes.
 */
export function ensureCliniciansSelectionOrder(prevIds, nextIds) {
  const next = withPrimaryClinicianFirst(nextIds, null)
  const prevPrimary = String(prevIds?.[0] ?? '').trim()
  if (prevPrimary && next.includes(prevPrimary)) {
    return withPrimaryClinicianFirst(next, prevPrimary)
  }

  return next
}

export function normalizeClinicianIdsForForm(raw) {
  if (!Array.isArray(raw)) {
    return []
  }

  const items = []
  const seen = new Set()
  for (const entry of raw) {
    const id = clinicianIdFromApiEntry(entry)
    if (!id || seen.has(id)) {
      continue
    }
    seen.add(id)
    items.push({
      id,
      isPrimary: clinicianIsPrimaryFromApiEntry(entry),
    })
  }

  const primary = items.find(item => item.isPrimary)
  if (primary) {
    return withPrimaryClinicianFirst(
      items.map(item => item.id),
      primary.id,
    )
  }

  return items.map(item => item.id)
}

export function resolveCliniciansFormValue(client, personal) {
  const fromList = client?.clinicians
    ?? client?.clinician_assignments
    ?? personal?.clinicians
  const normalized = normalizeClinicianIdsForForm(fromList)
  if (normalized.length) {
    return normalized
  }

  const single = personal?.clinician_id
    ?? client?.clinician_id
    ?? personal?.assigned_clinician_id
    ?? personal?.primary_clinician_id
    ?? client?.primary_clinician_id
  if (single != null && single !== '') {
    return [String(single)]
  }

  return []
}

export function resolveClinicianIdsForApi(form) {
  const raw = form?.[ck.clinicians]
  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .map(id => Number(id))
    .filter(id => Number.isFinite(id))
}

export function resolvePrimaryClinicianIdForApi(form) {
  const ids = resolveClinicianIdsForApi(form)

  return ids.length ? ids[0] : null
}

export function formHasAssignedClinicians(form) {
  return resolveClinicianIdsForApi(form).length > 0
}
