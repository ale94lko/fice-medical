import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  mapReferralsListFromApi,
  isReferralSchedulable,
  normalizeReferralDetail,
  normalizeReferralFile,
  normalizeReferralOption,
  referralToApiPayload,
} from 'src/utils/referral-normalize.js'

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
  const response = await apiInstance.get(
    apiPaths.clientReferrals(clientId),
    { params },
  )

  return mapReferralsListFromApi(unwrapList(response.data))
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
  const response = await apiInstance.get(
    apiPaths.clientReferralById(clientId, referralId),
  )

  return normalizeReferralDetail(unwrapData(response.data))
}

export async function createClientReferral(clientId, referral) {
  const body = referralToApiPayload(referral)
  const response = await apiInstance.post(
    apiPaths.clientReferrals(clientId),
    body,
  )

  return normalizeReferralDetail(unwrapData(response.data))
}

export async function updateClientReferral(clientId, referral) {
  const body = referralToApiPayload(referral)
  const response = await apiInstance.patch(
    apiPaths.clientReferralById(clientId, referral.id),
    body,
  )

  return normalizeReferralDetail(unwrapData(response.data))
}

export async function closeClientReferral(clientId, referralId) {
  const response = await apiInstance.post(
    apiPaths.clientReferralClose(clientId, referralId),
  )

  return normalizeReferralDetail(unwrapData(response.data))
}

export async function deleteClientReferral(clientId, referralId) {
  await apiInstance.delete(
    apiPaths.clientReferralById(clientId, referralId),
  )
}

export async function uploadReferralFile(clientId, referralId, file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiInstance.post(
    apiPaths.clientReferralFiles(clientId, referralId),
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )

  return normalizeReferralFile(unwrapData(response.data))
}

/** @deprecated use uploadReferralFile */
export const uploadReferralDocument = uploadReferralFile

export async function downloadReferralFile(
  clientId,
  referralId,
  fileId,
) {
  const response = await apiInstance.get(
    apiPaths.clientReferralFileDownload(clientId, referralId, fileId),
    { responseType: 'blob' },
  )

  return response
}

/** @deprecated use downloadReferralFile */
export const downloadReferralDocument = downloadReferralFile

export async function deleteReferralFile(
  clientId,
  referralId,
  fileId,
) {
  await apiInstance.delete(
    apiPaths.clientReferralFileById(clientId, referralId, fileId),
  )
}

/** @deprecated use deleteReferralFile */
export const deleteReferralDocument = deleteReferralFile

export function prepareReferralForSave(referral) {
  return referralToApiPayload(referral)
}
