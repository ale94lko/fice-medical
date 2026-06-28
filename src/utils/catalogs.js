import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'

export function catalogItemsFromCatalog(catalog) {
  const items = catalog?.catalog_items ?? catalog?.catalogItems ?? []

  return Array.isArray(items) ? items : []
}

export function catalogsArrayFromResponse(body) {
  const data = body?.data
  if (Array.isArray(data)) {
    return data
  }
  if (Array.isArray(data?.data)) {
    return data.data
  }

  return []
}

export function catalogsByNameFromList(catalogs) {
  const map = {}

  for (const catalog of catalogs ?? []) {
    const name = catalog?.name
    if (!name) {
      continue
    }
    map[name] = catalog
  }

  return map
}

export function resolveCatalogOptionLabel(options, raw) {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) {
    return ''
  }
  if (!Array.isArray(options) || !options.length) {
    return trimmed
  }
  const needle = trimmed.toLowerCase()
  const token = needle.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  const match = options.find(option => {
    const value = String(option?.value ?? '').trim()
    const label = String(option?.label ?? '').trim()
    if (!value && !label) {
      return false
    }
    const valueLower = value.toLowerCase()
    const labelLower = label.toLowerCase()
    const valueToken = valueLower
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')

    return (
      valueLower === needle
      || labelLower === needle
      || valueToken === token
    )
  })

  return match?.label ?? trimmed
}

export function resolveCatalogSelectValue(options, raw) {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed || !Array.isArray(options) || !options.length) {
    return null
  }
  const needle = trimmed.toLowerCase()
  const token = needle.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  const match = options.find(option => {
    const value = String(option?.value ?? '').trim()
    const label = String(option?.label ?? '').trim()
    if (!value && !label) {
      return false
    }
    const valueLower = value.toLowerCase()
    const labelLower = label.toLowerCase()
    const valueToken = valueLower
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')

    return (
      valueLower === needle
      || labelLower === needle
      || valueToken === token
    )
  })

  return match?.value ?? null
}

function normalizeCatalogRadioToken(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export function catalogRadioValuesMatch(stored, optionValue) {
  const a = normalizeCatalogRadioToken(stored)
  const b = normalizeCatalogRadioToken(optionValue)
  if (!a || !b) {
    return false
  }

  return a === b
}

export function mapCatalogItemsToSelectOptions(items, { emptyOption } = {}) {
  const sorted = [...(items ?? [])].sort(
    (a, b) => Number(a?.id ?? 0) - Number(b?.id ?? 0),
  )
  const options = sorted
    .map(item => {
      const label = String(item?.label ?? item?.code ?? '').trim()
      const value = String(item?.code ?? '').trim()
      if (!label || !value) {
        return null
      }

      return { label, value }
    })
    .filter(Boolean)

  if (emptyOption) {
    return [emptyOption, ...options]
  }

  return options
}

export async function fetchCatalogsByNames(names) {
  const response = await apiInstance.post(apiPaths.catalogsByNames, {
    names,
  })
  const list = catalogsArrayFromResponse(response.data)

  return catalogsByNameFromList(list)
}
