/* eslint-disable camelcase -- NPI Registry API and staff lookup payloads */
import { lookupStaffNpi } from 'src/utils/staff-api.js'

const NPI_REGISTRY_PROXY_PATH = '/npi-registry/api/'
export const NPI_DIGIT_LENGTH = 10

export function sanitizeNpiDigits(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, NPI_DIGIT_LENGTH)
}

export function isValidNpiDigits(value) {
  return /^\d{10}$/.test(sanitizeNpiDigits(value))
}

function pickPracticeAddress(addresses) {
  const list = Array.isArray(addresses) ? addresses : []
  const location = list.find(row =>
    String(row.address_purpose ?? '').toUpperCase() === 'LOCATION',
  )
  if (location) {
    return location
  }

  return list.find(row => row?.address_1) ?? list[0] ?? null
}

function extractPhonesFromAddresses(addresses) {
  const list = Array.isArray(addresses) ? addresses : []
  const entries = []
  const seen = new Set()

  function addPhone(number, kind) {
    const trimmed = String(number ?? '').trim()
    if (!trimmed) {
      return
    }
    const digits = trimmed.replace(/\D/g, '')
    if (!digits || seen.has(digits)) {
      return
    }
    seen.add(digits)
    entries.push({ number: trimmed, kind })
  }

  for (const address of list) {
    addPhone(address?.telephone_number, 'telephone')
    addPhone(address?.fax_number, 'fax')
  }

  return entries
}

function isEmailLike(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim())
}

function extractEmailsFromNpiRow(row) {
  const entries = []
  const seen = new Set()

  function addEmail(address, kind = 'work') {
    const trimmed = String(address ?? '').trim().replace(/^mailto:/i, '')
    if (!isEmailLike(trimmed)) {
      return
    }
    const key = trimmed.toLowerCase()
    if (seen.has(key)) {
      return
    }
    seen.add(key)
    entries.push({ address: trimmed, kind })
  }

  for (const endpoint of row?.endpoints ?? []) {
    addEmail(endpoint?.endpoint, 'work')
    addEmail(endpoint?.email, 'work')
  }

  return entries
}

function formatPostalCode(postal) {
  const digits = String(postal ?? '').replace(/\D/g, '')
  if (digits.length === 9) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }
  if (digits.length === 5) {
    return digits
  }

  return String(postal ?? '').trim()
}

function mapRegistrySex(sex) {
  const code = String(sex ?? '').trim().toUpperCase()
  if (code === 'M') {
    return 'Male'
  }
  if (code === 'F') {
    return 'Female'
  }

  return 'Other'
}

function cleanOptionalRegistryText(value) {
  const text = String(value ?? '').trim()

  return text && text !== '--' ? text : ''
}

function titleCaseName(value) {
  const text = String(value ?? '').trim()
  if (!text) {
    return ''
  }

  return text
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
}

function mapTaxonomies(taxonomies) {
  return (taxonomies ?? []).map(row => ({
    code: String(row.code ?? '').trim(),
    display_name: String(row.desc ?? '').trim(),
    displayName: String(row.desc ?? '').trim(),
    is_primary: Boolean(row.primary),
    isPrimary: Boolean(row.primary),
    license: String(row.license ?? '').trim(),
    state: String(row.state ?? '').trim(),
  }))
}

function mapLicensesFromTaxonomies(taxonomies) {
  return taxonomies
    .filter(row => row.license)
    .map((row, index) => ({
      id: `npi-license-${index + 1}`,
      type: row.displayName || row.code,
      identifier: row.license,
      expirationDate: '',
      status: 'Active',
      attachmentFileId: null,
      isPrimary: row.isPrimary,
      is_primary: row.isPrimary,
    }))
}

/**
 * @param {Record<string, unknown>} apiPayload
 * @param {string} npi
 */
export function mapNpiRegistryResult(apiPayload, npi) {
  const count = Number(apiPayload?.result_count ?? 0)
  const row = apiPayload?.results?.[0]
  const digits = sanitizeNpiDigits(npi)

  if (!count || !row) {
    return { found: false, npi: digits }
  }

  const basic = row.basic ?? {}
  const address = pickPracticeAddress(row.addresses)
  const phones = extractPhonesFromAddresses(row.addresses)
  const emails = extractEmailsFromNpiRow(row)
  const taxonomies = mapTaxonomies(row.taxonomies)
  const primaryTaxonomy = taxonomies.find(row => row.isPrimary) ?? taxonomies[0]

  return {
    found: true,
    npi: sanitizeNpiDigits(row.number ?? digits),
    first_name: titleCaseName(basic.first_name),
    middle_name: titleCaseName(basic.middle_name),
    last_name: titleCaseName(basic.last_name),
    suffix: cleanOptionalRegistryText(basic.name_suffix),
    prefix: cleanOptionalRegistryText(basic.name_prefix),
    name_prefix: cleanOptionalRegistryText(basic.name_prefix),
    sex: mapRegistrySex(basic.sex),
    credential: cleanOptionalRegistryText(basic.credential),
    primary_specialty: primaryTaxonomy?.display_name ?? '',
    taxonomies,
    licenses: mapLicensesFromTaxonomies(taxonomies),
    practice_address: address
      ? {
        address: String(address.address_1 ?? '').trim(),
        address2: String(address.address_2 ?? '').trim(),
        city: titleCaseName(address.city),
        state: String(address.state ?? '').trim(),
        zip_code: formatPostalCode(address.postal_code),
        country: address.country_code === 'US'
          ? 'USA'
          : String(address.country_name ?? '').trim(),
      }
      : null,
    phones,
    emails,
    phone: phones[0]?.number ?? '',
  }
}

async function fetchNpiRegistryPayload(digits) {
  const params = new URLSearchParams({
    version: '2.1',
    number: digits,
  })
  const response = await fetch(`${NPI_REGISTRY_PROXY_PATH}?${params}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error('NPI_LOOKUP_FAILED')
  }

  return response.json()
}

export async function lookupNpiRegistry(npi) {
  const digits = sanitizeNpiDigits(npi)
  if (!isValidNpiDigits(digits)) {
    throw new Error('INVALID_NPI')
  }

  try {
    const payload = await fetchNpiRegistryPayload(digits)

    return mapNpiRegistryResult(payload, digits)
  } catch {
    try {
      const result = await lookupStaffNpi(digits)
      if (!result?.found) {
        return { found: false, npi: digits }
      }

      return result
    } catch {
      throw new Error('NPI_LOOKUP_FAILED')
    }
  }
}
