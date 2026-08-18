/* eslint-disable camelcase -- API payloads use snake_case */
import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { fetchCliniciansListPage, paginationTotalPages } from
  'src/utils/clinicians-api.js'
import {
  mapClinicianListRowToAssignment,
  normalizeAssignedClinician,
} from 'src/utils/client-clinician-normalize.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

function unwrapClinicians(body) {
  const data = unwrapData(body)
  if (Array.isArray(data)) {
    return data
  }
  if (Array.isArray(data?.clinicians)) {
    return data.clinicians
  }
  if (Array.isArray(data?.items)) {
    return data.items
  }

  return []
}

export function clientClinicianApiErrorMessage(
  error,
  fallback = 'Request failed',
) {
  const data = error?.response?.data
  const message = data?.error_description
    ?? data?.message
    ?? error?.message

  return String(message || fallback)
}

export async function listClientClinicians(clientId) {
  const response = await apiInstance.get(
    apiPaths.clientClinicians(clientId),
  )

  return unwrapClinicians(response.data)
    .map(normalizeAssignedClinician)
    .filter(Boolean)
}

export async function replaceClientClinicians(clientId, clinicianIds) {
  const response = await apiInstance.put(
    apiPaths.clientClinicians(clientId),
    { clinician_ids: clinicianIds },
  )

  return unwrapClinicians(response.data)
    .map(normalizeAssignedClinician)
    .filter(Boolean)
}

export async function listActiveCliniciansForAssignment() {
  const all = []
  let page = 0
  let totalPages = 1
  while (page < totalPages && page < 50) {
    const { items, pagination } = await fetchCliniciansListPage({
      limit: 100,
      page,
      status: 'ACTIVE',
    })
    all.push(...items)
    totalPages = paginationTotalPages(pagination)
    if (!items.length) {
      break
    }
    page += 1
  }

  return mapAvailableClinicians(all)
}

export async function mergeClientClinicians(clientId, clinicianIds) {
  const current = await listClientClinicians(clientId)
  const nextIds = [...new Set([
    ...current.map(row => row.id),
    ...(Array.isArray(clinicianIds) ? clinicianIds : []),
  ])]

  return replaceClientClinicians(clientId, nextIds)
}

export async function mergeClientCliniciansForMany(
  clientIds,
  clinicianIds,
) {
  const ids = (Array.isArray(clientIds) ? clientIds : [])
    .map(id => String(id ?? '').trim())
    .filter(Boolean)
  const failures = []
  for (const clientId of ids) {
    try {
      await mergeClientClinicians(clientId, clinicianIds)
    } catch (error) {
      failures.push({ clientId, error })
    }
  }
  if (failures.length) {
    const error = new Error('assign-clinicians-partial-failure')
    error.failures = failures
    error.savedCount = ids.length - failures.length
    throw error
  }

  return ids.length
}

export function mapAvailableClinicians(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map(mapClinicianListRowToAssignment)
    .filter(Boolean)
}
