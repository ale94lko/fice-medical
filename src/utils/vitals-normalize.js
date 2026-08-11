/* eslint-disable camelcase -- API payloads use snake_case */
import { clientVitalsPainLevelValues } from 'components/constants.js'
import { calculateBmiFromUs } from 'src/utils/bmi-us.js'
import { formatDateUs } from 'src/utils/client-form.js'
import {
  combineRecordedDateTime,
  createEmptyVitalsDraft,
  createEmptyVitalsSection,
  formatTime12h,
  nextVitalsId,
} from 'src/utils/client-vitals.js'

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

function unwrapList(data) {
  if (Array.isArray(data)) {
    return data
  }
  if (Array.isArray(data?.items)) {
    return data.items
  }
  if (Array.isArray(data?.content)) {
    return data.content
  }
  if (Array.isArray(data?.vitals)) {
    return data.vitals
  }

  return []
}

export function mapPainLevelToNumber(pain) {
  const key = String(pain ?? '').trim()
  if (key === clientVitalsPainLevelValues.mild) {
    return 2
  }
  if (key === clientVitalsPainLevelValues.moderate) {
    return 5
  }
  if (key === clientVitalsPainLevelValues.severe) {
    return 9
  }
  const n = Number(pain)
  if (Number.isFinite(n) && n > 0) {
    return n
  }

  return 0
}

export function mapPainLevelFromNumber(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) {
    return null
  }
  if (n <= 3) {
    return clientVitalsPainLevelValues.mild
  }
  if (n <= 6) {
    return clientVitalsPainLevelValues.moderate
  }

  return clientVitalsPainLevelValues.severe
}

export function takenAtUtcFromVitalsEntry(entry) {
  const combined = combineRecordedDateTime(
    entry?.recordedDate,
    entry?.recordedTime,
  )
  if (!combined) {
    return null
  }

  return combined.toISOString()
}

export function resolveVitalsClinicianId(entry, fallbackId = null) {
  const raw = entry?.recordedBy ?? entry?.clinicianId
  if (raw == null || String(raw).trim() === '') {
    return fallbackId ?? null
  }
  const n = Number(raw)

  return Number.isFinite(n) ? n : raw
}

/**
 * Form entry → VitalsRequest (create/update).
 * Create: omit id. Update: caller may set id separately.
 */
export function vitalsEntryToApiPayload(entry, {
  clinicianId = null,
  includeId = false,
} = {}) {
  const resolvedClinicianId = resolveVitalsClinicianId(
    entry,
    clinicianId,
  )
  const payload = {
    clinician_id: resolvedClinicianId,
    blood_pressure_systolic: entry?.systolic ?? null,
    blood_pressure_diastolic: entry?.diastolic ?? null,
    heart_rate: entry?.heartRate ?? null,
    temperature: entry?.temperature ?? null,
    oxygen_saturation: entry?.oxygenSaturation ?? null,
    pain_level: mapPainLevelToNumber(entry?.painLevel),
    height: entry?.height ?? null,
    height_unit: trim(entry?.heightUnit) || 'IN',
    weight: entry?.weight ?? null,
    weight_unit: trim(entry?.weightUnit) || 'LB',
    notes: trim(entry?.notes) || null,
    taken_at_utc: takenAtUtcFromVitalsEntry(entry),
  }
  if (includeId) {
    const apiId = entry?.apiId ?? entry?.id
    if (apiId != null && String(apiId).trim()) {
      const n = Number(apiId)
      payload.id = Number.isFinite(n) ? n : apiId
    }
  }

  return payload
}

function recordedPartsFromTakenAt(iso) {
  const raw = trim(iso)
  if (!raw) {
    return { recordedDate: '', recordedTime: '' }
  }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return { recordedDate: '', recordedTime: '' }
  }

  return {
    recordedDate: formatDateUs(date),
    recordedTime: formatTime12h(date),
  }
}

/**
 * Normalize API vital → form entry (camelCase + apiId).
 */
export function normalizeVitalRecord(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const apiId = parseOptionalNumber(
    raw.id ?? raw.vital_id ?? raw.vitalId,
  )
  const height = parseOptionalNumber(raw.height)
  const weight = parseOptionalNumber(raw.weight)
  const bmi = calculateBmiFromUs(weight, height)
  const takenAt = trim(
    raw.taken_at_utc
    ?? raw.takenAtUtc
    ?? raw.taken_at
    ?? raw.takenAt,
  )
  const { recordedDate, recordedTime } = recordedPartsFromTakenAt(
    takenAt,
  )
  const clinicianId = parseOptionalNumber(
    raw.clinician_id ?? raw.clinicianId,
  )
  const encounterId = parseOptionalNumber(
    raw.encounter_id ?? raw.encounterId,
  )

  return {
    id: apiId != null
      ? `vitals-api-${apiId}`
      : nextVitalsId(),
    apiId,
    encounterId,
    systolic: parseOptionalNumber(
      raw.blood_pressure_systolic ?? raw.bloodPressureSystolic,
    ),
    diastolic: parseOptionalNumber(
      raw.blood_pressure_diastolic ?? raw.bloodPressureDiastolic,
    ),
    heartRate: parseOptionalNumber(
      raw.heart_rate ?? raw.heartRate,
    ),
    respiratoryRate: parseOptionalNumber(
      raw.respiratory_rate ?? raw.respiratoryRate,
    ),
    temperature: parseOptionalNumber(raw.temperature),
    oxygenSaturation: parseOptionalNumber(
      raw.oxygen_saturation ?? raw.oxygenSaturation,
    ),
    weight,
    height,
    heightUnit: trim(raw.height_unit ?? raw.heightUnit) || 'IN',
    weightUnit: trim(raw.weight_unit ?? raw.weightUnit) || 'LB',
    bmi,
    painLevel: mapPainLevelFromNumber(
      raw.pain_level ?? raw.painLevel,
    ),
    notes: trim(raw.notes),
    recordedDate,
    recordedTime,
    recordedBy: clinicianId != null ? String(clinicianId) : '',
    takenAtUtc: takenAt,
  }
}

export function mapClientVitalsListFromApi(rawList) {
  return unwrapList(rawList)
    .map(normalizeVitalRecord)
    .filter(Boolean)
}

export function mapClientVitalsSectionFromApi(rawList) {
  const entries = mapClientVitalsListFromApi(rawList)
  if (!entries.length) {
    return createEmptyVitalsSection()
  }

  return {
    entries,
    draft: createEmptyVitalsDraft(),
    editingId: null,
  }
}
