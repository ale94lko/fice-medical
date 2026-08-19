/* eslint-disable camelcase -- API payloads use snake_case */
import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  extractEnvelopeList,
  extractEnvelopeListPagination,
} from 'components/helpers.js'
import {
  mapAppointmentsList,
  mapAvailabilityRangesResponse,
  mapAvailabilityWindows,
  mapBookableServiceProcedures,
  normalizeAppointment,
  normalizeRecurringSeries,
} from 'src/utils/appointment-normalize.js'
import { parseWorkingWeekdays }
  from 'src/utils/working-weekdays.js'

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

function unwrapPaginatedRoot(body) {
  const root = body?.data ?? body
  if (Array.isArray(root)) {
    return { items: root, pagination: null }
  }
  if (root && typeof root === 'object') {
    return root
  }

  return { items: [], pagination: null }
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

/**
 * Server search for a client's appointments.
 * UI page is 1-based; API page is 0-based.
 */
export async function searchClientAppointments(clientId, params = {}) {
  const q = String(params.q ?? '').trim()
  const page = Number(params.page ?? 1)
  const limit = Number(params.limit ?? 20)
  const safePage = Number.isFinite(page) && page >= 1 ? page : 1
  const safeLimit = Number.isFinite(limit) && limit >= 1 ? limit : 20
  const apiPage = Math.max(0, safePage - 1)

  const response = await apiInstance.get(
    apiPaths.clientAppointmentsSearch(clientId),
    {
      params: {
        q,
        page: apiPage,
        limit: safeLimit,
      },
    },
  )

  const root = unwrapPaginatedRoot(response.data)
  const items = mapAppointmentsList(
    Array.isArray(root.items)
      ? root.items
      : unwrapList(response.data),
  )
  const pagination = extractEnvelopeListPagination(root)
    || {
      page: apiPage,
      limit: safeLimit,
      total: items.length,
      totalPages: 1,
      offset: apiPage * safeLimit,
    }

  return {
    items,
    pagination: {
      ...pagination,
      page: Number.isFinite(Number(pagination.page))
        ? Number(pagination.page)
        : apiPage,
      limit: Number.isFinite(Number(pagination.limit))
        && Number(pagination.limit) > 0
        ? Number(pagination.limit)
        : safeLimit,
      total: Number.isFinite(Number(pagination.total))
        ? Number(pagination.total)
        : items.length,
    },
  }
}

function optionalClientNumber(value) {
  const key = String(value ?? '').trim()

  return key || undefined
}

export async function listCalendarAppointments(params = {}) {
  const query = {
    from_utc: params.from_utc,
    to_utc: params.to_utc,
    clinician_ids: params.clinician_ids ?? undefined,
    clinician_id: params.clinician_id ?? undefined,
    client_number: optionalClientNumber(params.client_number),
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

export async function listEligibleClinicians(
  serviceProcedureIds = [],
  dateOfService,
) {
  const ids = (serviceProcedureIds ?? []).filter(id => id != null)
  const query = {
    service_procedure_ids: ids.join(','),
    date_of_service: dateOfService,
  }
  const response = await apiInstance.get(
    apiPaths.appointmentEligibleClinicians,
    { params: query },
  )

  return unwrapList(response.data)
    .map(row => {
      const id = Number(row.clinician_id ?? row.clinicianId)
      const label = String(row.display_name ?? row.displayName ?? '')
        .trim()
      if (!Number.isFinite(id) || !label) {
        return null
      }

      return {
        label,
        value: String(id),
        name: label,
        specialty: String(row.specialty ?? '').trim(),
      }
    })
    .filter(Boolean)
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
    client_number: optionalClientNumber(params.client_number),
    exclude_appointment_id: params.exclude_appointment_id ?? undefined,
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
    client_number: optionalClientNumber(params.client_number),
    exclude_appointment_id: params.exclude_appointment_id ?? undefined,
    limit: params.limit ?? 100,
  }

  const response = await apiInstance.get(
    apiPaths.appointmentAvailabilityRanges,
    { params: query },
  )

  return mapAvailabilityRangesResponse(unwrapData(response.data))
}

export async function previewRecurringAppointments(body) {
  const response = await apiInstance.post(
    apiPaths.appointmentBookPreview,
    body,
  )

  return unwrapData(response.data)
}

export async function listClinicianWorkingWeekdays(clinicianId) {
  const response = await apiInstance.get(
    apiPaths.clinicianWorkingWeekdays(clinicianId),
  )

  return parseWorkingWeekdays(unwrapData(response.data))
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

export async function deleteAppointment(appointmentId) {
  await apiInstance.delete(apiPaths.appointmentById(appointmentId))
}

export function extractBookingConflicts(error) {
  const data = error?.response?.data?.data ?? error?.response?.data

  return Array.isArray(data?.conflicts) ? data.conflicts : []
}

export function extractScheduleConflictCodes(error) {
  const payload = error?.response?.data
  const data = payload?.data ?? payload
  const codes = []
  const description = payload?.error_description
    ?? payload?.errorDescription
  if (description) {
    codes.push(String(description))
  }
  if (data?.code) {
    codes.push(String(data.code))
  }
  const reasons = Array.isArray(data?.reasons) ? data.reasons : []
  for (const reason of reasons) {
    if (reason) {
      codes.push(String(reason))
    }
  }
  for (const conflict of extractBookingConflicts(error)) {
    const code = conflict?.reason_code ?? conflict?.reasonCode
    if (code) {
      codes.push(String(code))
    }
  }

  return [...new Set(codes)]
}

export function appointmentConflictI18nKey(error) {
  const codes = extractScheduleConflictCodes(error)
  const hasClient = codes.includes('CLIENT_SCHEDULE_CONFLICT')
  const hasClinician = codes.includes('CLINICIAN_SCHEDULE_CONFLICT')
  if (hasClient && hasClinician) {
    return 'appointmentBookingBothConflict'
  }
  if (hasClient) {
    return 'appointmentBookingClientConflict'
  }
  if (hasClinician) {
    return 'appointmentBookingClinicianConflict'
  }
  if (extractBookingConflicts(error).length) {
    return 'appointmentBookingConflict'
  }

  return null
}
