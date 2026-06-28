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

/**
 * @param {Record<string, unknown>} params
 * @returns {Promise<{ items: unknown[], pagination: Record<string, unknown> }>}
 */
export async function fetchStaffListPage(params = {}) {
  const response = await apiInstance.get(apiPaths.staffList, { params })
  const envelope = readEnvelope(response)

  return {
    items: readItems(envelope),
    pagination: extractEnvelopeListPagination(envelope) ?? {},
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
  const { items, pagination } = await fetchStaffListPage(params)
  const rows = items
    .map(item => mapStaffListItem(item, t))
    .filter(Boolean)

  return { rows, pagination, params }
}

export async function fetchStaffSummaryCount(options = {}) {
  const params = buildStaffListQueryParams({
    ...options,
    page: 0,
    limit: 1,
  })
  const { pagination } = await fetchStaffListPage(params)

  return Number(pagination?.total ?? 0) || 0
}

export async function fetchStaffSummaryMetrics({
  panelFilters = null,
} = {}) {
  const filters = panelFilters ?? {}
  const [
    totalStaff,
    clinicians,
    activeStaff,
    onLeave,
    expiringCredentials,
  ] = await Promise.all([
    fetchStaffSummaryCount({ filters }),
    fetchStaffSummaryCount({
      filters,
      summaryFilter: 'clinicians',
    }),
    fetchStaffSummaryCount({
      filters,
      summaryFilter: 'activeStaff',
    }),
    fetchStaffSummaryCount({
      filters,
      summaryFilter: 'onLeave',
    }),
    fetchStaffSummaryCount({
      filters,
      summaryFilter: 'expiringCredentials',
    }),
  ])

  return {
    totalStaff,
    clinicians,
    activeStaff,
    onLeave,
    expiringCredentials,
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

export async function fetchRolesList() {
  const response = await apiInstance.get(apiPaths.rolesList)
  const envelope = readEnvelope(response)
  const items = Array.isArray(envelope.items)
    ? envelope.items
    : Array.isArray(envelope)
      ? envelope
      : []

  return items.map(row => ({
    label: String(row.name ?? row.label ?? '').trim(),
    value: row.id ?? row.role_id ?? row.value,
  })).filter(opt => opt.label && opt.value != null)
}
