import {
  encounterBillingReadinessStatuses,
  encounterStatuses,
} from 'components/constants.js'
import { mapCarePlansListFromApi } from 'src/utils/care-plan-normalize.js'
import { mapClinicalNotesListFromApi } from
  'src/utils/clinical-note-normalize.js'
import { mapFollowUpFromApi } from 'src/utils/client-follow-ups.js'
import { mapClientConsentsList } from 'src/utils/consent-normalize.js'
import { normalizeEncounter } from 'src/utils/encounter-normalize.js'
import {
  normalizeEncounterNarrative,
  normalizeGeneratedClinicalNote,
} from 'src/utils/encounter-narrative-api.js'
import {
  normalizeBillingReadinessSnapshot,
  normalizeEncounterRequirement,
  normalizeEncounterRequirementsSnapshot,
} from 'src/utils/encounter-requirements-normalize.js'
import { mapClientLabsListFromApi } from 'src/utils/lab-normalize.js'
import { mapMedicationsListFromApi } from
  'src/utils/medication-normalize.js'
import { mapReferralsListFromApi } from 'src/utils/referral-normalize.js'
import { mapScreeningsListFromApi } from
  'src/utils/screening-normalize.js'
import { normalizeSuperbill } from 'src/utils/superbill-normalize.js'
import { normalizeStoredFile } from 'src/utils/stored-file-normalize.js'
import { mapClientVitalsListFromApi } from
  'src/utils/vitals-normalize.js'

function trim(value) {
  return String(value ?? '').trim()
}

function asObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {}
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function parseOptionalNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) ? n : null
}

function normalizeAllergyBannerItem(row = {}) {
  const item = asObject(row)

  return {
    id: parseOptionalNumber(item.id),
    name: trim(
      item.name
      ?? item.allergen
      ?? item.allergen_name
      ?? item.allergenName
      ?? item.substance,
    ),
    severity: trim(item.severity ?? item.reaction_severity),
    reaction: trim(item.reaction ?? item.reaction_description),
  }
}

function normalizeSections(raw = {}) {
  const sections = asObject(raw)
  const readCount = key => parseOptionalNumber(
    sections[key]?.count
    ?? sections[key]
    ?? sections[`${key}_count`]
    ?? sections[`${key}Count`],
  ) ?? 0

  return {
    vitals: readCount('vitals'),
    notes: readCount('notes') || readCount('clinical_notes'),
    services: readCount('services') || readCount('service_procedures'),
    diagnoses: readCount('diagnoses'),
    assessments: readCount('assessments') || readCount('screenings'),
    medications: readCount('medications'),
    carePlans: readCount('care_plans') || readCount('carePlans'),
    labs: readCount('labs'),
    followUps: readCount('follow_ups') || readCount('followUps'),
    referrals: readCount('referrals'),
    documents: readCount('documents') || readCount('files'),
    consents: readCount('consents'),
  }
}

/**
 * Clinical rows already scoped to this encounter by the workspace API.
 */
export function normalizeEncounterWorkspaceClinical(body = {}) {
  const raw = asObject(body)

  return {
    vitals: mapClientVitalsListFromApi(raw.vitals),
    labs: mapClientLabsListFromApi(raw.labs),
    clinicalNotes: mapClinicalNotesListFromApi(
      raw.clinical_notes ?? raw.clinicalNotes,
    ),
    screenings: mapScreeningsListFromApi(
      raw.screenings ?? raw.assessments,
    ),
    referrals: mapReferralsListFromApi(raw.referrals),
    medications: mapMedicationsListFromApi(raw.medications),
    carePlans: mapCarePlansListFromApi(
      raw.care_plans ?? raw.carePlans,
    ),
    consents: mapClientConsentsList(raw.consents),
    followUps: asArray(raw.follow_ups ?? raw.followUps)
      .map(mapFollowUpFromApi)
      .filter(Boolean),
    files: asArray(raw.files ?? raw.documents)
      .map(normalizeStoredFile)
      .filter(file => file?.id != null),
  }
}

function personalBlock(client = {}) {
  return asObject(
    client.personal_information
    ?? client.personalInformation
    ?? client.basic_info
    ?? client.basicInfo
    ?? client.basic,
  )
}

function resolvePhotoFileId(...sources) {
  for (const source of sources) {
    const id = parseOptionalNumber(source)
    if (id != null && id > 0) {
      return id
    }
  }

  return null
}

function resolveClientNameFromRecord(client = {}) {
  const personal = personalBlock(client)
  const nestedName = trim(
    client.full_name
    ?? client.fullName
    ?? client.display_name
    ?? client.displayName
    ?? client.name
    ?? [
      personal.first_name ?? personal.firstName ?? client.first_name
      ?? client.firstName,
      personal.middle_name ?? personal.middleName ?? client.middle_name
      ?? client.middleName,
      personal.last_name ?? personal.lastName ?? client.last_name
      ?? client.lastName,
    ].filter(Boolean).join(' '),
  )

  return nestedName
}

