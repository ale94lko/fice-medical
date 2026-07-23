/* eslint-disable camelcase -- API query params use snake_case */
import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { extractEnvelopeListPagination } from 'components/helpers.js'

export const PROVIDER_TAXONOMY_SEARCH_LIMIT = 15

function trim(value) {
  return String(value ?? '').trim()
}

function readEnvelope(response) {
  return response?.data?.data ?? response?.data ?? {}
}

function readItems(envelope) {
  if (Array.isArray(envelope?.items)) {
    return envelope.items
  }
  if (Array.isArray(envelope?.content)) {
    return envelope.content
  }
  if (Array.isArray(envelope)) {
    return envelope
  }

  return []
}

function extractMetaPagination(envelope) {
  const fromHelper = extractEnvelopeListPagination(envelope)
  if (fromHelper) {
    return fromHelper
  }

  const meta = envelope?.meta ?? envelope?.pagination
  if (!meta || typeof meta !== 'object') {
    return null
  }

  const limit = Number(meta.limit)
  const offset = Number(meta.offset)
  const total = Number(meta.total)
  const page = Number(meta.page)
  const totalPages = Number(meta.total_pages ?? meta.totalPages)

  return {
    limit: Number.isFinite(limit) ? limit : 0,
    offset: Number.isFinite(offset) ? offset : 0,
    total: Number.isFinite(total) ? total : 0,
    page: Number.isFinite(page) ? page : 0,
    totalPages: Number.isFinite(totalPages) ? totalPages : 0,
  }
}

/**
 * @param {Record<string, unknown>} raw
 * @returns {{
 *   id: number|null,
 *   code: string,
 *   grouping: string,
 *   classification: string,
 *   specialization: string,
 *   displayName: string,
 *   definition: string,
 *   notes: string,
 *   active: boolean,
 *   version: string,
 * }}
 */
export function normalizeProviderTaxonomy(raw = {}) {
  const code = trim(raw.code)
  const displayName = trim(raw.display_name ?? raw.displayName)
  const classification = trim(raw.classification)
  const specialization = trim(raw.specialization)
  const id = Number(raw.id)

  return {
    id: Number.isFinite(id) && id > 0 ? id : null,
    code,
    grouping: trim(raw.grouping),
    classification,
    specialization,
    displayName: displayName || classification || code,
    definition: trim(raw.definition),
    notes: trim(raw.notes),
    active: raw.active !== false,
    version: trim(raw.version),
  }
}

/**
 * @param {ReturnType<typeof normalizeProviderTaxonomy>} taxonomy
 * @returns {{
 *   value: string,
 *   label: string,
 *   caption: string,
 *   code: string,
 *   displayName: string,
 * }}
 */
export function mapProviderTaxonomyToSelectOption(taxonomy) {
  const code = trim(taxonomy?.code)
  const displayName = trim(taxonomy?.displayName) || code
  const classification = trim(taxonomy?.classification)
  const specialization = trim(taxonomy?.specialization)
  const captionParts = [code]
  if (classification && classification !== displayName) {
    captionParts.push(classification)
  }
  if (specialization) {
    captionParts.push(specialization)
  }

  return {
    value: code,
    label: displayName,
    caption: captionParts.filter(Boolean).join(' · '),
    code,
    displayName,
    grouping: trim(taxonomy?.grouping),
    classification,
    specialization,
    definition: trim(taxonomy?.definition),
  }
}

/**
 * @param {{
 *   q?: string,
 *   code?: string,
 *   grouping?: string,
 *   classification?: string,
 *   specialization?: string,
 *   active?: boolean,
 *   page?: number,
 *   limit?: number,
 *   sortBy?: string,
 *   sortDir?: string,
 * }} [params]
 */
export async function fetchProviderTaxonomiesPage(params = {}) {
  const query = {
    active: params.active !== false,
    page: Number.isFinite(Number(params.page)) ? Number(params.page) : 0,
    limit: Number.isFinite(Number(params.limit))
      ? Number(params.limit)
      : PROVIDER_TAXONOMY_SEARCH_LIMIT,
  }
  const q = trim(params.q)
  if (q) {
    query.q = q
  }
  const code = trim(params.code)
  if (code) {
    query.code = code
  }
  const grouping = trim(params.grouping)
  if (grouping) {
    query.grouping = grouping
  }
  const classification = trim(params.classification)
  if (classification) {
    query.classification = classification
  }
  const specialization = trim(params.specialization)
  if (specialization) {
    query.specialization = specialization
  }
  const sortBy = trim(params.sortBy ?? params.sort_by)
  if (sortBy) {
    query.sort_by = sortBy
  }
  const sortDir = trim(params.sortDir ?? params.sort_dir).toUpperCase()
  if (sortDir === 'ASC' || sortDir === 'DESC') {
    query.sort_dir = sortDir
  }

  const response = await apiInstance.get(apiPaths.providerTaxonomies, {
    params: query,
  })
  const envelope = readEnvelope(response)
  const items = readItems(envelope).map(normalizeProviderTaxonomy)
  const pagination = extractMetaPagination(envelope) ?? {}

  return {
    items,
    options: items.map(mapProviderTaxonomyToSelectOption),
    pagination,
  }
}

/**
 * @param {string} code
 * @returns {Promise<ReturnType<typeof normalizeProviderTaxonomy>|null>}
 */
export async function fetchProviderTaxonomyByCode(code) {
  const trimmed = trim(code)
  if (!trimmed) {
    return null
  }

  try {
    const response = await apiInstance.get(
      apiPaths.providerTaxonomyByCode(trimmed),
    )
    const envelope = readEnvelope(response)
    const raw = envelope?.item ?? envelope?.taxonomy ?? envelope
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return null
    }
    const taxonomy = normalizeProviderTaxonomy(raw)
    if (!taxonomy.code) {
      return null
    }

    return taxonomy
  } catch (error) {
    const status = Number(error?.response?.status)
    if (status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Validates taxonomy rows against the ACTIVE NUCC catalog.
 * Missing/inactive codes are omitted and returned in missingCodes.
 *
 * @param {Array<{
 *   code?: string,
 *   displayName?: string,
 *   isPrimary?: boolean,
 * }>} rows
 * @returns {Promise<{
 *   taxonomies: Array<{
 *     code: string,
 *     displayName: string,
 *     isPrimary: boolean,
 *   }>,
 *   missingCodes: string[],
 * }>}
 */
export async function resolveTaxonomiesAgainstCatalog(rows = []) {
  const missingCodes = []
  const resolved = []
  const seen = new Set()

  for (const row of rows) {
    const code = trim(row?.code)
    if (!code || seen.has(code)) {
      continue
    }
    seen.add(code)

    let taxonomy = null
    try {
      taxonomy = await fetchProviderTaxonomyByCode(code)
    } catch {
      taxonomy = null
    }

    if (!taxonomy?.code || !taxonomy.active) {
      missingCodes.push(code)
      continue
    }

    resolved.push({
      code: taxonomy.code,
      displayName: taxonomy.displayName,
      definition: taxonomy.definition,
      grouping: taxonomy.grouping,
      classification: taxonomy.classification,
      specialization: taxonomy.specialization,
      isPrimary: Boolean(row.isPrimary ?? row.is_primary),
    })
  }

  if (!resolved.some(row => row.isPrimary) && resolved.length) {
    resolved[0] = {
      ...resolved[0],
      isPrimary: true,
    }
  }

  return {
    taxonomies: resolved.map(row => ({
      ...row,
      isPrimary: Boolean(row.isPrimary),
    })),
    missingCodes,
  }
}
