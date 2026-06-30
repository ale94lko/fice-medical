import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { extractEnvelopeListPagination } from 'components/helpers.js'
import {
  formatClinicianDisplayLabel,
} from 'src/utils/clinician-display.js'

const DEFAULT_PAGE_SIZE = 100
const DEFAULT_CLINICIAN_STATUS = 'ACTIVE'

function trim(value) {
  return String(value ?? '').trim()
}

function readEnvelope(response) {
  return response?.data?.data ?? response?.data ?? {}
}

/**
 * @param {Record<string, unknown>} raw
 * @returns {Record<string, unknown>}
 */
export function normalizeClinicianFromApi(raw = {}) {
  const staffMember = raw.staff_member ?? raw.staffMember ?? {}
  const personal = staffMember.personal_information
    ?? staffMember.personalInformation
    ?? null

  return {
    id: raw.id ?? null,
    npi: trim(raw.npi),
    specialty: trim(raw.specialty),
    staffMemberId: raw.staff_members_id
      ?? raw.staffMemberId
      ?? staffMember.id
      ?? null,
    staffCode: trim(staffMember.code),
    staffMember,
    personalInformation: personal,
    status: trim(raw.status ?? staffMember.status).toUpperCase(),
  }
}

/**
 * @param {Record<string, unknown>} row
 * @returns {({ label: string, value: string }) | null}
 */
export function mapClinicianRowToSelectOption(row) {
  const normalized = normalizeClinicianFromApi(row)
  const id = normalized.id
  if (id == null || id === '') {
    return null
  }

  const label = formatClinicianDisplayLabel(normalized)
  if (!label) {
    return null
  }

  return {
    label,
    value: String(id),
    npi: normalized.npi,
    specialty: normalized.specialty,
    staffCode: normalized.staffCode,
  }
}

/**
 * @param {{
 *   limit?: number,
 *   page?: number,
 *   q?: string,
 *   status?: string,
 * }} params
 * @returns {Promise<{ items: unknown[], pagination: Record<string, unknown> }>}
 */
export async function fetchCliniciansListPage({
  limit = DEFAULT_PAGE_SIZE,
  page = 0,
  q = undefined,
  status = DEFAULT_CLINICIAN_STATUS,
} = {}) {
  const query = {
    limit,
    page,
    q: trim(q) || undefined,
    status: trim(status) || undefined,
  }
  const response = await apiInstance.get(apiPaths.cliniciansList, {
    params: query,
  })
  const envelope = readEnvelope(response)
  const items = Array.isArray(envelope.items) ? envelope.items : []
  const pagination = extractEnvelopeListPagination(envelope)
    ?? envelope.pagination
    ?? {}

  return { items, pagination }
}

/**
 * Fetches paginated clinician rows and maps them to q-select options.
 *
 * @param {{
 *   pageSize?: number,
 *   maxPages?: number,
 *   status?: string,
 *   q?: string,
 * }} opts
 * @returns {Promise<Array<{ label: string, value: string }>>}
 */
export async function fetchAllCliniciansSelectOptions({
  pageSize = DEFAULT_PAGE_SIZE,
  maxPages = 50,
  status = DEFAULT_CLINICIAN_STATUS,
  q = undefined,
} = {}) {
  const all = []
  let page = 0
  let totalPages = 1

  while (page < totalPages && page < maxPages) {
    const { items, pagination } = await fetchCliniciansListPage({
      limit: pageSize,
      page,
      status,
      q,
    })
    all.push(...items)
    totalPages = Number(pagination?.total_pages ?? 1) || 1
    if (!items.length) {
      break
    }
    page += 1
  }

  const options = all
    .map(mapClinicianRowToSelectOption)
    .filter(Boolean)
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
    )

  return options
}
