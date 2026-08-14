import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  mapAuthorizationsListFromApi,
  normalizeAuthorizationDetail,
  authorizationToApiPayload,
} from 'src/utils/authorization-normalize.js'

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

export function authorizationApiErrorMessage(
  error,
  fallback = 'Request failed',
) {
  const data = error?.response?.data
  const message = data?.error_description
    ?? data?.message
    ?? error?.message

  return String(message || fallback)
}

export async function listClientAuthorizations(clientId, params = {}) {
  const response = await apiInstance.get(
    apiPaths.clientAuthorizations(clientId),
    { params },
  )

  return mapAuthorizationsListFromApi(unwrapList(response.data))
}

export async function fetchClientAuthorization(
  clientId,
  authorizationId,
) {
  const response = await apiInstance.get(
    apiPaths.clientAuthorizationById(clientId, authorizationId),
  )

  return normalizeAuthorizationDetail(unwrapData(response.data))
}

export async function createClientAuthorization(clientId, form) {
  const response = await apiInstance.post(
    apiPaths.clientAuthorizations(clientId),
    authorizationToApiPayload(form),
  )

  return normalizeAuthorizationDetail(unwrapData(response.data))
}

export async function updateClientAuthorization(clientId, form) {
  const response = await apiInstance.patch(
    apiPaths.clientAuthorizationById(clientId, form.id),
    authorizationToApiPayload(form),
  )

  return normalizeAuthorizationDetail(unwrapData(response.data))
}

export async function cancelClientAuthorization(
  clientId,
  authorizationId,
  reason,
) {
  const response = await apiInstance.post(
    apiPaths.clientAuthorizationCancel(clientId, authorizationId),
    { reason },
  )

  return normalizeAuthorizationDetail(unwrapData(response.data))
}

export async function uploadAuthorizationFile(
  clientId,
  authorizationId,
  file,
) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiInstance.post(
    apiPaths.clientAuthorizationFiles(clientId, authorizationId),
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )

  return unwrapData(response.data)
}

export async function downloadAuthorizationFile(
  clientId,
  authorizationId,
  fileId,
) {
  const response = await apiInstance.get(
    apiPaths.clientAuthorizationFileDownload(
      clientId,
      authorizationId,
      fileId,
    ),
    { responseType: 'blob' },
  )

  return response
}

export async function deleteAuthorizationFile(
  clientId,
  authorizationId,
  fileId,
) {
  await apiInstance.delete(
    apiPaths.clientAuthorizationFileById(
      clientId,
      authorizationId,
      fileId,
    ),
  )
}
