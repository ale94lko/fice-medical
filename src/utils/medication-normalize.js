import {
  medicationStatuses,
  pharmacyModeValues,
} from 'components/constants.js'
import {
  apiDateToDisplay,
  displayDateToApi,
} from 'src/utils/app-datetime.js'

function trimStr(value) {
  if (value == null) {
    return ''
  }

  return String(value).trim()
}

function toNumberOrNull(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) ? n : null
}

export function normalizeReferenceMedication(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const id = raw.id ?? raw.ID
  if (id == null || String(id).trim() === '') {
    return null
  }
  const name = trimStr(raw.name)
  const genericName = trimStr(raw.generic_name ?? raw.genericName)

  return {
    id,
    code: trimStr(raw.code),
    name,
    genericName,
    active: raw.active !== false,
    externalRxnorm: trimStr(raw.external_rxnorm ?? raw.externalRxnorm),
    externalNdc: trimStr(raw.external_ndc ?? raw.externalNdc) || null,
    label: genericName ? `${name} (${genericName})` : name,
  }
}

export function normalizePharmacy(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const id = raw.id ?? raw.ID
  if (id == null || String(id).trim() === '') {
    return null
  }

  return {
    id,
    name: trimStr(raw.name),
    phone: trimStr(raw.phone),
    fax: trimStr(raw.fax),
    addressLine: trimStr(raw.address_line ?? raw.addressLine),
    city: trimStr(raw.city),
    state: trimStr(raw.state),
    zipCode: trimStr(raw.zip_code ?? raw.zipCode),
    country: trimStr(raw.country) || 'US',
    notes: trimStr(raw.notes),
    preferred: Boolean(raw.preferred),
    createdAt: trimStr(raw.created_at ?? raw.createdAt),
  }
}

export function mapPharmaciesListFromApi(list) {
  return (Array.isArray(list) ? list : [])
    .map(normalizePharmacy)
    .filter(Boolean)
}

export function normalizePrescriptionConsent(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  return {
    clientId: raw.client_id ?? raw.clientId ?? null,
    consentGiven: Boolean(raw.consent_given ?? raw.consentGiven),
    notes: trimStr(raw.notes),
    consentedAt: trimStr(raw.consented_at ?? raw.consentedAt),
    updatedAt: trimStr(raw.updated_at ?? raw.updatedAt),
  }
}

export function normalizeClientMedication(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const id = raw.id ?? raw.ID
  if (id == null || String(id).trim() === '') {
    return null
  }
  const pharmacyRaw = raw.pharmacy
  const pharmacy = pharmacyRaw && typeof pharmacyRaw === 'object'
    ? normalizePharmacy(pharmacyRaw)
    : null
  const dosage = toNumberOrNull(raw.dosage)
  const dosageUnit = trimStr(raw.dosage_unit ?? raw.dosageUnit)
  const dosageUnitLabel = trimStr(
    raw.dosage_unit_label ?? raw.dosageUnitLabel,
  ) || dosageUnit
  const route = trimStr(raw.route)
  const routeLabel = trimStr(raw.route_label ?? raw.routeLabel) || route
  const frequency = trimStr(raw.frequency)
  const frequencyLabel = trimStr(
    raw.frequency_label ?? raw.frequencyLabel,
  ) || frequency
  const status = trimStr(raw.status).toUpperCase()
    || medicationStatuses.active

  return {
    id,
    clientId: raw.client_id ?? raw.clientId ?? null,
    medicationId: raw.medication_id ?? raw.medicationId ?? null,
    medicationName: trimStr(raw.medication_name ?? raw.medicationName),
    medicationGenericName: trimStr(
      raw.medication_generic_name ?? raw.medicationGenericName,
    ),
    medicationCode: trimStr(raw.medication_code ?? raw.medicationCode),
    dosage,
    dosageUnit,
    dosageUnitLabel,
    dosageDisplay: dosage != null
      ? `${dosage} ${dosageUnitLabel}`.trim()
      : '—',
    route,
    routeLabel,
    frequency,
    frequencyLabel,
    routeFrequencyDisplay: [routeLabel, frequencyLabel]
      .filter(Boolean)
      .join(' - ') || '—',
    startDate: apiDateToDisplay(raw.start_date ?? raw.startDate) || '',
    endDate: apiDateToDisplay(raw.end_date ?? raw.endDate) || '',
    status,
    reasonDiagnosis: trimStr(
      raw.reason_diagnosis ?? raw.reasonDiagnosis,
    ),
    instructions: trimStr(raw.instructions),
    notes: trimStr(raw.notes),
    pharmacy,
    pharmacyId: raw.pharmacy_id ?? raw.pharmacyId ?? pharmacy?.id ?? null,
    preferredPharmacy: Boolean(
      raw.preferred_pharmacy ?? raw.preferredPharmacy,
    ),
    pharmacyMode: resolvePharmacyMode(raw, pharmacy),
    prescriberId: raw.prescriber_id ?? raw.prescriberId ?? null,
    prescriberName: trimStr(raw.prescriber_name ?? raw.prescriberName),
    setPharmacyPreferred: false,
    createdAt: trimStr(raw.created_at ?? raw.createdAt),
    updatedAt: trimStr(raw.updated_at ?? raw.updatedAt),
  }
}