/**
 * Workspace client.dob is a display string:
 * "MM/dd/yyyy (N unit)" or "MM/dd/yyyy" or omitted.
 */
export function parseWorkspaceClientDobDisplay(dobRaw) {
  const raw = trim(dobRaw)
  if (!raw) {
    return {
      display: '',
      date: '',
      age: null,
      ageUnit: '',
    }
  }
  const match = raw.match(
    /^(\d{1,2}\/\d{1,2}\/\d{4})(?:\s*\(([^)]+)\))?$/,
  )
  if (!match) {
    return {
      display: raw,
      date: raw,
      age: null,
      ageUnit: '',
    }
  }
  const agePart = trim(match[2])
  const ageMatch = agePart.match(/^(\d+)\s*(.*)$/)
  const age = ageMatch ? Number(ageMatch[1]) : null

  return {
    display: raw,
    date: match[1],
    age: Number.isFinite(age) ? age : null,
    ageUnit: ageMatch ? trim(ageMatch[2]) : '',
  }
}

export function normalizeWorkspaceClient(raw = {}) {
  const client = asObject(raw)
  if (!Object.keys(client).length) {
    return null
  }
  const dobParsed = parseWorkspaceClientDobDisplay(
    client.dob
    ?? client.date_of_birth
    ?? client.dateOfBirth,
  )
  const id = parseOptionalNumber(client.id)
  const photoFileId = resolvePhotoFileId(
    client.photo_file_id,
    client.photoFileId,
  )

  return {
    id,
    clientNumber: trim(
      client.client_number ?? client.clientNumber ?? client.mrn,
    ),
    fullName: trim(
      client.full_name ?? client.fullName ?? client.display_name
      ?? client.displayName ?? client.name,
    ),
    dobDisplay: dobParsed.display,
    dateOfBirth: dobParsed.date,
    age: dobParsed.age,
    ageUnit: dobParsed.ageUnit || 'years',
    photoFileId,
  }
}

function resolveClientDob(client = {}, row = {}) {
  const personal = personalBlock(client)
  const fromCompact = parseWorkspaceClientDobDisplay(
    client.dob
    ?? client.date_of_birth
    ?? client.dateOfBirth,
  )
  if (fromCompact.date) {
    return fromCompact.date
  }

  return trim(
    row.client_date_of_birth
    ?? row.clientDateOfBirth
    ?? personal.date_of_birth
    ?? personal.dateOfBirth
    ?? personal.dob,
  )
}

function resolveClientAge(client = {}, row = {}) {
  const personal = personalBlock(client)
  const fromCompact = parseWorkspaceClientDobDisplay(
    client.dob
    ?? client.date_of_birth
    ?? client.dateOfBirth,
  )
  if (fromCompact.age != null) {
    return fromCompact.age
  }
  const fromApi = parseOptionalNumber(
    row.client_age
    ?? row.clientAge
    ?? client.age
    ?? personal.age,
  )
  if (fromApi != null) {
    return fromApi
  }

  return ageYearsFromDob(resolveClientDob(client, row))
}

function resolveClientAgeUnit(client = {}, row = {}) {
  const fromCompact = parseWorkspaceClientDobDisplay(
    client.dob
    ?? client.date_of_birth
    ?? client.dateOfBirth,
  )
  if (fromCompact.ageUnit) {
    return fromCompact.ageUnit
  }

  return trim(
    row.client_age_unit
    ?? row.clientAgeUnit
    ?? client.age_unit
    ?? client.ageUnit
    ?? 'years',
  ) || 'years'
}

function ageYearsFromDob(dobRaw) {
  const raw = trim(dobRaw)
  if (!raw) {
    return null
  }
  let date
  const usMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (usMatch) {
    date = new Date(
      Number(usMatch[3]),
      Number(usMatch[1]) - 1,
      Number(usMatch[2]),
    )
  } else {
    date = new Date(raw)
  }
  if (Number.isNaN(date?.getTime())) {
    return null
  }
  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const monthDiff = today.getMonth() - date.getMonth()
  if (
    monthDiff < 0
    || (monthDiff === 0 && today.getDate() < date.getDate())
  ) {
    age -= 1
  }

  return age >= 0 ? age : null
}

function resolveClientNumber(client = {}, row = {}) {
  return trim(
    row.client_number
    ?? row.clientNumber
    ?? client.client_number
    ?? client.clientNumber
    ?? client.mrn
    ?? client.MRN,
  )
}

