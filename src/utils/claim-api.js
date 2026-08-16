import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { extractEnvelopeListPagination } from 'components/helpers.js'
import {
  normalizeClaim,
  normalizeClaimHistoryItem,
  normalizeClaimWorkQueueItem,
  normalizeClaimWorkQueueOption,
} from 'src/utils/claim-normalize.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
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

export function claimApiErrorMessage(
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

export async function listClaimWorkQueue({
  status,
  from,
  to,
  q,
  providerId,
  payer,
  service,
  includeVoided,
  sort,
  sortDir,
  limit = 10,
  page = 1,
} = {}) {
  const uiPage = Math.max(1, Number(page ?? 1))
  const params = {
    limit: Math.max(1, Number(limit ?? 10)),
    page: uiPage - 1,
  }
  if (status) {
    params.status = status
  }
  if (from) {
    params.from = from
  }
  if (to) {
    params.to = to
  }
  if (q) {
    params.q = q
  }
  if (providerId) {
    params['provider_id'] = providerId
  }
  if (payer) {
    params.payer = payer
  }
  if (service) {
    params.service = service
  }
  if (includeVoided) {
    params['include_voided'] = true
  }
  if (sort) {
    params.sort = sort
  }
  if (sortDir) {
    params['sort_dir'] = sortDir
  }
  const response = await apiInstance.get(apiPaths.claimWorkQueue, {
    params,
  })
  const root = unwrapListRoot(response.data)
  const pagination = extractEnvelopeListPagination(root)
    ?? root?.pagination
  const countsRaw = root?.counts ?? {}

  return {
    items: (Array.isArray(root?.items) ? root.items : [])
      .map(normalizeClaimWorkQueueItem)
      .filter(item => item.id != null),
    pagination,
    counts: {
      needsAttention: Number(countsRaw.needs_attention
        ?? countsRaw.needsAttention ?? 0),
      ready: Number(countsRaw.ready ?? 0),
      voided: Number(countsRaw.voided ?? 0),
      all: Number(countsRaw.all ?? 0),
    },
    payers: Array.isArray(root?.payers) ? root.payers : [],
    providers: (Array.isArray(root?.providers) ? root.providers : [])
      .map(normalizeClaimWorkQueueOption)
      .filter(item => item.id != null),
  }
}

export async function fetchClaimById(id) {
  const response = await apiInstance.get(apiPaths.claimById(id))

  return normalizeClaim(unwrapData(response.data))
}

export async function generateClaimFromSuperbill(superbillId) {
  const response = await apiInstance.post(
    apiPaths.claimFromSuperbill(superbillId),
  )

  return normalizeClaim(unwrapData(response.data))
}

export async function voidClaim(id, { reason, notes, version }) {
  const response = await apiInstance.post(apiPaths.claimVoid(id), {
    reason,
    notes,
    version,
  })

  return normalizeClaim(unwrapData(response.data))
}

export async function fetchClaimHistory(id, {
  limit = 50,
  page = 1,
} = {}) {
  const uiPage = Math.max(1, Number(page ?? 1))
  const response = await apiInstance.get(apiPaths.claimHistory(id), {
    params: {
      limit: Math.max(1, Number(limit ?? 50)),
      page: uiPage - 1,
    },
  })
  const root = unwrapListRoot(response.data)

  return {
    items: (Array.isArray(root?.items) ? root.items : [])
      .map(normalizeClaimHistoryItem),
    pagination: extractEnvelopeListPagination(root)
      ?? root?.pagination,
  }
}
