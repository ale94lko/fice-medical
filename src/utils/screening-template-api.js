import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  buildScreeningTemplateRequest,
  screeningTemplateFormFromApi,
} from 'src/utils/screening-template-form.js'
import { mapScreeningTemplateListItem } from
  'src/utils/screening-template-list-normalize.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

function unwrapList(body) {
  const data = unwrapData(body)
  if (Array.isArray(data)) {
    return data
  }

  return data?.items ?? data?.content ?? []
}

export function screeningTemplateApiErrorMessage(
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

export async function listManageScreeningTemplates(params = {}, t) {
  const query = {
    status: params.status ?? undefined,
    category: params.category ?? undefined,
    /* eslint-disable-next-line camelcase -- API query param */
    include_archived: params.includeArchived ? true : undefined,
  }
  const response = await apiInstance.get(apiPaths.screeningTemplatesManage, {
    params: query,
  })

  return unwrapList(response.data)
    .map(item => mapScreeningTemplateListItem(item, t))
    .filter(Boolean)
}

export async function fetchManageScreeningTemplate(templateId) {
  const response = await apiInstance.get(
    apiPaths.screeningTemplateManageById(templateId),
    /* eslint-disable-next-line camelcase -- API query param */
    { params: { include_structure: true } },
  )

  return screeningTemplateFormFromApi(unwrapData(response.data))
}

export async function createScreeningTemplate(form) {
  const body = buildScreeningTemplateRequest(form)
  const response = await apiInstance.post(apiPaths.screeningTemplates, body)

  return screeningTemplateFormFromApi(unwrapData(response.data))
}

export async function updateScreeningTemplate(id, form, options = {}) {
  const body = buildScreeningTemplateRequest(form, options)
  const response = await apiInstance.put(
    apiPaths.screeningTemplateById(id),
    body,
  )

  return screeningTemplateFormFromApi(unwrapData(response.data))
}

export async function updateScreeningTemplateStatus(id, status) {
  const response = await apiInstance.patch(
    apiPaths.screeningTemplateStatus(id),
    { status },
  )

  return unwrapData(response.data)
}

export async function deleteScreeningTemplate(id) {
  const response = await apiInstance.delete(
    apiPaths.screeningTemplateById(id),
  )

  return unwrapData(response.data)
}
