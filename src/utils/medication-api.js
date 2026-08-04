import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  mapMedicationsListFromApi,
  mapPharmaciesListFromApi,
  normalizeClientMedication,
  normalizePharmacy,
  normalizePrescriptionConsent,
  normalizeReferenceMedication,
  medicationToApiPayload,
  pharmacyToApiPayload,
} from 'src/utils/medication-normalize.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

function unwrapList(data) {
  if (Array.isArray(data)) {
    return data
  }

  return data?.items ?? []
}

export function apiErrorMessage(error, fallback) {
  return String(
    error?.response?.data?.message
    ?? error?.message
    ?? fallback
    ?? 'Request failed',
  )
}

/* —— Reference Data (RxNorm master) —— */

export async function searchReferenceMedications(query, options = {}) {
  const q = String(query ?? '').trim()
  if (q.length < 2) {
    return []
  }
  const response = await apiInstance.get(apiPaths.referenceMedications, {
    params: {
      q,
      active: true,
      limit: options.limit ?? 20,
      page: options.page ?? 0,
      ...(options.code ? { code: options.code } : {}),
    },
  })
  const data = unwrapData(response.data)

  return unwrapList(data)
    .map(normalizeReferenceMedication)
    .filter(Boolean)
}

export async function fetchReferenceMedication(id) {
  const response = await apiInstance.get(
    apiPaths.referenceMedicationById(id),
  )

  return normalizeReferenceMedication(unwrapData(response.data))
}

/* —— Client medications —— */

export async function listClientMedications(clientId) {
  const response = await apiInstance.get(
    apiPaths.clientMedications(clientId),
  )
  const data = unwrapData(response.data)

  return mapMedicationsListFromApi(unwrapList(data))
}

export async function fetchClientMedication(clientId, medicationId) {
  const response = await apiInstance.get(
    apiPaths.clientMedicationById(clientId, medicationId),
  )

  return normalizeClientMedication(unwrapData(response.data))
}

export async function createClientMedication(clientId, form) {
  const response = await apiInstance.post(
    apiPaths.clientMedications(clientId),
    medicationToApiPayload(form),
  )

  return normalizeClientMedication(unwrapData(response.data))
}

export async function updateClientMedication(clientId, medicationId, form) {
  const response = await apiInstance.patch(
    apiPaths.clientMedicationById(clientId, medicationId),
    medicationToApiPayload(form),
  )

  return normalizeClientMedication(unwrapData(response.data))
}

export async function changeClientMedicationStatus(
  clientId,
  medicationId,
  status,
) {
  const response = await apiInstance.patch(
    apiPaths.clientMedicationStatus(clientId, medicationId),
    { status },
  )

  return normalizeClientMedication(unwrapData(response.data))
}

export async function deleteClientMedication(clientId, medicationId) {
  await apiInstance.delete(
    apiPaths.clientMedicationById(clientId, medicationId),
  )
}

/* —— Pharmacies —— */

export async function listClientPharmacies(clientId) {
  const response = await apiInstance.get(
    apiPaths.clientPharmacies(clientId),
  )
  const data = unwrapData(response.data)

  return mapPharmaciesListFromApi(unwrapList(data))
}

export async function createClientPharmacy(clientId, form) {
  const response = await apiInstance.post(
    apiPaths.clientPharmacies(clientId),
    pharmacyToApiPayload(form),
  )

  return normalizePharmacy(unwrapData(response.data))
}

export async function updateClientPharmacy(clientId, pharmacyId, form) {
  const response = await apiInstance.patch(
    apiPaths.clientPharmacyById(clientId, pharmacyId),
    pharmacyToApiPayload(form),
  )

  return normalizePharmacy(unwrapData(response.data))
}

export async function setPreferredClientPharmacy(clientId, pharmacyId) {
  const response = await apiInstance.post(
    apiPaths.clientPharmacySetPreferred(clientId, pharmacyId),
  )

  return normalizePharmacy(unwrapData(response.data))
}

export async function deleteClientPharmacy(clientId, pharmacyId) {
  await apiInstance.delete(
    apiPaths.clientPharmacyById(clientId, pharmacyId),
  )
}

/* —— Prescription consent —— */

export async function fetchPrescriptionConsent(clientId) {
  const response = await apiInstance.get(
    apiPaths.clientPrescriptionConsent(clientId),
  )
  const data = unwrapData(response.data)
  if (data == null) {
    return null
  }

  return normalizePrescriptionConsent(data)
}

export async function upsertPrescriptionConsent(clientId, payload) {
  const response = await apiInstance.put(
    apiPaths.clientPrescriptionConsent(clientId),
    {
      // eslint-disable-next-line camelcase -- API body
      consent_given: Boolean(payload?.consentGiven ?? payload?.consent_given),
      notes: payload?.notes != null && String(payload.notes).trim()
        ? String(payload.notes).trim()
        : null,
    },
  )

  return normalizePrescriptionConsent(unwrapData(response.data))
}
