import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { extractEnvelopeListPagination } from 'components/helpers.js'
import { normalizeDenialCase } from 'src/utils/denial-normalize.js'

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

export function denialApiErrorMessage(
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

export async function listDenialWorkQueue({
  queue,
  sourceType,
  status,
  claimStatus,
  category,
  priority,
  assignedTo,
  unassigned,
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
  if (sourceType) {
    params['source_type'] = sourceType
  }
  if (status) {
    params.status = status
  }
  if (claimStatus) {
    params['claim_status'] = claimStatus
  }
  if (category) {
    params.category = category
  }
  if (priority) {
    params.priority = priority
  }
  if (assignedTo != null) {
    params['assigned_to'] = assignedTo
  }
  if (unassigned) {
    params.unassigned = true
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
    apiPaths.denialWorkQueue,
    { params },
  )
  const root = unwrapListRoot(response.data)
  const pagination = extractEnvelopeListPagination(root)
    ?? root?.pagination
  const countsRaw = root?.counts ?? {}

  return {
    items: (Array.isArray(root?.items) ? root.items : [])
      .map(normalizeDenialCase)
      .filter(item => item.id != null),
    pagination,
    counts: {
      needsReview: Number(countsRaw.needs_review
        ?? countsRaw.needsReview ?? 0),
      inProgress: Number(countsRaw.in_progress
        ?? countsRaw.inProgress ?? 0),
      waiting: Number(countsRaw.waiting ?? 0),
      readyForResubmission: Number(
        countsRaw.ready_for_resubmission
          ?? countsRaw.readyForResubmission ?? 0,
      ),
      appeal: Number(countsRaw.appeal ?? 0),
      resolved: Number(countsRaw.resolved ?? 0),
      all: Number(countsRaw.all ?? 0),
    },
    payers: Array.isArray(root?.payers) ? root.payers : [],
  }
}

export async function fetchDenialById(id) {
  const response = await apiInstance.get(apiPaths.denialById(id))

  return normalizeDenialCase(unwrapData(response.data))
}

export async function updateDenial(id, payload) {
  const response = await apiInstance.patch(
    apiPaths.denialById(id),
    payload,
  )

  return normalizeDenialCase(unwrapData(response.data))
}

export async function addDenialNote(id, body) {
  const response = await apiInstance.post(apiPaths.denialNotes(id), {
    body,
  })

  return normalizeDenialCase(unwrapData(response.data))
}

export async function correctDenial(id, payload) {
  const response = await apiInstance.post(
    apiPaths.denialCorrect(id),
    payload,
  )

  return normalizeDenialCase(unwrapData(response.data))
}

export async function createDenialAppeal(id, payload) {
  const response = await apiInstance.post(
    apiPaths.denialAppeals(id),
    payload,
  )

  return normalizeDenialCase(unwrapData(response.data))
}

export async function updateDenialAppeal(id, appealId, payload) {
  const response = await apiInstance.patch(
    apiPaths.denialAppealById(id, appealId),
    payload,
  )

  return normalizeDenialCase(unwrapData(response.data))
}

export async function resolveDenial(id, payload) {
  const response = await apiInstance.post(
    apiPaths.denialResolve(id),
    payload,
  )

  return normalizeDenialCase(unwrapData(response.data))
}

export async function requestDenialSourceReopen(id, payload) {
  const response = await apiInstance.post(
    apiPaths.denialSourceReopen(id),
    payload,
  )

  return normalizeDenialCase(unwrapData(response.data))
}
