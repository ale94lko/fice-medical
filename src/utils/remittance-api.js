import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { extractEnvelopeListPagination } from 'components/helpers.js'
import {
  normalizeInsurancePayment,
  normalizeRemittance,
} from 'src/utils/remittance-normalize.js'

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

export function remittanceApiErrorMessage(
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

export async function listRemittanceWorkQueue({
  queue,
  processingStatus,
  postingStatus,
  payer,
  q,
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
  if (queue) {
    params.queue = queue
  }
  if (processingStatus) {
    params['processing_status'] = processingStatus
  }
  if (postingStatus) {
    params['posting_status'] = postingStatus
  }
  if (payer) {
    params.payer = payer
  }
  if (q) {
    params.q = q
  }
  if (sort) {
    params.sort = sort
  }
  if (sortDir) {
    params['sort_dir'] = sortDir
  }
  const response = await apiInstance.get(
    apiPaths.remittanceWorkQueue,
    { params },
  )
  const root = unwrapListRoot(response.data)
  const pagination = extractEnvelopeListPagination(root)
    ?? root?.pagination
  const countsRaw = root?.counts ?? {}

  return {
    items: (Array.isArray(root?.items) ? root.items : [])
      .map(normalizeRemittance)
      .filter(item => item.id != null),
    pagination,
    counts: {
      needsReview: Number(countsRaw.needs_review
        ?? countsRaw.needsReview ?? 0),
      readyToPost: Number(countsRaw.ready_to_post
        ?? countsRaw.readyToPost ?? 0),
      posted: Number(countsRaw.posted ?? 0),
      all: Number(countsRaw.all ?? 0),
    },
    payers: Array.isArray(root?.payers) ? root.payers : [],
  }
}

export async function fetchRemittanceById(id, includeRaw = false) {
  const params = {}
  if (includeRaw) {
    params['include_raw'] = true
  }
  const response = await apiInstance.get(
    apiPaths.remittanceById(id),
    { params },
  )

  return normalizeRemittance(unwrapData(response.data))
}

export async function ingestRemittance(payload) {
  const response = await apiInstance.post(
    apiPaths.remittanceIngest,
    payload,
  )

  return normalizeRemittance(unwrapData(response.data))
}

export async function postRemittance(id, version) {
  const response = await apiInstance.post(apiPaths.remittancePost(id), {
    version,
  })

  return normalizeRemittance(unwrapData(response.data))
}

export async function listInsurancePayments({
  postingStatus,
  method,
  payer,
  from,
  to,
  q,
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
  if (postingStatus) {
    params['posting_status'] = postingStatus
  }
  if (method) {
    params.method = method
  }
  if (payer) {
    params.payer = payer
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
  if (sort) {
    params.sort = sort
  }
  if (sortDir) {
    params['sort_dir'] = sortDir
  }
  const response = await apiInstance.get(
    apiPaths.insurancePaymentWorkQueue,
    { params },
  )
  const root = unwrapListRoot(response.data)
  const pagination = extractEnvelopeListPagination(root)
    ?? root?.pagination
  const countsRaw = root?.counts ?? {}

  return {
    items: (Array.isArray(root?.items) ? root.items : [])
      .map(normalizeInsurancePayment)
      .filter(item => item.id != null),
    pagination,
    counts: {
      totalReceived: countsRaw.total_received
        ?? countsRaw.totalReceived ?? 0,
      paymentCount: Number(countsRaw.payment_count
        ?? countsRaw.paymentCount ?? 0),
      inProcessAmount: countsRaw.in_process_amount
        ?? countsRaw.inProcessAmount ?? 0,
      inProcessCount: Number(countsRaw.in_process_count
        ?? countsRaw.inProcessCount ?? 0),
      pendingPostingAmount: countsRaw.pending_posting_amount
        ?? countsRaw.pendingPostingAmount ?? 0,
      pendingPostingCount: Number(countsRaw.pending_posting_count
        ?? countsRaw.pendingPostingCount ?? 0),
      totalAdjustments: countsRaw.total_adjustments
        ?? countsRaw.totalAdjustments ?? 0,
    },
    payers: Array.isArray(root?.payers) ? root.payers : [],
  }
}
