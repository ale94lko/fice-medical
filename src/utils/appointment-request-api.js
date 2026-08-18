import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  mapAppointmentsList,
  normalizeAppointment,
  normalizeRecurringSeries,
} from 'src/utils/appointment-normalize.js'
import { normalizeStaffAppointmentRequest } from
  'src/utils/appointment-request-normalize.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

function unwrapList(body) {
  const root = body?.data ?? body
  if (Array.isArray(root)) {
    return root
  }
  if (root && typeof root === 'object' && Array.isArray(root.data)) {
    return root.data
  }
  if (Array.isArray(root?.items)) {
    return root.items
  }

  return []
}

export function appointmentRequestApiErrorMessage(
  error,
  fallback = 'Request failed',
) {
  const data = error?.response?.data
  const message = data?.message
    ?? data?.error_description
    ?? data?.error
    ?? error?.message

  return String(message || fallback)
}

export async function listStaffAppointmentRequests(status = 'PENDING') {
  const params = {}
  const token = String(status ?? '').trim()
  if (token) {
    params.status = token
  }
  const response = await apiInstance.get(
    apiPaths.appointmentRequests,
    { params },
  )

  return unwrapList(response.data).map(normalizeStaffAppointmentRequest)
}

export async function rejectAppointmentRequest(id, notes = null) {
  const trimmed = String(notes ?? '').trim()
  const body = trimmed ? { notes: trimmed } : {}
  const response = await apiInstance.post(
    apiPaths.appointmentRequestReject(id),
    body,
  )

  return normalizeStaffAppointmentRequest(unwrapData(response.data))
}

export async function fulfillAppointmentRequest(
  id,
  body,
  idempotencyKey = null,
) {
  const headers = {}
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }
  const response = await apiInstance.post(
    apiPaths.appointmentRequestFulfill(id),
    body,
    { headers },
  )
  const data = unwrapData(response.data)
  if (Array.isArray(data?.appointments)) {
    return {
      appointments: mapAppointmentsList(data.appointments),
      recurringSeries: normalizeRecurringSeries(
        data.recurring_series,
      ) ?? null,
      conflicts: data.conflicts ?? [],
    }
  }

  return {
    appointment: normalizeAppointment(data?.appointment ?? data),
    appointments: [],
    recurringSeries: normalizeRecurringSeries(
      data?.recurring_series,
    ) ?? null,
    conflicts: [],
  }
}
