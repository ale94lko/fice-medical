/* eslint-disable camelcase -- API payloads use snake_case */
import { shallowRef } from 'vue'
import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  mapEncountersList,
  normalizeEncounter,
} from 'src/utils/encounter-normalize.js'

const activeEncounterByClientId = new Map()

/**
 * Shared toolbar signal: any IN_PROGRESS encounter currently cached.
 * Shape: { clientId: string, encounter: object } | null
 */
export const toolbarActiveEncounter = shallowRef(null)

function clientKey(clientId) {
  return String(clientId ?? '').trim()
}

function syncToolbarActiveEncounter() {
  for (const [id, encounter] of activeEncounterByClientId.entries()) {
    if (encounter?.isInProgress) {
      toolbarActiveEncounter.value = {
        clientId: id,
        encounter,
      }

      return
    }
  }
  toolbarActiveEncounter.value = null
}

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

function unwrapList(body) {
  const data = unwrapData(body)
  if (Array.isArray(data)) {
    return data
  }
  if (Array.isArray(data?.items)) {
    return data.items
  }
  if (Array.isArray(data?.content)) {
    return data.content
  }

  return []
}

function resolveEncounterId(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) ? n : value
}

export function getCachedActiveEncounter(clientId) {
  const key = clientKey(clientId)
  if (!key) {
    return null
  }

  return activeEncounterByClientId.get(key) ?? null
}

export function getCachedActiveEncounterId(clientId) {
  return getCachedActiveEncounter(clientId)?.id ?? null
}

export function setCachedActiveEncounter(clientId, encounter) {
  const key = clientKey(clientId)
  if (!key) {
    return
  }
  if (encounter == null) {
    activeEncounterByClientId.delete(key)
    syncToolbarActiveEncounter()

    return
  }
  activeEncounterByClientId.set(key, encounter)
  syncToolbarActiveEncounter()
}

export function clearCachedActiveEncounter(clientId) {
  const key = clientKey(clientId)
  if (!key) {
    return
  }
  activeEncounterByClientId.delete(key)
  syncToolbarActiveEncounter()
}

/**
 * Attach encounter_id when the client has an active encounter cached.
 * Omits the field when there is no active visit.
 */
export function attachEncounterId(body, clientId) {
  const payload = body && typeof body === 'object' ? { ...body } : {}
  const encounterId = getCachedActiveEncounterId(clientId)
  if (encounterId == null) {
    delete payload.encounter_id

    return payload
  }
  payload.encounter_id = resolveEncounterId(encounterId)

  return payload
}

/**
 * Attach encounter_id to create rows only (no id).
 * Existing rows keep their own encounter_id untouched.
 */
export function attachEncounterIdToRows(rows, clientId) {
  if (!Array.isArray(rows)) {
    return rows
  }
  const encounterId = getCachedActiveEncounterId(clientId)
  const resolved = encounterId == null
    ? null
    : resolveEncounterId(encounterId)

  return rows.map(row => {
    if (!row || typeof row !== 'object') {
      return row
    }
    const next = { ...row }
    const hasId = next.id != null && String(next.id).trim() !== ''
    if (hasId) {
      return next
    }
    if (resolved == null) {
      delete next.encounter_id

      return next
    }
    next.encounter_id = resolved

    return next
  })
}

const CLIENT_CLINICAL_LIST_KEYS = [
  'allergies',
  'vitals',
  'labs',
  'referrals',
  'screenings',
  'medications',
]

/**
 * Client PATCH body: stamp create-only clinical rows + optional
 * top-level encounter_id when an active encounter is cached.
 */
export function attachEncounterIdToClientClinicalBody(body, clientId) {
  if (!body || typeof body !== 'object') {
    return body
  }
  const next = { ...body }
  CLIENT_CLINICAL_LIST_KEYS.forEach(key => {
    if (Array.isArray(next[key])) {
      next[key] = attachEncounterIdToRows(next[key], clientId)
    }
  })
  const encounterId = getCachedActiveEncounterId(clientId)
  if (encounterId == null) {
    delete next.encounter_id
  } else {
    next.encounter_id = resolveEncounterId(encounterId)
  }

  return next
}

export function encounterApiErrorMessage(error, fallback = 'Request failed') {
  const data = error?.response?.data
  const message = data?.error_description
    ?? data?.message
    ?? data?.error
    ?? error?.message

  return String(message || fallback)
}

export function isEncounterConflictError(error) {
  return Number(error?.response?.status) === 409
}

export function isEncounterInvalidError(error) {
  return Number(error?.response?.status) === 400
}

function mapServiceProcedureToApi(row = {}) {
  const payload = {
    service_procedure_id: resolveEncounterId(
      row.serviceProcedureId ?? row.service_procedure_id,
    ),
    display_order: Number(row.displayOrder ?? row.display_order ?? 0) || 0,
    name: trimOrNull(row.name),
    cpt_code: trimOrNull(row.cptCode ?? row.cpt_code),
    hcpcs_code: trimOrNull(row.hcpcsCode ?? row.hcpcs_code),
  }
  const fee = row.suggestedFee ?? row.suggested_fee
  if (fee != null && fee !== '') {
    payload.suggested_fee = Number(fee)
  }

  return payload
}

