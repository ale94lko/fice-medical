/**
 * Photon (Komoot / OSM) pharmacy search.
 * Prefer VITE_PHOTON_BASE_URL; in dev defaults to /photon (Quasar proxy).
 */

import { usStates } from 'src/data/us-geography.js'

function trimStr(value) {
  return String(value ?? '').trim()
}

function resolveUsStateCode(raw) {
  const token = trimStr(raw)
  if (!token) {
    return null
  }
  const upper = token.toUpperCase()
  const byValue = usStates.find(item => item.value === upper)
  if (byValue) {
    return byValue.value
  }
  const lower = token.toLowerCase()
  const byLabel = usStates.find(
    item => String(item.label).toLowerCase() === lower,
  )

  return byLabel?.value ?? null
}

export function photonBaseUrl() {
  const configured = trimStr(import.meta.env.VITE_PHOTON_BASE_URL)
  if (configured) {
    return configured.replace(/\/$/, '')
  }
  if (import.meta.env.DEV) {
    return '/photon'
  }

  return 'https://photon.komoot.io'
}

export function isPhotonConfigured() {
  return true
}

export function buildPhotonPharmacyQuery(filters = {}) {
  const freeform = trimStr(filters.q)
  if (freeform) {
    return freeform
  }

  return [
    trimStr(filters.name),
    trimStr(filters.address),
    trimStr(filters.city),
    trimStr(filters.state),
    trimStr(filters.zipCode),
  ].filter(Boolean).join(' ')
}

function hasStructuredFilters(filters = {}) {
  return Boolean(
    trimStr(filters.address)
    || trimStr(filters.city)
    || trimStr(filters.state)
    || trimStr(filters.zipCode),
  )
}

function stateToPhotonValue(state) {
  const code = resolveUsStateCode(state)
  if (!code) {
    return trimStr(state)
  }
  const match = usStates.find(item => item.value === code)

  return match?.label || code
}

function mapPhotonPropertiesToPharmacyFields(properties = {}) {
  const street = trimStr(properties.street)
  const housenumber = trimStr(properties.housenumber)
  const addressLine = [housenumber, street].filter(Boolean).join(' ')
    || trimStr(properties.name)
  const countryCode = trimStr(properties.countrycode).toUpperCase() || 'US'
  const phone = trimStr(
    properties.extra?.phone
    ?? properties.extra?.['contact:phone']
    ?? properties.phone,
  )
  const city = trimStr(properties.city || properties.locality)
  const county = trimStr(properties.county)
    .replace(/\s+County$/i, '')

  return {
    name: trimStr(properties.name),
    phone,
    fax: '',
    addressLine,
    city: city || county,
    county,
    state: resolveUsStateCode(properties.state),
    zipCode: trimStr(properties.postcode),
    country: countryCode === 'UNITED STATES' ? 'US' : countryCode,
    notes: '',
    placeId: photonPlaceId(properties),
    formattedAddress: [
      addressLine,
      city || county,
      [trimStr(properties.state), trimStr(properties.postcode)]
        .filter(Boolean)
        .join(' '),
    ].filter(Boolean).join(', '),
    provider: 'photon',
  }
}

export function photonPlaceId(properties = {}) {
  const osmType = trimStr(properties.osm_type)
  const osmId = properties.osm_id
  if (osmType && osmId != null) {
    return `photon:${osmType}:${osmId}`
  }

  return `photon:${trimStr(properties.name)}:${trimStr(properties.postcode)}`
}

export function mapPhotonFeatureToPharmacyFields(feature) {
  if (!feature || typeof feature !== 'object') {
    return null
  }

  return mapPhotonPropertiesToPharmacyFields(feature.properties ?? {})
}

function mapPhotonFeatureToSearchResult(feature, fallbackLabel = 'Address') {
  const details = mapPhotonFeatureToPharmacyFields(feature)
  if (!details) {
    return null
  }

  return {
    placeId: details.placeId,
    name: details.name || details.formattedAddress || fallbackLabel,
    address: details.formattedAddress,
    provider: 'photon',
    raw: feature,
    details,
  }
}

async function fetchPhotonJson(pathWithQuery) {
  const url = `${photonBaseUrl()}${pathWithQuery}`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error(`Photon search failed: ${response.status}`)
  }

  return response.json()
}

function featuresFromBody(body) {
  return Array.isArray(body?.features) ? body.features : []
}

async function searchPhotonApi(query, { pharmacyOnly = false } = {}) {
  const params = new URLSearchParams({
    q: query,
    limit: '12',
    lang: 'en',
    countrycode: 'US',
  })
  if (pharmacyOnly) {
    params.set('osm_tag', 'amenity:pharmacy')
  }

  return fetchPhotonJson(`/api?${params.toString()}`)
}

async function searchPhotonStructured(filters, { pharmacyOnly = false } = {}) {
  const params = new URLSearchParams({
    limit: '12',
    lang: 'en',
    countrycode: 'US',
  })
  if (pharmacyOnly) {
    params.set('osm_tag', 'amenity:pharmacy')
  }
  const street = [trimStr(filters.address), trimStr(filters.name)]
    .filter(Boolean)
    .join(' ')
  const city = trimStr(filters.city)
  const state = stateToPhotonValue(filters.state)
  const postcode = trimStr(filters.zipCode)
  if (street) {
    params.set('street', street)
  }
  if (city) {
    params.set('city', city)
  }
  if (state) {
    params.set('state', state)
  }
  if (postcode) {
    params.set('postcode', postcode)
  }

  return fetchPhotonJson(`/structured?${params.toString()}`)
}

async function runPhotonSearch(filters = {}, options = {}) {
  const pharmacyOnly = Boolean(options.pharmacyOnly)
  const freeform = buildPhotonPharmacyQuery(filters)
  if (!freeform && !hasStructuredFilters(filters)) {
    return []
  }

  let body
  if (hasStructuredFilters(filters) && !trimStr(filters.q)) {
    try {
      body = await searchPhotonStructured(filters, { pharmacyOnly })
      if (!featuresFromBody(body).length && freeform) {
        body = await searchPhotonApi(freeform, { pharmacyOnly })
      }
    } catch {
      if (!freeform) {
        throw new Error('Photon structured search failed')
      }
      body = await searchPhotonApi(freeform, { pharmacyOnly })
    }
  } else {
    body = await searchPhotonApi(freeform, { pharmacyOnly })
  }
  const fallbackLabel = pharmacyOnly ? 'Pharmacy' : 'Address'

  return featuresFromBody(body)
    .map(feature => mapPhotonFeatureToSearchResult(feature, fallbackLabel))
    .filter(Boolean)
    .slice(0, 12)
}

/**
 * @returns {Promise<Array<{
 *   placeId, name, address, provider, raw, details
 * }>>}
 */
export async function searchPharmaciesWithPhoton(filters = {}) {
  return runPhotonSearch(filters, { pharmacyOnly: true })
}

export async function searchAddressesWithPhoton(filters = {}) {
  return runPhotonSearch(filters, { pharmacyOnly: false })
}
