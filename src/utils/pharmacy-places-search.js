/**
 * @deprecated Prefer address-places-search.js.
 * Kept as a thin re-export for pharmacy callers.
 */
export {
  isAddressPlaceSearchAvailable as isPharmacyPlaceSearchAvailable,
  searchPlaces as searchPharmacies,
  fetchPlaceDetails as fetchPharmacyDetails,
} from 'src/utils/address-places-search.js'
