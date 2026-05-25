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
