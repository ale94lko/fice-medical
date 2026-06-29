import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { extractEnvelopeListPagination } from 'components/helpers.js'
import {
  buildSubtenantRequest,
  normalizeSubtenantFromApi,
} from 'src/utils/subtenant-form.js'
import { mapSubtenantListItem } from 'src/utils/subtenant-list-normalize.js'

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

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

export function subtenantApiErrorMessage(error, fallback = 'Request failed') {
  const data = error?.response?.data
  const message = data?.error?.message
    ?? data?.message
    ?? error?.message

  return String(message || fallback)
}

export async function listSubtenants(params = {}, t) {
  const uiPage = Math.max(1, Number(params.page ?? 1))
  const limit = Math.max(1, Number(params.limit ?? 20))
  const page = uiPage - 1
  const response = await apiInstance.get(apiPaths.subtenantsList, {
    params: { page, limit },
  })
  const root = unwrapListRoot(response.data)
  const pagination = extractEnvelopeListPagination(root)
    ?? root?.pagination
    ?? null

  return {
    items: (root?.items ?? [])
      .map(item => mapSubtenantListItem(item, t))
      .filter(Boolean),
    pagination,
  }
}

export async function fetchSubtenantById(id) {
  const response = await apiInstance.get(apiPaths.subtenantById(id))
  const raw = unwrapData(response.data)

  return normalizeSubtenantFromApi(raw)
}

export async function createSubtenant(form) {
  const body = buildSubtenantRequest(form)
  const response = await apiInstance.post(apiPaths.subtenantsList, body)

  return normalizeSubtenantFromApi(unwrapData(response.data))
}

export async function updateSubtenant(id, form) {
  const body = buildSubtenantRequest(form)
  const response = await apiInstance.put(apiPaths.subtenantById(id), body)

  return normalizeSubtenantFromApi(unwrapData(response.data))
}

export async function deleteSubtenant(id) {
  await apiInstance.delete(apiPaths.subtenantById(id))
}
