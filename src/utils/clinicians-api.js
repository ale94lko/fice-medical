import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  formatClinicianDisplayLabel,
} from 'src/utils/clinician-display.js'

const DEFAULT_PAGE_SIZE = 100

/**
 * @param {Record<string, unknown>} row
 * @returns {({ label: string, value: string }) | null}
 */
export function mapClinicianRowToSelectOption(row) {
  const id = row?.id
  if (id == null || id === '') {
    return null
  }

  const label = formatClinicianDisplayLabel(row)
  if (!label) {
    return null
  }

  return {
    label,
    value: String(id),
  }
}

/**
 * @param {{ limit?: number, page?: number }} params
 * @returns {Promise<{ items: unknown[], pagination: Record<string, unknown> }>}
 */
export async function fetchCliniciansListPage({
  limit = DEFAULT_PAGE_SIZE,
  page = 0,
} = {}) {
  const response = await apiInstance.get(apiPaths.cliniciansList, {
    params: {
      limit,
      page,
      // eslint-disable-next-line camelcase -- staff API filter
      staff_type: 'clinicians',
    },
  })
  const envelope = response?.data?.data ?? response?.data ?? {}
  const items = Array.isArray(envelope.items) ? envelope.items : []
  const pagination = envelope.pagination ?? {}

  return { items, pagination }
}

/**
 * Fetches paginated clinician rows and maps them to q-select options.
 *
 * @param {{ pageSize?: number, maxPages?: number }} opts
 * @returns {Promise<Array<{ label: string, value: string }>>}
 */
export async function fetchAllCliniciansSelectOptions({
  pageSize = DEFAULT_PAGE_SIZE,
  maxPages = 50,
} = {}) {
  const all = []
  let page = 0
  let totalPages = 1

  while (page < totalPages && page < maxPages) {
    const { items, pagination } = await fetchCliniciansListPage({
      limit: pageSize,
      page,
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