function resolvePharmacyMode(raw, pharmacy) {
  const mode = trimStr(raw.pharmacy_mode ?? raw.pharmacyMode).toUpperCase()
  if (
    mode === pharmacyModeValues.preferred
    || mode === pharmacyModeValues.selected
    || mode === pharmacyModeValues.none
  ) {
    return mode
  }
  if (pharmacy?.id != null) {
    return pharmacy.preferred
      ? pharmacyModeValues.preferred
      : pharmacyModeValues.selected
  }

  return pharmacyModeValues.none
}

export function mapMedicationsListFromApi(list) {
  return (Array.isArray(list) ? list : [])
    .map(normalizeClientMedication)
    .filter(Boolean)
}

export function createEmptyMedicationForm() {
  return {
    id: null,
    medicationId: null,
    medicationName: '',
    medicationGenericName: '',
    dosage: '',
    dosageUnit: null,
    route: null,
    frequency: null,
    startDate: '',
    endDate: '',
    status: medicationStatuses.active,
    reasonDiagnosis: '',
    instructions: '',
    notes: '',
    pharmacyId: null,
    pharmacyMode: pharmacyModeValues.preferred,
    setPharmacyPreferred: false,
    prescriberId: null,
  }
}

export function createEmptyPharmacyForm() {
  return {
    id: null,
    name: '',
    phone: '',
    fax: '',
    addressLine: '',
    city: '',
    state: null,
    zipCode: '',
    country: 'US',
    notes: '',
    preferred: false,
  }
}

export function medicationToApiPayload(form) {
  const mode = trimStr(form?.pharmacyMode).toUpperCase()
    || pharmacyModeValues.none
  const pharmacyId = form?.pharmacyId != null && form.pharmacyId !== ''
    ? Number(form.pharmacyId)
    : null
  /* eslint-disable camelcase -- API request body uses snake_case */
  const payload = {
    medication_id: Number(form?.medicationId),
    dosage: Number(form?.dosage),
    dosage_unit: trimStr(form?.dosageUnit),
    route: trimStr(form?.route),
    frequency: trimStr(form?.frequency),
    start_date: displayDateToApi(form?.startDate) || null,
    end_date: displayDateToApi(form?.endDate) || null,
    prescriber_id: Number(form?.prescriberId),
    status: trimStr(form?.status).toUpperCase()
      || medicationStatuses.active,
    reason_diagnosis: trimStr(form?.reasonDiagnosis) || null,
    instructions: trimStr(form?.instructions),
    notes: trimStr(form?.notes) || null,
    pharmacy_mode: mode,
    set_pharmacy_preferred: Boolean(form?.setPharmacyPreferred),
  }
  if (mode === pharmacyModeValues.selected && Number.isFinite(pharmacyId)) {
    payload.pharmacy_id = pharmacyId
  } else if (mode === pharmacyModeValues.preferred) {
    payload.pharmacy_id = null
  } else {
    payload.pharmacy_id = null
  }
  /* eslint-enable camelcase */

  return payload
}

export function pharmacyToApiPayload(form) {
  /* eslint-disable camelcase -- API request body uses snake_case */
  return {
    name: trimStr(form?.name),
    phone: trimStr(form?.phone) || null,
    fax: trimStr(form?.fax) || null,
    address_line: trimStr(form?.addressLine),
    city: trimStr(form?.city),
    state: trimStr(form?.state),
    zip_code: trimStr(form?.zipCode),
    country: trimStr(form?.country) || 'US',
    notes: trimStr(form?.notes) || null,
    preferred: Boolean(form?.preferred),
  }
  /* eslint-enable camelcase */
}

export function medicationStatusVariant(status) {
  const token = trimStr(status).toUpperCase()
  if (token === medicationStatuses.active) {
    return 'positive'
  }
  if (token === medicationStatuses.completed) {
    return 'info'
  }
  if (token === medicationStatuses.discontinued) {
    return 'negative'
  }

  return 'neutral'
}

export function formatPharmacyAddress(pharmacy) {
  if (!pharmacy) {
    return ''
  }
  const line1 = trimStr(pharmacy.addressLine)
  const cityStateZip = [
    trimStr(pharmacy.city),
    [trimStr(pharmacy.state), trimStr(pharmacy.zipCode)]
      .filter(Boolean)
      .join(' '),
  ].filter(Boolean).join(', ')

  return [line1, cityStateZip].filter(Boolean).join(', ')
}
