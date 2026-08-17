import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { extractEnvelopeListPagination } from 'components/helpers.js'
import {
  normalizeFinancialSummary,
  normalizeLedgerEntry,
  normalizeLedgerList,
} from 'src/utils/ledger-normalize.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

export function ledgerApiErrorMessage(
  error,
  fallback = 'Request failed',
) {
  const data = error?.response?.data
  const message = data?.message
    ?? data?.error_description
    ?? data?.error
    ?? error?.message

  return String(message || fallback)
}

export async function getClientFinancialSummary(
  clientId,
  { asOf } = {},
) {
  const id = String(clientId ?? '').trim()
  const params = {}
  if (asOf) {
    params['as_of'] = asOf
  }
  const { data } = await apiInstance.get(
    apiPaths.clientFinancialSummary(id),
    { params },
  )

  return normalizeFinancialSummary(unwrapData(data))
}

export async function listClientLedger(
  clientId,
  {
    from,
    to,
    entryType,
    status,
    sourceType,
    q,
    sortDir,
    limit = 10,
    page = 1,
  } = {},
) {
  const id = String(clientId ?? '').trim()
  const uiPage = Math.max(1, Number(page ?? 1))
  const params = {
    limit: Math.max(1, Number(limit ?? 10)),
    page: uiPage - 1,
  }
  if (from) {
    params.from = from
  }
  if (to) {
    params.to = to
  }
  if (entryType) {
    params['entry_type'] = entryType
  }
  if (status) {
    params.status = status
  }
  if (sourceType) {
    params['source_type'] = sourceType
  }
  if (q) {
    params.q = q
  }
  if (sortDir) {
    params['sort_dir'] = sortDir
  }
  const { data } = await apiInstance.get(
    apiPaths.clientLedger(id),
    { params },
  )
  const root = unwrapData(data)
  const list = normalizeLedgerList(root)
  const pagination = extractEnvelopeListPagination(root)
    ?? list.pagination

  return {
    ...list,
    pagination,
  }
}

export async function getClientLedgerEntry(clientId, entryId) {
  const { data } = await apiInstance.get(
    apiPaths.clientLedgerEntry(clientId, entryId),
  )

  return normalizeLedgerEntry(unwrapData(data))
}

export async function reverseClientLedgerEntry(
  clientId,
  entryId,
  { reason, version } = {},
) {
  const payload = { reason }
  if (version != null) {
    payload.version = version
  }
  const { data } = await apiInstance.post(
    apiPaths.clientLedgerReverse(clientId, entryId),
    payload,
  )

  return normalizeLedgerEntry(unwrapData(data))
}
