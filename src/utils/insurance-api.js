import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
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

export async function listClientInsuranceProfiles(
  clientId,
  params = {},
) {
  const response = await apiInstance.get(
    apiPaths.clientInsuranceProfiles(clientId),
    {
      params: {
        limit: params.limit ?? 100,
        page: params.page ?? 0,
      },
    },
  )

  return unwrapList(response.data)
}

export function insuranceApiErrorMessage(
  error,
  fallback = 'Request failed',
) {
  const data = error?.response?.data
  const message = data?.error_description
    ?? data?.message
    ?? error?.message

  return String(message || fallback)
}

/**
 * POST /client/v1/{clientId}/insurance-profiles/{profileId}/deactivate
 * @param {{ reason: string, notes?: string|null }} payload
 */
export async function deactivateInsuranceProfile(
  clientId,
  profileId,
  payload,
) {
  const body = {
    reason: String(payload?.reason ?? '').trim(),
    notes: payload?.notes == null || payload.notes === ''
      ? null
      : String(payload.notes).trim(),
  }
  const response = await apiInstance.post(
    apiPaths.clientInsuranceProfileDeactivate(clientId, profileId),
    body,
  )

  return unwrapData(response.data)
}

/**
 * POST /client/v1/{clientId}/insurance-profiles/{profileId}/reactivate
 */
export async function reactivateInsuranceProfile(clientId, profileId) {
  const response = await apiInstance.post(
    apiPaths.clientInsuranceProfileReactivate(clientId, profileId),
  )

  return unwrapData(response.data)
}