function resolveClientStatus(client = {}, row = {}) {
  const personal = personalBlock(client)

  return trim(
    row.client_status
    ?? row.clientStatus
    ?? client.status
    ?? personal.status,
  ).toLowerCase() || 'active'
}

function enrichEncounter(rawEncounter, workspace = {}) {
  const encounter = normalizeEncounter(rawEncounter)
  if (!encounter) {
    return null
  }
  const row = asObject(rawEncounter)
  const client = asObject(
    row.client
    ?? workspace.client
    ?? workspace.patient,
  )
  const workspaceClient = normalizeWorkspaceClient(client)
  const personal = personalBlock(client)
  const clinician = asObject(
    row.clinician
    ?? row.rendering_clinician
    ?? row.renderingClinician
    ?? row.started_by
    ?? row.startedBy
    ?? workspace.clinician
    ?? workspace.rendering_clinician
    ?? workspace.renderingClinician,
  )
  const clientDisplayName = trim(
    workspaceClient?.fullName
    || encounter.clientDisplayName
    || resolveClientNameFromRecord(client),
  )
  const clinicianName = trim(
    row.clinician_name
    ?? row.clinicianName
    ?? row.rendering_clinician_name
    ?? row.renderingClinicianName
    ?? row.started_by_name
    ?? row.startedByName
    ?? encounter.clinicianDisplayName
    ?? clinician.display_name
    ?? clinician.displayName
    ?? clinician.full_name
    ?? clinician.fullName
    ?? clinician.name
    ?? [
      clinician.first_name ?? clinician.firstName,
      clinician.last_name ?? clinician.lastName,
    ].filter(Boolean).join(' '),
  )
  const locationName = trim(
    row.location_name
    ?? row.locationName
    ?? row.clinic_name
    ?? row.clinicName
    ?? row.facility_name
    ?? row.facilityName
    ?? row.subtenant_name
    ?? row.subtenantName
    ?? row.location
    ?? workspace.location_name
    ?? workspace.locationName
    ?? workspace.clinic_name
    ?? workspace.clinicName,
  )
  const clientGender = trim(
    row.client_gender
    ?? row.clientGender
    ?? personal.gender
    ?? personal.sex
    ?? client.gender
    ?? client.sex,
  )
  const clientDobDisplay = trim(
    workspaceClient?.dobDisplay
    || '',
  )

  return {
    ...encounter,
    clientId: encounter.clientId ?? workspaceClient?.id ?? null,
    clientDisplayName,
    encounterMode: trim(
      row.encounter_mode ?? row.encounterMode ?? row.mode,
    ).toUpperCase(),
    locationName,
    clinicName: trim(
      row.clinic_name
      ?? row.clinicName
      ?? row.subtenant_name
      ?? row.subtenantName
      ?? locationName,
    ),
    clinicianName,
    clientNumber: workspaceClient?.clientNumber
      || resolveClientNumber(client, row),
    clientDobDisplay,
    clientDateOfBirth: workspaceClient?.dateOfBirth
      || resolveClientDob(client, row),
    clientAge: workspaceClient?.age ?? resolveClientAge(client, row),
    clientAgeUnit: workspaceClient?.ageUnit
      || resolveClientAgeUnit(client, row),
    clientGender,
    clientStatus: resolveClientStatus(client, row),
    clientPhotoFileId: workspaceClient?.photoFileId
      ?? resolvePhotoFileId(
        row.client_photo_file_id,
        row.clientPhotoFileId,
        client.photo_file_id,
        client.photoFileId,
        personal.photo_file_id,
        personal.photoFileId,
      ),
    displayCode: trim(
      row.encounter_number
      ?? row.encounterNumber
      ?? row.display_code
      ?? row.displayCode
      ?? row.encounter_code
      ?? row.encounterCode,
    ),
    encounterNumber: trim(
      row.encounter_number
      ?? row.encounterNumber,
    ),
    version: parseOptionalNumber(row.version),
  }
}

/**
 * Overlay demographics from GET /client/v1/{id} onto workspace encounter.
 */
