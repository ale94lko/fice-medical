import { pharmacyModeValues } from 'components/constants.js'

function pharmacyIdOf(row) {
  if (row?.id == null || row.id === '') {
    return null
  }

  return row.id
}

export function resolveDefaultPharmacySelection(pharmacies = []) {
  const list = Array.isArray(pharmacies) ? pharmacies : []
  if (!list.length) {
    return {
      pharmacyMode: pharmacyModeValues.none,
      pharmacyId: null,
    }
  }
  const preferred = list.find(row => row?.preferred)
  if (preferred) {
    return {
      pharmacyMode: pharmacyModeValues.selected,
      pharmacyId: pharmacyIdOf(preferred),
    }
  }
  if (list.length === 1) {
    return {
      pharmacyMode: pharmacyModeValues.selected,
      pharmacyId: pharmacyIdOf(list[0]),
    }
  }

  return {
    pharmacyMode: pharmacyModeValues.selected,
    pharmacyId: null,
  }
}

export function findPharmacyById(pharmacies, pharmacyId) {
  if (pharmacyId == null || pharmacyId === '') {
    return null
  }

  return (pharmacies ?? []).find(
    row => String(row?.id) === String(pharmacyId),
  ) ?? null
}

export function isSelectedPharmacyPreferred(pharmacies, pharmacyId) {
  const row = findPharmacyById(pharmacies, pharmacyId)

  return Boolean(row?.preferred)
}

export function shouldWarnMissingPharmacy(pharmacies, pharmacyId) {
  const list = Array.isArray(pharmacies) ? pharmacies : []
  if (list.length < 2) {
    return false
  }
  if (list.some(row => row?.preferred)) {
    return false
  }

  return pharmacyId == null || pharmacyId === ''
}
