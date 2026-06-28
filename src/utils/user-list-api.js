import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { extractEnvelopeListPagination } from 'components/helpers.js'
import {
  mapUserListViewItem,
  mapUsersListFromApi,
} from 'src/utils/user-list-normalize.js'
import { buildUserRegisterRequest } from 'src/utils/user-register-payload.js'

function unwrapListRoot(body) {
  const root = body?.data ?? body
  if (Array.isArray(root?.items)) {
    return root
  }
  if (Array.isArray(root?.content)) {
    return { items: root.content, pagination: root.pagination }
  }
  if (Array.isArray(root)) {
    return { items: root, pagination: null }
  }

  return root
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

export async function listTenantUsers(params = {}, t) {
  const page = Math.max(1, Number(params.page ?? 1))
  const limit = Number(params.limit ?? 20)
  const offset = (page - 1) * limit
  const q = String(params.q ?? '').trim()
  const queryParams = { limit, offset }
  if (q) {
    queryParams.q = q
  }
  const response = await apiInstance.get(apiPaths.tenantsUsersList, {
    params: queryParams,
  })
  const root = unwrapListRoot(response.data)
  const pagination = extractEnvelopeListPagination(root)
    ?? root?.pagination
    ?? null

  return {
    items: mapUsersListFromApi(root?.items ?? [], t),
    pagination,
  }
}

export async function fetchTenantUser(userId, t) {
  const response = await apiInstance.get(apiPaths.tenantUserById(userId))
  const raw = unwrapData(response.data)

  return mapUserListViewItem(raw, t)
}

export async function createTenantUser(payload, options = {}) {
  const body = buildUserRegisterRequest(payload, {
    activeSubtenantId: options.activeSubtenantId,
    permissionTreeNodes: options.permissionTreeNodes,
  })
  const response = await apiInstance.post(
    apiPaths.tenantsUsersCreate,
    body,
  )

  return unwrapData(response.data)
}

export async function updateTenantUser(userId, payload) {
  const body = {
    username: String(payload?.username ?? payload?.email ?? '').trim(),
    description: String(payload?.description ?? '').trim(),
  }
  const password = String(payload?.password ?? '').trim()
  if (password) {
    body.password = password
  }

  const response = await apiInstance.patch(
    apiPaths.tenantUserById(userId),
    body,
  )

  return unwrapData(response.data)
}

export async function deleteTenantUser(userId) {
  await apiInstance.delete(apiPaths.tenantUserById(userId))
}
