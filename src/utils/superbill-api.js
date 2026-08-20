import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { extractEnvelopeListPagination } from 'components/helpers.js'
import {
  normalizeSuperbill,
  normalizeSuperbillHistoryItem,
  normalizeWorkQueueItem,
  normalizeWorkQueueOption,
} from 'src/utils/superbill-normalize.js'

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

export function superbillApiErrorMessage(
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

export function isSuperbillHasSubmittedClaimError(error) {
  const data = error?.response?.data

  return String(data?.error_description ?? '')
    === 'SUPERBILL_HAS_SUBMITTED_CLAIM'
}

export function isSuperbillNotReadyError(error) {
  const data = error?.response?.data

  return String(data?.error_description ?? '')
    === 'SUPERBILL_NOT_READY'
}

export function superbillNotReadyEvaluation(error) {
  const data = error?.response?.data?.data
  if (data == null || typeof data !== 'object') {
    return null
  }

  return data
}

export async function listSuperbills({
  status,
  from,
  to,
  q,
  clientNumber,
  includeVoided,
  limit = 20,
  page = 1,
} = {}) {
  const uiPage = Math.max(1, Number(page ?? 1))
  const params = {
    limit: Math.max(1, Number(limit ?? 20)),
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
  const id = String(clientNumber ?? '').trim()
  if (id) {
    params['client_number'] = id
  }
  if (includeVoided) {
    params['include_voided'] = true
  }
  const response = await apiInstance.get(apiPaths.superbillsList, {
    params,
  })
  const root = unwrapListRoot(response.data)
  const pagination = extractEnvelopeListPagination(root)
    ?? root?.pagination

  return {
    items: (Array.isArray(root?.items) ? root.items : [])
      .map(normalizeSuperbill)
      .filter(item => item.id != null),
    pagination,
  }
}

export async function listBillingWorkQueue({
  status,
  from,
  to,
  q,
  providerId,
  locationId,
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
  if (locationId) {
    params['location_id'] = locationId
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
  const response = await apiInstance.get(apiPaths.billingWorkQueue, {
    params,
  })
  const root = unwrapListRoot(response.data)
  const pagination = extractEnvelopeListPagination(root)
    ?? root?.pagination
  const countsRaw = root?.counts ?? {}

  return {
    items: (Array.isArray(root?.items) ? root.items : [])
      .map(normalizeWorkQueueItem)
      .filter(item => item.id != null),
    pagination,
    counts: {
      needsAttention: Number(countsRaw.needs_attention
        ?? countsRaw.needsAttention ?? 0),
      readyForReview: Number(countsRaw.ready_for_review
        ?? countsRaw.readyForReview ?? 0),
      reviewed: Number(countsRaw.reviewed ?? 0),
      onHold: Number(countsRaw.on_hold ?? countsRaw.onHold ?? 0),
      voided: Number(countsRaw.voided ?? 0),
      all: Number(countsRaw.all ?? 0),
    },
    payers: Array.isArray(root?.payers) ? root.payers : [],
    locations: (Array.isArray(root?.locations) ? root.locations : [])
      .map(normalizeWorkQueueOption)
      .filter(item => item.id != null),
    providers: (Array.isArray(root?.providers) ? root.providers : [])
      .map(normalizeWorkQueueOption)
      .filter(item => item.id != null),
  }
}

export async function fetchSuperbillHistory(id, {
  limit = 50,
  page = 1,
} = {}) {
  const uiPage = Math.max(1, Number(page ?? 1))
  const response = await apiInstance.get(apiPaths.superbillHistory(id), {
    params: {
      limit: Math.max(1, Number(limit ?? 50)),
      page: uiPage - 1,
    },
  })
  const root = unwrapListRoot(response.data)

  return {
    items: (Array.isArray(root?.items) ? root.items : [])
      .map(normalizeSuperbillHistoryItem),
    pagination: extractEnvelopeListPagination(root)
      ?? root?.pagination,
  }
}

export async function fetchSuperbillById(id) {
  const response = await apiInstance.get(apiPaths.superbillById(id))

  return normalizeSuperbill(unwrapData(response.data))
}

export async function fetchEncounterSuperbill(encounterId) {
  const response = await apiInstance.get(
    apiPaths.encounterSuperbill(encounterId),
  )
  const data = unwrapData(response.data)
  if (data == null || typeof data !== 'object' || !data.id) {
    return null
  }

  return normalizeSuperbill(data)
}

export async function generateEncounterSuperbill(encounterId) {
  const response = await apiInstance.post(
    apiPaths.encounterSuperbill(encounterId),
  )
  const data = unwrapData(response.data)
  if (data == null || typeof data !== 'object' || !data.id) {
    return null
  }

  return normalizeSuperbill(data)
}

export async function markSuperbillReviewed(id, version) {
  const response = await apiInstance.post(apiPaths.superbillReview(id), {
    version,
  })

  return normalizeSuperbill(unwrapData(response.data))
}

export async function voidSuperbill(id, { reason, version }) {
  const response = await apiInstance.post(apiPaths.superbillVoid(id), {
    reason,
    version,
  })

  return normalizeSuperbill(unwrapData(response.data))
}

export async function reopenSuperbill(id, { reason, version }) {
  const response = await apiInstance.post(apiPaths.superbillReopen(id), {
    reason,
    version,
  })

  return normalizeSuperbill(unwrapData(response.data))
}

export async function addSuperbillNote(id, body) {
  const response = await apiInstance.post(apiPaths.superbillNotes(id), {
    body,
  })

  return normalizeSuperbill(unwrapData(response.data))
}

export async function putSuperbillOnHold(id, {
  reason,
  notes,
  version,
}) {
  const response = await apiInstance.post(apiPaths.superbillHold(id), {
    reason,
    notes,
    version,
  })

  return normalizeSuperbill(unwrapData(response.data))
}

export async function releaseSuperbillHold(id, version) {
  const response = await apiInstance.post(
    apiPaths.superbillReleaseHold(id),
    { version },
  )

  return normalizeSuperbill(unwrapData(response.data))
}
