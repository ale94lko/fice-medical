import {
  encounterStatuses,
  encounterTypes,
} from 'components/constants.js'

function trim(value) {
  return String(value ?? '').trim()
}

function parseOptionalNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) ? n : null
}

function parseOptionalBool(value) {
  return value === true || value === 'true' || value === 1 || value === '1'
}

function normalizeServiceProcedure(row = {}) {
  return {
    id: parseOptionalNumber(row.id),
    serviceProcedureId: parseOptionalNumber(
      row.service_procedure_id ?? row.serviceProcedureId,
    ),
    displayOrder: parseOptionalNumber(
      row.display_order ?? row.displayOrder,
    ) ?? 0,
    name: trim(row.name),
    cptCode: trim(row.cpt_code ?? row.cptCode),
    hcpcsCode: trim(row.hcpcs_code ?? row.hcpcsCode),
    suggestedFee: parseOptionalNumber(
      row.suggested_fee ?? row.suggestedFee,
    ),
  }
}

function normalizeDiagnosis(row = {}) {
  return {
    id: parseOptionalNumber(row.id),
    icd10Code: trim(row.icd10_code ?? row.icd10Code),
    description: trim(row.description),
    sequenceNo: parseOptionalNumber(
      row.sequence_no ?? row.sequenceNo,
    ) ?? 0,
    isPrimary: parseOptionalBool(row.is_primary ?? row.isPrimary),
  }
}

/**
 * Normalize a single encounter from API (snake_case or camelCase).
 * Returns null when there is no usable id / empty active payload.
 */
export function normalizeEncounter(raw) {
  if (raw == null || raw === '') {
    return null
  }
  if (typeof raw !== 'object') {
    return null
  }
  const id = parseOptionalNumber(raw.id ?? raw.encounter_id ?? raw.encounterId)
  if (id == null) {
    return null
  }
  const status = trim(raw.status).toUpperCase()
    || encounterStatuses.inProgress
  const encounterType = trim(
    raw.encounter_type ?? raw.encounterType,
  ).toUpperCase()
  const nestedClient = raw.client
    && typeof raw.client === 'object'
    ? raw.client
    : null
  const clientDisplayName = trim(
    raw.client_display_name
    ?? raw.clientDisplayName
    ?? raw.client_name
    ?? raw.clientName
    ?? nestedClient?.display_name
    ?? nestedClient?.displayName
    ?? nestedClient?.full_name
    ?? nestedClient?.fullName
    ?? nestedClient?.name
    ?? [
      nestedClient?.first_name ?? nestedClient?.firstName,
      nestedClient?.middle_name ?? nestedClient?.middleName,
      nestedClient?.last_name ?? nestedClient?.lastName,
    ].filter(Boolean).join(' '),
  )

  return {
    id,
    clientId: parseOptionalNumber(
      raw.client_id ?? raw.clientId ?? nestedClient?.id,
    ),
    clientDisplayName,
    clinicianId: parseOptionalNumber(
      raw.clinician_id ?? raw.clinicianId,
    ),
    appointmentId: parseOptionalNumber(
      raw.appointment_id ?? raw.appointmentId,
    ),
    encounterType: encounterType || encounterTypes.walkIn,
    status,
    telemedicine: parseOptionalBool(
      raw.telemedicine ?? raw.is_telemedicine ?? raw.isTelemedicine,
    ),
    placeOfServiceCode: trim(
      raw.place_of_service_code ?? raw.placeOfServiceCode,
    ),
    chiefComplaint: trim(
      raw.chief_complaint ?? raw.chiefComplaint,
    ),
    notes: trim(raw.notes),
    startedAtUtc: trim(
      raw.started_at_utc
      ?? raw.startedAtUtc
      ?? raw.started_at
      ?? raw.startedAt,
    ),
    completedAtUtc: trim(
      raw.completed_at_utc
      ?? raw.completedAtUtc
      ?? raw.completed_at
      ?? raw.completedAt,
    ),
    cancelledAtUtc: trim(
      raw.cancelled_at_utc
      ?? raw.cancelledAtUtc
      ?? raw.cancelled_at
      ?? raw.cancelledAt,
    ),
    serviceProcedures: (
      raw.service_procedures
      ?? raw.serviceProcedures
      ?? []
    ).map(normalizeServiceProcedure),
    diagnoses: (raw.diagnoses ?? []).map(normalizeDiagnosis),
    isInProgress: status === encounterStatuses.inProgress,
  }
}

export function mapEncountersList(rows) {
  if (!Array.isArray(rows)) {
    return []
  }

  return rows.map(normalizeEncounter).filter(Boolean)
}

export function isEncounterInProgress(encounter) {
  return Boolean(encounter?.isInProgress)
}
