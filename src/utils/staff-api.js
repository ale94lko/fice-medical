import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { extractEnvelopeListPagination } from 'components/helpers.js'
import { mapStaffListItem } from 'src/utils/staff-list-normalize.js'
import { buildStaffListQueryParams } from 'src/utils/staff-list-filters.js'

function readEnvelope(response) {
  return response?.data?.data ?? response?.data ?? {}
}

function readItems(envelope) {
  return Array.isArray(envelope.items) ? envelope.items : []
}

function readSummary(envelope) {
  const summary = envelope?.summary ?? {}
  const totalStaff = Number(summary.total_staff ?? summary.totalStaff ?? 0)
  const clinicians = Number(summary.clinicians ?? 0)
  const activeStaff = Number(summary.active_staff ?? summary.activeStaff ?? 0)
  const onLeave = Number(summary.on_leave ?? summary.onLeave ?? 0)
  const expiringCredentials = Number(
    summary.expiring_credentials ?? summary.expiringCredentials ?? 0,
  )

  return {
    totalStaff: Number.isFinite(totalStaff) && totalStaff >= 0
      ? totalStaff
      : 0,
    clinicians: Number.isFinite(clinicians) && clinicians >= 0
      ? clinicians
      : 0,
    activeStaff: Number.isFinite(activeStaff) && activeStaff >= 0
      ? activeStaff
      : 0,
    onLeave: Number.isFinite(onLeave) && onLeave >= 0 ? onLeave : 0,
    expiringCredentials:
      Number.isFinite(expiringCredentials) && expiringCredentials >= 0
        ? expiringCredentials
        : 0,
  }
}

/**
 * @param {Record<string, unknown>} params
 * @returns {Promise<{
 *   items: unknown[],
 *   pagination: Record<string, unknown>,
 *   summary: {
 *     totalStaff: number,
 *     clinicians: number,
 *     activeStaff: number,
 *     onLeave: number,
 *     expiringCredentials: number,
 *   },
 * }>}
 */
export async function fetchStaffListPage(params = {}) {
  const response = await apiInstance.get(apiPaths.staffList, { params })
  const envelope = readEnvelope(response)

  return {
    items: readItems(envelope),
    pagination: extractEnvelopeListPagination(envelope) ?? {},
    summary: readSummary(envelope),
  }
}

export async function loadStaffListView({
  page = 0,
  limit = 20,
  q = '',
  summaryFilter = null,
  filters = null,
  t,
} = {}) {
  const params = buildStaffListQueryParams({
    page,
    limit,
    q,
    summaryFilter,
    filters,
  })
  const { items, pagination, summary } = await fetchStaffListPage(params)
  const rows = items
    .map(item => mapStaffListItem(item, t))
    .filter(Boolean)

  return {
    rows,
    pagination,
    summary,
    params,
  }
}

export async function fetchStaffById(id) {
  const response = await apiInstance.get(apiPaths.staffById(id))

  return readEnvelope(response)
}

export async function createStaff(payload) {
  const response = await apiInstance.post(apiPaths.staffList, payload)

  return readEnvelope(response)
}

export async function patchStaff(id, payload) {
  const response = await apiInstance.patch(apiPaths.staffById(id), payload)

  return readEnvelope(response)
}

export async function patchStaffStatus(id, status) {
  const response = await apiInstance.patch(apiPaths.staffStatus(id), {
    status,
  })

  return readEnvelope(response)
}

export async function patchStaffStatusBulk(ids, status) {
  const results = await Promise.all(
    ids.map(id => patchStaffStatus(id, status)),
  )

  return results
}

export async function lookupStaffNpi(npi) {
  const response = await apiInstance.get(apiPaths.staffNpiLookup, {
    params: { npi: String(npi ?? '').trim() },
  })

  return readEnvelope(response)
}

export async function fetchStaffPositionIsClinical(code) {
  const response = await apiInstance.get(
    apiPaths.staffPositionIsClinical(code),
  )
  const envelope = readEnvelope(response)

  return Boolean(envelope.is_clinical)
}
