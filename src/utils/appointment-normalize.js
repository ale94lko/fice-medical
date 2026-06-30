
import { appointmentSlotStatuses } from 'components/constants.js'
import { formatClinicianDisplayLabel } from 'src/utils/clinician-display.js'

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

export function normalizeAppointmentType(raw) {
  const row = raw ?? {}

  return {
    id: parseOptionalNumber(row.id),
    code: trim(row.code),
    name: trim(row.name),
    description: trim(row.description) || null,
    defaultDurationMin: parseOptionalNumber(
      row.default_duration_min ?? row.defaultDurationMin,
    ),
    telemedicineAllowed: parseOptionalBool(
      row.telemedicine_allowed ?? row.telemedicineAllowed,
    ),
  }
}

export function normalizeAppointmentClinician(raw) {
  const row = raw ?? {}
  const id = parseOptionalNumber(row.id ?? row.clinician_id)
  const label = formatClinicianDisplayLabel(row)
    || trim(
      row.display_name
      ?? row.displayName
      ?? row.name
      ?? row.clinician_display_name,
    )

  return {
    value: id,
    label,
  }
}

export function normalizeAppointmentSlot(raw) {
  const row = raw ?? {}

  return {
    slotId: parseOptionalNumber(row.slot_id ?? row.slotId ?? row.id),
    clinicianId: parseOptionalNumber(
      row.clinician_id ?? row.clinicianId,
    ),
    appointmentTypeId: parseOptionalNumber(
      row.appointment_type_id ?? row.appointmentTypeId,
    ),
    startAtUtc: trim(row.start_at_utc ?? row.startAtUtc),
    endAtUtc: trim(row.end_at_utc ?? row.endAtUtc),
    durationMin: parseOptionalNumber(
      row.duration_min ?? row.durationMin,
    ),
    status: trim(row.status).toUpperCase()
      || appointmentSlotStatuses.available,
  }
}

export function normalizeAppointment(raw) {
  const row = raw ?? {}

  return {
    appointmentId: parseOptionalNumber(
      row.appointment_id ?? row.appointmentId ?? row.id,
    ),
    appointmentNumber: trim(
      row.appointment_number ?? row.appointmentNumber,
    ),
    status: trim(row.status).toUpperCase(),
    clientId: parseOptionalNumber(row.client_id ?? row.clientId),
    clientDisplayName: trim(
      row.client_display_name
      ?? row.clientDisplayName
      ?? row.patient_name
      ?? row.patientName,
    ) || null,
    clinicianId: parseOptionalNumber(row.clinician_id ?? row.clinicianId),
    clinicianDisplayName: trim(
      row.clinician_display_name ?? row.clinicianDisplayName,
    ) || formatClinicianDisplayLabel(row.clinician),
    appointmentTypeId: parseOptionalNumber(
      row.appointment_type_id ?? row.appointmentTypeId,
    ),
    appointmentTypeCode: trim(
      row.appointment_type_code ?? row.appointmentTypeCode,
    ),
    appointmentTypeName: trim(
      row.appointment_type_name ?? row.appointmentTypeName,
    ),
    slotId: parseOptionalNumber(row.slot_id ?? row.slotId),
    startAtUtc: trim(row.start_at_utc ?? row.startAtUtc),
    endAtUtc: trim(row.end_at_utc ?? row.endAtUtc),
    durationMin: parseOptionalNumber(
      row.duration_min ?? row.durationMin,
    ),
    telemedicine: parseOptionalBool(row.telemedicine),
    telemedicineAllowed: parseOptionalBool(
      row.telemedicine_allowed ?? row.telemedicineAllowed,
    ),
    notes: trim(row.notes) || null,
    referralId: parseOptionalNumber(row.referral_id ?? row.referralId),
    referralNumber: trim(row.referral_number ?? row.referralNumber) || null,
    referralLabel: trim(row.referral_label ?? row.referralLabel) || null,
    checkedInAtUtc: trim(row.checked_in_at_utc ?? row.checkedInAtUtc) || null,
    completedAtUtc: trim(row.completed_at_utc ?? row.completedAtUtc) || null,
    cancelledAtUtc: trim(row.cancelled_at_utc ?? row.cancelledAtUtc) || null,
  }
}

export function normalizeReferralOption(raw) {
  const row = raw ?? {}
  const id = parseOptionalNumber(row.id ?? row.referral_id)

  return {
    value: id,
    label: trim(row.label)
      || trim(row.referral_label ?? row.referralLabel)
      || [
        trim(row.referral_number ?? row.referralNumber) || (id ? `#${id}` : ''),
        trim(row.referring_provider_name ?? row.referringProviderName),
      ].filter(Boolean).join(' – '),
  }
}

export function normalizeCarePlanOption(raw) {
  const row = raw ?? {}
  const id = parseOptionalNumber(row.id ?? row.care_plan_id)
  const number = trim(row.number ?? row.care_plan_number ?? row.code)
  const name = trim(row.name ?? row.problem ?? row.title)

  return {
    value: id,
    label: [number, name].filter(Boolean).join(' – ') || (id ? `#${id}` : ''),
  }
}

export function mapAppointmentsList(rawList) {
  const list = Array.isArray(rawList) ? rawList : []

  return list.map(normalizeAppointment).filter(row => row.appointmentId != null)
}

export function mapAppointmentTypes(rawList) {
  const list = Array.isArray(rawList) ? rawList : []

  return list.map(normalizeAppointmentType).filter(row => row.id != null)
}

export function mapAppointmentClinicians(rawList) {
  const list = Array.isArray(rawList) ? rawList : []

  return list
    .map(normalizeAppointmentClinician)
    .filter(row => row.value != null && row.label)
}

export function mapAvailableSlots(rawList) {
  const list = Array.isArray(rawList) ? rawList : []

  return list
    .map(normalizeAppointmentSlot)
    .filter(row =>
      row.slotId != null
      && row.status === appointmentSlotStatuses.available,
    )
}
