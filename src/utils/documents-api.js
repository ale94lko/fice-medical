import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  buildGenerateDocumentPayload,
  normalizeDocumentTypeInfo,
} from 'src/utils/document-generation-payload.js'
import { normalizeStoredFile } from 'src/utils/stored-file-normalize.js'

let cachedDocumentTypes = null
let documentTypesPromise = null

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

function unwrapList(body) {
  const root = unwrapData(body)
  if (Array.isArray(root)) {
    return root
  }
  if (Array.isArray(root?.items)) {
    return root.items
  }
  if (Array.isArray(root?.content)) {
    return root.content
  }

  return []
}

export function apiErrorMessage(error, fallback = 'Request failed') {
  const data = error?.response?.data
  const message = data?.error_description
    ?? data?.message
    ?? data?.error
    ?? error?.message

  return String(message || fallback)
}

export async function getDocumentTypes({ force = false } = {}) {
  if (!force && cachedDocumentTypes) {
    return cachedDocumentTypes
  }
  if (!force && documentTypesPromise) {
    return documentTypesPromise
  }

  documentTypesPromise = apiInstance
    .get(apiPaths.documentsTypes)
    .then(response => {
      const items = unwrapList(response.data)
        .map(normalizeDocumentTypeInfo)
        .filter(item => item.documentType)

      cachedDocumentTypes = items

      return items
    })
    .finally(() => {
      documentTypesPromise = null
    })

  return documentTypesPromise
}

export async function generateDocument(payload) {
  const body = buildGenerateDocumentPayload(payload)
  const response = await apiInstance.post(
    apiPaths.documentsGenerate,
    body,
  )

  return normalizeStoredFile(unwrapData(response.data))
}

export function clearDocumentTypesCache() {
  cachedDocumentTypes = null
  documentTypesPromise = null
}
