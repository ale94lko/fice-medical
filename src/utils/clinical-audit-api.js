/* eslint-disable camelcase -- API query params use snake_case */
import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { extractEnvelopeListPagination } from 'components/helpers.js'
import { utcRangeForLocalDay } from 'src/utils/appointment-datetime.js'
import { usDateToIso } from 'src/utils/client-form.js'
import { normalizeClinicalAuditItem } from
  'src/utils/clinical-audit-normalize.js'

/** Display date → UTC ISO for start (from) or end (to) of that local day. */
function displayDateToUtcBound(value, bound) {
  const dayKey = usDateToIso(value)
  if (!dayKey) {
    return ''
  }
  const range = utcRangeForLocalDay(dayKey)

  return bound === 'end' ? range.toUtc : range.fromUtc
}

function unwrapListRoot(body) {
  const root = body?.data ?? body
  if (Array.isArray(root?.items)) {
    return root
  }
  if (Array.isArray(root)) {
    return { items: root, pagination: null }
  }

  return root
}

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

function trimOrEmpty(value) {
  return String(value ?? '').trim()
}

const SORT_BY_TO_API = {
  createdAt: 'created_at',
  changedBy: 'changed_by_name',
  clientNumber: 'client_name',
  clientId: 'client_name',
  entityId: 'entity_name',
  action: 'action',
  entityType: 'entity_type',
}

function mapClinicalAuditSortBy(sortBy) {
  const key = String(sortBy ?? '').trim()
  if (!key || key === 'actions') {
    return ''
  }

  return SORT_BY_TO_API[key] || ''
}

function buildListQueryParams(params = {}) {
  const uiPage = Math.max(1, Number(params.page ?? 1))
  const limit = Math.max(1, Number(params.limit ?? 20))
  const query = {
    page: uiPage - 1,
    limit,
  }

  const clientNumber = trimOrEmpty(params.clientNumber ?? params.clientId)
  if (clientNumber) {
    query.client_number = clientNumber
  }
  const entityType = trimOrEmpty(params.entityType)
  if (entityType) {
    query.entity_type = entityType
  }
  const entityId = trimOrEmpty(params.entityId)
  if (entityId) {
    query.entity_id = entityId
  }
  const action = trimOrEmpty(params.action)
  if (action) {
    query.action = action
  }
  const changedBy = trimOrEmpty(params.changedBy)
  if (changedBy) {
    query.changed_by = changedBy
  }
  const fromUtc = displayDateToUtcBound(params.from, 'start')
  if (fromUtc) {
    query.from = fromUtc
  }
  const toUtc = displayDateToUtcBound(params.to, 'end')
  if (toUtc) {
    query.to = toUtc
  }
  const sortBy = mapClinicalAuditSortBy(params.sortBy)
  if (sortBy) {
    query.sort_by = sortBy
    query.sort_dir = resolveClinicalAuditSortDir(params.descending)
  }

  return query
}

function resolveClinicalAuditSortDir(descending) {
  return descending === true ? 'DESC' : 'ASC'
}

export function clinicalAuditApiErrorMessage(
  error,
  fallback = 'Request failed',
) {
  const data = error?.response?.data
  const message = data?.error?.message
    ?? data?.message
    ?? error?.message

  return String(message || fallback)
}

export async function listClinicalAudit(params = {}) {
  const response = await apiInstance.get(apiPaths.clinicalAuditList, {
    params: buildListQueryParams(params),
  })
  const root = unwrapListRoot(response.data)
  const pagination = extractEnvelopeListPagination(root)
    ?? root?.pagination
    ?? null

  return {
    items: (root?.items ?? [])
      .map(item => normalizeClinicalAuditItem(item))
      .filter(Boolean),
    pagination,
  }
}

export async function fetchClinicalAuditById(id) {
  const response = await apiInstance.get(apiPaths.clinicalAuditById(id))
  const raw = unwrapData(response.data)

  return normalizeClinicalAuditItem(raw)
}
