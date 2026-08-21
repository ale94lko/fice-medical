import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

function unwrapList(data) {
  if (Array.isArray(data)) {
    return data
  }

  return data?.items ?? data?.content ?? []
}

function trim(value) {
  return String(value ?? '').trim()
}

/** Compare ICD-10 codes ignoring case, spaces and punctuation. */
export function normalizeIcd10CodeKey(code) {
  return trim(code).toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function parseOptionalBool(value) {
  return value === true || value === 'true' || value === 1 || value === '1'
}

export function normalizeIcd10Cm(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const id = raw.id ?? raw.ID
  const codeCompact = trim(
    raw.code
    ?? raw.icd10_code
    ?? raw.icd10Code
    ?? raw.icd10_cm_code,
  )
  const codeDotted = trim(
    raw.code_dotted
    ?? raw.codeDotted,
  )
  const code = codeDotted || codeCompact
  if ((id == null || String(id).trim() === '') && !code) {
    return null
  }
  const description = trim(
    raw.description
    ?? raw.display
    ?? raw.name
    ?? raw.long_description
    ?? raw.longDescription
    ?? raw.short_description
    ?? raw.shortDescription,
  )

  return {
    id: id != null && String(id).trim() !== '' ? id : code,
    code,
    codeCompact: codeCompact || code,
    codeDotted: codeDotted || code,
    description,
    billable: parseOptionalBool(raw.billable ?? raw.is_billable),
    active: raw.active !== false && raw.status !== 'INACTIVE',
    label: code
      ? (description ? `${code} — ${description}` : code)
      : (description || '—'),
  }
}

/**
 * Search ICD-10-CM reference catalog.
 * Params: q, code, billable, active, limit, page, sort_by, sort_dir
 */
export async function searchIcd10Cm(queryOrParams = {}, options = {}) {
  const params = typeof queryOrParams === 'string'
    ? { q: queryOrParams, ...options }
    : { ...queryOrParams, ...options }

  const q = trim(params.q)
  const code = trim(params.code)
  if (q.length < 2 && !code) {
    return []
  }

  const response = await apiInstance.get(apiPaths.referenceIcd10Cm, {
    /* eslint-disable camelcase -- API query params */
    params: {
      q: q || undefined,
      code: code || undefined,
      billable: params.billable ?? true,
      active: params.active ?? true,
      limit: params.limit ?? 20,
      page: params.page ?? 0,
      sort_by: params.sortBy ?? params.sort_by ?? undefined,
      sort_dir: params.sortDir ?? params.sort_dir ?? undefined,
    },
    /* eslint-enable camelcase */
  })
  const data = unwrapData(response.data)

  return unwrapList(data)
    .map(normalizeIcd10Cm)
    .filter(Boolean)
}

export async function fetchIcd10CmById(id) {
  const response = await apiInstance.get(
    apiPaths.referenceIcd10CmById(id),
  )

  return normalizeIcd10Cm(unwrapData(response.data))
}
