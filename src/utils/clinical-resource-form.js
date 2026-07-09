import {
  clinicalResourceStatusValues,
  clinicalResourceTypeValues,
} from 'components/constants.js'
import {
  catalogItemsFromCatalog,
  mapCatalogItemsToSelectOptions,
} from 'src/utils/catalogs.js'

function trim(value) {
  return String(value ?? '').trim()
}

function parseType(value) {
  const raw = trim(value)
  const allowed = Object.values(clinicalResourceTypeValues)

  return allowed.includes(raw) ? raw : ''
}

function parseStatus(value) {
  const raw = trim(value).toUpperCase()
  const allowed = Object.values(clinicalResourceStatusValues)

  return allowed.includes(raw) ? raw : clinicalResourceStatusValues.active
}

function parseKeywords(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map(item => trim(item))
    .filter(Boolean)
}

function parseStoredFileId(value) {
  const id = Number(value)

  return Number.isFinite(id) && id > 0 ? id : null
}

function resolveCategoryFromApi(raw = {}) {
  return trim(
    raw.category
    ?? raw.category_name
    ?? raw.categoryName,
  )
}

export function buildResourceCategoryCatalogOptions(catalog) {
  const items = catalogItemsFromCatalog(catalog)

  return mapCatalogItemsToSelectOptions(items)
    .map(option => ({
      label: option.label,
      value: option.label,
    }))
}

export function createEmptyClinicalResourceForm() {
  return {
    id: null,
    title: '',
    category: '',
    type: clinicalResourceTypeValues.externalLink,
    keywords: [],
    content: '',
    url: '',
    status: clinicalResourceStatusValues.active,
    storedFileId: null,
    documentFile: null,
    documentFileName: '',
  }
}

export function cloneClinicalResourceForm(source = {}) {
  return {
    ...createEmptyClinicalResourceForm(),
    ...source,
    category: trim(source.category ?? source.categoryName),
    keywords: Array.isArray(source.keywords) ? [...source.keywords] : [],
    documentFile: null,
  }
}

export function normalizeClinicalResourceFromApi(raw = {}) {
  const document = raw.document ?? null

  return {
    id: raw.id ?? null,
    subtenantId: raw.subtenant_id ?? raw.subtenantId ?? null,
    title: trim(raw.title),
    category: resolveCategoryFromApi(raw),
    type: parseType(raw.type) || clinicalResourceTypeValues.externalLink,
    keywords: parseKeywords(raw.keywords),
    content: trim(raw.content),
    url: trim(raw.url),
    storedFileId: raw.stored_file_id ?? raw.storedFileId
      ?? document?.id ?? null,
    document,
    status: parseStatus(raw.status),
    pinned: Boolean(raw.pinned),
    pinnedOrder: raw.pinned_order ?? raw.pinnedOrder ?? null,
    favorite: Boolean(raw.favorite),
    createdAt: trim(raw.created_at ?? raw.createdAt),
    updatedAt: trim(raw.updated_at ?? raw.updatedAt),
    documentFile: null,
    documentFileName: trim(
      document?.original_filename ?? document?.originalFilename,
    ),
  }
}

export function buildClinicalResourceRequest(
  form = {},
  { partial = false } = {},
) {
  const title = trim(form.title)
  const category = trim(form.category)
  const type = parseType(form.type)
  const status = parseStatus(form.status)
  const keywords = parseKeywords(form.keywords)
  const content = trim(form.content) || null
  const url = trim(form.url) || null
  const storedFileId = parseStoredFileId(form.storedFileId)

  /* eslint-disable camelcase -- API payload */
  const body = {}
  if (!partial || title) {
    body.title = title
  }
  if (!partial || category) {
    body.category = category
  }
  if (!partial || type) {
    body.type = type
  }
  if (!partial || form.keywords != null) {
    body.keywords = keywords
  }
  if (!partial || form.content != null) {
    body.content = content
  }
  if (!partial || form.url != null) {
    body.url = url
  }
  if (!partial || form.status != null) {
    body.status = status
  }
  if (storedFileId) {
    body.stored_file_id = storedFileId
  }

  return body
}
