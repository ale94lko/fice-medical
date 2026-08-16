
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

function resolveAppointmentCheckedOut(row = {}) {
  if (
    parseOptionalBool(row.checked_out)
    || parseOptionalBool(row.checkedOut)
    || parseOptionalBool(row.is_checked_out)
    || parseOptionalBool(row.isCheckedOut)
  ) {
    return true
  }
  const checkedOutAt = trim(
    row.checked_out_at_utc
    ?? row.checkedOutAtUtc
    ?? row.checkout_at_utc
    ?? row.checkoutAtUtc
    ?? row.checked_out_at
    ?? row.checkedOutAt,
  )
  if (checkedOutAt) {
    return true
  }
  const status = trim(row.status).toUpperCase()

  return status === 'COMPLETED'
}

function resolveAppointmentHasNote(row = {}) {
  if (
    parseOptionalBool(row.has_note)
    || parseOptionalBool(row.hasNote)
    || parseOptionalBool(row.has_clinical_note)
    || parseOptionalBool(row.hasClinicalNote)
  ) {
    return true
  }

  return parseOptionalNumber(
    row.clinical_note_id
    ?? row.clinicalNoteId
    ?? row.note_id
    ?? row.noteId,
  ) != null
}

function resolveAppointmentBilled(row = {}) {
  if (
    parseOptionalBool(row.billed)
    || parseOptionalBool(row.is_billed)
    || parseOptionalBool(row.isBilled)
    || parseOptionalBool(row.has_billing)
    || parseOptionalBool(row.hasBilling)
  ) {
    return true
  }
  const billingStatus = trim(
    row.billing_status ?? row.billingStatus,
  ).toUpperCase()

  return billingStatus === 'BILLED' || billingStatus === 'INVOICED'
}

