import { adminTableStatusVariants } from 'src/constants/admin-table.js'
import {
  formatUtcDateLong,
  formatUtcTimeRange,
  localDayKeyFromUtc,
} from 'src/utils/appointment-datetime.js'
import { localMinutesFromUtc } from 'src/utils/calendar-events.js'

export const appointmentRequestStatuses = {
  pending: 'PENDING',
  cancelled: 'CANCELLED',
  fulfilled: 'FULFILLED',
  rejected: 'REJECTED',
}

export const appointmentRequestStatusFilterValues = {
  pending: 'PENDING',
  all: 'ALL',
  fulfilled: 'FULFILLED',
  rejected: 'REJECTED',
  cancelled: 'CANCELLED',
}

function trim(value) {
  return String(value ?? '').trim()
}

function asBool(value) {
  return value === true || value === 'true'
}

function asId(value) {
  const id = Number(value)
  return Number.isFinite(id) && id > 0 ? id : null
}

export function normalizeStaffAppointmentRequest(raw = {}) {
  const preferredStartAtUtc = raw.preferred_start_at_utc
    ?? raw.preferredStartAtUtc
    ?? null
  const preferredEndAtUtc = raw.preferred_end_at_utc
    ?? raw.preferredEndAtUtc
    ?? null

  return {
    id: asId(raw.id),
    status: trim(raw.status).toUpperCase(),
    clientId: asId(raw.client_id ?? raw.clientId),
    clientAccountId: asId(
      raw.client_account_id ?? raw.clientAccountId,
    ),
    clientNumber: trim(raw.client_number ?? raw.clientNumber),
    clientName: trim(raw.client_name ?? raw.clientName),
    preferredStartAtUtc,
    preferredEndAtUtc,
    serviceProcedureId: asId(
      raw.service_procedure_id ?? raw.serviceProcedureId,
    ),
    serviceName: trim(raw.service_name ?? raw.serviceName),
    clinicianId: asId(raw.clinician_id ?? raw.clinicianId),
    clinicianName: trim(raw.clinician_name ?? raw.clinicianName),
    notes: trim(raw.notes),
    createdAt: raw.created_at ?? raw.createdAt ?? null,
    appointmentId: asId(raw.appointment_id ?? raw.appointmentId),
    resolutionNotes: trim(
      raw.resolution_notes ?? raw.resolutionNotes,
    ),
    hasClient: asBool(raw.has_client ?? raw.hasClient),
    canFulfill: asBool(raw.can_fulfill ?? raw.canFulfill),
    canReject: asBool(raw.can_reject ?? raw.canReject),
    canCreateClient: asBool(
      raw.can_create_client ?? raw.canCreateClient,
    ),
  }
}

export function appointmentRequestStatusVariant(status) {
  const token = String(status ?? '').toUpperCase()
  if (token === appointmentRequestStatuses.pending) {
    return adminTableStatusVariants.pending
  }
  if (token === appointmentRequestStatuses.fulfilled) {
    return adminTableStatusVariants.completed
  }
  if (
    token === appointmentRequestStatuses.rejected
    || token === appointmentRequestStatuses.cancelled
  ) {
    return adminTableStatusVariants.cancelled
  }

  return adminTableStatusVariants.other
}

export function appointmentRequestStatusI18nKey(status) {
  const token = String(status ?? '').toUpperCase()
  if (token === appointmentRequestStatuses.pending) {
    return 'appointmentRequestStatusPending'
  }
  if (token === appointmentRequestStatuses.cancelled) {
    return 'appointmentRequestStatusCancelled'
  }
  if (token === appointmentRequestStatuses.fulfilled) {
    return 'appointmentRequestStatusFulfilled'
  }
  if (token === appointmentRequestStatuses.rejected) {
    return 'appointmentRequestStatusRejected'
  }

  return ''
}

export function appointmentRequestMatchesQuery(row, query) {
  const needle = String(query ?? '').trim().toLowerCase()
  if (!needle) {
    return true
  }
  const haystack = [
    row.clientName,
    row.clientNumber,
    row.serviceName,
    row.clinicianName,
    row.notes,
  ].join(' ').toLowerCase()

  return haystack.includes(needle)
}

export function preferredTimeLabel(row, unsetLabel) {
  const start = row?.preferredStartAtUtc
  if (!start) {
    return unsetLabel
  }
  const date = formatUtcDateLong(start)
  const time = formatUtcTimeRange(start, row.preferredEndAtUtc)
  if (date && time) {
    return `${date} · ${time}`
  }

  return date || time || unsetLabel
}

export function bookingHintFromRequest(row) {
  const start = row?.preferredStartAtUtc
  if (!start) {
    return null
  }
  const dayKey = localDayKeyFromUtc(start)
  if (!dayKey) {
    return null
  }

  return {
    dayKey,
    minutesLocal: localMinutesFromUtc(start),
  }
}
