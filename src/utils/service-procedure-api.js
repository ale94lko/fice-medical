import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { extractEnvelopeListPagination } from 'components/helpers.js'
import {
  buildServiceProcedureRequest,
  normalizeServiceProcedureFromApi,
} from 'src/utils/service-procedure-form.js'
import { mapServiceProcedureListItem } from
  'src/utils/service-procedure-list-normalize.js'
import {
  buildServiceRequirementRequest,
  normalizeServiceRequirementConfig,
} from 'src/utils/encounter-requirements-normalize.js'

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

export function serviceProcedureApiErrorMessage(
  error,
  fallback = 'Request failed',
) {
  const data = error?.response?.data
  const code = data?.error?.message ?? data?.message
  if (code === 'SERVICE_PROCEDURE_NAME_DUPLICATE') {
    return 'SERVICE_PROCEDURE_NAME_DUPLICATE'
  }

  const message = data?.error?.message
    ?? data?.message
    ?? error?.message

  return String(message || fallback)
}

export async function listServiceProcedures(params = {}, t) {
  const uiPage = Math.max(1, Number(params.page ?? 1))
  const limit = Math.max(1, Number(params.limit ?? 20))
  const page = uiPage - 1
  const query = {
    page,
    limit,
    search: params.search ?? params.q ?? undefined,
    category: params.category ?? undefined,
    status: params.status ?? undefined,
    /* eslint-disable-next-line camelcase -- API query param */
    active_only: params.activeOnly ? true : undefined,
  }

  const response = await apiInstance.get(apiPaths.serviceProceduresList, {
    params: query,
  })
  const root = unwrapListRoot(response.data)
  const pagination = extractEnvelopeListPagination(root)
    ?? root?.pagination
    ?? null

  return {
    items: (root?.items ?? [])
      .map(item => mapServiceProcedureListItem(item, t))
      .filter(Boolean),
    pagination,
  }
}

export async function fetchServiceProcedureById(id) {
  const response = await apiInstance.get(apiPaths.serviceProcedureById(id))
  const raw = unwrapData(response.data)

  return normalizeServiceProcedureFromApi(raw)
}

export async function createServiceProcedure(form) {
  const body = buildServiceProcedureRequest(form)
  const response = await apiInstance.post(
    apiPaths.serviceProceduresList,
    body,
  )

  return normalizeServiceProcedureFromApi(unwrapData(response.data))
}

export async function updateServiceProcedure(id, form) {
  const body = buildServiceProcedureRequest(form)
  const response = await apiInstance.patch(
    apiPaths.serviceProcedureById(id),
    body,
  )

  return normalizeServiceProcedureFromApi(unwrapData(response.data))
}

export async function updateServiceProcedureStatus(id, status) {
  const body = { status }
  const response = await apiInstance.patch(
    apiPaths.serviceProcedureStatus(id),
    body,
  )

  return normalizeServiceProcedureFromApi(unwrapData(response.data))
}

export async function listActiveServiceProcedures(t) {
  return listServiceProcedures({ activeOnly: true, limit: 500, page: 1 }, t)
}

function mapCatalogOptions(items = []) {
  return (Array.isArray(items) ? items : [])
    .filter(item => item?.id != null)
    .map(item => ({
      label: String(item.name ?? item.code ?? '').trim(),
      value: item.id,
      code: String(item.code ?? '').trim(),
    }))
    .filter(option => option.label)
}

function readItems(envelope) {
  if (Array.isArray(envelope)) {
    return envelope
  }

  return Array.isArray(envelope?.items) ? envelope.items : []
}

export async function listServiceProviderTypes() {
  const response = await apiInstance.get(
    apiPaths.serviceProcedureProviderTypes,
  )

  return mapCatalogOptions(readItems(unwrapData(response.data)))
}

export async function listServiceClinicalCapabilities() {
  const response = await apiInstance.get(
    apiPaths.serviceProcedureClinicalCapabilities,
  )

  return mapCatalogOptions(readItems(unwrapData(response.data)))
}

export async function listServiceProcedureRequirements(serviceProcedureId) {
  const response = await apiInstance.get(
    apiPaths.serviceProcedureRequirements(serviceProcedureId),
  )
  const raw = unwrapData(response.data)
  const items = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw)
      ? raw
      : []

  return items.map(item => normalizeServiceRequirementConfig(item))
}

export async function createServiceProcedureRequirement(
  serviceProcedureId,
  form,
) {
  const response = await apiInstance.post(
    apiPaths.serviceProcedureRequirements(serviceProcedureId),
    buildServiceRequirementRequest(form),
  )

  return normalizeServiceRequirementConfig(unwrapData(response.data))
}

export async function updateServiceProcedureRequirement(
  serviceProcedureId,
  requirementId,
  form,
) {
  const response = await apiInstance.patch(
    apiPaths.serviceProcedureRequirementById(
      serviceProcedureId,
      requirementId,
    ),
    buildServiceRequirementRequest(form),
  )

  return normalizeServiceRequirementConfig(unwrapData(response.data))
}

export async function deleteServiceProcedureRequirement(
  serviceProcedureId,
  requirementId,
) {
  await apiInstance.delete(
    apiPaths.serviceProcedureRequirementById(
      serviceProcedureId,
      requirementId,
    ),
  )
}
