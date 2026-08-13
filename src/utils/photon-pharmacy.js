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

/**
 * Pull a US state code/name out of free text (prefers end-of-string).
 * @returns {{ code: string, remainder: string } | null}
 */
export function extractUsStateFromText(text) {
  let rest = trimStr(text)
  if (!rest) {
    return null
  }

  const sortedLabels = [...usStates]
    .map(item => ({
      code: item.value,
      label: String(item.label ?? '').trim(),
    }))
    .filter(item => item.label)
    .sort((a, b) => b.label.length - a.label.length)

  for (const item of sortedLabels) {
    const re = new RegExp(
      `(^|\\s)${item.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`,
      'i',
    )
    if (!re.test(rest)) {
      continue
    }
    rest = rest.replace(re, ' ').replace(/\s+/g, ' ').trim()

    return { code: item.code, remainder: rest }
  }

  const tokens = rest.split(/\s+/).filter(Boolean)
  if (!tokens.length) {
    return null
  }
  const last = tokens[tokens.length - 1]
  const code = resolveUsStateCode(last)
  if (!code || last.length !== 2) {
    return null
  }
  tokens.pop()

  return { code, remainder: tokens.join(' ') }
}

/**
 * Map a freeform pharmacy/address query onto structured Photon filters
 * so ZIP / city / state / street work (not only name).
 */
export function inferPharmacySearchFiltersFromQuery(query) {
  let rest = trimStr(query)
  const out = {
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  }
  if (!rest) {
    return out
  }

  const zipMatch = rest.match(/\b(\d{5})(?:-\d{4})?\b/)
  if (zipMatch) {
    out.zipCode = zipMatch[1]
    rest = rest.replace(zipMatch[0], ' ').replace(/\s+/g, ' ').trim()
  }

  const stateHit = extractUsStateFromText(rest)
  if (stateHit) {
    out.state = stateHit.code
    rest = stateHit.remainder
  }

  if (!rest) {
    return out
  }

  if (/^\d+\s+\S/.test(rest)) {
    const words = rest.split(/\s+/).filter(Boolean)
    if ((out.state || out.zipCode) && words.length >= 3) {
      out.city = words[words.length - 1]
      out.address = words.slice(0, -1).join(' ')
    } else {
      out.address = rest
    }

    return out
  }

  if (out.zipCode || out.state) {
    const words = rest.split(/\s+/).filter(Boolean)
    if (words.length === 1) {
      out.city = words[0]
    } else {
      out.name = words.slice(0, -1).join(' ')
      out.city = words[words.length - 1]
    }

    return out
  }

  out.name = rest

  return out
}

function photonFeatureKey(feature) {
  const props = feature?.properties ?? {}
  const osmType = trimStr(props.osm_type)
  const osmId = props.osm_id
  if (osmType && osmId != null) {
    return `${osmType}:${osmId}`
  }

  return [
    trimStr(props.name),
    trimStr(props.street),
    trimStr(props.postcode),
    trimStr(props.city),
  ].join('|')
}

function mergePhotonFeatureLists(...lists) {
  const seen = new Set()
  const merged = []
  lists.flat().forEach(feature => {
    if (!feature) {
      return
    }
    const key = photonFeatureKey(feature)
    if (seen.has(key)) {
      return
    }
    seen.add(key)
    merged.push(feature)
  })

  return merged
}

function looksLikeCityOrNameQuery(query) {
  const q = trimStr(query)
  if (!q || /^\d/.test(q) || /\d/.test(q)) {
    return false
  }
  const words = q.split(/\s+/).filter(Boolean)

  return words.length >= 1 && words.length <= 3
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

async function searchPhotonApi(query, { pharmacyOnly = false, lat, lon } = {}) {
  const params = new URLSearchParams({
    q: query,
    limit: '12',
    lang: 'en',
    countrycode: 'US',
  })
  if (pharmacyOnly) {
    params.set('osm_tag', 'amenity:pharmacy')
  }
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    params.set('lat', String(lat))
    params.set('lon', String(lon))
    params.set('location_bias_scale', '0.4')
  }

  return fetchPhotonJson(`/api?${params.toString()}`)
}