function mapDiagnosisToApi(row = {}) {
  return {
    icd10_code: trimOrNull(row.icd10Code ?? row.icd10_code),
    description: trimOrNull(row.description),
    sequence_no: Number(row.sequenceNo ?? row.sequence_no ?? 0) || 0,
    is_primary: Boolean(row.isPrimary ?? row.is_primary),
  }
}

function trimOrNull(value) {
  const text = String(value ?? '').trim()

  return text || null
}

export function encounterCreateToApiPayload(form = {}) {
  const payload = {
    client_id: resolveEncounterId(form.clientId ?? form.client_id),
    clinician_id: resolveEncounterId(
      form.clinicianId ?? form.clinician_id,
    ),
    encounter_type: String(
      form.encounterType ?? form.encounter_type ?? '',
    ).trim().toUpperCase(),
    telemedicine: Boolean(form.telemedicine),
  }
  const pos = trimOrNull(
    form.placeOfServiceCode ?? form.place_of_service_code,
  )
  if (pos) {
    payload.place_of_service_code = pos
  }
  const complaint = trimOrNull(
    form.chiefComplaint ?? form.chief_complaint,
  )
  if (complaint) {
    payload.chief_complaint = complaint
  }
  const notes = trimOrNull(form.notes)
  if (notes) {
    payload.notes = notes
  }
  const appointmentId = resolveEncounterId(
    form.appointmentId ?? form.appointment_id,
  )
  if (appointmentId != null) {
    payload.appointment_id = appointmentId
  }
  const procedures = form.serviceProcedures ?? form.service_procedures
  if (Array.isArray(procedures) && procedures.length) {
    payload.service_procedures = procedures.map(mapServiceProcedureToApi)
  }

  return payload
}

export function encounterPatchToApiPayload(form = {}) {
  const payload = {}
  if (form.chiefComplaint != null || form.chief_complaint != null) {
    payload.chief_complaint = trimOrNull(
      form.chiefComplaint ?? form.chief_complaint,
    )
  }
  if (form.placeOfServiceCode != null
    || form.place_of_service_code != null) {
    payload.place_of_service_code = trimOrNull(
      form.placeOfServiceCode ?? form.place_of_service_code,
    )
  }
  if (form.telemedicine != null) {
    payload.telemedicine = Boolean(form.telemedicine)
  }
  if (form.notes != null) {
    payload.notes = trimOrNull(form.notes)
  }
  const procedures = form.serviceProcedures ?? form.service_procedures
  if (Array.isArray(procedures)) {
    payload.service_procedures = procedures.map(mapServiceProcedureToApi)
  }
  const diagnoses = form.diagnoses
  if (Array.isArray(diagnoses)) {
    payload.diagnoses = diagnoses.map(mapDiagnosisToApi)
  }

  return payload
}

export async function createEncounter(form) {
  const response = await apiInstance.post(
    apiPaths.encountersCreate,
    encounterCreateToApiPayload(form),
  )
  const encounter = normalizeEncounter(unwrapData(response.data))
  if (encounter?.clientId != null) {
    setCachedActiveEncounter(encounter.clientId, encounter)
  }

  return encounter
}

export async function listClientEncounters(clientId, params = {}) {
  const response = await apiInstance.get(
    apiPaths.clientEncounters(clientId),
    { params },
  )

  return mapEncountersList(unwrapList(response.data))
}

export async function fetchClientActiveEncounter(clientId) {
  const key = clientKey(clientId)
  if (!key) {
    return null
  }
  try {
    const response = await apiInstance.get(
      apiPaths.clientActiveEncounter(key),
    )
    const data = unwrapData(response.data)
    if (data == null
      || data === ''
      || (typeof data === 'object' && !Object.keys(data).length)) {
      setCachedActiveEncounter(key, null)

      return null
    }
    const encounter = normalizeEncounter(data)
    setCachedActiveEncounter(key, encounter)

    return encounter
  } catch (error) {
    if (Number(error?.response?.status) === 404) {
      setCachedActiveEncounter(key, null)

      return null
    }
    throw error
  }
}

export async function fetchEncounter(encounterId) {
  const response = await apiInstance.get(
    apiPaths.encounterById(encounterId),
  )

  return normalizeEncounter(unwrapData(response.data))
}

export async function patchEncounter(encounterId, form) {
  const response = await apiInstance.patch(
    apiPaths.encounterById(encounterId),
    encounterPatchToApiPayload(form),
  )
  const encounter = normalizeEncounter(unwrapData(response.data))
  if (encounter?.clientId != null && encounter.isInProgress) {
    setCachedActiveEncounter(encounter.clientId, encounter)
  }

  return encounter
}

export async function completeEncounter(encounterId, clientId = null) {
  const response = await apiInstance.post(
    apiPaths.encounterComplete(encounterId),
  )
  const encounter = normalizeEncounter(unwrapData(response.data))
  const key = clientId ?? encounter?.clientId
  if (key != null) {
    setCachedActiveEncounter(key, null)
  }

  return encounter
}

export async function cancelEncounter(encounterId, clientId = null) {
  const response = await apiInstance.post(
    apiPaths.encounterCancel(encounterId),
  )
  const encounter = normalizeEncounter(unwrapData(response.data))
  const key = clientId ?? encounter?.clientId
  if (key != null) {
    setCachedActiveEncounter(key, null)
  }

  return encounter
}
