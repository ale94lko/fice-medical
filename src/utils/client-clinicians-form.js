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

export function normalizeClinicianIdsForForm(raw) {
  if (!Array.isArray(raw)) {
    return []
  }

  const ids = raw
    .map(clinicianIdFromApiEntry)
    .filter(Boolean)

  return [...new Set(ids)]
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