async function searchPhotonStructured(filters, { pharmacyOnly = false } = {}) {
  const params = new URLSearchParams({
    limit: '12',
    lang: 'en',
    countrycode: 'US',
  })
  // osm_tag + city/zip returns empty on Photon — never combine them.
  if (pharmacyOnly) {
    params.set('osm_tag', 'amenity:pharmacy')
  }
  const address = trimStr(filters.address)
  const name = trimStr(filters.name)
  const city = trimStr(filters.city)
  const state = stateToPhotonValue(filters.state)
  const postcode = trimStr(filters.zipCode)
  const street = address
    || (
      name
      && !city
      && !state
      && !postcode
        ? name
        : ''
    )
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
  if (
    !params.has('street')
    && !params.has('city')
    && !params.has('state')
    && !params.has('postcode')
  ) {
    return { features: [] }
  }

  return fetchPhotonJson(`/structured?${params.toString()}`)
}

function coordsFromFeature(feature) {
  const coords = feature?.geometry?.coordinates
  if (!Array.isArray(coords) || coords.length < 2) {
    return null
  }
  const lon = Number(coords[0])
  const lat = Number(coords[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null
  }

  return { lat, lon }
}

function pickGeocodeFeature(features, filters = {}) {
  const list = Array.isArray(features) ? features : []
  if (!list.length) {
    return null
  }
  const zip = trimStr(filters.zipCode)
  if (zip) {
    const exact = list.find(feature => {
      const props = feature?.properties ?? {}

      return trimStr(props.postcode) === zip
        || trimStr(props.name) === zip
    })
    if (exact) {
      return exact
    }
  }
  const city = trimStr(filters.city).toLowerCase()
  if (city) {
    const cityMatch = list.find(feature => {
      const props = feature?.properties ?? {}
      const featureCity = trimStr(props.city || props.name).toLowerCase()

      return featureCity === city
    })
    if (cityMatch) {
      return cityMatch
    }
  }

  return list[0]
}

async function resolveLocationCoords(filters = {}) {
  const location = {
    address: trimStr(filters.address),
    city: trimStr(filters.city),
    state: trimStr(filters.state),
    zipCode: trimStr(filters.zipCode),
  }
  if (hasStructuredFilters(location)) {
    try {
      const structured = await searchPhotonStructured(
        location,
        { pharmacyOnly: false },
      )
      const fromStructured = coordsFromFeature(
        pickGeocodeFeature(featuresFromBody(structured), location),
      )
      if (fromStructured) {
        return fromStructured
      }
    } catch {
      // Fall through to freeform geocode.
    }
  }

  const query = [
    location.address,
    location.city,
    stateToPhotonValue(location.state),
    location.zipCode,
    trimStr(filters.q),
  ].filter(Boolean).join(' ')
  if (!query) {
    return null
  }
  const body = await searchPhotonApi(query, { pharmacyOnly: false })

  return coordsFromFeature(
    pickGeocodeFeature(featuresFromBody(body), location),
  )
}

async function searchPharmaciesNearLocation(filters = {}, nameHint = '') {
  const coords = await resolveLocationCoords(filters)
  if (!coords) {
    return { features: [] }
  }
  const q = trimStr(nameHint) || 'pharmacy'

  return searchPhotonApi(q, {
    pharmacyOnly: true,
    lat: coords.lat,
    lon: coords.lon,
  })
}

async function collectPhotonBodies(tasks) {
  const settled = await Promise.allSettled(tasks)
  const features = []
  settled.forEach(result => {
    if (result.status !== 'fulfilled') {
      return
    }
    features.push(...featuresFromBody(result.value))
  })

  return { features: mergePhotonFeatureLists(features) }
}

/**
 * Photon cannot filter pharmacies by city/ZIP via osm_tag alone.
 * Geocode the place, then bias pharmacy search with lat/lon.
 */
async function searchPhotonPharmacyFreeform(query) {
  const q = trimStr(query)
  if (!q) {
    return { features: [] }
  }

  const inferred = inferPharmacySearchFiltersFromQuery(q)
  const nameHint = trimStr(inferred.name)
  const location = {
    address: inferred.address,
    city: inferred.city,
    state: inferred.state,
    zipCode: inferred.zipCode,
    q: hasStructuredFilters(inferred) ? '' : q,
  }

  if (hasStructuredFilters(inferred) || /^\d{5}(?:-\d{4})?$/.test(q)) {
    const tasks = [
      searchPharmaciesNearLocation(location, nameHint),
    ]
    if (nameHint) {
      tasks.push(searchPhotonApi(nameHint, { pharmacyOnly: true }))
    }

    return collectPhotonBodies(tasks)
  }

  if (/^\d+\s+\S/.test(q)) {
    return searchPharmaciesNearLocation({ address: q, q }, nameHint)
  }

  if (looksLikeCityOrNameQuery(q)) {
    const byName = await searchPhotonApi(q, { pharmacyOnly: true })
    if (featuresFromBody(byName).length) {
      return byName
    }

    return searchPharmaciesNearLocation({ city: q, q }, '')
  }

  return searchPhotonApi(q, { pharmacyOnly: true })
}

async function searchPhotonAddressFreeform(query) {
  const q = trimStr(query)
  if (!q) {
    return { features: [] }
  }

  const tasks = [searchPhotonApi(q, { pharmacyOnly: false })]
  const inferred = inferPharmacySearchFiltersFromQuery(q)

  if (hasStructuredFilters(inferred)) {
    tasks.push(searchPhotonStructured({
      address: inferred.address,
      city: inferred.city,
      state: inferred.state,
      zipCode: inferred.zipCode,
    }, { pharmacyOnly: false }))
  } else if (looksLikeCityOrNameQuery(q)) {
    tasks.push(searchPhotonStructured({ city: q }, { pharmacyOnly: false }))
  }

  if (/^\d+\s+\S/.test(q)) {
    tasks.push(searchPhotonStructured({ address: q }, { pharmacyOnly: false }))
  }

  return collectPhotonBodies(tasks)
}

async function runPhotonSearch(filters = {}, options = {}) {
  const pharmacyOnly = Boolean(options.pharmacyOnly)
  const freeform = buildPhotonPharmacyQuery(filters)
  if (!freeform && !hasStructuredFilters(filters) && !trimStr(filters.name)) {
    return []
  }

  let body
  if (pharmacyOnly) {
    if (hasStructuredFilters(filters) && !trimStr(filters.q)) {
      body = await searchPharmaciesNearLocation(filters, filters.name)
      if (!featuresFromBody(body).length && trimStr(filters.name)) {
        body = await searchPhotonApi(
          trimStr(filters.name),
          { pharmacyOnly: true },
        )
      }
    } else if (freeform) {
      body = await searchPhotonPharmacyFreeform(freeform)
    } else {
      body = await searchPhotonApi(
        trimStr(filters.name),
        { pharmacyOnly: true },
      )
    }
  } else if (hasStructuredFilters(filters) && !trimStr(filters.q)) {
    try {
      body = await searchPhotonStructured(filters, { pharmacyOnly: false })
      if (!featuresFromBody(body).length && freeform) {
        body = await searchPhotonAddressFreeform(freeform)
      }
    } catch {
      if (!freeform) {
        throw new Error('Photon structured search failed')
      }
      body = await searchPhotonAddressFreeform(freeform)
    }
  } else if (freeform) {
    body = await searchPhotonAddressFreeform(freeform)
  } else {
    body = await searchPhotonApi(trimStr(filters.name), { pharmacyOnly: false })
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
