import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { extractEnvelopeListPagination } from 'components/helpers.js'
import {
  normalizeOpenObligationList,
  normalizeClientPayment,
  normalizeClientPaymentList,
} from 'src/utils/client-payment-normalize.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

export function clientPaymentApiErrorMessage(
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

export async function listOpenObligations(clientId) {
  const { data } = await apiInstance.get(
    apiPaths.clientOpenObligations(clientId),
  )

  return normalizeOpenObligationList(unwrapData(data))
}

export async function listClientPayments(
  clientId,
  {
    from,
    to,
    method,
    status,
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
  if (method) {
    params['payment_method'] = method
  }
  if (status) {
    params.status = status
  }
  if (q) {
    params.q = q
  }
  if (sortDir) {
    params['sort_dir'] = sortDir
  }
  const { data } = await apiInstance.get(
    apiPaths.clientPayments(id),
    { params },
  )
  const root = unwrapData(data)
  const list = normalizeClientPaymentList(root)
  const pagination = extractEnvelopeListPagination(root)
    ?? list.pagination

  return {
    ...list,
    pagination,
  }
}

export async function getClientPayment(clientId, paymentId) {
  const { data } = await apiInstance.get(
    apiPaths.clientPaymentById(clientId, paymentId),
  )

  return normalizeClientPayment(unwrapData(data))
}

export async function createClientPayment(
  clientId,
  body,
  idempotencyKey,
) {
  const { data } = await apiInstance.post(
    apiPaths.clientPayments(clientId),
    body,
    {
      headers: idempotencyKey
        ? { 'Idempotency-Key': idempotencyKey }
        : undefined,
    },
  )

  return normalizeClientPayment(unwrapData(data))
}

export async function allocateClientPayment(
  clientId,
  paymentId,
  allocations,
) {
  const { data } = await apiInstance.post(
    apiPaths.clientPaymentAllocations(clientId, paymentId),
    { allocations },
  )

  return normalizeClientPayment(unwrapData(data))
}

export async function reverseClientPaymentAllocation(
  clientId,
  paymentId,
  allocationId,
  reason,
) {
  const { data } = await apiInstance.post(
    apiPaths.clientPaymentAllocationReverse(
      clientId,
      paymentId,
      allocationId,
    ),
    { reason },
  )

  return normalizeClientPayment(unwrapData(data))
}

export async function reverseClientPayment(
  clientId,
  paymentId,
  { reason, version } = {},
) {
  const payload = { reason }
  if (version != null) {
    payload.version = version
  }
  const { data } = await apiInstance.post(
    apiPaths.clientPaymentReverse(clientId, paymentId),
    payload,
  )

  return normalizeClientPayment(unwrapData(data))
}

export async function listClientPaymentWorkQueue({
  status,
  method,
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
  if (status) {
    params.status = status
  }
  if (method) {
    params['payment_method'] = method
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
  const { data } = await apiInstance.get(
    apiPaths.clientPaymentWorkQueue,
    { params },
  )
  const root = unwrapData(data)
  const list = normalizeClientPaymentList(root)
  const pagination = extractEnvelopeListPagination(root)
    ?? list.pagination

  return {
    ...list,
    pagination,
  }
}
