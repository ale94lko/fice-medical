import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { attachEncounterId } from 'src/utils/encounter-api.js'
import {
  mapClientVitalsListFromApi,
  normalizeVitalRecord,
  vitalsEntryToApiPayload,
} from 'src/utils/vitals-normalize.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

function resolveVitalFromResponse(data) {
  return normalizeVitalRecord(data?.vital ?? data)
}

export async function listVitals(clientId, params = {}) {
  const response = await apiInstance.get(
    apiPaths.clientVitals(clientId),
    { params },
  )
  const data = unwrapData(response.data)

  return mapClientVitalsListFromApi(data)
}

export async function fetchVital(clientId, vitalId) {
  const response = await apiInstance.get(
    apiPaths.clientVitalById(clientId, vitalId),
  )
  const data = unwrapData(response.data)

  return resolveVitalFromResponse(data)
}

export async function createVital(clientId, entry) {
  const body = attachEncounterId(
    vitalsEntryToApiPayload(entry),
    clientId,
  )
  const response = await apiInstance.post(
    apiPaths.clientVitals(clientId),
    body,
  )
  const data = unwrapData(response.data)
  const vital = resolveVitalFromResponse(data)

  return {
    vitalId: vital?.apiId ?? data?.id ?? data?.vital_id,
    vital,
  }
}

export async function updateVital(clientId, vitalId, entry) {
  const body = vitalsEntryToApiPayload(entry)
  delete body.id
  const response = await apiInstance.patch(
    apiPaths.clientVitalById(clientId, vitalId),
    body,
  )
  const data = unwrapData(response.data)

  return resolveVitalFromResponse(data)
}

export async function deleteVital(clientId, vitalId, reason) {
  await apiInstance.delete(
    apiPaths.clientVitalById(clientId, vitalId),
    { data: { reason } },
  )
}

/** Aliases matching labs naming. */
export const listPatientVitals = listVitals
export const fetchPatientVital = fetchVital
export const createPatientVital = createVital
export const updatePatientVital = updateVital
export const deletePatientVital = deleteVital
