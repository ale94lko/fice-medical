import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  mockCloseClientReferral,
  mockCreateClientReferral,
  mockDeleteClientReferral,
  mockDeleteReferralDocument,
  mockGetClientReferral,
  mockListClientReferrals,
  mockUpdateClientReferral,
  mockUploadReferralDocument,
} from 'src/utils/referral-mock-store.js'
import {
  mapReferralsListFromApi,
  isReferralSchedulable,
  normalizeReferralDetail,
  normalizeReferralDocument,
  normalizeReferralOption,
  referralToApiPayload,
} from 'src/utils/referral-normalize.js'

function useMockFallback(error) {
  const status = error?.response?.status
  if (status === 404 || status === 501 || status === 502 || status === 503) {
    return true
  }
  if (!error?.response) {
    return true
  }

  return false
}

function unwrapList(body) {
  const root = body?.data ?? body
  if (Array.isArray(root)) {
    return root
  }
  if (Array.isArray(root?.content)) {
    return root.content
  }
  if (Array.isArray(root?.items)) {
    return root.items
  }

  return []
}

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

export function apiErrorMessage(error, fallback = 'Request failed') {
  const data = error?.response?.data
  const message = data?.error_description
    ?? data?.message
    ?? error?.message

  return String(message || fallback)
}

export async function listClientReferrals(clientId, params = {}) {
  try {
    const response = await apiInstance.get(
      apiPaths.clientReferrals(clientId),
      { params },
    )

    return mapReferralsListFromApi(unwrapList(response.data))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mapReferralsListFromApi(
      mockListClientReferrals(clientId, params),
    )
  }
}

export async function listClientReferralOptions(
  clientId,
  { schedulableOnly = false } = {},
) {
  const rows = await listClientReferrals(clientId)
  const filtered = schedulableOnly
    ? rows.filter(isReferralSchedulable)
    : rows

  return filtered
    .map(normalizeReferralOption)
    .filter(row => row.value != null)
}

export async function fetchClientReferral(clientId, referralId) {
  try {
    const response = await apiInstance.get(
      apiPaths.clientReferralById(clientId, referralId),
    )

    return normalizeReferralDetail(unwrapData(response.data))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }
    const row = mockGetClientReferral(clientId, referralId)
    if (!row) {
      throw error
    }

    return normalizeReferralDetail(row)
  }
}

export async function createClientReferral(clientId, referral) {
  const body = referralToApiPayload(referral)
  try {
    const response = await apiInstance.post(
      apiPaths.clientReferrals(clientId),
      body,
    )

    return normalizeReferralDetail(unwrapData(response.data))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeReferralDetail(
      mockCreateClientReferral(clientId, body),
    )
  }
}

export async function updateClientReferral(clientId, referral) {
  const body = referralToApiPayload(referral)
  try {
    const response = await apiInstance.patch(
      apiPaths.clientReferralById(clientId, referral.id),
      body,
    )

    return normalizeReferralDetail(unwrapData(response.data))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeReferralDetail(
      mockUpdateClientReferral(clientId, referral.id, body),
    )
  }
}

export async function closeClientReferral(clientId, referralId) {
  try {
    const response = await apiInstance.post(
      apiPaths.clientReferralClose(clientId, referralId),
    )

    return normalizeReferralDetail(unwrapData(response.data))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeReferralDetail(
      mockCloseClientReferral(clientId, referralId),
    )
  }
}

export async function deleteClientReferral(clientId, referralId) {
  try {
    await apiInstance.delete(
      apiPaths.clientReferralById(clientId, referralId),
    )
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    mockDeleteClientReferral(clientId, referralId)
  }
}

export async function uploadReferralDocument(clientId, referralId, file) {
  const formData = new FormData()
  formData.append('file', file)
  try {
    const response = await apiInstance.post(
      apiPaths.clientReferralDocuments(clientId, referralId),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )

    return normalizeReferralDocument(unwrapData(response.data))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeReferralDocument(
      mockUploadReferralDocument(clientId, referralId, file),
    )
  }
}

export async function downloadReferralDocument(
  clientId,
  referralId,
  documentId,
) {
  const response = await apiInstance.get(
    apiPaths.clientReferralDocumentDownload(
      clientId,
      referralId,
      documentId,
    ),
    { responseType: 'blob' },
  )

  return response
}

export async function deleteReferralDocument(
  clientId,
  referralId,
  documentId,
) {
  try {
    await apiInstance.delete(
      apiPaths.clientReferralDocumentById(
        clientId,
        referralId,
        documentId,
      ),
    )
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    mockDeleteReferralDocument(clientId, referralId, documentId)
  }
}

export function prepareReferralForSave(referral) {
  return referralToApiPayload(referral)
}
