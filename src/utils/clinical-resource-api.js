import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  buildClinicalResourceRequest,
  normalizeClinicalResourceFromApi,
} from 'src/utils/clinical-resource-form.js'
import { mapClinicalResourceListItem } from
  'src/utils/clinical-resource-list-normalize.js'

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

function unwrapArray(body) {
  const data = unwrapData(body)
  if (Array.isArray(data)) {
    return data
  }

  return []
}

function normalizePagination(pagination) {
  if (!pagination || typeof pagination !== 'object') {
    return null
  }
  const limit = Number(pagination.limit ?? 20)
  const page = Number(pagination.page ?? 0)
  const total = Number(
    pagination.total_items
    ?? pagination.totalItems
    ?? pagination.total
    ?? 0,
  )
  const totalPages = Number(
    pagination.total_pages ?? pagination.totalPages ?? 0,
  )

  return {
    limit: Number.isFinite(limit) ? limit : 20,
    page: Number.isFinite(page) ? page : 0,
    total: Number.isFinite(total) ? total : 0,
    totalPages: Number.isFinite(totalPages) ? totalPages : 0,
    offset: (Number.isFinite(page) ? page : 0)
      * (Number.isFinite(limit) ? limit : 20),
  }
}

function extractFileName(headers, fallback = 'download') {
  const raw = headers?.['content-disposition'] ?? ''
  const match = /filename="?([^"]+)"?/i.exec(raw)

  return match?.[1] ?? fallback
}

export function clinicalResourceApiErrorMessage(
  error,
  fallback = 'Request failed',
) {
  const data = error?.response?.data
  const message = data?.error_description
    ?? data?.message
    ?? data?.error
    ?? error?.message

  return String(message || fallback)
}

function buildListQueryParams(params = {}) {
  const uiPage = Math.max(1, Number(params.page ?? 1))
  const limit = Math.max(1, Number(params.limit ?? 20))
  const page = uiPage - 1
  const query = {
    page,
    limit,
  }
  const q = String(params.q ?? '').trim()
  if (q) {
    query.q = q
  }
  const title = String(params.title ?? '').trim()
  if (title) {
    query.title = title
  }
  const keywords = String(params.keywords ?? '').trim()
  if (keywords) {
    query.keywords = keywords
  }
  if (params.type) {
    query.type = String(params.type)
  }
  if (params.status) {
    query.status = String(params.status)
  }
  if (params.pinned === true) {
    query.pinned = true
  }
  if (params.favorites === true) {
    query.favorites = true
  }
  if (params.includeArchived === true) {
    // eslint-disable-next-line camelcase -- API query param
    query.include_archived = true
  }

  return query
}

export async function listClinicalResources(params = {}, t) {
  const response = await apiInstance.get(apiPaths.clinicalResourcesList, {
    params: buildListQueryParams(params),
  })
  const root = unwrapListRoot(response.data)
  const pagination = normalizePagination(root?.pagination)

  return {
    items: (root?.items ?? [])
      .map(item => mapClinicalResourceListItem(item, t))
      .filter(Boolean),
    pagination,
  }
}

export async function listPinnedClinicalResources(t) {
  const response = await apiInstance.get(apiPaths.clinicalResourcesPinned)
  const items = unwrapArray(response.data)

  return items
    .map(item => mapClinicalResourceListItem(item, t))
    .filter(Boolean)
}

export async function fetchClinicalResourceById(id, t) {
  const response = await apiInstance.get(apiPaths.clinicalResourceById(id))
  const raw = unwrapData(response.data)
  const normalized = normalizeClinicalResourceFromApi(raw)

  return {
    ...normalized,
    ...mapClinicalResourceListItem(raw, t),
  }
}

function buildClinicalResourceFormData(form, file = null) {
  const formData = new FormData()
  const resourceJson = JSON.stringify(buildClinicalResourceRequest(form))
  formData.append(
    'resource',
    new Blob([resourceJson], { type: 'application/json' }),
  )
  if (file) {
    formData.append('document', file)
  }

  return formData
}

export async function createClinicalResource(form, file = null) {
  const response = await apiInstance.post(
    apiPaths.clinicalResourcesList,
    buildClinicalResourceFormData(form, file),
  )

  return normalizeClinicalResourceFromApi(unwrapData(response.data))
}

/** @deprecated use createClinicalResource */
export const createClinicalResourceJson = form => createClinicalResource(form)

/** @deprecated use createClinicalResource */
export const createClinicalResourceWithDocument = (form, file) =>
  createClinicalResource(form, file)

export async function updateClinicalResource(id, form) {
  const body = buildClinicalResourceRequest(form, { partial: true })
  const response = await apiInstance.put(
    apiPaths.clinicalResourceById(id),
    body,
  )

  return normalizeClinicalResourceFromApi(unwrapData(response.data))
}

export async function uploadClinicalResourceDocument(id, file) {
  const formData = new FormData()
  formData.append('document', file)
  const response = await apiInstance.post(
    apiPaths.clinicalResourceDocument(id),
    formData,
  )

  return normalizeClinicalResourceFromApi(unwrapData(response.data))
}

export async function downloadClinicalResourceDocument(
  id,
  { preview = false } = {},
) {
  const response = await apiInstance.get(
    apiPaths.clinicalResourceDocumentDownload(id, preview),
    { responseType: 'blob' },
  )

  return {
    blob: response.data,
    fileName: extractFileName(response.headers),
  }
}

export async function updateClinicalResourceStatus(id, status) {
  const response = await apiInstance.patch(
    apiPaths.clinicalResourceStatus(id),
    { status },
  )

  return normalizeClinicalResourceFromApi(unwrapData(response.data))
}

export async function archiveClinicalResource(id) {
  const response = await apiInstance.delete(apiPaths.clinicalResourceById(id))

  return normalizeClinicalResourceFromApi(unwrapData(response.data))
}

export async function pinClinicalResource(id) {
  const response = await apiInstance.post(apiPaths.clinicalResourcePin(id))

  return normalizeClinicalResourceFromApi(unwrapData(response.data))
}

export async function unpinClinicalResource(id) {
  const response = await apiInstance.delete(apiPaths.clinicalResourcePin(id))

  return normalizeClinicalResourceFromApi(unwrapData(response.data))
}

export async function favoriteClinicalResource(id) {
  const response = await apiInstance.post(
    apiPaths.clinicalResourceFavorite(id),
  )

  return normalizeClinicalResourceFromApi(unwrapData(response.data))
}

export async function unfavoriteClinicalResource(id) {
  const response = await apiInstance.delete(
    apiPaths.clinicalResourceFavorite(id),
  )

  return normalizeClinicalResourceFromApi(unwrapData(response.data))
}
