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
    units: parseOptionalNumber(row.units),
    durationMinutes: parseOptionalNumber(
      row.duration_minutes ?? row.durationMinutes,
    ),
    placeOfServiceCode: trim(
      row.place_of_service_code ?? row.placeOfServiceCode,
    ) || null,
    renderingClinicianId: parseOptionalNumber(
      row.rendering_clinician_id ?? row.renderingClinicianId,
    ),
    isPrimary: parseOptionalBool(row.is_primary ?? row.isPrimary),
  }
}

function normalizeDiagnosis(row = {}) {
  const codeDotted = trim(row.code_dotted ?? row.codeDotted)
  const code = trim(row.icd10_code ?? row.icd10Code)

  return {
    id: parseOptionalNumber(row.id),
    icd10Code: codeDotted || code,
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
    clientNumber: trim(
      raw.client_number
        ?? raw.clientNumber
        ?? nestedClient?.client_number
        ?? nestedClient?.clientNumber,
    ),
    clientDisplayName,
    clinicianId: parseOptionalNumber(
      raw.clinician_id ?? raw.clinicianId,
    ),
    clinicianDisplayName: trim(
      raw.clinician_display_name
      ?? raw.clinicianDisplayName
      ?? raw.clinician_name
      ?? raw.clinicianName,
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
    billingResponsibility: trim(
      raw.billing_responsibility ?? raw.billingResponsibility,
    ).toUpperCase() || null,
    insuranceProfileId: parseOptionalNumber(
      raw.insurance_profile_id ?? raw.insuranceProfileId,
    ),
    chiefComplaint: trim(
      raw.chief_complaint ?? raw.chiefComplaint,
    ),
    notes: trim(raw.notes),
    encounterNumber: trim(
      raw.encounter_number ?? raw.encounterNumber,
    ),
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
    reopenedAtUtc: trim(
      raw.reopened_at_utc
      ?? raw.reopenedAtUtc
      ?? raw.reopened_at
      ?? raw.reopenedAt,
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
    wait: normalizeWaitSummary(raw.wait),
    clinicalNoteTemplateId: parseOptionalNumber(
      raw.clinical_note_template_id ?? raw.clinicalNoteTemplateId,
    ),
    clinicalNoteTemplateVersion: parseOptionalNumber(
      raw.clinical_note_template_version
      ?? raw.clinicalNoteTemplateVersion,
    ),
    clinicalNoteTemplateName: trim(
      raw.clinical_note_template_name ?? raw.clinicalNoteTemplateName,
    ),
    isInProgress: status === encounterStatuses.inProgress,
    isWaiting: status === encounterStatuses.waitingForResults,
    isReadyToResume: status === encounterStatuses.readyToResume,
    isOpen: isOpenEncounterStatus(status),
  }
}

function normalizeWaitDependency(row = {}) {
  return {
    id: parseOptionalNumber(row.id),
    waitEpisodeId: parseOptionalNumber(
      row.wait_episode_id ?? row.waitEpisodeId,
    ),
    dependencyType: trim(
      row.dependency_type ?? row.dependencyType,
    ).toUpperCase(),
    diagnosticOrderId: parseOptionalNumber(
      row.diagnostic_order_id ?? row.diagnosticOrderId,
    ),
    testName: trim(row.test_name ?? row.testName),
    status: trim(row.status).toUpperCase(),
    blocking: parseOptionalBool(row.blocking) !== false,
    resolvedAt: trim(row.resolved_at ?? row.resolvedAt),
  }
}

function normalizeWaitEpisode(row = {}) {
  const dependencies = row.dependencies ?? []

  return {
    id: parseOptionalNumber(row.id),
    reason: trim(row.reason),
    status: trim(row.status).toUpperCase(),
    startedAt: trim(row.started_at ?? row.startedAt),
    startedBy: parseOptionalNumber(row.started_by ?? row.startedBy),
    readyAt: trim(row.ready_at ?? row.readyAt),
    resumedAt: trim(row.resumed_at ?? row.resumedAt),
    resumedBy: parseOptionalNumber(row.resumed_by ?? row.resumedBy),
    dependencies: (Array.isArray(dependencies) ? dependencies : [])
      .map(normalizeWaitDependency),
  }
}

function normalizeWaitSummary(raw) {
  if (raw == null || typeof raw !== 'object') {
    return null
  }
  const pending = raw.pending_dependencies ?? raw.pendingDependencies ?? []
  const resolved = raw.resolved_dependencies
    ?? raw.resolvedDependencies
    ?? []
  const episodes = raw.episodes ?? []
  const currentEpisodeRaw = raw.current_episode ?? raw.currentEpisode ?? null

  return {
    waitingSince: trim(raw.waiting_since ?? raw.waitingSince),
    readyToResumeSince: trim(
      raw.ready_to_resume_since ?? raw.readyToResumeSince,
    ),
    currentActivityType: trim(
      raw.current_activity_type ?? raw.currentActivityType,
    ).toUpperCase(),
    activeClinicalMinutes: parseOptionalNumber(
      raw.active_clinical_minutes ?? raw.activeClinicalMinutes,
    ),
    waitingMinutes: parseOptionalNumber(
      raw.waiting_minutes ?? raw.waitingMinutes,
    ),
    elapsedMinutes: parseOptionalNumber(
      raw.elapsed_minutes ?? raw.elapsedMinutes,
    ),
    reason: trim(raw.reason),
    currentEpisodeId: parseOptionalNumber(
      raw.current_episode_id ?? raw.currentEpisodeId,
    ),
    currentEpisode: currentEpisodeRaw
      ? normalizeWaitEpisode(currentEpisodeRaw)
      : null,
    episodes: (Array.isArray(episodes) ? episodes : [])
      .map(normalizeWaitEpisode),
    pendingDependencies: (Array.isArray(pending) ? pending : [])
      .map(normalizeWaitDependency),
    resolvedDependencies: (Array.isArray(resolved) ? resolved : [])
      .map(normalizeWaitDependency),
  }
}

export function mapEncountersList(rows) {
  if (!Array.isArray(rows)) {
    return []
  }

  return rows.map(normalizeEncounter).filter(Boolean)
}

export function isOpenEncounterStatus(status) {
  const token = String(status ?? '').trim().toUpperCase()

  return token === encounterStatuses.inProgress
    || token === encounterStatuses.waitingForResults
    || token === encounterStatuses.readyToResume
}

export function isEncounterInProgress(encounter) {
  return Boolean(encounter?.isInProgress)
}

export function isEncounterOpen(encounter) {
  return Boolean(encounter?.isOpen)
    || isOpenEncounterStatus(encounter?.status)
}

export function isEncounterWaiting(encounter) {
  return Boolean(encounter?.isWaiting)
    || String(encounter?.status ?? '').toUpperCase()
      === encounterStatuses.waitingForResults
}

export function isEncounterReadyToResume(encounter) {
  return Boolean(encounter?.isReadyToResume)
    || String(encounter?.status ?? '').toUpperCase()
      === encounterStatuses.readyToResume
}
