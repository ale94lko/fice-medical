/**
 * Google Places helpers for address / pharmacy search.
 * Requires VITE_GOOGLE_PLACES_API_KEY (Maps JavaScript API + Places library).
 */

const PLACES_SCRIPT_ID = 'fice-google-places-js'
let placesLoadPromise = null

function placesApiKey() {
  return String(import.meta.env.VITE_GOOGLE_PLACES_API_KEY ?? '').trim()
}

export function isGooglePlacesConfigured() {
  return Boolean(placesApiKey())
}

function loadPlacesScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Places requires a browser'))
  }
  if (window.google?.maps?.places) {
    return Promise.resolve(window.google.maps.places)
  }
  if (placesLoadPromise) {
    return placesLoadPromise
  }
  const key = placesApiKey()
  if (!key) {
    return Promise.reject(new Error('Google Places API key is not configured'))
  }

  placesLoadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(PLACES_SCRIPT_ID)
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.google?.maps?.places) {
          resolve(window.google.maps.places)
        } else {
          reject(new Error('Google Places failed to load'))
        }
      })
      existing.addEventListener('error', () => {
        placesLoadPromise = null
        reject(new Error('Google Places failed to load'))
      })

      return
    }

    const script = document.createElement('script')
    script.id = PLACES_SCRIPT_ID
    script.async = true
    script.defer = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      encodeURIComponent(key)
    }&libraries=places`
    script.onload = () => {
      if (window.google?.maps?.places) {
        resolve(window.google.maps.places)
      } else {
        placesLoadPromise = null
        reject(new Error('Google Places failed to load'))
      }
    }
    script.onerror = () => {
      placesLoadPromise = null
      reject(new Error('Google Places failed to load'))
    }
    document.head.appendChild(script)
  })

  return placesLoadPromise
}

function trimStr(value) {
  return String(value ?? '').trim()
}

export function buildPharmacyPlacesQuery(filters = {}) {
  const freeform = trimStr(filters.q)
  if (freeform) {
    return `${freeform} pharmacy`
  }
  const parts = [
    trimStr(filters.name),
    trimStr(filters.address),
    trimStr(filters.city),
    trimStr(filters.state),
    trimStr(filters.zipCode),
    'pharmacy',
  ].filter(Boolean)

  return parts.join(' ')
}

export function buildAddressPlacesQuery(filters = {}) {
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

function addressComponent(components, type) {
  const match = (components ?? []).find(item =>
    Array.isArray(item.types) && item.types.includes(type),
  )

  return match?.long_name ?? match?.short_name ?? ''
}

function addressComponentShort(components, type) {
  const match = (components ?? []).find(item =>
    Array.isArray(item.types) && item.types.includes(type),
  )

  return match?.short_name ?? match?.long_name ?? ''
}

export function mapPlaceResultToPharmacyFields(place) {
  const components = place?.address_components ?? []
  const streetNumber = addressComponent(components, 'street_number')
  const route = addressComponent(components, 'route')
  const addressLine = [streetNumber, route].filter(Boolean).join(' ')
    || trimStr(place?.vicinity)
    || trimStr(place?.formatted_address).split(',')[0]
  const city = addressComponent(components, 'locality')
    || addressComponent(components, 'sublocality')
    || addressComponent(components, 'postal_town')
  const county = addressComponent(components, 'administrative_area_level_2')
    .replace(/\s+County$/i, '')
  const state = addressComponentShort(
    components,
    'administrative_area_level_1',
  )
  const zipCode = addressComponent(components, 'postal_code')
  const country = addressComponentShort(components, 'country') || 'US'
  const phone = trimStr(place?.formatted_phone_number)
  const name = trimStr(place?.name)

  return {
    name,
    phone,
    fax: '',
    addressLine,
    city,
    county,
    state: state || null,
    zipCode,
    country: country === 'United States' ? 'US' : country,
    notes: '',
    placeId: trimStr(place?.place_id),
    formattedAddress: trimStr(place?.formatted_address),
  }
}

function runGoogleTextSearch(query, { type } = {}) {
  return new Promise((resolve, reject) => {
    const service = new window.google.maps.places.PlacesService(
      document.createElement('div'),
    )
    const request = { query }
    if (type) {
      request.type = type
    }
    service.textSearch(request, (results, status) => {
      const ok = window.google.maps.places.PlacesServiceStatus.OK
      const zero = window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS
      if (status === zero || !results?.length) {
        resolve([])

        return
      }
      if (status !== ok) {
        reject(new Error(`Google Places search failed: ${status}`))

        return
      }
      resolve(
        results.slice(0, 12).map(item => ({
          placeId: item.place_id,
          name: trimStr(item.name),
          address: trimStr(item.formatted_address),
          raw: item,
        })),
      )
    })
  })
}

export async function searchPharmaciesWithPlaces(filters = {}) {
  const query = buildPharmacyPlacesQuery(filters)
  if (!query || query === 'pharmacy') {
    return []
  }

  await loadPlacesScript()

  return runGoogleTextSearch(query, { type: 'pharmacy' })
}

export async function searchAddressesWithPlaces(filters = {}) {
  const query = buildAddressPlacesQuery(filters)
  if (!query) {
    return []
  }

  await loadPlacesScript()

  return runGoogleTextSearch(query)
}

export async function fetchPharmacyPlaceDetails(placeId) {
  const id = trimStr(placeId)
  if (!id) {
    return null
  }
  await loadPlacesScript()
  const service = new window.google.maps.places.PlacesService(
    document.createElement('div'),
  )

  return new Promise((resolve, reject) => {
    service.getDetails(
      {
        placeId: id,
        fields: [
          'place_id',
          'name',
          'formatted_address',
          'address_components',
          'formatted_phone_number',
          'vicinity',
        ],
      },
      (place, status) => {
        const ok = window.google.maps.places.PlacesServiceStatus.OK
        if (status !== ok || !place) {
          reject(new Error(`Google Places details failed: ${status}`))

          return
        }
        resolve(mapPlaceResultToPharmacyFields(place))
      },
    )
  })
}