export function mergeClientRecordIntoEncounter(encounter, clientRaw) {
  if (!encounter || typeof encounter !== 'object') {
    return encounter
  }
  const client = asObject(clientRaw)
  if (!Object.keys(client).length) {
    return encounter
  }
  const workspaceClient = normalizeWorkspaceClient(client)
  const personal = personalBlock(client)
  const name = workspaceClient?.fullName
    || resolveClientNameFromRecord(client)
  const number = workspaceClient?.clientNumber
    || resolveClientNumber(client)
  const dobDisplay = workspaceClient?.dobDisplay || ''
  const dob = workspaceClient?.dateOfBirth || resolveClientDob(client)
  const age = workspaceClient?.age ?? resolveClientAge(client)
  const ageUnit = workspaceClient?.ageUnit
    || resolveClientAgeUnit(client)
  const photoFileId = workspaceClient?.photoFileId
    ?? resolvePhotoFileId(
      client.photo_file_id,
      client.photoFileId,
      personal.photo_file_id,
      personal.photoFileId,
    )
  const status = resolveClientStatus(client)

  return {
    ...encounter,
    clientId: workspaceClient?.id ?? encounter.clientId,
    clientDisplayName: name || encounter.clientDisplayName,
    clientNumber: number || encounter.clientNumber,
    clientDobDisplay: dobDisplay || encounter.clientDobDisplay,
    clientDateOfBirth: dob || encounter.clientDateOfBirth,
    clientAge: age ?? encounter.clientAge,
    clientAgeUnit: ageUnit || encounter.clientAgeUnit || 'years',
    clientStatus: status || encounter.clientStatus || 'active',
    clientPhotoFileId: photoFileId ?? encounter.clientPhotoFileId,
  }
}

function normalizeProcessingIssue(raw = {}) {
  const status = String(raw.status ?? '').toUpperCase()
  const processType = String(
    raw.process_type ?? raw.processType ?? '',
  ).toUpperCase()

  return {
    id: raw.id ?? null,
    entityType: trim(raw.entity_type ?? raw.entityType),
    entityId: raw.entity_id ?? raw.entityId ?? null,
    processType,
    status,
    attemptCount: Number(raw.attempt_count ?? raw.attemptCount ?? 0),
    lastAttemptAt: raw.last_attempt_at ?? raw.lastAttemptAt ?? null,
    errorCategory: String(
      raw.error_category ?? raw.errorCategory ?? '',
    ).toUpperCase(),
    userSafeMessage: trim(
      raw.user_safe_message ?? raw.userSafeMessage,
    ),
    resolvedAt: raw.resolved_at ?? raw.resolvedAt ?? null,
    isOpen: status === 'OPEN',
  }
}

function normalizeWorkspaceSuperbill(raw) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return null
  }
  const normalized = normalizeSuperbill(raw)
  if (normalized.id == null) {
    return null
  }

  return normalized
}

/**
 * Normalize GET /encounters/v1/{id}/workspace payload.
 */
export function normalizeEncounterWorkspace(raw = {}) {
  const body = asObject(raw)
  const completionRaw = asObject(body.completion)
  const encounterId = body.encounter?.id
    ?? body.encounter_id
    ?? body.encounterId
  const completion = normalizeEncounterRequirementsSnapshot({
    ...completionRaw,
    encounterId,
  })
  const allergies = asArray(body.allergies).map(normalizeAllergyBannerItem)
  const clinical = normalizeEncounterWorkspaceClinical(body)

  return {
    encounter: enrichEncounter(body.encounter ?? body, body),
    client: normalizeWorkspaceClient(body.client),
    allergies,
    completion,
    billingReadiness: normalizeBillingReadinessSnapshot(
      body.billing_readiness ?? body.billingReadiness,
    ),
    superbill: normalizeWorkspaceSuperbill(
      body.superbill,
    ),
    narrative: normalizeEncounterNarrative(
      body.narrative,
    ),
    generatedClinicalNote: normalizeGeneratedClinicalNote(
      body.generated_clinical_note ?? body.generatedClinicalNote,
    ),
    processingIssues: asArray(
      body.processing_issues ?? body.processingIssues,
    ).map(normalizeProcessingIssue),
    sections: normalizeSections(body.sections),
    ...clinical,
  }
}

export function isEncounterCompleted(encounter) {
  return String(encounter?.status ?? '').toUpperCase()
    === encounterStatuses.completed
}

export function canReopenEncounter(workspace) {
  const encounter = workspace?.encounter
  if (!isEncounterCompleted(encounter)) {
    return false
  }
  const billing = workspace?.billingReadiness?.status

  return billing !== encounterBillingReadinessStatuses.billed
}

export function parseCompletionRequirementsError(error) {
  const data = error?.response?.data
  const code = data?.error_description ?? data?.error_code
  if (String(code) !== 'ENCOUNTER_COMPLETION_REQUIREMENTS_NOT_MET') {
    return null
  }
  const payload = asObject(data?.data ?? data)
  const missing = asArray(
    payload.missing_requirements ?? payload.missingRequirements,
  ).map(normalizeEncounterRequirement)
  const requirements = asArray(payload.requirements)
    .map(normalizeEncounterRequirement)

  return {
    missingRequirements: missing,
    requirements,
    optionalActions: asArray(
      payload.optional_actions ?? payload.optionalActions,
    ).map(normalizeEncounterRequirement),
  }
}