function resolvePlaceOfServiceFields(row = {}) {
  const nested = row.place_of_service ?? row.placeOfService
  const nestedObj = nested && typeof nested === 'object' ? nested : null
  const id = parseOptionalNumber(
    row.place_of_service_id
    ?? row.placeOfServiceId
    ?? nestedObj?.id,
  )
  const code = trim(
    row.place_of_service_code
    ?? row.placeOfServiceCode
    ?? nestedObj?.code,
  )
  const name = trim(
    row.place_of_service_name
    ?? row.placeOfServiceName
    ?? nestedObj?.name,
  )
  const displayName = trim(
    row.place_of_service_display_name
    ?? row.placeOfServiceDisplayName
    ?? nestedObj?.display_name
    ?? nestedObj?.displayName,
  ) || (
    code && name
      ? `${code} - ${name}`
      : (name || code)
  )

  return {
    placeOfServiceId: id,
    placeOfServiceCode: code,
    placeOfServiceName: name,
    placeOfServiceDisplayName: displayName || null,
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

export function normalizeRecurringSeries(raw) {
  if (raw == null || typeof raw !== 'object') {
    return null
  }
  const row = raw

  return {
    id: parseOptionalNumber(
      row.id ?? row.recurring_series_id ?? row.recurringSeriesId,
    ),
    frequency: trim(row.frequency) || null,
    intervalCount: parseOptionalNumber(
      row.interval_count ?? row.intervalCount,
    ),
    daysOfWeek: Array.isArray(row.days_of_week ?? row.daysOfWeek)
      ? (row.days_of_week ?? row.daysOfWeek).map(Number).filter(Number.isFinite)
      : [],
    endType: trim(row.end_type ?? row.endType) || null,
    endAfterCount: parseOptionalNumber(
      row.end_after_count ?? row.endAfterCount,
    ),
    endOnDateUtc: trim(
      row.end_on_date_utc ?? row.endOnDateUtc,
    ) || null,
  }
}

export function normalizeBookableServiceProcedure(raw) {
  const row = raw ?? {}
  const minDurationMin = parseOptionalNumber(
    row.min_duration_min ?? row.minDurationMin,
  )
  const maxDurationMin = parseOptionalNumber(
    row.max_duration_min ?? row.maxDurationMin,
  )
  const defaultDurationMin = parseOptionalNumber(
    row.default_duration_min ?? row.defaultDurationMin,
  ) ?? (
    minDurationMin != null
    && maxDurationMin != null
    && minDurationMin === maxDurationMin
      ? minDurationMin
      : minDurationMin ?? maxDurationMin
  )
  const fixedDuration = minDurationMin != null
    && maxDurationMin != null
    && minDurationMin === maxDurationMin
  const hasDefaultDuration = defaultDurationMin != null

  return {
    id: parseOptionalNumber(row.id),
    name: trim(row.name),
    category: trim(row.category),
    status: trim(row.status).toUpperCase() || 'ACTIVE',
    minDurationMin,
    maxDurationMin,
    defaultDurationMin,
    fixedDuration: fixedDuration
      || (
        hasDefaultDuration
        && minDurationMin == null
        && maxDurationMin == null
      ),
    durationEditable: !fixedDuration
      && minDurationMin != null
      && maxDurationMin != null
      && maxDurationMin > minDurationMin,
    cptCode: trim(row.cpt_code ?? row.cptCode),
    hcpcsCode: trim(row.hcpcs_code ?? row.hcpcsCode),
    defaultFee: parseOptionalNumber(row.default_fee ?? row.defaultFee),
    requiresAppointment: parseOptionalBool(
      row.requires_appointment ?? row.requiresAppointment,
    ),
  }
}

export function normalizeServiceProcedureLine(raw) {
  const row = raw ?? {}

  return {
    id: parseOptionalNumber(row.id ?? row.service_procedure_id),
    name: trim(row.name),
    durationMin: parseOptionalNumber(
      row.duration_min ?? row.durationMin,
    ),
    cptCode: trim(row.cpt_code ?? row.cptCode),
    hcpcsCode: trim(row.hcpcs_code ?? row.hcpcsCode),
    defaultFee: parseOptionalNumber(row.default_fee ?? row.defaultFee),
  }
}

/** Prefer CPT, then HCPCS, for a service procedure line. */
export function formatServiceProcedureCode(line) {
  const cpt = trim(line?.cptCode)
  if (cpt) {
    return cpt
  }

  return trim(line?.hcpcsCode)
}

export function buildServicesCodesLabel(serviceProcedures) {
  if (!Array.isArray(serviceProcedures) || !serviceProcedures.length) {
    return ''
  }
  const codes = []
  const seen = new Set()
  for (const line of serviceProcedures) {
    const code = formatServiceProcedureCode(line)
    if (!code || seen.has(code)) {
      continue
    }
    seen.add(code)
    codes.push(code)
  }

  return codes.join(', ')
}

export function normalizeAvailabilityWindow(raw) {
  const row = raw ?? {}

  return {
    startAtUtc: trim(row.start_at_utc ?? row.startAtUtc),
    endAtUtc: trim(row.end_at_utc ?? row.endAtUtc),
    clinicianId: parseOptionalNumber(row.clinician_id ?? row.clinicianId),
    clinicianDisplayName: trim(
      row.clinician_display_name ?? row.clinicianDisplayName,
    ),
    durationMin: parseOptionalNumber(
      row.duration_min ?? row.durationMin,
    ),
    availableMinutes: parseOptionalNumber(
      row.available_minutes ?? row.availableMinutes,
    ),
  }
}

function normalizeAvailabilityBlockType(rawType) {
  const type = trim(rawType).toUpperCase()
  if (
    type === 'OFF_HOURS'
    || type === 'OUTSIDE_WORKING_HOURS'
    || type === 'OUTSIDE'
    || type === 'NON_WORKING'
  ) {
    return 'outside'
  }
  if (type === 'BREAK' || type === 'LUNCH') {
    return 'break'
  }
  if (type === 'APPOINTMENT' || type === 'BOOKED') {
    return 'appointment'
  }
  if (type === 'AVAILABLE' || type === 'FREE') {
    return 'available'
  }

  return 'outside'
}

function normalizeAvailabilityAppointmentBlock(raw) {
  const appointment = normalizeAppointment(raw)
  if (!appointment.startAtUtc || !appointment.endAtUtc) {
    return null
  }

  return {
    startAtUtc: appointment.startAtUtc,
    endAtUtc: appointment.endAtUtc,
    blockType: 'appointment',
    clinicianId: appointment.clinicianId,
    clinicianDisplayName: appointment.clinicianDisplayName,
    appointmentId: appointment.appointmentId,
    appointmentNumber: appointment.appointmentNumber,
    clientDisplayName: appointment.clientDisplayName,
    servicesLabel: appointment.servicesLabel,
    servicesCodesLabel: appointment.servicesCodesLabel,
    serviceProcedures: appointment.serviceProcedures,
    status: appointment.status,
    durationMin: appointment.durationMin,
    telemedicine: appointment.telemedicine,
    telehealthInviteUrl: appointment.telehealthInviteUrl,
    telehealthSessionId: appointment.telehealthSessionId,
    placeOfServiceId: appointment.placeOfServiceId,
    placeOfServiceName: appointment.placeOfServiceName,
    placeOfServiceCode: appointment.placeOfServiceCode,
    placeOfServiceDisplayName: appointment.placeOfServiceDisplayName,
  }
}

export function normalizeAvailabilityCalendarBlock(raw) {
  const row = raw ?? {}
  const serviceProcedures = Array.isArray(row.service_procedures)
    ? row.service_procedures.map(normalizeServiceProcedureLine)
    : []
  const servicesLabel = trim(row.services_label ?? row.servicesLabel)
    || (serviceProcedures.length
      ? serviceProcedures.map(line => line.name).filter(Boolean).join(', ')
      : trim(row.appointment_type_name ?? row.appointmentTypeName))
  const servicesCodesLabel = buildServicesCodesLabel(serviceProcedures)

  return {
    startAtUtc: trim(row.start_at_utc ?? row.startAtUtc),
    endAtUtc: trim(row.end_at_utc ?? row.endAtUtc),
    blockType: normalizeAvailabilityBlockType(
      row.block_type ?? row.blockType,
    ),
    clinicianId: parseOptionalNumber(row.clinician_id ?? row.clinicianId),
    clinicianDisplayName: trim(
      row.clinician_display_name ?? row.clinicianDisplayName,
    ),
    appointmentId: parseOptionalNumber(
      row.appointment_id ?? row.appointmentId ?? row.id,
    ),
    appointmentNumber: trim(
      row.appointment_number ?? row.appointmentNumber,
    ),
    clientDisplayName: trim(
      row.client_display_name
      ?? row.clientDisplayName
      ?? row.patient_name
      ?? row.patientName,
    ),
    servicesLabel,
    servicesCodesLabel,
    serviceProcedures,
    status: trim(row.status).toUpperCase(),
    label: trim(row.label ?? row.title),
    durationMin: parseOptionalNumber(
      row.duration_min ?? row.durationMin,
    ),
    telemedicine: parseOptionalBool(row.telemedicine),
    telehealthInviteUrl: trim(
      row.telehealth_invite_url ?? row.telehealthInviteUrl,
    ) || null,
    telehealthSessionId: parseOptionalNumber(
      row.telehealth_session_id ?? row.telehealthSessionId,
    ),
    ...resolvePlaceOfServiceFields(row),
  }
}

export function normalizeAppointment(raw) {
  const row = raw ?? {}
  const serviceProcedures = Array.isArray(row.service_procedures)
    ? row.service_procedures.map(normalizeServiceProcedureLine)
    : []

  const legacyTypeName = trim(
    row.appointment_type_name ?? row.appointmentTypeName,
  )
  const servicesLabel = serviceProcedures.length
    ? serviceProcedures.map(line => line.name).filter(Boolean).join(', ')
    : legacyTypeName
  const servicesCodesLabel = buildServicesCodesLabel(serviceProcedures)

  return {
    appointmentId: parseOptionalNumber(
      row.appointment_id ?? row.appointmentId ?? row.id,
    ),
    appointmentNumber: trim(
      row.appointment_number ?? row.appointmentNumber,
    ),
    status: trim(row.status).toUpperCase(),
    clientId: parseOptionalNumber(row.client_id ?? row.clientId),
    clientNumber: trim(row.client_number ?? row.clientNumber),
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
    supervisorId: parseOptionalNumber(
      row.supervisor_id ?? row.supervisorId,
    ),
    supervisorDisplayName: trim(
      row.supervisor_display_name ?? row.supervisorDisplayName,
    ) || formatClinicianDisplayLabel(row.supervisor),
    serviceProcedures,
    servicesLabel,
    servicesCodesLabel,
    ...resolvePlaceOfServiceFields(row),
    appointmentTypeId: parseOptionalNumber(
      row.appointment_type_id ?? row.appointmentTypeId,
    ),
    appointmentTypeCode: trim(
      row.appointment_type_code ?? row.appointmentTypeCode,
    ),
    appointmentTypeName: servicesLabel || legacyTypeName,
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
    telehealthInviteUrl: trim(
      row.telehealth_invite_url ?? row.telehealthInviteUrl,
    ) || null,
    telehealthSessionId: parseOptionalNumber(
      row.telehealth_session_id ?? row.telehealthSessionId,
    ),
    notes: trim(row.notes) || null,
    checkedOut: resolveAppointmentCheckedOut(row),
    hasNote: resolveAppointmentHasNote(row),
    billed: resolveAppointmentBilled(row),
    referralId: parseOptionalNumber(row.referral_id ?? row.referralId),
    referralNumber: trim(row.referral_number ?? row.referralNumber) || null,
    referralLabel: trim(row.referral_label ?? row.referralLabel) || null,
    carePlanId: parseOptionalNumber(row.care_plan_id ?? row.carePlanId),
    carePlanLabel: trim(row.care_plan_label ?? row.carePlanLabel) || null,
    checkedInAtUtc: trim(row.checked_in_at_utc ?? row.checkedInAtUtc) || null,
    completedAtUtc: trim(row.completed_at_utc ?? row.completedAtUtc) || null,
    cancelledAtUtc: trim(row.cancelled_at_utc ?? row.cancelledAtUtc) || null,
    recurringSeriesId: parseOptionalNumber(
      row.recurring_series_id ?? row.recurringSeriesId,
    ),
    recurringSeries: normalizeRecurringSeries(
      row.recurring_series ?? row.recurringSeries,
    ),
  }
}

export function mapBookableServiceProcedures(rawList) {
  const list = Array.isArray(rawList) ? rawList : []

  return list
    .map(normalizeBookableServiceProcedure)
    .filter(row =>
      row.id != null
      && row.requiresAppointment !== false
      && row.status !== 'INACTIVE',
    )
}

export function mapAvailabilityWindows(rawList) {
  const list = Array.isArray(rawList) ? rawList : []

  return list
    .map(normalizeAvailabilityWindow)
    .filter(row => row.startAtUtc && row.endAtUtc)
}

function mapAvailabilityRangeBlocks(rawList = []) {
  const list = Array.isArray(rawList) ? rawList : []

  return list
    .map(normalizeAvailabilityCalendarBlock)
    .filter(row =>
      row.startAtUtc
      && row.endAtUtc
      && row.blockType !== 'available',
    )
}

function mapAvailabilityRangeAppointments(rawList = []) {
  const list = Array.isArray(rawList) ? rawList : []

  return list
    .map(normalizeAvailabilityAppointmentBlock)
    .filter(Boolean)
}

export function mapAvailabilityRangesResponse(raw) {
  const root = raw?.data != null && typeof raw.data === 'object'
    ? raw.data
    : (raw ?? {})

  const availableRanges = mapAvailabilityWindows(
    root.available_ranges ?? root.availableRanges ?? [],
  )
  const blocks = [
    ...mapAvailabilityRangeBlocks(
      root.off_hours_ranges ?? root.offHoursRanges ?? [],
    ),
    ...mapAvailabilityRangeBlocks(
      root.break_ranges ?? root.breakRanges ?? [],
    ),
    ...mapAvailabilityRangeAppointments(root.appointments ?? []),
  ]

  return { availableRanges, blocks }
}

export function mapAppointmentsList(rawList) {
  const list = Array.isArray(rawList) ? rawList : []

  return list.map(normalizeAppointment).filter(row => row.appointmentId != null)
}

export function mapAppointmentClinicians(rawList) {
  const list = Array.isArray(rawList) ? rawList : []

  return list
    .map(normalizeAppointmentClinician)
    .filter(row => row.value != null && row.label)
}
