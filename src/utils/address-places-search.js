export const ADDRESS_SEARCH_MIN_CHARS = 3
export const ADDRESS_SEARCH_DEBOUNCE_MS = 300

/**
 * General address search (Photon / Google Places).
 * Pharmacy search remains available via { kind: 'pharmacy' }.
 */
import {
  fetchPharmacyPlaceDetails as fetchGooglePlaceDetails,
  isGooglePlacesConfigured,
  searchPharmaciesWithPlaces,
  searchAddressesWithPlaces,
} from 'src/utils/google-places-pharmacy.js'
import {
  isPhotonConfigured,
  mapPhotonFeatureToPharmacyFields,
  pharmacyResultMatchesState,
  searchPharmaciesWithPhoton,
  searchAddressesWithPhoton,
} from 'src/utils/photon-pharmacy.js'

export function isAddressPlaceSearchAvailable() {
  return isGooglePlacesConfigured() || isPhotonConfigured()
}

function withProvider(results, provider) {
  return (results ?? []).map(item => ({
    ...item,
    provider: item.provider || provider,
  }))
}

function filterPlacesByClinicState(results, state) {
  const token = String(state ?? '').trim()
  if (!token) {
    return results ?? []
  }

  return (results ?? []).filter(row =>
    pharmacyResultMatchesState(row, token),
  )
}

/**
 * @param {{
 *   q?: string,
 *   kind?: 'address' | 'pharmacy',
 *   state?: string,
 * }} filters
 */
export async function searchPlaces(filters = {}) {
  const kind = filters.kind === 'pharmacy' ? 'pharmacy' : 'address'
  let results = []
  if (isGooglePlacesConfigured()) {
    try {
      const googleResults = withProvider(
        kind === 'pharmacy'
          ? await searchPharmaciesWithPlaces(filters)
          : await searchAddressesWithPlaces(filters),
        'google',
      )
      if (googleResults.length) {
        results = googleResults
      }
    } catch {
      // Fall through to Photon.
    }
  }
  if (!results.length) {
    results = kind === 'pharmacy'
      ? await searchPharmaciesWithPhoton(filters)
      : await searchAddressesWithPhoton(filters)
  }
  if (kind !== 'pharmacy') {
    return results
  }

  return filterPlacesByClinicState(results, filters.state)
}

/** @deprecated Use searchPlaces({ kind: 'pharmacy' }) */
export async function searchPharmacies(filters = {}) {
  return searchPlaces({ ...filters, kind: 'pharmacy' })
}

export function isPharmacyPlaceSearchAvailable() {
  return isAddressPlaceSearchAvailable()
}

/**
 * Resolve a search row into address fields for forms.
 */
export async function fetchPlaceDetails(result) {
  if (!result) {
    return null
  }
  if (result.provider === 'photon') {
    if (result.details) {
      return normalizeAddressDetails(result.details)
    }

    return normalizeAddressDetails(
      mapPhotonFeatureToPharmacyFields(result.raw),
    )
  }
  if (result.provider === 'google' || isGooglePlacesConfigured()) {
    const details = await fetchGooglePlaceDetails(result.placeId)

    return normalizeAddressDetails(details)
  }
  if (result.details) {
    return normalizeAddressDetails(result.details)
  }

  return normalizeAddressDetails(
    mapPhotonFeatureToPharmacyFields(result.raw),
  )
}

/** @deprecated Use fetchPlaceDetails */
export async function fetchPharmacyDetails(result) {
  return fetchPlaceDetails(result)
}

export function normalizeAddressDetails(details) {
  if (!details) {
    return null
  }
  const addressLine = String(
    details.addressLine
    ?? details.addressLine1
    ?? details.address
    ?? '',
  ).trim()
  const city = String(details.city ?? '').trim()
  const county = String(details.county ?? '').trim()
  const zipCode = String(details.zipCode ?? '').trim()
  const state = details.state != null && String(details.state).trim()
    ? String(details.state).trim()
    : null
  const country = String(details.country ?? 'US').trim() || 'US'

  return {
    name: String(details.name ?? '').trim(),
    phone: String(details.phone ?? '').trim(),
    fax: String(details.fax ?? '').trim(),
    addressLine,
    addressLine1: addressLine,
    addressLine2: String(details.addressLine2 ?? '').trim(),
    city,
    county,
    state,
    zipCode,
    country,
    formattedAddress: String(details.formattedAddress ?? '').trim(),
    provider: details.provider || null,
    placeId: details.placeId || null,
  }
}

/** Keep a free-text value selectable in FormSelect options. */
export function withExtraSelectOption(options, value) {
  const list = Array.isArray(options) ? [...options] : []
  const token = String(value ?? '').trim()
  if (!token) {
    return list
  }
  const exists = list.some(option => {
    const optionValue = String(option?.value ?? '').trim()
    const optionLabel = String(option?.label ?? '').trim()

    return (
      optionValue.toLowerCase() === token.toLowerCase()
      || optionLabel.toLowerCase() === token.toLowerCase()
    )
  })
  if (exists) {
    return list
  }

  return [{ label: token, value: token }, ...list]
}
