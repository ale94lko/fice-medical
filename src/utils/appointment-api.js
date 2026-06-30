/* eslint-disable camelcase -- API payloads use snake_case */
import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { extractEnvelopeList } from 'components/helpers.js'
import {
  mapAppointmentsList,
  mapAvailabilityRangesResponse,
  mapAvailabilityWindows,
  mapBookableServiceProcedures,
  normalizeAppointment,
  normalizeCarePlanOption,
  normalizeRecurringSeries,
} from 'src/utils/appointment-normalize.js'

function unwrapList(body) {
  const root = body?.data ?? body
  if (Array.isArray(root)) {
    return root
  }
  if (root && typeof root === 'object' && Array.isArray(root.data)) {
    return root.data
  }
  if (Array.isArray(root?.content)) {
    return root.content
  }
  if (Array.isArray(root?.items)) {
    return root.items
  }
  if (Array.isArray(root?.service_procedures)) {
    return root.service_procedures
  }
  if (Array.isArray(root?.serviceProcedures)) {
    return root.serviceProcedures
  }

  return extractEnvelopeList(root)
}

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

export async function listClientAppointments(clientId, params = {}) {
  const response = await apiInstance.get(
    apiPaths.clientAppointments(clientId),
    { params },
  )

  return mapAppointmentsList(unwrapList(response.data))
}

export async function listCalendarAppointments(params = {}) {
  const query = {
    from_utc: params.from_utc,
    to_utc: params.to_utc,
    clinician_ids: params.clinician_ids ?? undefined,
    clinician_id: params.clinician_id ?? undefined,
    page: params.page ?? 0,
    limit: params.limit ?? 200,
  }

  const response = await apiInstance.get(apiPaths.appointmentsList, {
    params: query,
  })

  return mapAppointmentsList(unwrapList(response.data))
}

export async function fetchAppointment(appointmentId) {
  const response = await apiInstance.get(
    apiPaths.appointmentById(appointmentId),
  )

  return normalizeAppointment(unwrapData(response.data))
}

export async function listBookableServiceProcedures() {
  const response = await apiInstance.get(
    apiPaths.appointmentServiceProcedures,
  )

  return mapBookableServiceProcedures(unwrapList(response.data))
}

export async function fetchAppointmentDurationPreview(
  serviceProcedureIds = [],
  durationMinutes = null,
) {
  const ids = (serviceProcedureIds ?? []).filter(id => id != null)
  const query = {
    service_procedure_ids: ids.join(','),
    duration_minutes: durationMinutes ?? undefined,
  }

  const response = await apiInstance.get(
    apiPaths.appointmentDurationPreview,
    { params: query },
  )

  return unwrapData(response.data)
}

export async function listAppointmentAvailability(params = {}) {
  const query = {
    from_utc: params.from_utc,
    to_utc: params.to_utc,
    duration_minutes: params.duration_minutes,
    service_procedure_ids: (params.service_procedure_ids ?? [])
      .join(','),
    clinician_id: params.clinician_id ?? undefined,
    limit: params.limit ?? 50,
  }

  const response = await apiInstance.get(apiPaths.appointmentAvailability, {
    params: query,
  })

  return mapAvailabilityWindows(unwrapList(response.data))
}

export async function listAppointmentAvailabilityRanges(params = {}) {
  const query = {
    from_utc: params.from_utc,
    to_utc: params.to_utc,
    duration_minutes: params.duration_minutes,
    service_procedure_ids: (params.service_procedure_ids ?? [])
      .join(','),
    clinician_id: params.clinician_id ?? undefined,
    limit: params.limit ?? 100,
  }

  const response = await apiInstance.get(
    apiPaths.appointmentAvailabilityRanges,
    { params: query },
  )

  return mapAvailabilityRangesResponse(unwrapData(response.data))
}

export async function listClientReferrals(clientId) {
  const { listClientReferralOptions } = await import(
    'src/utils/referral-api.js'
  )

  return listClientReferralOptions(clientId, { schedulableOnly: true })
}

export async function listClientCarePlans(clientId) {
  const response = await apiInstance.get(apiPaths.clientCarePlans(clientId))

  return unwrapList(response.data).map(normalizeCarePlanOption)
    .filter(row => row.value != null)
}

export async function bookAppointment(body, idempotencyKey = null) {
  const headers = {}
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  const response = await apiInstance.post(
    apiPaths.appointmentBook,
    body,
    { headers },
  )

  const data = unwrapData(response.data)
  if (Array.isArray(data?.appointments)) {
    return {
      appointments: mapAppointmentsList(data.appointments),
      recurringSeries: normalizeRecurringSeries(data.recurring_series) ?? null,
      conflicts: data.conflicts ?? [],
    }
  }

  return {
    appointment: normalizeAppointment(data?.appointment ?? data),
    appointments: [],
    recurringSeries: normalizeRecurringSeries(data?.recurring_series) ?? null,
    conflicts: [],
  }
}

export async function patchAppointment(appointmentId, body) {
  const response = await apiInstance.patch(
    apiPaths.appointmentById(appointmentId),
    body,
  )

  return normalizeAppointment(unwrapData(response.data))
}

export async function cancelAppointment(appointmentId, reason = null) {
  const body = reason ? { reason } : {}
  const response = await apiInstance.post(
    apiPaths.appointmentCancel(appointmentId),
    body,
  )

  return normalizeAppointment(unwrapData(response.data))
}

export async function rescheduleAppointment(
  appointmentId,
  payload = {},
) {
  const body = {
    new_start_at_utc: payload.newStartAtUtc ?? payload.new_start_at_utc,
    clinician_id: payload.clinicianId ?? payload.clinician_id ?? undefined,
    notes: payload.notes ?? undefined,
  }
  const response = await apiInstance.post(
    apiPaths.appointmentReschedule(appointmentId),
    body,
  )

  return normalizeAppointment(unwrapData(response.data))
}

export async function checkInAppointment(appointmentId) {
  const response = await apiInstance.post(
    apiPaths.appointmentCheckIn(appointmentId),
  )

  return normalizeAppointment(unwrapData(response.data))
}

export async function completeAppointment(appointmentId) {
  const response = await apiInstance.post(
    apiPaths.appointmentComplete(appointmentId),
  )

  return normalizeAppointment(unwrapData(response.data))
}

export async function noShowAppointment(appointmentId) {
  const response = await apiInstance.post(
    apiPaths.appointmentNoShow(appointmentId),
  )

  return normalizeAppointment(unwrapData(response.data))
}

export function extractBookingConflicts(error) {
  const data = error?.response?.data?.data ?? error?.response?.data

  return Array.isArray(data?.conflicts) ? data.conflicts : []
}
